'use client';

import DataProcessingAgreementModal, {
  type SocialChannel,
} from '@/components/DataProcessingAgreementModal';
import GoogleLocationModal from '@/components/GoogleLocationModal';
import { RequireAuth } from '@/components/require-auth';
import WebsiteWidgetModal from '@/components/Websitewidgetmodal ';
import { getPageItems, TablePagination } from '@/components/ui/table-pagination';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import type { ApexOptions } from 'apexcharts';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Globe2,
  Loader2,
  MessageCircle,
  MoreVertical,
  PauseCircle,
  Plug,
  Power,
  RefreshCw,
  Settings,
  Trash2,
  WifiOff,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const ChannelSettingsDrawer = dynamic(
  () =>
    import('@/components/ChannelSettingsDrawer').then(
      (m) => m.ChannelSettingsDrawer,
    ),
  { ssr: false },
);

type Overview = {
  total_conversations: number;
  open_conversations: number;
  total_messages: number;
  avg_latency_ms: number | null;
  total_leads: number;
  total_handoffs: number;
  total_errors: number;
};

type Channel = {
  id: number;
  platform: string;
  platform_account_id: string;
  display_name?: string;
  account_name?: string;
  username?: string;
  profile_picture_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  token_issued_at?: string;
  location_id?: string | null;
  location_name?: string | null;
};

type WebsiteWidgetResponse = {
  config?: Record<string, unknown>;
  embed_code?: string;
  script?: string;
  embedCode?: string;
  created?: boolean;
  widget_key?: string;
};

type VerifyResult = {
  ok: boolean;
  account_name?: string | null;
  error?: string | null;
};

const ALL_PLATFORMS = ['instagram', 'telegram', 'facebook', 'google reviews'];
const META_PLATFORMS = ['instagram', 'facebook'];
const TOKEN_LIFETIME_DAYS = 60;
const WARN_AFTER_DAYS = 50;
const BRAND = '#465FFF';

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  telegram: 'Telegram',
  facebook: 'Facebook',
  google: 'Google Reviews',
  'google reviews': 'Google Reviews',
  website: 'Website',
};

const PLATFORM_LOGOS: Record<string, string> = {
  instagram: '/brand-logo/instagram.png',
  telegram: '/brand-logo/telegram.png',
  facebook: '/brand-logo/facebook.png',
  google: '/brand-logo/google-map.png',
  'google reviews': '/brand-logo/google-map.png',
  website: '/brand-logo/website.png',
  whatsapp: '/brand-logo/whatsapp.png',
  youtube: '/brand-logo/youtube.png',
  meta: '/brand-logo/meta.png',
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function platformLabel(platform?: string) {
  if (!platform) return 'Channel';
  const key = platform.toLowerCase().trim();
  return PLATFORM_LABELS[key] || platform.charAt(0).toUpperCase() + platform.slice(1);
}

function platformLogo(platform?: string) {
  if (!platform) return '/brand-logo/website.png';
  const key = platform.toLowerCase().trim();
  return PLATFORM_LOGOS[key] || '/brand-logo/website.png';
}

function channelName(channel: Channel) {
  return (
    channel.account_name ||
    channel.display_name ||
    channel.username ||
    channel.platform_account_id ||
    platformLabel(channel.platform)
  );
}

function formatDate(value?: string | null) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date);
}

