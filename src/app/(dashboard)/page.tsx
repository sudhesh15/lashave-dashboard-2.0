'use client';
import Link from 'next/link';

import {
  ATTENTION_CFG,
  AttentionCfg,
  type AttentionItem,
  type FaqGap,
  type TopicItem,
} from '@/components/dashboard/DashboardPanels';
import { OnboardingCard } from '@/components/overview/onboarding/OnboardingCard';
import { OnboardingDrawer } from '@/components/overview/onboarding/OnboardingDrawer';
import { BIZ_QUESTIONS } from '@/components/overview/onboarding/data';
import { OVERVIEW_LIGHT } from '@/components/overview/theme';
import type {
  BizType,
  ChannelInfo,
  ChannelTS,
  Overview,
  Pipeline,
  TS,
} from '@/components/overview/types';
import { RequireAuth } from '@/components/require-auth';
import { adaptFaqGaps, adaptTopics } from '@/components/overview/adapters';
import { apiFetch } from '@/lib/api';
import {
  analyzeKnowledgeWebsite,
  listKnowledgeDocuments,
  listWebsiteKnowledgeEntries,
  uploadKnowledgeCatalogue,
} from '@/lib/knowledge-api';
import { DARK } from '@/lib/theme';
import { useTheme } from '@/lib/theme-context';
import type { ApexOptions } from 'apexcharts';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowUp,
  Bot,
  Calendar,
  CheckCircle2,
  CircleHelp,
  Clock3,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Target,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const BRAND = '#465FFF';
const BRAND_LIGHT = '#9CB9FF';
const PIPELINE_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'];
const PIPELINE_COLORS = ['#465FFF', '#5E76FF', '#7592FF', '#9CB9FF', '#C2D6FF'];

type UnknownRecord = Record<string, unknown>;
type ItemsResponse = { items?: UnknownRecord[]; total?: number };
type AuthMeResponse = { user: { id: string; tenant_id?: string } };
type ScrapeResponse = { analysis_id: number | string; url?: string };
type UploadResponse = {
  document_id: number | string;
  job_id?: number | string | null;
  filename?: string;
};
type KnowledgeEntry = { source_url?: string; url?: string };
type KnowledgeDocument = {
  filename?: string;
  original_filename?: string;
};

function formatCompact(value: number | string | null | undefined) {
  if (typeof value === 'string') return value;
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(
    value ?? 0,
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

function numericValue(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeTimeValue(item: UnknownRecord) {
  return (
    stringValue(item.t) ||
    stringValue(item.bucket) ||
    stringValue(item.date) ||
    stringValue(item.day) ||
    stringValue(item.created_at)
  );
}

function normalizeMetricValue(item: UnknownRecord) {
  return numericValue(
    item.v ??
      item.value ??
      item.count ??
      item.messages ??
      item.total_messages ??
      item.message_count,
  );
}

function normalizePlatformKey(platform: string) {
  const key = platform.toLowerCase().trim().replace(/[\s-]+/g, '_');
  const aliases: Record<string, string> = {
    fb: 'facebook',
    google_reviews: 'google',
    google_map: 'google',
    google_maps: 'google',
    ig: 'instagram',
    insta: 'instagram',
    wa: 'whatsapp',
    yt: 'youtube',
  };

  return aliases[key] || key;
}

function adaptTimeseries(raw: unknown): TS {
  const source = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as UnknownRecord)?.points)
      ? ((raw as UnknownRecord).points as unknown[])
      : Array.isArray((raw as UnknownRecord)?.items)
        ? ((raw as UnknownRecord).items as unknown[])
        : [];

  return {
    points: source
      .map((item) => {
        const record = (item || {}) as UnknownRecord;
        return {
          t: normalizeTimeValue(record),
          v: normalizeMetricValue(record),
        };
      })
      .filter((point) => point.t),
  };
}

function adaptChannelTimeseries(raw: unknown): ChannelTS {
  const points: ChannelTS['points'] = [];
  const channels = new Set<string>();

  const addPoint = (item: unknown, inheritedChannel?: string) => {
    const record = (item || {}) as UnknownRecord;
    const channel =
      inheritedChannel ||
      stringValue(record.channel) ||
      stringValue(record.platform) ||
      stringValue(record.channel_name) ||
      stringValue(record.name);
    const t = normalizeTimeValue(record);
    if (!channel || !t) return;

    channels.add(channel);
    points.push({
      t,
      channel,
      v: normalizeMetricValue(record),
    });
  };

  const rawRecord = (raw || {}) as UnknownRecord;
  const flatSource = Array.isArray(raw)
    ? raw
    : Array.isArray(rawRecord.points)
      ? (rawRecord.points as unknown[])
      : Array.isArray(rawRecord.items)
        ? (rawRecord.items as unknown[])
        : Array.isArray(rawRecord.data)
          ? (rawRecord.data as unknown[])
          : [];

  flatSource.forEach((item) => addPoint(item));

  const seriesField = rawRecord.series ?? rawRecord.channel_series;

  if (Array.isArray(seriesField)) {
    // Shape: series: [{ channel, points: [...] }, ...]
    seriesField.forEach((series) => {
      const record = (series || {}) as UnknownRecord;
      const channel =
        stringValue(record.channel) ||
        stringValue(record.platform) ||
        stringValue(record.name);
      const nestedPoints = Array.isArray(record.points)
        ? (record.points as unknown[])
        : Array.isArray(record.data)
          ? (record.data as unknown[])
          : [];

      if (nestedPoints.length) {
        nestedPoints.forEach((item) => addPoint(item, channel));
      } else {
        addPoint(record, channel);
      }
    });
  } else if (seriesField && typeof seriesField === 'object') {
    // Shape: series: { instagram: [...points], google: [...points], ... }
    Object.entries(seriesField as UnknownRecord).forEach(([channel, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => addPoint(item, channel));
      }
    });
  }

  return { channels: Array.from(channels), points };
}

