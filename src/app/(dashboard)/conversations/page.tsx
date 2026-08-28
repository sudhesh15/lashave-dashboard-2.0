'use client';

import {
  ChannelFilter,
  ChannelFilterValue,
  ChannelFilterValueLabel,
  ChannelItem,
  useChannelFilter,
} from '@/components/channel-filter';
import { DateFilter } from '@/components/date-filter';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import {
  TablePagination,
} from '@/components/ui/table-pagination';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { apiFetch } from '@/lib/api';
import {
  Category,
  detectCategory,
  Mood,
  resolveMoodForLead,
} from '@/lib/chat-classifiers';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  Eye,
  HelpCircle,
  List,
  MessageCircle,
  Package,
  Radio,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Target,
  Users,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ConvoItem = {
  id: number;
  channel: string;
  channel_id?: number | null;
  external_user_id: string;
  display_name?: string | null;
  status: string;
  last_message_at: string | null;
  preview: string;
  profile_pic_url?: string | null;
  is_verified_user?: boolean | null;
  unread_count?: number;
  lead?: {
    id: number;
    status: string;
    intent: string;
    service: string;
    contacts?: { emails?: string[]; phones?: string[] };
    meta?: {
      text_preview?: string;
      triggers?: string[];
      mood?: Mood;
      instagram_profile?: {
        profile_pic_url?: string | null;
      };
    };
  } | null;
};

const PAGE_SIZE = 25;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(str: string) {
  return new Date(str + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value);
}

function timeAgo(iso: string | null) {
  if (!iso) return 'No activity';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return 'No activity';
  const diff = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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

function platformLabel(channel?: string) {
  if (!channel) return 'Unknown';
  const map: Record<string, string> = {
    instagram: 'Instagram',
    youtube: 'YouTube',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    facebook: 'Facebook',
    website: 'Website',
    test: 'Test',
  };
  return (
    map[channel.toLowerCase()] ||
    channel.charAt(0).toUpperCase() + channel.slice(1)
  );
}

function displayName(c: ConvoItem) {
  const name = c.display_name?.trim();
  if (name) return c.channel === 'website' ? name : `@${name}`;

  const uid = c.external_user_id || '';
  if (c.channel === 'website') return `Website Visitor #${c.id}`;
  if (/^\d{10,}$/.test(uid)) return `User ${uid.slice(-8)}`;
  return uid || `${platformLabel(c.channel)} User #${c.id}`;
}

function getCategory(item: ConvoItem): Category | null {
  const lead = item.lead;
  if (!lead) return null;

  const mood = resolveMoodForLead({
    storedMood: lead.meta?.mood,
    text_preview: lead.meta?.text_preview,
    triggers: lead.meta?.triggers,
    intent: lead.intent,
  });

  return detectCategory({
    text_preview: lead.meta?.text_preview,
    triggers: lead.meta?.triggers,
    intent: lead.intent,
    service: lead.service,
    mood: mood.mood,
    contacts: lead.contacts,
  });
}

function isRealLead(lead?: ConvoItem['lead']) {
  if (!lead) return false;
  return ['qualified', 'won', 'hot', 'warm'].includes(
    String(lead.status || '').toLowerCase(),
  );
}

const STAT_FILTERS: {
  key: string;
  label: string;
  tone: keyof typeof STAT_TONE;
  icon: React.ReactNode;
}[] = [
  {
    key: 'all',
    label: 'Total',
    tone: 'gray',
    icon: <List className='h-5 w-5' />,
  },
  {
    key: 'complaint',
    label: 'Complaint',
    tone: 'error',
    icon: <AlertTriangle className='h-5 w-5' />,
  },
  {
    key: 'feedback',
    label: 'Feedback',
    tone: 'brand',
    icon: <MessageCircle className='h-5 w-5' />,
  },
  {
    key: 'order',
    label: 'Order',
    tone: 'warning',
    icon: <Package className='h-5 w-5' />,
  },
  {
    key: 'enquiry',
    label: 'Enquiry',
    tone: 'brand',
    icon: <HelpCircle className='h-5 w-5' />,
  },
  {
    key: 'open',
    label: 'Open',
    tone: 'success',
    icon: <CheckCircle2 className='h-5 w-5' />,
  },
  {
    key: 'handoff',
    label: 'Handoff',
    tone: 'warning',
    icon: <ArrowRightLeft className='h-5 w-5' />,
  },
  {
    key: 'lead',
    label: 'With lead',
    tone: 'success',
    icon: <Target className='h-5 w-5' />,
  },
];

function matchesStatFilter(item: ConvoItem, statFilter: string) {
  switch (statFilter) {
    case 'all':
      return true;
    case 'open':
    case 'handoff':
      return (item.status || '').toLowerCase() === statFilter;
    case 'lead':
      return isRealLead(item.lead);
    case 'complaint':
    case 'feedback':
    case 'order':
    case 'enquiry':
      return getCategory(item) === statFilter;
    default:
      return true;
  }
}

function badgeClass(status: string) {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500';
    case 'handoff':
      return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400';
    case 'blocked':
      return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500';
    case 'closed':
      return 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80';
    default:
      return 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400';
  }
}

function leadBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case 'won':
    case 'qualified':
      return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500';
    case 'lost':
      return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500';
    case 'contacted':
      return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400';
    default:
      return 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400';
  }
}
const STAT_TONE: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400',
  error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
  warning:
    'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400',
  success:
    'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  gray: 'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300',
};
function StatTile({
  label,
  value,
  icon,
  tone = 'gray',
  onClick,
  active = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: keyof typeof STAT_TONE;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-2xl border bg-white p-3 text-left transition dark:bg-gray-900/60 sm:gap-3 xl:p-3',
        active
          ? 'border-brand-500 ring-1 ring-brand-500/30 dark:border-brand-400'
          : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700',
      )}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${STAT_TONE[tone]}`}
      >
        {icon}
      </span>
      <div className='min-w-0'>
        <div className='type-card-title font-bold text-gray-800 dark:text-white/90'>
          {formatCompact(value)}
        </div>
        <div className='truncate type-caption leading-5 text-gray-500 dark:text-gray-400'>
          {label}
        </div>
      </div>
    </button>
  );
}

function ConversationAvatar({
  conversation,
  size = 40,
}: {
  conversation: ConvoItem;
  size?: number;
}) {
  const name = displayName(conversation);
  const rawImage =
    conversation.profile_pic_url ||
    conversation.lead?.meta?.instagram_profile?.profile_pic_url;
  const [broken, setBroken] = useState(false);

  const image = broken ? undefined : rawImage;

  useEffect(() => {
    setBroken(false);
  }, [rawImage]);

  if (image) {
    return (
      <span
        style={{ height: size, width: size }}
        className='inline-flex shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800'
      >
        <img
          src={image}
          alt={name}
          loading='lazy'
          onError={() => setBroken(true)}
          style={{ height: size, width: size }}
          className='h-full w-full object-cover'
        />
      </span>
    );
  }

  const initials = name.replace(/^@/, '').slice(0, 2).toUpperCase();
  return (
    <div
      style={{ height: size, width: size }}
      className='flex items-center justify-center rounded-full bg-gray-100 type-small font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    >
      {initials || 'U'}
    </div>
  );
}

const INBOX_TABS: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <List size={13} /> },
  { key: 'open', label: 'Open', icon: <CheckCircle2 size={13} /> },
  { key: 'handoff', label: 'Handoff', icon: <ArrowRightLeft size={13} /> },
  { key: 'closed', label: 'Closed', icon: <XCircle size={13} /> },
];

type InboxFilterKey = 'conversation' | 'channel' | 'date' | 'category';

// ── Table ────────────────────────────────────────────────────────────────────────
function ConversationTable({
  items,
  loading,
  page,
  setPage,
  totalItems,
  status,
  setStatus,
  tabCounts,
  openFilter,
  setOpenFilter,
  q,
  setQ,
  onSearchSubmit,
  onSeeAll,
  channelFilter,
  setChannelFilter,
  channels,
  channelsLoading,
  selectedChannels,
  channelCounts,
  channelTotal,
  dateRange,
  setDateRange,
  activePreset,
  setActivePreset,
  filterLead,
  setFilterLead,
  statFilter,
  setStatFilter,
  statCounts,
}: {
  items: ConvoItem[];
  loading: boolean;
  page: number;
  setPage: (page: number) => void;
  totalItems: number;
  status: string;
  setStatus: (status: string) => void;
  tabCounts: Record<string, number>;
  openFilter: InboxFilterKey | null;
  setOpenFilter: (filter: InboxFilterKey | null) => void;
  q: string;
  setQ: (value: string) => void;
  onSearchSubmit: () => void;
  onSeeAll: () => void;
  channelFilter: ChannelFilterValue;
  setChannelFilter: (value: ChannelFilterValue) => void;
  channels: ChannelItem[];
  channelsLoading: boolean;
  selectedChannels: ChannelItem[];
  channelCounts: Record<number, number>;
  channelTotal: number;
  dateRange: { from: string; to: string } | null;
  setDateRange: (range: { from: string; to: string } | null) => void;
  activePreset: number | null;
  setActivePreset: (preset: number | null) => void;
  filterLead: boolean;
  setFilterLead: (updater: (value: boolean) => boolean) => void;
  statFilter: string;
  setStatFilter: (value: string) => void;
  statCounts: Record<string, number>;
}) {
  const pageItems = items;

  const channelFilterRef = useRef<HTMLDivElement>(null);
  const conversationFilterRef = useRef<HTMLDivElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);
  const categoryFilterRef = useRef<HTMLDivElement>(null);

  useOutsideClick(
    channelFilterRef,
    () => setOpenFilter(null),
    openFilter === 'channel',
  );
  useOutsideClick(
    conversationFilterRef,
    () => setOpenFilter(null),
    openFilter === 'conversation',
  );
  useOutsideClick(
    dateFilterRef,
    () => setOpenFilter(null),
    openFilter === 'date',
  );
  useOutsideClick(
    categoryFilterRef,
    () => setOpenFilter(null),
    openFilter === 'category',
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(timer);
  }, [status, q, dateRange, activePreset, statFilter]);

  const activeTab =
    INBOX_TABS.find((tab) => tab.key === status) ?? INBOX_TABS[0];

  return (
    <div className='min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]'>
      <div className='flex flex-col gap-2 border-b border-gray-100 px-5 py-5 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between sm:px-6 '>
        <h3 className='type-body font-semibold text-gray-800 dark:text-white/90'>
          Inbox
        </h3>
        <div className='type-small font-medium text-gray-500 dark:text-gray-400'>
          {items.length} conversations
        </div>
      </div>

      <div className='min-w-0 py-5'>
        <div className='flex flex-col gap-4 rounded-t-xl border border-b-0 border-gray-200 bg-white px-5 py-4 dark:border-white/[0.05] dark:bg-white/[0.01] sm:px-6 lg:flex-row lg:items-center lg:justify-between '>
          <h4 className='type-card-title font-semibold text-gray-800 dark:text-white/90'>
            {activeTab.label} conversations
          </h4>
          <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end '>
            <div className='relative w-full sm:w-[280px]'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400' />
              <input
                type='search'
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                placeholder='Search by username or ID'
                className='h-10 w-full rounded-[10px] border border-gray-300 bg-white py-2 pl-10 pr-4 type-small text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500'
              />
            </div>

            {/* Channel filter */}
            <div ref={channelFilterRef} className='relative'>
              <Button
                variant='outline'
                onClick={() =>
                  setOpenFilter(openFilter === 'channel' ? null : 'channel')
                }
              >
                <Radio size={14} />
                <ChannelFilterValueLabel selected={selectedChannels} />
              </Button>
              {openFilter === 'channel' && (
                <div className='absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900'>
                  <ChannelFilter
                    value={channelFilter}
                    onChange={setChannelFilter}
                    channels={channels}
                    loading={channelsLoading}
                    counts={channelCounts}
                    totalCount={channelTotal}
                  />
                </div>
              )}
            </div>

            {/* Conversation (status) filter */}
            <div ref={conversationFilterRef} className='relative'>
              <Button
                variant='outline'
                onClick={() =>
                  setOpenFilter(
                    openFilter === 'conversation' ? null : 'conversation',
                  )
                }
              >
                <SlidersHorizontal size={14} />
                {status === 'all'
                  ? 'Conversation'
                  : `${INBOX_TABS.find((t) => t.key === status)?.label ?? ''} conversations`}
              </Button>
              {openFilter === 'conversation' && (
                <div className='absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900'>
                  {INBOX_TABS.map((tab) => {
                    const isActive = status === tab.key;
                    const count = tabCounts[tab.key] || 0;
                    return (
                      <button
                        key={tab.key}
                        type='button'
                        onClick={() => {
                          setStatus(tab.key);
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
                          {tab.label} conversations
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

            {/* Inbox stats filter */}
            <div ref={categoryFilterRef} className='relative'>
              <Button
                variant='outline'
                onClick={() =>
                  setOpenFilter(openFilter === 'category' ? null : 'category')
                }
              >
                <List size={14} />
                {statFilter === 'all'
                  ? 'Inbox filter'
                  : STAT_FILTERS.find((s) => s.key === statFilter)?.label}
              </Button>
              {openFilter === 'category' && (
                <div className='absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900'>
                  {STAT_FILTERS.map((stat) => {
                    const isActive = statFilter === stat.key;
                    return (
                      <button
                        key={stat.key}
                        type='button'
                        onClick={() => {
                          setStatFilter(stat.key);
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
                          <span className='[&>svg]:h-4 [&>svg]:w-4'>
                            {stat.icon}
                          </span>
                          {stat.label}
                        </span>
                        <span className='type-caption text-gray-400 dark:text-gray-500'>
                          {statCounts[stat.key] || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date filter */}
            <div ref={dateFilterRef}>
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

            <button
              type='button'
              onClick={() => setFilterLead((value) => !value)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] px-4 type-small font-medium transition',
                filterLead
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5',
              )}
            >
              <Users className='h-4 w-4' />
              Leads only
            </button>

            <Button variant='outline' onClick={onSeeAll}>
              See all
            </Button>
          </div>
        </div>

        <div className='min-w-0 max-w-full overflow-hidden rounded-b-xl border border-gray-200 dark:border-white/[0.05]'>
          <table className='lashvae-column-dividers w-full table-fixed min-h-80'>
            <colgroup>
              <col className='w-[30%]' /> {/* Customer — flexible */}
              <col className='w-[140px]' /> {/* Channel */}
              <col className='w-[120px]' /> {/* Intent */}
              <col className='w-[120px]' /> {/* Status */}
              <col className='w-[112px]' /> {/* Lead */}
              <col className='w-[112px]' /> {/* Last seen */}
              <col className='w-[200px]' /> {/* Actions */}
            </colgroup>

            <thead className='border-b border-gray-100 dark:border-white/[0.05]'>
              <tr>
                {[
                  'Customer',
                  'Channel',
                  'Intent',
                  'Status',
                  'Lead',
                  'Last seen',
                  'Actions',
                ].map((header) => (
                  <th
                    key={header}
                    className={cn(
                      'px-5 py-3.5 type-caption font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 sm:px-6',
                      header === 'Actions' ? 'text-right' : 'text-left',
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className='divide-y divide-gray-100 dark:divide-white/[0.05]'>
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className='px-5 py-14 text-center type-small text-gray-500 dark:text-gray-400'
                  >
                    Loading conversations
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className='px-5 py-14 text-center type-small text-gray-500 dark:text-gray-400'
                  >
                    {q.trim()
                      ? 'No conversations match this search'
                      : 'No conversations found'}
                  </td>
                </tr>
              )}

              {!loading &&
                pageItems.map((item) => {
                  const category = getCategory(item);

                  const preview =
                    item.lead?.meta?.text_preview ||
                    item.preview ||
                    'No preview available';

                  const name = displayName(item);

                  return (
                    <tr
                      key={item.id}
                      className='transition hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                    >
                      {/* Customer */}
                      <td className='px-5 py-3 sm:px-6'>
                        <Link
                          href={`/conversations/${item.id}`}
                          className='flex items-center gap-3'
                        >
                          <div className='relative shrink-0'>
                            <ConversationAvatar
                              conversation={item}
                              size={34}
                            />
                          </div>

                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2'>
                              <span className='group relative block min-w-0 type-small font-semibold text-gray-800 dark:text-white/90'>
                                <span className='block truncate'>{name}</span>

                                <span className='pointer-events-none absolute left-0 top-full z-50 mt-1 hidden max-w-[280px] group-hover:block'>
                                  <span className='absolute -top-1 left-3 h-2 w-2 rotate-45 rounded-[2px] bg-gray-900' />

                                  <span className='relative block rounded-[10px] bg-gray-900 px-3 py-1.5 type-caption font-medium text-white shadow-lg'>
                                    {name}
                                  </span>
                                </span>
                              </span>

                              {item.unread_count != null &&
                                item.unread_count > 0 && (
                                  <span className='shrink-0 rounded-full bg-brand-500 px-1.5 py-0 text-[10px] font-bold text-white'>
                                    {item.unread_count}
                                  </span>
                                )}
                            </div>

                            <span className='mt-1 block truncate type-caption text-gray-500 dark:text-gray-400'>
                              {preview}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Channel */}
                      <td className='px-5 py-3 type-small text-gray-500 dark:text-gray-400 sm:px-6'>
                        <span className='inline-flex items-center gap-2'>
                          <span className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5'>
                            <Image
                              src={
                                CHANNEL_LOGOS[
                                  (item.channel || '').toLowerCase()
                                ] || '/brand-logo/website.png'
                              }
                              alt={platformLabel(item.channel)}
                              width={16}
                              height={16}
                              className='h-4 w-4 shrink-0 object-contain'
                            />
                          </span>
                          <span className='truncate font-medium text-gray-700 dark:text-gray-300'>
                            {platformLabel(item.channel)}
                          </span>
                        </span>
                      </td>

                      {/* Intent */}
                      <td className='px-5 py-3 sm:px-6'>
                        <span
                          title={category || 'Unclassified'}
                          className='inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-brand-600 truncate dark:bg-brand-500/15 dark:text-brand-400'
                        >
                          {category || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className='px-5 py-3 sm:px-6'>
                        <span
                          title={item.status || 'unknown'}
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize truncate ${badgeClass(
                            item.status,
                          )}`}
                        >
                          {item.status || '—'}
                        </span>
                      </td>

                      {/* Lead */}
                      <td className='px-5 py-3 sm:px-6'>
                        {item.lead ? (
                          <span
                            title={item.lead.status || 'new'}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize truncate ${leadBadgeClass(
                              item.lead.status,
                            )}`}
                          >
                            {item.lead.status || 'new'}
                          </span>
                        ) : (
                          <span className='text-[11px] font-medium text-gray-400 dark:text-gray-500'>
                            —
                          </span>
                        )}
                      </td>

                      <td className='px-5 py-3 type-small font-medium text-gray-500 dark:text-gray-400 sm:px-6'>
                        <span className='whitespace-nowrap'>
                          {timeAgo(item.last_message_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className='px-5 py-3 text-right sm:px-6'>
                        <Link
                          href={`/conversations/${item.id}`}
                          className='inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-[9px] bg-brand-500 px-3 text-[13px] font-semibold text-white shadow-theme-xs hover:bg-brand-600'
                        >
                          <Eye size={13} />
                          View Conversation
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalItems={totalItems}
          onPageChange={setPage}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────────
export default function ConversationsPage() {
  const {
    filter: channelFilter,
    setFilter: setChannelFilter,
    channels,
    loading: channelsLoading,
    selectedChannels,
    clear: clearChannels,
  } = useChannelFilter();

  const [items, setItems] = useState<ConvoItem[]>([]);
  const [countsAll, setCountsAll] = useState<ConvoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filterLead, setFilterLead] = useState(false);
  const [openFilter, setOpenFilter] = useState<InboxFilterKey | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [statFilter, setStatFilter] = useState('all');
  const [page, setPage] = useState(1);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setErr(null);

      try {
        const pageQ = new URLSearchParams();
        pageQ.set('limit', String(PAGE_SIZE));
        pageQ.set('offset', String((Math.max(1, page) - 1) * PAGE_SIZE));
        if (q.trim()) pageQ.set('q', q.trim());
        if (status !== 'all') pageQ.set('status', status);

        // NOTE: channel filter is applied CLIENT-SIDE (see visibleItems / channelCounts).
        // Do NOT send channel_id here — doing so narrows `items` and breaks the counts.

        if (dateRange?.from) {
          pageQ.set('from_ts', new Date(dateRange.from).toISOString());
        }
        if (dateRange?.to) {
          const to = new Date(dateRange.to);
          to.setHours(23, 59, 59, 999);
          pageQ.set('to_ts', to.toISOString());
        }

        const countsQ = new URLSearchParams(pageQ.toString());
        countsQ.set('offset', '0');
        countsQ.set('limit', String(1000));

        const [pageData, countsData] = await Promise.all([
          apiFetch<{
            items: ConvoItem[];
            total_count?: number;
            count?: number;
            total?: number;
          }>(`/admin/conversations?${pageQ.toString()}`, { auth: true }),
          apiFetch<{
            items: ConvoItem[];
          }>(`/admin/conversations?${countsQ.toString()}`, { auth: true }),
        ]);

        const pageItems = (pageData.items || []).filter(
          (item) => item.channel?.toLowerCase() !== 'google',
        );
        const countsItems = (countsData.items || []).filter(
          (item) => item.channel?.toLowerCase() !== 'google',
        );
        setItems(pageItems);
        const receivedTotal =
          typeof pageData.total_count === 'number'
            ? pageData.total_count
            : typeof pageData.count === 'number'
              ? pageData.count
              : typeof pageData.total === 'number'
                ? pageData.total
                : countsItems.length < 1000
                  ? countsItems.length
                  : Math.max(totalCount, countsItems.length * 2);
        setTotalCount(receivedTotal);
        setCountsAll(countsItems);
        setLastRefresh(new Date());
      } catch (error: unknown) {
        setErr(errorMessage(error, 'Failed to load conversations'));
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [dateRange, page, q, status, totalCount], // channelFilter intentionally NOT here — no refetch on channel select
  );

  useEffect(() => {
    const timer = setTimeout(() => load(), 400);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => load({ silent: true }), 15000);
    return () => clearInterval(timer);
  }, [load]);

  // Lead-filtered but NOT channel-filtered — the source of truth for channel counts.
  const leadFilteredItems = useMemo(
    () => countsAll.filter((item) => !filterLead || isRealLead(item.lead)),
    [filterLead, countsAll],
  );

  // Channel counts computed BEFORE the channel filter, so every channel keeps its
  // real total whether or not it's selected.
  const channelCounts = useMemo(
    () =>
      leadFilteredItems.reduce<Record<number, number>>((acc, item) => {
        if (item.channel_id != null)
          acc[item.channel_id] = (acc[item.channel_id] || 0) + 1;
        return acc;
      }, {}),
    [leadFilteredItems],
  );

  // What the table actually renders — channel filter applied here on top.
  const visibleItems = useMemo(() => {
    let list = items;
    if (channelFilter.channel_ids.length > 0) {
      list = list.filter(
        (item) =>
          item.channel_id != null &&
          channelFilter.channel_ids.includes(item.channel_id),
      );
    }
    if (statFilter !== 'all') {
      list = list.filter((item) => matchesStatFilter(item, statFilter));
    }
    return list;
  }, [items, channelFilter, statFilter]);

  const statusCounts = useMemo(
    () =>
      countsAll.reduce<Record<string, number>>((acc, item) => {
        const key = item.status || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [countsAll],
  );

  const categoryCounts = useMemo(
    () =>
      countsAll.reduce<Record<string, number>>((acc, item) => {
        const category = getCategory(item);
        if (category) acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
    [countsAll],
  );

  const tabCounts = useMemo(
    () => ({
      all: countsAll.length,
      open: statusCounts.open || 0,
      handoff: statusCounts.handoff || 0,
      closed: statusCounts.closed || 0,
    }),
    [countsAll.length, statusCounts],
  );

  const openCount = statusCounts.open || 0;
  const handoffCount = statusCounts.handoff || 0;
  const leadCount = countsAll.filter((item) => isRealLead(item.lead)).length;

  const statValues: Record<string, number> = {
    all: countsAll.length,
    complaint: categoryCounts.complaint || 0,
    feedback: categoryCounts.feedback || 0,
    order: categoryCounts.order || 0,
    enquiry: categoryCounts.enquiry || 0,
    open: openCount,
    handoff: handoffCount,
    lead: leadCount,
  };

  const handleSeeAll = useCallback(() => {
    setStatus('all');
    setQ('');
    setFilterLead(false);
    clearChannels();
    setStatFilter('all');
    setDateRange(null);
    setActivePreset(null);
    setOpenFilter(null);
    setPage(1);
  }, [clearChannels]);

  return (
    <RequireAuth>
      <div className='mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8'>
        <div className='rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-white/[0.03] sm:p-8'>
          <div className='flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between'>
            <div>
              <p className='type-small font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400'>
                Conversations
              </p>
              <h1 className='mt-2 text-title-sm font-semibold text-gray-800 dark:text-white/90'>
                Inbox management
              </h1>
              <p className='mt-2 max-w-2xl type-small text-gray-500 dark:text-gray-400'>
                Review customer conversations, lead quality, channel source, and
                intent signals from a single workspace.
              </p>
            </div>

            <div className='flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3'>
              <button
                className='inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-4 type-small font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]'
                onClick={() => load()}
              >
                <RefreshCw className='h-4 w-4' />
                Refresh
              </button>
              <div className='flex items-center gap-2 type-caption text-gray-500 dark:text-gray-400'>
                <Clock3 className='h-3.5 w-3.5' />
                Last refreshed {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className='mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 3xl:grid-cols-8'>
            {STAT_FILTERS.map((stat) => (
              <StatTile
                key={stat.key}
                label={stat.label}
                value={statValues[stat.key] || 0}
                icon={stat.icon}
                tone={stat.tone}
                active={statFilter === stat.key}
                onClick={() =>
                  setStatFilter(statFilter === stat.key ? 'all' : stat.key)
                }
              />
            ))}
          </div>
        </div>

        {err && (
          <div className='mt-6 rounded-xl border border-error-200 bg-error-50 px-4 py-3 type-small text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400'>
            {err}
          </div>
        )}

        <div className='mt-6'>
          <ConversationTable
            items={visibleItems}
            loading={loading}
            page={page}
            setPage={setPage}
            totalItems={totalCount}
            status={status}
            setStatus={(next) => {
              setStatus(next);
              setPage(1);
            }}
            tabCounts={tabCounts}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            q={q}
            setQ={(next) => {
              setQ(next);
              if (!next.trim()) setPage(1);
            }}
            onSearchSubmit={() => {
              setPage(1);
              load();
            }}
            onSeeAll={handleSeeAll}
            channelFilter={channelFilter}
            setChannelFilter={setChannelFilter}
            channels={channels}
            channelsLoading={channelsLoading}
            selectedChannels={selectedChannels}
            channelCounts={channelCounts}
            channelTotal={leadFilteredItems.length}
            dateRange={dateRange}
            setDateRange={(next) => {
              setDateRange(next);
              setPage(1);
            }}
            activePreset={activePreset}
            setActivePreset={setActivePreset}
            filterLead={filterLead}
            setFilterLead={(updater) => {
              setFilterLead(updater);
              setPage(1);
            }}
            statFilter={statFilter}
            setStatFilter={(next) => {
              setStatFilter(next);
              setPage(1);
            }}
            statCounts={statValues}
          />

          {dateRange && (
            <p className='mt-3 type-caption text-gray-500 dark:text-gray-400'>
              Filtered from {formatDate(dateRange.from)} to{' '}
              {formatDate(dateRange.to)}
            </p>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