function formatLatency(ms?: number | null) {
  if (ms == null) return '0ms';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

function getTokenStatus(
  channel: Channel,
): { status: 'ok' | 'expiring' | 'expired'; daysLeft: number } | null {
  const platform = channel.platform?.toLowerCase();
  if (!platform || !META_PLATFORMS.includes(platform)) return null;
  const issued = channel.token_issued_at ?? channel.updated_at ?? channel.created_at;
  if (!issued) return null;
  const issuedMs = new Date(issued).getTime();
  if (Number.isNaN(issuedMs)) return null;
  const ageDays = (Date.now() - issuedMs) / (1000 * 60 * 60 * 24);
  const daysLeft = Math.max(0, Math.ceil(TOKEN_LIFETIME_DAYS - ageDays));
  if (ageDays >= TOKEN_LIFETIME_DAYS) return { status: 'expired', daysLeft: 0 };
  if (ageDays >= WARN_AFTER_DAYS) return { status: 'expiring', daysLeft };
  return { status: 'ok', daysLeft };
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
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const badge =
    tone === 'success'
      ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
      : tone === 'warning'
        ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400'
        : tone === 'error'
          ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
          : 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400';

  return (
    <Card className='p-5 md:p-6'>
      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90'>
        {icon}
      </div>
      <div className='mt-5 flex items-end justify-between gap-4'>
        <div>
          <span className='text-sm text-gray-500 dark:text-gray-400'>{label}</span>
          <h3 className='mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90'>
            {value}
          </h3>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-theme-xs font-medium ${badge}`}>
          {sub}
        </span>
      </div>
    </Card>
  );
}

function ChartHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className='mb-6'>
      <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>{title}</h3>
      <p className='mt-1 text-theme-sm text-gray-500 dark:text-gray-400'>{subtitle}</p>
    </div>
  );
}

function StatusChart({
  activeCount,
  offlineCount,
  isDark,
}: {
  activeCount: number;
  offlineCount: number;
  isDark: boolean;
}) {
  const total = activeCount + offlineCount;
  const options: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    colors: ['#465FFF', '#C2D6FF'],
    labels: ['Active', 'Offline'],
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    tooltip: { theme: isDark ? 'dark' : 'light' },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Channels',
              formatter: () => String(total),
            },
          },
        },
      },
    },
  };

  return (
    <Card className='p-5 sm:p-6'>
      <ChartHeader title='Channel Health' subtitle='Active and paused channel status' />
      <ReactApexChart options={options} series={[activeCount, offlineCount]} type='donut' height={230} />
      <div className='mt-2 space-y-3'>
        {[
          ['Active', activeCount, '#465FFF'],
          ['Offline', offlineCount, '#C2D6FF'],
        ].map(([label, value, color]) => (
          <div key={label} className='flex items-center justify-between text-theme-sm'>
            <span className='flex items-center gap-2 text-gray-700 dark:text-gray-300'>
              <span className='h-2 w-2 rounded-full' style={{ backgroundColor: String(color) }} />
              {label}
            </span>
            <span className='font-medium text-gray-800 dark:text-white/90'>{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PlatformChart({
  channels,
  isDark,
}: {
  channels: Channel[];
  isDark: boolean;
}) {
  const rows = useMemo(() => {
    const counts = channels.reduce<Record<string, number>>((acc, channel) => {
      const key = platformLabel(channel.platform);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts);
  }, [channels]);

  const options: ApexOptions = {
    colors: [BRAND],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      height: 230,
      toolbar: { show: false },
    },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '42%', borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    grid: {
      borderColor: isDark ? '#1D2939' : '#F2F4F7',
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: rows.map(([label]) => label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: isDark ? '#98A2B3' : '#667085' } },
    },
    yaxis: { labels: { style: { colors: isDark ? '#98A2B3' : '#667085' } } },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  return (
    <Card className='p-5 sm:p-6'>
      <ChartHeader title='Platform Coverage' subtitle='Connected accounts by platform' />
      {rows.length > 0 ? (
        <ReactApexChart
          options={options}
          series={[{ name: 'Channels', data: rows.map(([, count]) => count) }]}
          type='bar'
          height={230}
        />
      ) : (
        <div className='flex min-h-56 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400'>
          No connected channels yet
        </div>
      )}
    </Card>
  );
}

function ConnectModal({
  platform,
  connecting,
  error,
  token,
  setToken,
  onCancel,
  onConfirm,
}: {
  platform: string;
  connecting: boolean;
  error: string;
  token: string;
  setToken: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isTelegram = platform === 'telegram';
  return (
    <div className='fixed inset-0 z-[400] grid place-items-center bg-gray-900/50 p-5 backdrop-blur-sm'>
      <Card className='w-full max-w-lg p-6 shadow-theme-xl'>
        <h2 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
          Connect {platformLabel(platform)}
        </h2>
        <p className='mt-2 text-theme-sm text-gray-500 dark:text-gray-400'>
          Authorize this channel so Lashvae can manage customer messages from the dashboard.
        </p>
        {isTelegram && (
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder='Telegram bot token'
            className='mt-5 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
          />
        )}
        {error && (
          <p className='mt-4 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-theme-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-500'>
            {error}
          </p>
        )}
        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={connecting}
            className='h-10 rounded-lg border border-gray-200 bg-white px-4 text-theme-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={connecting || (isTelegram && !token.trim())}
            className='inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white disabled:opacity-60'
          >
            {connecting && <Loader2 className='h-4 w-4 animate-spin' />}
            Connect
          </button>
        </div>
      </Card>
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  tone,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  tone: 'warning' | 'error';
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className='fixed inset-0 z-[400] grid place-items-center bg-gray-900/50 p-5 backdrop-blur-sm'>
      <Card className='w-full max-w-md p-6 shadow-theme-xl'>
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
            tone === 'error'
              ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
              : 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400'
          }`}
        >
          <AlertTriangle className='h-5 w-5' />
        </div>
        <h2 className='text-lg font-semibold text-gray-800 dark:text-white/90'>{title}</h2>
        <p className='mt-2 text-theme-sm text-gray-500 dark:text-gray-400'>{description}</p>
        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={onCancel}
            className='h-10 rounded-lg border border-gray-200 bg-white px-4 text-theme-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            className={`h-10 rounded-lg px-4 text-theme-sm font-medium text-white ${
              tone === 'error' ? 'bg-error-500' : 'bg-warning-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </Card>
    </div>
  );
}

