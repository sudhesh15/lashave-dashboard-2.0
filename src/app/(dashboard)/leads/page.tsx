'use client';

import { ChannelFilter, useChannelFilter, type ChannelFilterValue } from '@/components/channel-filter';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { DateFilter } from '@/components/date-filter';
import { RequireAuth } from '@/components/require-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPageItems, TablePagination } from '@/components/ui/table-pagination';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { apiFetch } from '@/lib/api';
import { type Mood } from '@/lib/chat-classifiers';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Eye,
  List,
  Loader2,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  Trophy,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type LeadItem = {
  id: number;
  conversation_id: number;
  external_user_id: string;
  display_name?: string | null;
  profile_pic_url?: string | null;
  is_user_follow_business?: boolean | null;
  channel: string;
  channel_id?: number | null;
  status: string;
  source: string;
  intent: string;
  service: string;
  contacts: { emails?: string[]; phones?: string[] };
  meta: {
    score?: number;
    triggers?: string[];
    text_preview?: string;
    mood?: Mood;
    instagram_profile?: {
      profile_pic_url?: string | null;
      is_user_follow_business?: boolean | null;
    };
  };
  updated_at: string | null;
};

type FollowUpItem = {
  conversation_id: number | string;
  name?: string | null;
  lead_or_customer?: string | null;
  title?: string | null;
  reason?: string | null;
  insight?: string | null;
  priority?: string | null;
};

const PIPELINE = ['new', 'contacted', 'qualified', 'won', 'lost'];
const LIMIT = 200;
const PAGE_SIZE = 8;

const STAGE_TABS: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All stages', icon: <List size={13} /> },
  { key: 'new', label: 'New', icon: <Plus size={13} /> },
  { key: 'contacted', label: 'Contacted', icon: <Phone size={13} /> },
  { key: 'qualified', label: 'Qualified', icon: <Check size={13} /> },
  { key: 'won', label: 'Won', icon: <Trophy size={13} /> },
  { key: 'lost', label: 'Lost', icon: <X size={13} /> },
];

const CHANNEL_LOGOS: Record<string, string> = {
  facebook: '/brand-logo/facebook.png',
  google: '/brand-logo/google-map.png',
  instagram: '/brand-logo/instagram.png',
  meta: '/brand-logo/meta.png',
  telegram: '/brand-logo/telegram.png',
  website: '/brand-logo/website.png',
  whatsapp: '/brand-logo/whatsapp.png',
  youtube: '/brand-logo/youtube.png',
};

const QUICK_KW = [
  { label: 'Pricing', kws: ['price', 'cost', 'budget', 'quote', 'fee'] },
  { label: 'Intent', kws: ['urgent', 'asap', 'demo', 'call', 'book'] },
  { label: 'Services', kws: ['whatsapp', 'instagram', 'automation', 'website', 'chatbot'] },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function timeAgo(iso: string | null) {
  if (!iso) return '-';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function titleCase(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function getDisplayInfo(lead: LeadItem) {
  const uid = lead.external_user_id || '';

  if (lead.channel === 'website') {
    const name = lead.display_name || `Website visitor ${lead.conversation_id}`;
    return {
      label: name.replace(/^@/, ''),
      subtitle: uid || `Conversation #${lead.conversation_id}`,
      isPsid: false,
    };
  }

  if (lead.display_name) {
    return {
      label: lead.display_name.replace(/^@/, ''),
      subtitle: uid,
      isPsid: false,
    };
  }

  if (/^\d+$/.test(uid)) {
    return {
      label: 'Instagram User',
      subtitle: `ID ${uid.slice(-8)}`,
      isPsid: true,
    };
  }

  return {
    label: uid ? uid.replace(/^@/, '') : `Lead ${lead.id}`,
    subtitle: uid,
    isPsid: false,
  };
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-brand-50 px-1 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function LeadAvatar({ lead, label }: { lead: LeadItem; label: string }) {
  const src = lead.profile_pic_url || lead.meta?.instagram_profile?.profile_pic_url || null;
  const initials = label
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt={label}
        width={40}
        height={40}
        unoptimized
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 type-caption font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
      {initials || 'LD'}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  active,
  tone = 'brand',
  onClick,
}: {
  label: string;
  value: number;
  detail: string;
  active?: boolean;
  tone?: 'brand' | 'success' | 'warning' | 'error' | 'gray';
  onClick?: () => void;
}) {
  const toneBg: Record<string, string> = {
    brand: 'bg-brand-50/60 dark:bg-brand-500/[0.06]',
    success: 'bg-success-50/60 dark:bg-success-500/[0.06]',
    warning: 'bg-warning-50/60 dark:bg-warning-500/[0.06]',
    error: 'bg-error-50/60 dark:bg-error-500/[0.06]',
    gray: 'bg-gray-50 dark:bg-white/[0.02]',
  };

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-6 text-left transition',
        toneBg[tone],
        active
          ? 'border-brand-300 shadow-theme-sm dark:border-brand-500/40'
          : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700',
      )}
    >
      <span className='type-caption font-medium uppercase text-gray-500 dark:text-gray-400'>
        {label}
      </span>
      <div className='mt-3 flex items-end justify-between gap-3'>
        <span className='text-title-sm font-semibold text-gray-800 dark:text-white/90'>
          {value}
        </span>
        <span className='type-caption text-gray-400 dark:text-gray-500'>
          {detail}
        </span>
      </div>
    </button>
  );
}