function formatDate(str: string) {
  return new Date(str + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function toDateStr(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return toDateStr(d);
}

function buildDateQuery(dateRange: { from: string; to: string } | null) {
  const dateQs = new URLSearchParams();

  if (dateRange?.from) {
    dateQs.set('from_ts', new Date(dateRange.from).toISOString());
  }
  if (dateRange?.to) {
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);
    dateQs.set('to_ts', to.toISOString());
  }

  const str = dateQs.toString();
  return {
    dq: str ? `&${str}` : '',
    dqOnly: str ? `?${str}` : '',
  };
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon,
  tone = 'default',
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  tone?: 'default' | 'warning' | 'success';
}) {
  const badgeClass =
    tone === 'warning'
      ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400'
      : tone === 'success'
        ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
        : 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400';

  return (
    <Card className='p-5 md:p-6'>
      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90'>
        {icon}
      </div>
      <div className='mt-5 flex items-end justify-between gap-4'>
        <div className='min-w-0'>
          <span className='text-sm text-gray-500 dark:text-gray-400'>
            {label}
          </span>
          <h3 className='mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90'>
            {formatCompact(value)}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-theme-xs font-medium ${badgeClass}`}
        >
          {sub}
        </span>
      </div>
    </Card>
  );
}

function ChartHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
      <div>
        <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
          {title}
        </h3>
        {subtitle && (
          <p className='mt-1 text-theme-sm text-gray-500 dark:text-gray-400'>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className='flex min-h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400'>
      {label}
    </div>
  );
}

function DateFilter({
  dateRange,
  activePreset,
  setDateRange,
  setActivePreset,
}: {
  dateRange: { from: string; to: string } | null;
  activePreset: number | null;
  setDateRange: (value: { from: string; to: string } | null) => void;
  setActivePreset: (value: number | null) => void;
}) {
  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center'>
      <div className='grid grid-cols-3 gap-2 sm:w-auto'>
        {[
          { label: 'Today', days: 0 },
          { label: '7 Days', days: 7 },
          { label: '30 Days', days: 30 },
        ].map((preset) => (
          <button
            key={preset.label}
            className={`h-10 rounded-lg px-3 text-theme-sm font-medium transition ${
              activePreset === preset.days
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5'
            }`}
            onClick={() => {
              setActivePreset(preset.days);
              setDateRange({
                from: daysAgo(preset.days),
                to: toDateStr(new Date()),
              });
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className='grid grid-cols-2 gap-2'>
        <input
          type='date'
          value={dateRange?.from ?? ''}
          onChange={(e) => {
            setActivePreset(null);
            setDateRange({
              from: e.target.value,
              to: dateRange?.to ?? toDateStr(new Date()),
            });
          }}
          className='h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
        />
        <input
          type='date'
          value={dateRange?.to ?? ''}
          onChange={(e) => {
            setActivePreset(null);
            setDateRange({
              from: dateRange?.from ?? toDateStr(new Date()),
              to: e.target.value,
            });
          }}
          className='h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
        />
      </div>

      {dateRange && (
        <button
          className='h-10 rounded-lg border border-gray-200 px-4 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
          onClick={() => {
            setDateRange(null);
            setActivePreset(null);
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}

function MessagesAreaChart({
  points,
  total,
  avgLatency,
  isDark,
}: {
  points: { d: string; v: number }[];
  total: number;
  avgLatency: number | null;
  isDark: boolean;
}) {
  const options: ApexOptions = useMemo(
    () => ({
      legend: { show: false },
      colors: [BRAND, BRAND_LIGHT],
      chart: {
        fontFamily: 'Outfit, sans-serif',
        type: 'area',
        height: 310,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      stroke: { curve: 'straight', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { opacityFrom: 0.45, opacityTo: 0 },
      },
      markers: { size: 0, hover: { size: 5 } },
      grid: {
        borderColor: isDark ? '#1D2939' : '#F2F4F7',
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: points.map((p) => p.d),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: isDark ? '#98A2B3' : '#667085' } },
      },
      yaxis: {
        labels: {
          style: { colors: isDark ? '#98A2B3' : '#667085' },
          formatter: (value: number) => formatCompact(Math.round(value)),
        },
      },
      tooltip: { theme: isDark ? 'dark' : 'light' },
    }),
    [points, isDark],
  );

  return (
    <Card className='px-5 pb-5 pt-5 sm:px-6 sm:pt-6'>
      <ChartHeader
        title='Message Volume'
        subtitle={
          avgLatency != null
            ? `${total.toLocaleString()} total messages with ${avgLatency}ms average response`
            : `${total.toLocaleString()} total messages`
        }
      />
      {points.length > 0 ? (
        <div className='max-w-full overflow-x-auto custom-scrollbar'>
          <div className='min-w-[720px] xl:min-w-full'>
            <ReactApexChart
              options={options}
              series={[{ name: 'Messages', data: points.map((p) => p.v) }]}
              type='area'
              height={310}
            />
          </div>
        </div>
      ) : (
        <EmptyBlock label='No message data available for this range' />
      )}
    </Card>
  );
}

function PipelineChart({
  pipeline,
  pipeMap,
  isDark,
}: {
  pipeline: Pipeline | null;
  pipeMap: Record<string, number>;
  isDark: boolean;
}) {
  const total = pipeline?.total_leads ?? 0;
  const series = PIPELINE_STATUSES.map((status) => pipeMap[status] || 0);
  const hasData = series.some((value) => value > 0);
  const options: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    colors: PIPELINE_COLORS,
    labels: PIPELINE_STATUSES.map((status) => status.replace('_', ' ')),
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { theme: isDark ? 'dark' : 'light' },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Leads',
              formatter: () => String(total),
            },
          },
        },
      },
    },
  };

  return (
    <Card className='p-5 sm:p-6'>
      <ChartHeader title='Lead Pipeline' subtitle='Distribution by status' />
      {hasData ? (
        <>
          <ReactApexChart
            options={options}
            series={series}
            type='donut'
            height={240}
          />
          <div className='mt-2 space-y-3'>
            {PIPELINE_STATUSES.map((status, index) => {
              const value = pipeMap[status] || 0;
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div key={status}>
                  <div className='mb-1 flex items-center justify-between text-theme-xs'>
                    <div className='flex items-center gap-2 font-medium capitalize text-gray-700 dark:text-gray-300'>
                      <span
                        className='h-2 w-2 rounded-full'
                        style={{ backgroundColor: PIPELINE_COLORS[index] }}
                      />
                      {status}
                    </div>
                    <span className='text-gray-500 dark:text-gray-400'>
                      {value} · {pct}%
                    </span>
                  </div>
                  <div className='h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800'>
                    <div
                      className='h-full rounded-full'
                      style={{
                        width: `${pct}%`,
                        backgroundColor: PIPELINE_COLORS[index],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyBlock label='No lead pipeline data yet' />
      )}
    </Card>
  );
}

// helper
const TOPIC_COLOR_MAP: Record<string, string> = {
  pricing: '#60A5FA',
  booking: '#22D3EE',
  appointment: '#2DD4BF',
  support: '#FCA5A5',
  product: '#C4B5FD',
  availability: '#F0ABFC',
  complaint: '#FB7185',
  refund: '#FDBA74',
  hours: '#FCD34D',
  general_interest: '#CBD5E1',
  integration: '#93C5FD',
  demo: '#67E8F9',
};

function getTopicColor(topic: string): string {
  const lower = topic.toLowerCase();
  for (const [key, color] of Object.entries(TOPIC_COLOR_MAP)) {
    if (lower.includes(key)) return color;
  }
  return '#94A3B8'; // fallback slate
}

function TopicsCard({
  topics,
  loading,
}: {
  topics: TopicItem[];
  loading: boolean;
}) {
  const max = Math.max(...topics.map((topic) => topic.count), 1);

  return (
    <Card className='p-5 sm:p-6'>
      <ChartHeader
        title='Customer Intent'
        subtitle='Common themes detected across conversations'
      />
      {loading ? (
        <EmptyBlock label='Loading topics' />
      ) : topics.length === 0 ? (
        <EmptyBlock label='No conversation topics detected yet' />
      ) : (
        <div className='space-y-4'>
          {topics.slice(0, 8).map((topic) => {
            const pct = Math.round((topic.count / max) * 100);
            const color = getTopicColor(topic.topic);
            return (
              <div key={topic.topic}>
                <div className='mb-2 flex justify-between gap-3 text-theme-sm'>
                  <span className='font-medium capitalize text-gray-700 dark:text-gray-300'>
                    {topic.topic.replace(/_/g, ' ')}
                  </span>
                  <span className='font-semibold' style={{ color }}>
                    {topic.count}
                  </span>
                </div>
                <div className='h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800'>
                  <div
                    className='h-full rounded-full transition-all'
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}99)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function FaqGapsCard({
  gaps,
  loading,
}: {
  gaps: FaqGap[];
  loading: boolean;
}) {
  return (
    <Card className='p-5 sm:p-6'>
      <ChartHeader
        title='FAQ Content Gaps'
        subtitle='Questions the AI needs better source material for'
      />
      {loading ? (
        <EmptyBlock label='Loading FAQ gaps' />
      ) : gaps.length === 0 ? (
        <EmptyBlock label='No FAQ gaps found' />
      ) : (
        <div className='overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800'>
          {gaps.slice(0, 5).map((gap, index) => (
            <div
              key={`${gap.query}-${index}`}
              className='flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 last:border-b-0 dark:border-gray-800'
            >
              <div className='min-w-0'>
                <p className='truncate text-theme-sm font-medium text-gray-800 dark:text-white/90'>
                  {gap.query}
                </p>
                <p className='mt-1 text-theme-xs text-gray-500 dark:text-gray-400'>
                  Last seen {new Date(gap.last_seen).toLocaleDateString()}
                </p>
              </div>
              <span className='shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-theme-xs font-medium text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400'>
                {gap.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ActiveChannelsCard({
  channels,
  messagesTodayByChannel,
  onConnectNow,
}: {
  channels: ChannelInfo[];
  messagesTodayByChannel: Record<string, number>;
  onConnectNow: () => void;
}) {
  const active = channels.filter((channel) => channel.is_active);
  const requiredPlatforms = [
    { platform: 'google', label: 'Google Map' },
    { platform: 'facebook', label: 'Facebook' },
    { platform: 'youtube', label: 'YouTube' },
    { platform: 'whatsapp', label: 'WhatsApp' },
  ];
  const displayChannels = [
    ...channels.map((channel) => ({
      channel,
      platform: channel.platform,
      label:
        channel.display_name ||
        channel.account_name ||
        channel.username ||
        channel.platform,
      connected: true,
    })),
    ...requiredPlatforms
      .filter(
        (item) =>
          !channels.some(
            (channel) =>
              normalizePlatformKey(channel.platform) === item.platform,
          ),
      )
      .map((item) => ({
        channel: null,
        platform: item.platform,
        label: item.label,
        connected: false,
      })),
  ];
  const visibleChannels = displayChannels;
  const logoForPlatform = (platform?: string | null) => {
    const key = (platform || '').toLowerCase().trim();
    const logos: Record<string, string> = {
      facebook: '/brand-logo/facebook.png',
      google: '/brand-logo/google-map.png',
      google_maps: '/brand-logo/google-map.png',
      google_map: '/brand-logo/google-map.png',
      instagram: '/brand-logo/instagram.png',
      meta: '/brand-logo/meta.png',
      telegram: '/brand-logo/telegram.png',
      website: '/brand-logo/website.png',
      whatsapp: '/brand-logo/whatsapp.png',
      youtube: '/brand-logo/youtube.png',
    };

    return logos[key] || '/brand-logo/website.png';
  };
  const labelForPlatform = (platform?: string | null) => {
    const key = (platform || '').toLowerCase().trim();
    const labels: Record<string, string> = {
      facebook: 'Facebook',
      google: 'Google Map',
      google_maps: 'Google Map',
      google_map: 'Google Map',
      instagram: 'Instagram',
      meta: 'Meta',
      telegram: 'Telegram',
      website: 'Website',
      whatsapp: 'WhatsApp',
      youtube: 'YouTube',
    };

    return labels[key] || platform || 'Channel';
  };
  const messagesForPlatform = (platform: string) => {
    const key = normalizePlatformKey(platform);
    return messagesTodayByChannel[key] || 0;
  };

  return (
    <div>
      <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h3 className='text-xl font-semibold text-gray-800 dark:text-white/90'>
            Connected Channels
          </h3>
          <p className='mt-1 text-theme-sm text-gray-500 dark:text-gray-400'>
            {active.length} active channels
          </p>
        </div>
        <button
          type='button'
          onClick={onConnectNow}
          className='inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]'
        >
          <Plus className='h-4 w-4' />
          Manage channels
        </button>
      </div>

      {visibleChannels.length === 0 ? (
        <EmptyBlock label='No channels connected yet' />
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {visibleChannels.map((item) => {
            const messagesToday = messagesForPlatform(item.platform);
            const isActive = Boolean(item.channel?.is_active);

            return (
              <div
                key={item.channel?.id || item.platform}
                className='min-h-[140px] rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]'
              >
                <div className='flex items-start gap-4'>
                  <div className='flex h-12 w-12 shrink-0 items-center justify-center'>
                    <Image
                      src={logoForPlatform(item.platform)}
                      alt={`${item.label} logo`}
                      width={42}
                      height={42}
                      className='h-10 w-10 object-contain'
                    />
                  </div>
                  <div className='min-w-0'>
                    <p className='truncate text-base font-semibold capitalize text-gray-800 dark:text-white/90'>
                      {item.label}
                    </p>
                    <p className='mt-1 truncate text-theme-sm capitalize text-gray-500 dark:text-gray-400'>
                      {labelForPlatform(item.platform)}
                    </p>
                  </div>
                </div>

                <div className='mt-7 flex items-end justify-between gap-4'>
                  <div className='min-w-0'>
                    <p className='text-xl font-bold text-gray-800 dark:text-white/90'>
                      {item.connected
                        ? messagesToday.toLocaleString()
                        : '0'}
                    </p>
                    <p className='mt-1 text-theme-xs text-gray-500 dark:text-gray-400'>
                      Messages Today
                    </p>
                  </div>

                  {item.connected ? (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-theme-xs font-medium ${
                        isActive
                          ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                          : 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80'
                      }`}
                    >
                      {isActive && <ArrowUp className='h-3 w-3' />}
                      {isActive ? 'Active' : 'Paused'}
                    </span>
                  ) : (
                    <button
                      type='button'
                      onClick={onConnectNow}
                      className='inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-theme-xs font-medium text-brand-500 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400'
                    >
                      <Plus className='h-3 w-3' />
                      Connect Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return 'No timestamp';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return 'No timestamp';
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const FALLBACK_CFG: AttentionCfg = {
  dot: 'bg-gray-400',
  badge: 'bg-gray-100 text-gray-600 dark:bg-gray-500/[0.12] dark:text-gray-300',
  label: 'attention',
};

function getAttentionCfg(type: string): AttentionCfg {
  return ATTENTION_CFG[type] ?? FALLBACK_CFG;
}

function attentionLabel(type: string) {
  return type.replace(/_/g, ' ');
}

function AttentionCard({
  items,
  loading,
}: {
  items: AttentionItem[];
  loading: boolean;
}) {
  return (
    <Card className='p-5 sm:p-6'>
      <ChartHeader
        title='Needs Attention'
        subtitle='Conversations and signals that need a team review'
      />
      {loading ? (
        <EmptyBlock label='Loading attention items' />
      ) : items.length === 0 ? (
        <EmptyBlock label='No attention items right now' />
      ) : (
        <div className='overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800'>
          {items.slice(0, 8).map((item, index) => {
            const cfg = getAttentionCfg(item.type);
            const href = item.conversation_id
              ? `/conversations/${item.conversation_id}`
              : '/conversations';

            return (
              <Link
                key={`${item.type}-${item.created_at}-${index}`}
                href={href}
                className='flex gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]'
              >
                <span
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`}
                />
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center justify-between gap-3'>
                    <p className='truncate text-theme-sm font-medium text-gray-800 dark:text-white/90'>
                      {item.sender_name || 'Unknown customer'}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-theme-xs font-medium capitalize ${cfg.badge}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className='mt-1 line-clamp-2 text-theme-sm text-gray-500 dark:text-gray-400'>
                    {item.message ||
                      'Review this conversation for next action.'}
                  </p>
                  <p className='mt-2 text-theme-xs text-gray-400 dark:text-gray-500'>
                    {timeAgo(item.created_at)} · {item.tenant_id || 'Tenant'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const onboardingTheme = isDark ? DARK : OVERVIEW_LIGHT;

  const [overview, setOverview] = useState<Overview | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [tsMessages, setTsMessages] = useState<TS | null>(null);
  const [tsMessagesByChannel, setTsMessagesByChannel] =
    useState<ChannelTS | null>(null);
  const [, setTsLeads] = useState<TS | null>(null);
  const [tsHandoffs, setTsHandoffs] = useState<TS | null>(null);
  const [, setTsHourly] = useState<TS | null>(null);
  const [handoffConvCount, setHandoffConvCount] = useState<number>(0);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [hasFaqs, setHasFaqs] = useState(false);
  const [tenantId, setTenantId] = useState<string | undefined>();
  const [showTrainAI, setShowTrainAI] = useState(false);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [faqGaps, setFaqGaps] = useState<FaqGap[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [dropoffTotal, setDropoffTotal] = useState(0);
  const [returningTotal, setReturningTotal] = useState(0);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [activePreset, setActivePreset] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoaded(false);
        const { dq, dqOnly } = buildDateQuery(dateRange);
        const [
          byChannelRaw,
          o,
          p,
          m,
          l,
          h,
          hConvs,
          dailyMessagesRaw,
          channelsRes,
          faqs,
          me,
        ] = await Promise.all([
          apiFetch<unknown>(
            `/admin/stats/timeseries-by-channel?interval=day${dq}`,
            { auth: true },
          ),
          apiFetch<Overview>(`/admin/stats/overview${dqOnly}`, { auth: true }),
          apiFetch<Pipeline>('/admin/leads/pipeline', { auth: true }),
          apiFetch<unknown>(
            `/admin/stats/timeseries?metric=messages&interval=hour${dq}`,
            { auth: true },
          ),
          apiFetch<TS>(
            `/admin/stats/timeseries?metric=leads&interval=day${dq}`,
            { auth: true },
          ),
          apiFetch<TS>(
            `/admin/stats/timeseries?metric=handoffs&interval=day${dq}`,
            { auth: true },
          ),
          apiFetch<ItemsResponse>(
            '/admin/conversations?status=handoff&limit=1',
            { auth: true },
          ),
          apiFetch<unknown>(
            `/admin/stats/timeseries?metric=messages&interval=day${dq}`,
            { auth: true },
          ),
          apiFetch<{ items: ChannelInfo[] }>('/admin/channels', { auth: true }),
          apiFetch<ItemsResponse>('/admin/faq?limit=1', {
            auth: true,
          }),
          apiFetch<AuthMeResponse>(
            '/admin/auth/me',
            { auth: true },
          ).catch(
            (): AuthMeResponse => ({ user: { id: 'default' } }),
          ),
        ]);

        setOverview(o);
        setPipeline(p);
        setTsMessages(adaptTimeseries(dailyMessagesRaw));
        setTsMessagesByChannel(adaptChannelTimeseries(byChannelRaw));
        setTsLeads(l);
        setTsHandoffs(h);
        setHandoffConvCount(hConvs.total ?? hConvs.items?.length ?? 0);
        setTsHourly(adaptTimeseries(m));
        setChannels(channelsRes.items || []);

        const tid = me.user.tenant_id || me.user.id;
        const realFaqCount = faqs.items?.length || faqs.total || 0;
        let trained = realFaqCount > 0;
        try {
          if (typeof window !== 'undefined' && tid) {
            const flag = localStorage.getItem(`onboarding_trained:${tid}`);
            if (flag === '1') trained = true;
            localStorage.removeItem('onboarding_trained');
          }
        } catch {}
        setHasFaqs(trained);
        setTenantId(tid);
        setLoaded(true);
      } catch (e: unknown) {
        setErr(errorMessage(e, 'Failed to load overview'));
        setLoaded(true);
      }
    })();
  }, [dateRange]);

  useEffect(() => {
    const { dq, dqOnly } = buildDateQuery(dateRange);
    apiFetch<ItemsResponse>(
      `/admin/attention?limit=8${dq}`,
      { auth: true },
    )
      .then((res) =>
        setAttentionItems(
          (res.items || []).map((item) => ({
            conversation_id: numberValue(item.conversation_id) ?? null,
            type: stringValue(item.type, 'handoff_needed'),
            sender_name:
              stringValue(item.sender_name) ||
              stringValue(item.channel_display_name) ||
              stringValue(item.external_user_id) ||
              'Unknown customer',
            tenant_id: stringValue(item.tenant_id),
            message:
              stringValue(item.message) || stringValue(item.title) || null,
            silence_min:
              typeof item.meta === 'object' && item.meta !== null
                ? (numberValue((item.meta as UnknownRecord).silence_min) ??
                  numberValue((item.meta as UnknownRecord).silence_minutes) ??
                  null)
                : null,
            created_at:
              stringValue(item.created_at) ||
              stringValue(item.last_message_at) ||
              new Date().toISOString(),
          })),
        ),
      )
      .catch(() => setAttentionItems([]))
      .finally(() => setAttentionLoading(false));

    apiFetch<unknown>(`/admin/stats/topics${dqOnly}`, { auth: true })
      .then((res) => setTopics(adaptTopics(res)))
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false));

    apiFetch<unknown>('/admin/stats/faq-gaps?limit=5', { auth: true })
      .then((res) => setFaqGaps(adaptFaqGaps(res)))
      .catch(() => setFaqGaps([]))
      .finally(() => setFaqLoading(false));

    apiFetch<UnknownRecord>(`/admin/stats/dropoffs${dqOnly}`, { auth: true })
      .then((res) => {
        const total = numberValue(res.total_dropoffs) ?? numberValue(res.total) ?? 0;
        const recovered = numberValue(res.recovered) ?? 0;
        setDropoffTotal(total - recovered);
      })
      .catch(() => setDropoffTotal(0));

    apiFetch<UnknownRecord>('/admin/stats/returning-users', { auth: true })
      .then((res) =>
        setReturningTotal(
          numberValue(res.total_returning) ??
            numberValue(res.total_returning_users) ??
            0,
        ),
      )
      .catch(() => setReturningTotal(0));
  }, [dateRange]);

  async function handleRunScrape(
    url: string,
  ): Promise<{ analysisId: number | string; url: string }> {
    try {
      const started = (await analyzeKnowledgeWebsite(
        url.trim(),
        50,
      )) as ScrapeResponse;
      return {
        analysisId: started.analysis_id,
        url: started.url || url.trim(),
      };
    } catch (e: unknown) {
      throw new Error(errorMessage(e, 'Scrape failed'));
    }
  }

  async function handleRunUpload(
    file: File,
    docCategory: string,
  ): Promise<{
    documentId: number | string;
    jobId?: number | string | null;
    filename: string;
  }> {
    try {
      const label = file.name.replace(/\.[^.]+$/, '');
      const response = (await uploadKnowledgeCatalogue(
        file,
        label,
        docCategory || undefined,
      )) as UploadResponse;
      return {
        documentId: response.document_id,
        jobId: response.job_id ?? null,
        filename: response.filename || file.name,
      };
    } catch (e: unknown) {
      throw new Error(errorMessage(e, 'Upload failed'));
    }
  }

  async function handleCheckDupUrl(url: string): Promise<boolean> {
    try {
      const q = url
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');
      if (!q) return false;
      const entries = (await listWebsiteKnowledgeEntries({
        pageSize: 100,
      }).catch(() => ({ items: [] }))) as
        | { items?: KnowledgeEntry[] }
        | KnowledgeEntry[];
      const items = Array.isArray(entries) ? entries : (entries.items ?? []);
      return items.some((e) => {
        const src = (e.source_url || e.url || '').toLowerCase();
        return (
          src.includes(q) ||
          q.includes(src.replace(/^https?:\/\//, '').replace(/\/$/, ''))
        );
      });
    } catch {
      return false;
    }
  }

  async function handleCheckDupFile(filename: string): Promise<boolean> {
    try {
      const docs = (await listKnowledgeDocuments().catch(() => [])) as
        | { items?: KnowledgeDocument[] }
        | KnowledgeDocument[];
      const list = Array.isArray(docs) ? docs : (docs.items ?? []);
      const name = filename.toLowerCase();
      return list.some(
        (d) =>
          (d.filename || d.original_filename || '').toLowerCase() === name,
      );
    } catch {
      return false;
    }
  }

  async function handleRunQuestions(
    answers: Record<number, string>,
    biz: BizType,
    about: string,
  ): Promise<{ addedCount: number }> {
    const questions = BIZ_QUESTIONS[biz];
    const answeredPairs = Object.entries(answers).filter(([, v]) => v.trim());

    let added = 0;
    for (const [idxStr, answer] of answeredPairs) {
      const q = questions[parseInt(idxStr, 10)];
      if (!q) continue;
      try {
        await apiFetch('/admin/faq', {
          method: 'POST',
          auth: true,
          body: {
            question: q.faqQ,
            answer: answer.trim(),
            tags: `onboarding,${biz}`,
            synonyms: '',
            is_active: true,
          },
        });
        added += 1;
      } catch (e) {
        console.error('FAQ POST failed:', e);
      }
    }

    if (about) {
      try {
        const currentSettings = await apiFetch<{ system_prompt?: string }>(
          '/admin/settings',
          {
          auth: true,
          },
        );
        const existingPrompt = currentSettings?.system_prompt || '';
        const basePrompt = existingPrompt
          .replace(/\n*\[Business Information\][\s\S]*$/i, '')
          .trim();
        const updatedPrompt = `${basePrompt}

[Business Information]
${about}`.trim();
        await apiFetch('/admin/settings', {
          method: 'PUT',
          auth: true,
          body: { system_prompt: updatedPrompt },
        });
      } catch (e) {
        console.error('Failed to save business information:', e);
      }
    }

    try {
      const faqs = await apiFetch<ItemsResponse>(
        '/admin/faq?limit=1',
        { auth: true },
      );
      setHasFaqs((faqs.items?.length || faqs.total || 0) > 0);
    } catch {
      setHasFaqs(true);
    }

    return { addedCount: added };
  }

  async function handleSetBizType(biz: BizType): Promise<void> {
    try {
      await apiFetch('/admin/settings', {
        method: 'PUT',
        auth: true,
        body: { business_type: biz },
      });
    } catch (e) {
      console.error('Failed to save business type:', e);
    }
  }

  function handleOnboardingFinish(payload: {
    coachTab: 'manual' | 'catalogue' | 'website' | 'saved';
    pendingScrape?: { analysisId: number | string; url: string };
    pendingUpload?: {
      documentId: number | string;
      jobId?: number | string | null;
      filename: string;
    };
  }) {
    try {
      localStorage.setItem('faq_coach_target', payload.coachTab);
      if (tenantId) {
        localStorage.setItem(`onboarding_trained:${tenantId}`, '1');
      }
      if (payload.pendingScrape) {
        localStorage.setItem(
          'pending_scrape',
          JSON.stringify(payload.pendingScrape),
        );
      }
      if (payload.pendingUpload) {
        localStorage.setItem(
          'pending_upload',
          JSON.stringify(payload.pendingUpload),
        );
      }
    } catch {}
    setHasFaqs(true);
    setShowTrainAI(false);
    router.push('/faq');
  }

  const hasChannels = channels.some((channel) => channel.is_active);
  const pipeMap = useMemo(() => {
    const m: Record<string, number> = {};
    (pipeline?.by_status || []).forEach((item) => {
      m[item.status] = item.count;
    });
    return m;
  }, [pipeline]);

  const todayMessages = useMemo(() => {
    if (!tsMessages?.points?.length) return 0;
    const today = toDateStr(new Date());
    return tsMessages.points.reduce(
      (total, point) => total + (point.t.startsWith(today) ? point.v : 0),
      0,
    );
  }, [tsMessages]);

  const messagesTodayByChannel = useMemo(() => {
    const today = toDateStr(new Date());
    return (tsMessagesByChannel?.points || []).reduce<Record<string, number>>(
      (totals, point) => {
        if (!point.t.startsWith(today)) return totals;
        const key = normalizePlatformKey(point.channel);
        totals[key] = (totals[key] || 0) + point.v;
        return totals;
      },
      {},
    );
  }, [tsMessagesByChannel]);

  const msgChart = useMemo(
    () =>
      (tsMessages?.points || []).map((point) => ({
        d: point.t.slice(5, 10),
        v: point.v,
      })),
    [tsMessages],
  );

  const handoffsToday = useMemo(() => {
    if (!tsHandoffs?.points?.length) return 0;
    const today = toDateStr(new Date());
    return tsHandoffs.points.reduce(
      (total, point) => total + (point.t.startsWith(today) ? point.v : 0),
      0,
    );
  }, [tsHandoffs]);

  return (
    <RequireAuth>
      <div className='mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
          <div>
            <p className='text-theme-sm font-medium text-brand-500 dark:text-brand-400'>
              Overview
            </p>
            <h1 className='mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90'>
              Business dashboard
            </h1>
            <p className='mt-2 max-w-2xl text-theme-sm text-gray-500 dark:text-gray-400'>
              Monitor conversations, leads, channels, and AI knowledge coverage.
            </p>
          </div>
          <DateFilter
            dateRange={dateRange}
            activePreset={activePreset}
            setDateRange={setDateRange}
            setActivePreset={setActivePreset}
          />
        </div>

        {showTrainAI && (
          <OnboardingDrawer
            onClose={() => setShowTrainAI(false)}
            onRunScrape={handleRunScrape}
            onRunUpload={handleRunUpload}
            onRunQuestions={handleRunQuestions}
            onSetBizType={handleSetBizType}
            onFinish={handleOnboardingFinish}
            onCheckDupUrl={handleCheckDupUrl}
            onCheckDupFile={handleCheckDupFile}
            t={onboardingTheme}
            isDark={isDark}
          />
        )}

        {err && (
          <div className='mb-6 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400'>
            {err}
          </div>
        )}

        {loaded && (!hasFaqs || !hasChannels) && (
          <div className='mb-6'>
            <OnboardingCard
              hasFaqs={hasFaqs}
              hasChannels={hasChannels}
              onTrainAI={() => setShowTrainAI(true)}
              onConnectChannel={() => router.push('/channels')}
              t={onboardingTheme}
              isDark={isDark}
              tenantId={tenantId}
            />
          </div>
        )}

        <div className='mb-14'>
          <ActiveChannelsCard
            channels={channels}
            messagesTodayByChannel={messagesTodayByChannel}
            onConnectNow={() => router.push('/channels')}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6'>
          <MetricCard
            label='Conversations'
            value={overview?.total_conversations ?? 0}
            sub={`${overview?.open_conversations ?? 0} open`}
            icon={<MessageSquare className='h-6 w-6' />}
          />
          <MetricCard
            label='Messages Sent'
            value={overview?.total_messages ?? 0}
            sub={`${todayMessages} today`}
            icon={<Send className='h-6 w-6' />}
          />
          <MetricCard
            label='Total Leads'
            value={overview?.total_leads ?? 0}
            sub={`${pipeMap.won || 0} won`}
            icon={<Target className='h-6 w-6' />}
            tone='success'
          />
          <MetricCard
            label='Needs Attention'
            value={dropoffTotal + handoffConvCount}
            sub={`${handoffsToday} handoffs`}
            icon={<AlertTriangle className='h-6 w-6' />}
            tone='warning'
          />
        </div>

        <div className='mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12'>
          <div className='xl:col-span-8'>
            <MessagesAreaChart
              points={msgChart}
              total={overview?.total_messages ?? 0}
              avgLatency={overview?.avg_latency_ms ?? null}
              isDark={isDark}
            />
          </div>
          <div className='xl:col-span-4'>
            <PipelineChart pipeline={pipeline} pipeMap={pipeMap} isDark={isDark} />
          </div>
        </div>

        <div className='mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12'>
          <div className='xl:col-span-5'>
            <AttentionCard
              items={attentionItems}
              loading={attentionLoading}
            />
          </div>
          <div className='xl:col-span-7'>
            <TopicsCard topics={topics} loading={topicsLoading} />
          </div>
        </div>

        <div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <MetricCard
            label='Returning Users'
            value={returningTotal}
            sub='repeat contacts'
            icon={<RefreshCw className='h-6 w-6' />}
          />
          <MetricCard
            label='AI Errors'
            value={overview?.total_errors ?? 0}
            sub='total'
            icon={<Bot className='h-6 w-6' />}
          />
          <MetricCard
            label='Complaints'
            value={overview?.total_complaints ?? 0}
            sub='total'
            icon={<CircleHelp className='h-6 w-6' />}
          />
        </div>

        <div className='mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12'>
          <div className='xl:col-span-7'>
            <FaqGapsCard gaps={faqGaps} loading={faqLoading} />
          </div>
          <div className='xl:col-span-5'>
            <Card className='p-5 sm:p-6'>
              <ChartHeader
                title='Operational Summary'
                subtitle={
                  dateRange
                    ? `${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}`
                    : 'All available data'
                }
              />
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                {[
                  {
                    label: 'Open conversations',
                    value: overview?.open_conversations ?? 0,
                    icon: <Users className='h-5 w-5' />,
                  },
                  {
                    label: 'Average latency',
                    value:
                      overview?.avg_latency_ms != null
                        ? `${overview.avg_latency_ms}ms`
                        : '0ms',
                    icon: <Clock3 className='h-5 w-5' />,
                  },
                  {
                    label: 'Active channels',
                    value: channels.filter((channel) => channel.is_active).length,
                    icon: <CheckCircle2 className='h-5 w-5' />,
                  },
                  {
                    label: 'Date range',
                    value: activePreset != null ? `${activePreset}d` : 'Custom',
                    icon: <Calendar className='h-5 w-5' />,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className='rounded-xl border border-gray-200 p-4 dark:border-gray-800'
                  >
                    <div className='mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
                      {item.icon}
                    </div>
                    <p className='text-theme-xs text-gray-500 dark:text-gray-400'>
                      {item.label}
                    </p>
                    <p className='mt-1 text-lg font-semibold text-gray-800 dark:text-white/90'>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