function ChannelsInner() {
  const { isDark } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [processingAccepted, setProcessingAccepted] = useState<boolean | null>(null);
  const [agreementPlatform, setAgreementPlatform] = useState<SocialChannel | null>(null);
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null);
  const [connectToken, setConnectToken] = useState('');
  const [connectError, setConnectError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<Channel | null>(null);
  const [pauseTarget, setPauseTarget] = useState<Channel | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<Channel | null>(null);
  const [locationTarget, setLocationTarget] = useState<Channel | null>(null);
  const [pendingLocationChannelId, setPendingLocationChannelId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [websiteModalOpen, setWebsiteModalOpen] = useState(false);
  const [websiteWidget, setWebsiteWidget] = useState<WebsiteWidgetResponse | null>(null);
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteSaving, setWebsiteSaving] = useState(false);
  const [channelsPage, setChannelsPage] = useState(1);

  const load = useCallback(async () => {
    setErr('');
    try {
      const data = await apiFetch<{ items: Channel[] }>('/admin/channels', { auth: true });
      setChannels(data.items || []);
    } catch (error: unknown) {
      setErr(errorMessage(error, 'Failed to load channels.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWebsiteWidget = useCallback(async () => {
    setWebsiteLoading(true);
    try {
      const data = await apiFetch<WebsiteWidgetResponse>('/admin/widget', {
        method: 'GET',
        auth: true,
      });
      setWebsiteWidget(data);
    } catch {
      setWebsiteWidget(null);
    } finally {
      setWebsiteLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
      void loadWebsiteWidget();
      void apiFetch<Overview>('/admin/stats/overview', { auth: true })
        .then(setOverview)
        .catch(() => undefined);
      void apiFetch<{ accepted: boolean }>('/admin/processing-acceptance/status', {
        auth: true,
      })
        .then((res) => setProcessingAccepted(res.accepted))
        .catch(() => setProcessingAccepted(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, loadWebsiteWidget]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const handlers = [
        ['ig_status', 'ig_username', 'Instagram'],
        ['fb_status', 'fb_page', 'Facebook'],
        ['yt_status', 'yt_channel', 'YouTube'],
      ] as const;
      for (const [statusKey, nameKey, label] of handlers) {
        const status = searchParams.get(statusKey);
        const name = searchParams.get(nameKey);
        const msg = searchParams.get(statusKey.replace('status', 'msg'));
        if (!status) continue;
        router.replace('/channels', { scroll: false });
        if (status === 'success') {
          setSuccess(name ? `${name} connected on ${label}.` : `${label} connected.`);
          void load();
        } else {
          setErr(msg || `${label} connection failed.`);
        }
      }
      const googleStatus = searchParams.get('google_status');
      if (googleStatus) {
        router.replace('/channels', { scroll: false });
        if (googleStatus === 'success') {
          setSuccess('Google connected. Select the business profile to manage.');
          const channelId = searchParams.get('channel_id');
          if (channelId) setPendingLocationChannelId(Number(channelId));
          void load();
        } else {
          setErr(searchParams.get('google_msg') || 'Google connection failed.');
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, router, searchParams]);

  useEffect(() => {
    if (pendingLocationChannelId == null) return;
    const target = channels.find((channel) => channel.id === pendingLocationChannelId);
    if (!target) return;
    const timer = window.setTimeout(() => {
      setLocationTarget(target);
      setPendingLocationChannelId(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [channels, pendingLocationChannelId]);

  const active = channels.filter((channel) => channel.is_active);
  const offline = channels.filter((channel) => !channel.is_active);
  const pagedChannels = getPageItems(channels, channelsPage);
  const websiteChannel = channels.find((channel) => channel.platform?.toLowerCase?.().trim() === 'website');
  const websiteIsConnected = Boolean(websiteChannel);
  const taken = new Set(channels.map((channel) => channel.platform?.toLowerCase?.().trim()).filter(Boolean));
  const available = ALL_PLATFORMS.filter((platform) => {
    const key = platform.toLowerCase().trim();
    if (key === 'google reviews') return !taken.has('google');
    return !taken.has(key);
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setChannelsPage(1), 0);
    return () => window.clearTimeout(timer);
  }, [channels.length]);

  async function handleVerify(id: number): Promise<VerifyResult> {
    try {
      return await apiFetch<VerifyResult>(`/admin/channels/${id}/verify`, {
        method: 'POST',
        auth: true,
      });
    } catch (error: unknown) {
      return { ok: false, error: errorMessage(error, 'Verification failed.') };
    }
  }

  async function handleToggle(id: number, val: boolean) {
    try {
      const channel = channels.find((item) => item.id === id);
      if (channel?.platform === 'website') {
        await apiFetch(val ? '/admin/widget/enable' : '/admin/widget', {
          method: val ? 'POST' : 'DELETE',
          auth: true,
        });
        await loadWebsiteWidget();
      } else {
        await apiFetch(`/admin/channels/${id}`, {
          method: 'PUT',
          auth: true,
          body: { is_active: val },
        });
      }
      await load();
    } catch (error: unknown) {
      setErr(errorMessage(error, 'Failed to update channel.'));
    }
  }

  async function handleDisconnect(channel: Channel) {
    try {
      if (channel.platform === 'website') {
        await disableWebsiteWidget();
      } else {
        await apiFetch(`/admin/channels/${channel.id}`, {
          method: 'DELETE',
          auth: true,
        });
        setSuccess(`${platformLabel(channel.platform)} removed.`);
        await load();
      }
    } catch (error: unknown) {
      setErr(errorMessage(error, 'Failed to remove channel.'));
    } finally {
      setDisconnectTarget(null);
    }
  }

  async function handleConnect(platform: string, token?: string) {
    if (platform === 'instagram') {
      const response = await apiFetch<{ auth_url: string }>('/admin/channels/instagram/connect', { auth: true });
      if (response.auth_url) window.location.assign(response.auth_url);
      return;
    }
    if (platform === 'facebook') {
      const response = await apiFetch<{ auth_url: string }>('/admin/channels/facebook/connect', { auth: true });
      if (response.auth_url) window.location.assign(response.auth_url);
      return;
    }
    if (platform === 'google reviews') {
      const response = await apiFetch<{ auth_url: string }>('/admin/channels/google/connect', { auth: true });
      if (response.auth_url) window.location.assign(response.auth_url);
      return;
    }
    if (platform === 'telegram') {
      const response = await apiFetch<{ display_name?: string; username?: string }>('/admin/channels/telegram/connect', {
        method: 'POST',
        auth: true,
        body: { token },
      });
      setSuccess(`${response.display_name || response.username || 'Telegram bot'} connected.`);
      await load();
    }
  }

  function openConnect(platform: string) {
    if (!processingAccepted) {
      setAgreementPlatform(platform as SocialChannel);
      return;
    }
    setConnectToken('');
    setConnectError('');
    setConnectPlatform(platform);
  }

  async function confirmConnect() {
    if (!connectPlatform) return;
    setConnecting(true);
    setConnectError('');
    try {
      await handleConnect(connectPlatform, connectToken.trim() || undefined);
      setConnectPlatform(null);
    } catch (error: unknown) {
      setConnectError(errorMessage(error, 'Failed to connect channel.'));
    } finally {
      setConnecting(false);
    }
  }

  async function openWebsiteModal() {
    if (!processingAccepted) {
      setAgreementPlatform('website');
      return;
    }
    setWebsiteModalOpen(true);
    await loadWebsiteWidget();
  }

  async function enableWebsiteWidget() {
    setWebsiteSaving(true);
    try {
      const data = await apiFetch<WebsiteWidgetResponse>('/admin/widget/enable', {
        method: 'POST',
        auth: true,
      });
      setWebsiteWidget(data);
      await loadWebsiteWidget();
      await load();
    } catch (error: unknown) {
      setErr(errorMessage(error, 'Failed to enable website widget.'));
    } finally {
      setWebsiteSaving(false);
    }
  }

  async function disableWebsiteWidget() {
    setWebsiteSaving(true);
    try {
      await apiFetch('/admin/widget', { method: 'DELETE', auth: true });
      await loadWebsiteWidget();
      await load();
    } catch (error: unknown) {
      setErr(errorMessage(error, 'Failed to disable website widget.'));
    } finally {
      setWebsiteSaving(false);
    }
  }

  async function copyWebsiteScript() {
    const config = websiteWidget?.config || websiteWidget;
    const widgetKey =
      config && typeof config === 'object' && 'widget_key' in config
        ? String(config.widget_key)
        : '';
    const script =
      websiteWidget?.embed_code ||
      websiteWidget?.script ||
      websiteWidget?.embedCode ||
      (widgetKey
        ? `<script src="${process.env.NEXT_PUBLIC_API_BASE}/widget/embed.js" data-widget-id="${widgetKey}" async></script>`
        : '');
    if (!script) {
      setErr('No script available. Enable the website widget first.');
      return;
    }
    await navigator.clipboard.writeText(script);
    setSuccess('Website script copied.');
  }

  const settingsCfgColor = '#465FFF';

  return (
    <>
      {disconnectTarget && (
        <ConfirmModal
          title={`Disconnect ${platformLabel(disconnectTarget.platform)}?`}
          description={`${channelName(disconnectTarget)} will be removed from this workspace.`}
          confirmLabel='Disconnect'
          tone='error'
          onCancel={() => setDisconnectTarget(null)}
          onConfirm={() => void handleDisconnect(disconnectTarget)}
        />
      )}

      {pauseTarget && (
        <ConfirmModal
          title={`Pause ${platformLabel(pauseTarget.platform)}?`}
          description='The AI assistant will stop replying on this channel until it is reactivated.'
          confirmLabel='Pause channel'
          tone='warning'
          onCancel={() => setPauseTarget(null)}
          onConfirm={() => {
            void handleToggle(pauseTarget.id, false);
            setPauseTarget(null);
          }}
        />
      )}

      {locationTarget && (
        <GoogleLocationModal
          channelId={locationTarget.id}
          isDark={isDark}
          currentLocationId={locationTarget.location_id ?? null}
          onClose={() => setLocationTarget(null)}
          onSaved={(loc) => {
            setSuccess(`Now managing reviews for ${loc.location_name || 'the selected location'}.`);
            void load();
          }}
        />
      )}

      {agreementPlatform && (
        <DataProcessingAgreementModal
          platform={agreementPlatform}
          isDark={isDark}
          onClose={() => setAgreementPlatform(null)}
          onAccepted={() => {
            const platform = agreementPlatform;
            setProcessingAccepted(true);
            setAgreementPlatform(null);
            if (platform === 'website') {
              setWebsiteModalOpen(true);
              void loadWebsiteWidget();
            } else {
              setConnectPlatform(platform);
            }
          }}
        />
      )}

      {connectPlatform && (
        <ConnectModal
          platform={connectPlatform}
          connecting={connecting}
          error={connectError}
          token={connectToken}
          setToken={setConnectToken}
          onCancel={() => setConnectPlatform(null)}
          onConfirm={() => void confirmConnect()}
        />
      )}

      {settingsTarget && (
        <ChannelSettingsDrawer
          channelId={settingsTarget.id}
          channelName={channelName(settingsTarget)}
          platformColor={settingsCfgColor}
          onClose={() => setSettingsTarget(null)}
        />
      )}

      {websiteModalOpen && (
        <WebsiteWidgetModal
          isDark={isDark}
          loading={websiteLoading}
          saving={websiteSaving}
          widget={websiteWidget}
          onClose={() => setWebsiteModalOpen(false)}
          onEnable={enableWebsiteWidget}
          onDisable={disableWebsiteWidget}
          onCopy={copyWebsiteScript}
        />
      )}

      <div className='mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
          <div>
            <p className='text-theme-sm font-medium text-brand-500 dark:text-brand-400'>Channels</p>
            <h1 className='mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90'>
              Channel management
            </h1>
            <p className='mt-2 max-w-2xl text-theme-sm text-gray-500 dark:text-gray-400'>
              Connect, monitor, pause, and configure customer communication channels.
            </p>
          </div>
          <button
            type='button'
            onClick={() => void load()}
            className='inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]'
          >
            <RefreshCw className='h-4 w-4' />
            Refresh
          </button>
        </div>

        {success && (
          <div className='mb-6 flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-theme-sm font-medium text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-500'>
            <Check className='h-4 w-4' />
            <span className='flex-1'>{success}</span>
            <button type='button' onClick={() => setSuccess('')}>Close</button>
          </div>
        )}

        {err && (
          <div className='mb-6 flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-theme-sm font-medium text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-500'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
            <span className='flex-1'>{err}</span>
            <button type='button' onClick={() => setErr('')}>Close</button>
          </div>
        )}

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6'>
          <MetricCard
            label='Active channels'
            value={active.length}
            sub={`${channels.length} total`}
            icon={<CheckCircle2 className='h-6 w-6' />}
            tone='success'
          />
          <MetricCard
            label='Offline channels'
            value={offline.length}
            sub='paused'
            icon={<WifiOff className='h-6 w-6' />}
            tone={offline.length > 0 ? 'warning' : 'primary'}
          />
          <MetricCard
            label='Messages'
            value={overview?.total_messages ?? 0}
            sub={`${overview?.open_conversations ?? 0} open chats`}
            icon={<MessageCircle className='h-6 w-6' />}
          />
          <MetricCard
            label='AI latency'
            value={formatLatency(overview?.avg_latency_ms)}
            sub='average response'
            icon={<Plug className='h-6 w-6' />}
          />
        </div>

        <div className='mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12'>
          <div className='xl:col-span-5'>
            <StatusChart activeCount={active.length} offlineCount={offline.length} isDark={isDark} />
          </div>
          <div className='xl:col-span-7'>
            <PlatformChart channels={channels} isDark={isDark} />
          </div>
        </div>

        <Card className='mt-6 overflow-hidden'>
          <div className='flex flex-col gap-2 border-b border-gray-100 px-5 py-5 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between sm:px-6'>
            <div>
              <h3 className='text-base font-semibold text-gray-800 dark:text-white/90'>Connected Channels</h3>
              <p className='mt-1 text-theme-sm text-gray-500 dark:text-gray-400'>
                Manage account status, verification, settings, and disconnect actions.
              </p>
            </div>
            <div className='text-theme-sm font-medium text-gray-500 dark:text-gray-400'>
              {channels.length} channels
            </div>
          </div>

          <div className='min-w-0 px-5 py-5 sm:px-6'>
            <div className='flex flex-col gap-4 rounded-t-xl border border-b-0 border-gray-200 bg-white px-5 py-4 dark:border-white/[0.05] dark:bg-white/[0.01] lg:flex-row lg:items-center lg:justify-between'>
              <h4 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
                Connected channels
              </h4>
              <p className='text-theme-sm text-gray-500 dark:text-gray-400'>
                Verify, pause, configure, or update Google review locations.
              </p>
            </div>

            <div className='min-w-0 max-w-full overflow-hidden rounded-b-xl border border-gray-200 dark:border-white/[0.05]'>
              <div className='w-full overflow-x-auto'>
                <table className='lashvae-column-dividers min-w-[1220px] table-fixed'>
                  <colgroup>
                    <col className='w-[330px]' />
                    <col className='w-[160px]' />
                    <col className='w-[150px]' />
                    <col className='w-[170px]' />
                    <col className='w-[160px]' />
                    <col className='w-[250px]' />
                  </colgroup>
                  <thead className='border-b border-gray-100 dark:border-white/[0.05]'>
                    <tr>
                      {['Channel', 'Platform', 'Status', 'Token', 'Updated', 'Actions'].map((header) => (
                        <th key={header} className='px-5 py-3 text-left text-base font-medium text-gray-500 dark:text-gray-400'>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100 dark:divide-white/[0.05]'>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className='px-5 py-14 text-center text-theme-sm text-gray-500 dark:text-gray-400'>
                          Loading channels
                        </td>
                      </tr>
                    ) : channels.length === 0 ? (
                      <tr>
                        <td colSpan={6} className='px-5 py-14 text-center text-theme-sm text-gray-500 dark:text-gray-400'>
                          No channels connected yet
                        </td>
                      </tr>
                    ) : (
                      pagedChannels.map((channel) => {
                        const token = getTokenStatus(channel);
                        const isGoogle = channel.platform?.toLowerCase().trim() === 'google';
                        const isWebsite = channel.platform?.toLowerCase().trim() === 'website';
                        return (
                          <tr key={channel.id} className='transition hover:bg-gray-50 dark:hover:bg-white/[0.02]'>
                            <td className='px-5 py-3 sm:px-6'>
                              <div className='flex items-center gap-3'>
                                <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700'>
                                  <Image
                                    src={platformLogo(channel.platform)}
                                    alt={platformLabel(channel.platform)}
                                    width={22}
                                    height={22}
                                    className='h-5.5 w-5.5 object-contain'
                                  />
                                </div>
                                <div className='min-w-0'>
                                  <p className='truncate text-theme-sm font-medium text-gray-800 dark:text-white/90'>{channelName(channel)}</p>
                                  <p className='mt-1 truncate text-theme-xs text-gray-500 dark:text-gray-400'>
                                    {channel.location_name || channel.platform_account_id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className='px-6 py-3 text-theme-sm text-gray-500 dark:text-gray-400'>
                              {platformLabel(channel.platform)}
                            </td>
                            <td className='px-6 py-3'>
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-theme-xs font-medium ${
                                channel.is_active
                                  ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                                  : 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400'
                              }`}>
                                {channel.is_active ? 'Active' : 'Offline'}
                              </span>
                            </td>
                            <td className='px-6 py-3'>
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-theme-xs font-medium ${
                                token?.status === 'expired'
                                  ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
                                  : token?.status === 'expiring'
                                    ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80'
                              }`}>
                                {token ? (token.status === 'ok' ? `${token.daysLeft} days left` : token.status) : 'Not applicable'}
                              </span>
                            </td>
                            <td className='px-6 py-3 text-theme-sm text-gray-500 dark:text-gray-400'>
                              {formatDate(channel.updated_at || channel.created_at)}
                            </td>
                            <td className='px-6 py-3'>
                              <div className='flex items-center gap-2'>
                                <button
                                  type='button'
                                  onClick={() => {
                                    void handleVerify(channel.id).then((result) => {
                                      if (result.ok) {
                                        setErr('');
                                        setSuccess(
                                          result.account_name
                                            ? `Verified ${result.account_name}.`
                                            : 'Channel verified.',
                                        );
                                        return;
                                      }
                                      setSuccess('');
                                      setErr(result.error || 'Verification failed.');
                                    });
                                  }}
                                  className='inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600'
                                >
                                  Verify
                                </button>
                                <button
                                  type='button'
                                  onClick={() => channel.is_active ? setPauseTarget(channel) : void handleToggle(channel.id, true)}
                                  className='inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]'
                                >
                                  {channel.is_active ? <PauseCircle className='h-4 w-4' /> : <Power className='h-4 w-4' />}
                                  {channel.is_active ? 'Pause' : 'Activate'}
                                </button>
                                {isGoogle && (
                                  <button
                                    type='button'
                                    onClick={() => setLocationTarget(channel)}
                                    className='inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600'
                                  >
                                    Location
                                  </button>
                                )}
                                {isWebsite && (
                                  <button
                                    type='button'
                                    onClick={() => router.push('/customize-chat')}
                                    className='inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600'
                                  >
                                    Manage
                                  </button>
                                )}
                                <div className='relative'>
                                  <button
                                    type='button'
                                    onClick={() => setOpenMenuId(openMenuId === channel.id ? null : channel.id)}
                                    className='flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
                                  >
                                    <MoreVertical className='h-4 w-4' />
                                  </button>
                                  {openMenuId === channel.id && (
                                    <div className='absolute right-0 top-[calc(100%+8px)] z-20 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900'>
                                      <button
                                        type='button'
                                        onClick={() => {
                                          setSettingsTarget(channel);
                                          setOpenMenuId(null);
                                        }}
                                        className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                                      >
                                        <Settings className='h-4 w-4' />
                                        Settings
                                      </button>
                                      <button
                                        type='button'
                                        onClick={() => {
                                          setDisconnectTarget(channel);
                                          setOpenMenuId(null);
                                        }}
                                        className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-theme-sm text-error-600 hover:bg-error-50 dark:text-error-500 dark:hover:bg-error-500/10'
                                      >
                                        <Trash2 className='h-4 w-4' />
                                        Disconnect
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <TablePagination page={channelsPage} totalItems={channels.length} onPageChange={setChannelsPage} />
          </div>
        </Card>
        {(available.length > 0 || !websiteIsConnected) && (
          <Card className='mt-6 p-5 sm:p-6'>
            <ChartHeader title='Add Channel' subtitle='Connect another source using the approved channel setup flow' />
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {!websiteIsConnected && (
                <button
                  type='button'
                  onClick={() => void openWebsiteModal()}
                  className='rounded-xl border border-gray-200 p-5 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]'
                >
                  <div className='mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
                    <Globe2 className='h-5 w-5' />
                  </div>
                  <h4 className='text-theme-sm font-semibold text-gray-800 dark:text-white/90'>Website Chatbot</h4>
                  <p className='mt-1 text-theme-sm text-gray-500 dark:text-gray-400'>Add AI chat to your website using one script tag.</p>
                </button>
              )}
              {available.map((platform) => (
                <button
                  key={platform}
                  type='button'
                  onClick={() => openConnect(platform)}
                  className='rounded-xl border border-gray-200 p-5 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]'
                >
                  <div className='mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
                    <Plug className='h-5 w-5' />
                  </div>
                  <h4 className='text-theme-sm font-semibold text-gray-800 dark:text-white/90'>{platformLabel(platform)}</h4>
                  <p className='mt-1 text-theme-sm text-gray-500 dark:text-gray-400'>Connect and manage this channel from Lashvae.</p>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

export default function ChannelsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <ChannelsInner />
      </Suspense>
    </RequireAuth>
  );
}