const STAGE_TONE: Record<string, string> = {
  new: 'text-brand-500 dark:text-brand-400',
  contacted: 'text-warning-600 dark:text-orange-400',
  qualified: 'text-brand-500 dark:text-brand-400',
  won: 'text-success-600 dark:text-success-500',
  lost: 'text-error-600 dark:text-error-500',
};

function StageSelect({
  status,
  disabled,
  onChange,
  label,
}: {
  status: string;
  disabled: boolean;
  onChange: (status: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false), open);

  const current = STAGE_TABS.find((tab) => tab.key === status) ?? STAGE_TABS[1];
  const toneClass = STAGE_TONE[status] || 'text-gray-700 dark:text-gray-300';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-[10px] border border-gray-200 bg-white px-3 type-small font-medium outline-none transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-white/[0.03]"
        aria-label={`Change stage for ${label}`}
      >
        <span className={cn('inline-flex items-center gap-2 truncate', toneClass)}>
          {current.icon}
          {current.label}
        </span>
        {disabled ? (
          <Loader2 className="icon-small shrink-0 animate-spin text-gray-400" />
        ) : (
          <ChevronDown className={cn('icon-small shrink-0 text-gray-400 transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {PIPELINE.map((stage) => {
            const tab = STAGE_TABS.find((item) => item.key === stage);
            if (!tab) return null;
            const isActive = stage === status;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => {
                  onChange(stage);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left type-small font-medium transition',
                  isActive
                    ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]',
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LeadWorklist({
  items,
  loading,
  searchQ,
  updatingId,
  onStatusChange,
}: {
  items: LeadItem[];
  loading: boolean;
  searchQ: string;
  updatingId: number | null;
  onStatusChange: (leadId: number, status: string) => void;
}) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-b-xl border border-gray-200 dark:border-white/[0.05]">
      <div className="w-full overflow-x-auto">
        <table className="lashvae-column-dividers min-w-[1360px] table-fixed">
          <colgroup>
            <col className="w-[280px]" />
            <col className="w-[170px]" />
            <col className="w-[160px]" />
            <col className="w-[240px]" />
            <col className="w-[200px]" />
            <col className="w-[120px]" />
            <col className="w-[190px]" />
          </colgroup>
          <thead className="border-b border-gray-100 dark:border-white/[0.05]">
            <tr>
              {['Lead', 'Stage', 'Channel', 'Email', 'Phone', 'Activity', 'Actions'].map(
                (header) => (
                  <th
                    key={header}
                    className="px-5 py-3 text-left type-body font-medium text-gray-500 dark:text-gray-400"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center type-small text-gray-500 dark:text-gray-400">
                  Loading leads
                </td>
              </tr>
            )}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center type-small text-gray-500 dark:text-gray-400">
                  {searchQ ? 'No leads match this search' : 'No leads found'}
                </td>
              </tr>
            )}

            {items.map((lead) => {
              const display = getDisplayInfo(lead);
              const email = lead.contacts?.emails?.[0] || '';
              const phone = lead.contacts?.phones?.[0] || '';
              return (
                <tr key={lead.id} className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                      <LeadAvatar lead={lead} label={display.label} />
                      <div className="min-w-0">
                        <span className="group relative block max-w-full type-small font-medium text-gray-800 dark:text-white/90">
                          <Link
                            href={`/conversations/${lead.conversation_id}`}
                            className="block truncate hover:text-brand-500 dark:hover:text-brand-400"
                          >
                            <Highlight text={display.label} query={searchQ} />
                          </Link>
                          <span className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden max-w-[280px] group-hover:block">
                            <span className="absolute -top-1 left-3 h-2 w-2 rotate-45 rounded-[2px] bg-gray-900" />
                            <span className="relative block rounded-[10px] bg-gray-900 px-3 py-1.5 type-caption font-medium text-white shadow-lg">
                              {display.label}
                            </span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <StageSelect
                      status={lead.status}
                      disabled={updatingId === lead.id}
                      onChange={(status) => onStatusChange(lead.id, status)}
                      label={display.label}
                    />
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-2 type-small text-gray-700 dark:text-gray-300">
                      <Image
                        src={CHANNEL_LOGOS[(lead.channel || '').toLowerCase()] || '/brand-logo/website.png'}
                        alt={titleCase(lead.channel || 'Channel')}
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px] shrink-0 object-contain"
                      />
                      <span className="truncate">{titleCase(lead.channel || 'Channel')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-3 type-small text-gray-500 dark:text-gray-400">
                    <span className="block truncate" title={email || undefined}>
                      {email || 'No email saved'}
                    </span>
                  </td>
                  <td className="px-6 py-3 type-small text-gray-500 dark:text-gray-400">
                    <span className="block truncate" title={phone || undefined}>
                      {phone || 'No phone saved'}
                    </span>
                  </td>
                  <td className="px-6 py-3 type-small tabular-nums text-gray-500 dark:text-gray-400">
                    {timeAgo(lead.updated_at)}
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/conversations/${lead.conversation_id}`}
                      className="inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-[10px] bg-brand-500 px-3 type-small font-medium text-white shadow-theme-xs hover:bg-brand-600"
                    >
                      <Eye size={14} />
                      View conversation
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type LeadFilterKey = 'channel' | 'stage' | 'date';

export default function LeadsPage() {
  const [items, setItems] = useState<LeadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { filter: channelFilter, setFilter: setChannelFilter } = useChannelFilter();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [voiceFollowUps, setVoiceFollowUps] = useState<FollowUpItem[]>([]);
  const [kwInput, setKwInput] = useState('');
  const [savingKW, setSavingKW] = useState(false);
  const [savedKW, setSavedKW] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [openFilter, setOpenFilter] = useState<LeadFilterKey | null>(null);

  const channelFilterRef = useRef<HTMLDivElement>(null);
  const stageFilterRef = useRef<HTMLDivElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);
  useOutsideClick(channelFilterRef, () => setOpenFilter(null), openFilter === 'channel');
  useOutsideClick(stageFilterRef, () => setOpenFilter(null), openFilter === 'stage');
  useOutsideClick(dateFilterRef, () => setOpenFilter(null), openFilter === 'date');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQ(searchQ);
      setSearching(false);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQ]);

  useEffect(() => {
    apiFetch<{ lead_keywords: string[] }>('/admin/settings', { auth: true })
      .then((data) => setKeywords(data.lead_keywords ?? []))
      .catch(() => {});

    apiFetch<{ ok: boolean; followups: FollowUpItem[]; count: number }>('/admin/growth/followups', { auth: true })
      .then((data) => setVoiceFollowUps(data.followups ?? []))
      .catch(() => {});
  }, []);

  function addKw() {
    const kw = kwInput.trim().toLowerCase();
    if (!kw || keywords.includes(kw)) return;
    setKeywords((prev) => [...prev, kw]);
    setKwInput('');
  }

  function removeKw(kw: string) {
    setKeywords((prev) => prev.filter((item) => item !== kw));
  }

  async function saveKeywords() {
    setSavingKW(true);
    try {
      await apiFetch('/admin/settings', {
        method: 'PUT',
        auth: true,
        body: { lead_keywords: keywords },
      });
      setSavedKW(true);
      setTimeout(() => setSavedKW(false), 2000);
    } catch (error: unknown) {
      setErr(getErrorMessage(error, 'Save failed'));
    } finally {
      setSavingKW(false);
    }
  }

  const load = useCallback(
    async (q = debouncedQ) => {
      setLoading(true);
      setErr(null);

      try {
        const qs = new URLSearchParams();
        qs.set('limit', String(LIMIT));
        qs.set('offset', '0');
        if (q.trim()) qs.set('q', q.trim());
        if (channelFilter.channel) qs.set('channel', channelFilter.channel);
        if (channelFilter.channel_id !== null) qs.set('channel_id', String(channelFilter.channel_id));
        if (dateRange?.from) qs.set('from_ts', new Date(dateRange.from).toISOString());
        if (dateRange?.to) {
          const to = new Date(dateRange.to);
          to.setHours(23, 59, 59, 999);
          qs.set('to_ts', to.toISOString());
        }

        const data = await apiFetch<{ items: LeadItem[]; total: number }>(`/admin/leads?${qs}`, {
          auth: true,
        });

        setItems(data.items || []);
        setTotal(data.total ?? data.items?.length ?? 0);
      } catch (error: unknown) {
        setErr(getErrorMessage(error, 'Failed to load'));
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, channelFilter, dateRange],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load(debouncedQ);
    }, 0);

    return () => clearTimeout(timeout);
  }, [debouncedQ, channelFilter, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timeout = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(timeout);
  }, [filterStatus, debouncedQ, channelFilter, dateRange]);

  async function updateStatus(leadId: number, newStatus: string) {
    setUpdatingId(leadId);
    try {
      await apiFetch(`/admin/leads/${leadId}/status`, {
        method: 'POST',
        auth: true,
        body: { status: newStatus },
      });

      setItems((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead)));
    } catch (error: unknown) {
      setErr(getErrorMessage(error, 'Failed to update status'));
    } finally {
      setUpdatingId(null);
    }
  }

  const counts = useMemo(
    () =>
      items.reduce<Record<string, number>>((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {}),
    [items],
  );

  const channelCounts = useMemo(
    () =>
      items.reduce<Record<number, number>>((acc, lead) => {
        if (lead.channel_id != null) acc[lead.channel_id] = (acc[lead.channel_id] || 0) + 1;
        return acc;
      }, {}),
    [items],
  );

  const stageCounts: Record<string, number> = {
    all: items.length,
    new: counts.new || 0,
    contacted: counts.contacted || 0,
    qualified: counts.qualified || 0,
    won: counts.won || 0,
    lost: counts.lost || 0,
  };

  const visibleItems = useMemo(
    () => (filterStatus === 'all' ? items : items.filter((lead) => lead.status === filterStatus)),
    [items, filterStatus],
  );

  const pageItems = getPageItems(visibleItems, page, PAGE_SIZE);
  const activeStageTab = STAGE_TABS.find((tab) => tab.key === filterStatus) ?? STAGE_TABS[0];

  const pipelineTotal = useMemo(() => Object.values(counts).reduce((sum, value) => sum + value, 0), [counts]);
  const qualifiedTotal = (counts.qualified || 0) + (counts.won || 0);

  const handleSeeAllLeads = useCallback(() => {
    setFilterStatus('all');
    setSearchQ('');
    setDateRange(null);
    setActivePreset(null);
    setChannelFilter({ channel: null, channel_id: null });
    setOpenFilter(null);
  }, [setChannelFilter]);

  return (
    <RequireAuth>
      <div className='mx-auto max-w-360 px-4 py-8'>
        <PageBreadcrumb pageTitle='Leads' />

        <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-title-sm font-semibold text-gray-800 dark:text-white/90'>
              Leads
            </h1>
            <p className='mt-1 type-small text-gray-500 dark:text-gray-400'>
              Manage lead qualification, follow-ups, and pipeline movement from
              one focused workspace.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => load()}
              disabled={loading}
            >
              <RefreshCw className={cn('icon-small', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <MetricCard
            label='Total leads'
            value={total}
            detail={debouncedQ ? 'Filtered result' : 'Current view'}
            active={filterStatus === 'all'}
            tone='warning'
            onClick={() => setFilterStatus('all')}
          />
          <MetricCard
            label='New'
            value={counts.new || 0}
            detail={
              pipelineTotal
                ? `${Math.round(((counts.new || 0) / pipelineTotal) * 100)}% pipeline`
                : 'No data'
            }
            active={filterStatus === 'new'}
            tone='brand'
            onClick={() =>
              setFilterStatus(filterStatus === 'new' ? 'all' : 'new')
            }
          />
          <MetricCard
            label='Qualified'
            value={qualifiedTotal}
            detail='Qualified and won'
            active={filterStatus === 'qualified'}
            tone='success'
            onClick={() =>
              setFilterStatus(
                filterStatus === 'qualified' ? 'all' : 'qualified',
              )
            }
          />
          <MetricCard
            label='Follow-ups'
            value={voiceFollowUps.length}
            detail='Growth queue'
            tone='error'
          />
        </div>

        <div className='flex flex-col gap-6'>
          <div className='flex flex-col gap-6'>
            <div className='min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]'>
              <div className='flex flex-col gap-2 border-b border-gray-100 px-5 py-5 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between sm:px-6'>
                <h3 className='type-body font-semibold text-gray-800 dark:text-white/90'>
                  Lead pipeline
                </h3>
                <div className='type-small font-medium text-gray-500 dark:text-gray-400'>
                  {total} leads
                </div>
              </div>

              <div className='min-w-0 px-5 py-5 sm:px-6'>
                <div className='flex flex-col gap-4 rounded-t-xl border border-b-0 border-gray-200 bg-white px-5 py-4 dark:border-white/[0.05] dark:bg-white/[0.01] lg:flex-row lg:items-center lg:justify-between'>
                  <h4 className='type-card-title font-semibold text-gray-800 dark:text-white/90'>
                    {activeStageTab.label} leads
                  </h4>
                  <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end'>
                    <div className='relative w-full sm:w-[240px]'>
                      <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400' />
                      <input
                        type='search'
                        value={searchQ}
                        onChange={(event) => {
                          setSearchQ(event.target.value);
                          setSearching(!!event.target.value);
                        }}
                        placeholder='Search name, intent, service, or message'
                        className='h-10 w-full rounded-[10px] border border-gray-300 bg-white py-2 pl-11 pr-9 type-small text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500'
                      />
                      {searchQ && !searching && (
                        <button
                          type='button'
                          onClick={() => setSearchQ('')}
                          className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300'
                          aria-label='Clear search'
                        >
                          <X className='icon-small' />
                        </button>
                      )}
                      {searching && (
                        <Loader2 className='pointer-events-none absolute right-3 top-1/2 icon-small -translate-y-1/2 animate-spin text-gray-400' />
                      )}
                    </div>

                    <div ref={channelFilterRef} className='relative'>
                      <Button
                        variant='outline'
                        onClick={() =>
                          setOpenFilter(
                            openFilter === 'channel' ? null : 'channel',
                          )
                        }
                      >
                        <Radio size={14} />
                        Channel
                      </Button>
                      {openFilter === 'channel' && (
                        <div className='absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900'>
                          <ChannelFilter
                            value={channelFilter}
                            onChange={(value) => {
                              setChannelFilter(value);
                              setOpenFilter(null);
                            }}
                            counts={channelCounts}
                            totalCount={items.length}
                          />
                        </div>
                      )}
                    </div>

                    <div ref={stageFilterRef} className='relative'>
                      <Button
                        variant='outline'
                        onClick={() =>
                          setOpenFilter(openFilter === 'stage' ? null : 'stage')
                        }
                      >
                        <SlidersHorizontal size={14} />
                        Stage
                      </Button>
                      {openFilter === 'stage' && (
                        <div className='absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900'>
                          {STAGE_TABS.map((tab) => {
                            const isActive = filterStatus === tab.key;
                            const count = stageCounts[tab.key] || 0;
                            return (
                              <button
                                key={tab.key}
                                type='button'
                                onClick={() => {
                                  setFilterStatus(tab.key);
                                  setOpenFilter(null);
                                }}
                                className={cn(
                                  'flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left type-small font-medium transition',
                                  isActive
                                    ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400'
                                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]',
                                )}
                              >
                                <span className='inline-flex items-center gap-2'>
                                  {tab.icon}
                                  {tab.label}
                                </span>
                                <span className='type-caption text-gray-400 dark:text-gray-500'>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div ref={dateFilterRef} className='relative'>
                      <DateFilter
                        dateRange={dateRange}
                        activePreset={activePreset}
                        setDateRange={setDateRange}
                        setActivePreset={setActivePreset}
                        open={openFilter === 'date'}
                        onToggle={() =>
                          setOpenFilter(openFilter === 'date' ? null : 'date')
                        }
                        onClose={() => setOpenFilter(null)}
                      />
                    </div>

                    <Button variant='outline' onClick={handleSeeAllLeads}>
                      See all
                    </Button>
                  </div>
                </div>

                {debouncedQ && !loading && (
                  <div className='border-x border-gray-200 bg-white px-5 py-3 type-small text-brand-500 dark:border-white/[0.05] dark:bg-white/[0.01] dark:text-brand-400'>
                    {total > 0
                      ? `${total} leads match "${debouncedQ}"`
                      : `No leads match "${debouncedQ}"`}
                  </div>
                )}

                {err && (
                  <div className='mt-3 flex items-center gap-2 rounded-[10px] border border-error-200 bg-error-50 px-4 py-3 type-small text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-500'>
                    <AlertTriangle className='icon-small shrink-0' />
                    {err}
                  </div>
                )}

                <LeadWorklist
                  items={pageItems}
                  loading={loading}
                  searchQ={debouncedQ}
                  updatingId={updatingId}
                  onStatusChange={updateStatus}
                />
                <TablePagination
                  page={page}
                  totalItems={visibleItems.length}
                  onPageChange={setPage}
                  pageSize={PAGE_SIZE}
                />
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-6'>
            <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
              <div className='border-b border-gray-100 px-6 py-5 dark:border-gray-800'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <h3 className='type-body font-semibold text-gray-800 dark:text-white/90'>
                      Lead keywords
                    </h3>
                    <p className='mt-1 type-small text-gray-500 dark:text-gray-400'>
                      Terms that boost a conversation&apos;s lead score
                      automatically.
                    </p>
                  </div>
                  <Badge color='light'>{keywords.length} active</Badge>
                </div>
              </div>

              <div className='grid gap-4 p-4 sm:p-6 lg:grid-cols-2'>
                <div className='flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]'>
                  <div className='flex items-center gap-2 type-caption font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                    <Tag className='icon-tiny' />
                    Active keywords
                  </div>
                  <p className='type-caption text-gray-500 dark:text-gray-400'>
                    Each keyword adds 2 points. Strong intent terms can qualify
                    a conversation automatically.
                  </p>
                  <div className='flex min-h-24 flex-1 flex-wrap content-start gap-2 rounded-[10px] border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900'>
                    {keywords.length === 0 ? (
                      <span className='self-center type-small text-gray-400 dark:text-gray-500'>
                        No keywords added yet
                      </span>
                    ) : (
                      keywords.map((kw) => (
                        <Badge key={kw} color='primary'>
                          {kw}
                          <button
                            type='button'
                            onClick={() => removeKw(kw)}
                            className='text-brand-500/70 transition hover:text-brand-500 dark:text-brand-400/70 dark:hover:text-brand-400'
                            aria-label={`Remove ${kw}`}
                          >
                            <X className='icon-tiny' />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className='flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]'>
                  <div className='flex items-center gap-2 type-caption font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                    <Plus className='icon-tiny' />
                    Add a keyword
                  </div>
                  <div className='flex gap-2'>
                    <Input
                      value={kwInput}
                      onChange={(event) => setKwInput(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && addKw()}
                      placeholder='e.g. pricing, urgent'
                      className='h-10 rounded-[10px] bg-white dark:bg-gray-900'
                    />
                    <Button
                      className='h-10 shrink-0 rounded-[10px] px-5'
                      onClick={addKw}
                      disabled={!kwInput.trim()}
                    >
                      <Plus className='icon-small' />
                      Add
                    </Button>
                  </div>

                  <div className='flex flex-1 flex-col gap-3'>
                    <p className='type-caption font-medium text-gray-500 dark:text-gray-400'>
                      Suggested
                    </p>
                    {QUICK_KW.map((group) => (
                      <div key={group.label} className='flex flex-col gap-1.5'>
                        <span className='type-caption text-gray-400 dark:text-gray-500'>
                          {group.label}
                        </span>
                        <div className='flex flex-wrap gap-2'>
                          {group.kws.map((kw) => {
                            const already = keywords.includes(kw);
                            return (
                              <button
                                key={kw}
                                type='button'
                                disabled={already}
                                onClick={() =>
                                  setKeywords((prev) => [...prev, kw])
                                }
                                className={cn(
                                  'inline-flex items-center rounded-[10px] border px-3 py-1.5 type-caption font-medium transition',
                                  already
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-800 dark:bg-white/[0.04] dark:text-gray-500'
                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.03]',
                                )}
                              >
                                {kw}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='flex justify-end border-t border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6'>
                <Button onClick={saveKeywords} disabled={savingKW}>
                  {savingKW ? (
                    'Saving'
                  ) : savedKW ? (
                    <>
                      <Check className='icon-small' />
                      Saved
                    </>
                  ) : (
                    'Save keywords'
                  )}
                </Button>
              </div>
            </div>

            <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
              <div className='border-b border-gray-100 px-6 py-5 dark:border-gray-800'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <h3 className='type-body font-medium text-gray-800 dark:text-white/90'>
                      Follow-ups
                    </h3>
                    <p className='mt-1 type-small text-gray-500 dark:text-gray-400'>
                      Recommended conversations to revisit.
                    </p>
                  </div>
                  <Badge color='light'>{voiceFollowUps.length}</Badge>
                </div>
              </div>

              <div className='space-y-3 p-4 sm:p-6'>
                {voiceFollowUps.length === 0 ? (
                  <div className='rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center dark:border-gray-800 dark:bg-white/[0.02]'>
                    <p className='type-small font-medium text-gray-700 dark:text-gray-300'>
                      No follow-ups waiting
                    </p>
                    <p className='mt-1 type-caption text-gray-500 dark:text-gray-400'>
                      Growth recommendations will appear here.
                    </p>
                  </div>
                ) : (
                  voiceFollowUps.map((followUp, index) => (
                    <Link
                      key={followUp.conversation_id}
                      href={`/conversations/${followUp.conversation_id}`}
                      className='block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-white/[0.03]'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <p className='truncate type-small font-medium text-gray-800 dark:text-white/90'>
                            {followUp.name ||
                              followUp.lead_or_customer ||
                              followUp.title ||
                              `Follow-up ${index + 1}`}
                          </p>
                          <p className='mt-1 line-clamp-2 type-caption text-gray-500 dark:text-gray-400'>
                            {followUp.reason ||
                              followUp.insight ||
                              'No reason provided'}
                          </p>
                        </div>
                        {followUp.priority && (
                          <Badge
                            color={
                              followUp.priority === 'HIGH' ? 'error' : 'warning'
                            }
                          >
                            {titleCase(String(followUp.priority))}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
