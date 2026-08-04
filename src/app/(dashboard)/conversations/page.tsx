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
  getPageItems,
  TablePagination,
} from '@/components/ui/table-pagination';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Category,
  detectCategory,
  Mood,
  resolveMoodForLead,
} from '@/lib/chat-classifiers';
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

const LIMIT = 200;

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
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: keyof typeof STAT_TONE;
}) {
  return (
    <div className='flex min-w-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/60 sm:gap-3 xl:p-3'>
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
    </div>
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
  const image =
    conversation.profile_pic_url ||
    conversation.lead?.meta?.instagram_profile?.profile_pic_url;

  if (image) {
    return (
      <Image
        width={size}
        height={size}
        src={image}
        alt={name}
        unoptimized
        style={{ height: size, width: size }}
        className='rounded-full object-cover'
      />
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

type InboxFilterKey = 'conversation' | 'channel' | 'date';

// ── Table ────────────────────────────────────────────────────────────────────────
function ConversationTable({
  items,
  loading,
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
}: {
  items: ConvoItem[];
  loading: boolean;
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
}) {
  const [page, setPage] = useState(1);
  const pageItems = getPageItems(items, page);

  const channelFilterRef = useRef<HTMLDivElement>(null);
  const conversationFilterRef = useRef<HTMLDivElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const timer = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(timer);
  }, [status, items.length]);

  const activeTab =
    INBOX_TABS.find((tab) => tab.key === status) ?? INBOX_TABS[0];

  return (
    <div className='min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]'>
      <div className='flex flex-col gap-2 border-b border-gray-100 px-5 py-5 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between sm:px-6'>
        <h3 className='type-body font-semibold text-gray-800 dark:text-white/90'>
          Inbox
        </h3>
        <div className='type-small font-medium text-gray-500 dark:text-gray-400'>
          {items.length} conversations
        </div>
      </div>

      <div className='min-w-0 px-5 py-5 sm:px-6'>
        <div className='flex flex-col gap-4 rounded-t-xl border border-b-0 border-gray-200 bg-white px-5 py-4 dark:border-white/[0.05] dark:bg-white/[0.01] lg:flex-row lg:items-center lg:justify-between'>
          <h4 className='type-card-title font-semibold text-gray-800 dark:text-white/90'>
            {activeTab.label} conversations
          </h4>
          <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end'>
            <div className='relative w-full sm:w-[240px]'>
              <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400' />
              <input
                type='search'
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                placeholder='Search by username or ID'
                className='h-10 w-full rounded-[10px] border border-gray-300 bg-white py-2 pl-11 pr-4 type-small text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500'
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
                Conversation
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
          <div className='w-full overflow-x-auto'>
            <table className='lashvae-column-dividers min-w-[1300px] table-fixed'>
              <colgroup>
                <col className='w-[340px]' />
                <col className='w-[140px]' />
                <col className='w-[150px]' />
                <col className='w-[150px]' />
                <col className='w-[150px]' />
                <col className='w-[140px]' />
                <col className='w-[230px]' />
              </colgroup>
              <thead className='border-b border-gray-100 dark:border-white/[0.05]'>
                <tr>
                  {[
                    'Customer',
                    'Channel',
                    'Intent',
                    'Status',
                    'Lead',
                    'Last active',
                    'Actions',
                  ].map((header) => (
                    <th
                      key={header}
                      className='px-5 py-3 text-left type-body font-medium text-gray-500 dark:text-gray-400'
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
                            <div className='min-w-0'>
                              <div className='flex items-center gap-2'>
                                <span className='group relative block max-w-[220px] type-small font-medium text-gray-800 dark:text-white/90'>
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
                                    <span className='shrink-0 rounded-full bg-brand-50 px-2 py-0.5 type-caption font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400'>
                                      {item.unread_count}
                                    </span>
                                  )}
                              </div>
                              <span className='mt-1 block max-w-[260px] truncate type-caption text-gray-500 dark:text-gray-400'>
                                {preview}
                              </span>
                            </div>
                          </Link>
                        </td>
                        <td className='px-6 py-3 type-small text-gray-500 dark:text-gray-400'>
                          <span className='inline-flex items-center gap-2'>
                            <Image
                              src={
                                CHANNEL_LOGOS[
                                  (item.channel || '').toLowerCase()
                                ] || '/brand-logo/website.png'
                              }
                              alt={platformLabel(item.channel)}
                              width={18}
                              height={18}
                              className='h-[18px] w-[18px] shrink-0 object-contain'
                            />
                            <span className='truncate'>
                              {platformLabel(item.channel)}
                            </span>
                          </span>
                        </td>
                        <td className='px-6 py-3'>
                          <span className='inline-flex items-center rounded-full bg-brand-50 px-3 py-1 type-caption font-medium capitalize text-brand-500 dark:bg-brand-500/15 dark:text-brand-400'>
                            {category || 'Unclassified'}
                          </span>
                        </td>
                        <td className='px-6 py-3'>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 type-caption font-medium capitalize ${badgeClass(item.status)}`}
                          >
                            {item.status || 'unknown'}
                          </span>
                        </td>
                        <td className='px-6 py-3'>
                          {item.lead ? (
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 type-caption font-medium capitalize ${leadBadgeClass(item.lead.status)}`}
                            >
                              {item.lead.status || 'new'}
                            </span>
                          ) : (
                            <span className='type-small text-gray-400 dark:text-gray-500'>
                              None
                            </span>
                          )}
                        </td>
                        <td className='px-6 py-3 type-small text-gray-500 dark:text-gray-400'>
                          {timeAgo(item.last_message_at)}
                        </td>
                        <td className='px-6 py-3'>
                          <Link
                            href={`/conversations/${item.id}`}
                            className='inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-[10px] bg-brand-500 px-3 type-small font-medium text-white shadow-theme-xs hover:bg-brand-600'
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
        <TablePagination
          page={page}
          totalItems={items.length}
          onPageChange={setPage}
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

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setErr(null);

      try {
        const qs = new URLSearchParams();
        qs.set('limit', String(LIMIT));
        qs.set('offset', '0');
        if (q.trim()) qs.set('q', q.trim());
        if (status !== 'all') qs.set('status', status);

        // NOTE: channel filter is applied CLIENT-SIDE (see visibleItems / channelCounts).
        // Do NOT send channel_id here — doing so narrows `items` and breaks the counts.

        if (dateRange?.from) {
          qs.set('from_ts', new Date(dateRange.from).toISOString());
        }
        if (dateRange?.to) {
          const to = new Date(dateRange.to);
          to.setHours(23, 59, 59, 999);
          qs.set('to_ts', to.toISOString());
        }

        const data = await apiFetch<{ items: ConvoItem[] }>(
          `/admin/conversations?${qs.toString()}`,
          { auth: true },
        );
        const filtered = (data.items || []).filter(
          (item) => item.channel?.toLowerCase() !== 'google',
        );
        setItems(filtered);
        setLastRefresh(new Date());
      } catch (error: unknown) {
        setErr(errorMessage(error, 'Failed to load conversations'));
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [dateRange, q, status], // channelFilter intentionally NOT here — no refetch on channel select
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
    () => items.filter((item) => !filterLead || isRealLead(item.lead)),
    [filterLead, items],
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
  const visibleItems = useMemo(
    () =>
      channelFilter.channel_ids.length === 0
        ? leadFilteredItems
        : leadFilteredItems.filter(
            (item) =>
              item.channel_id != null &&
              channelFilter.channel_ids.includes(item.channel_id),
          ),
    [leadFilteredItems, channelFilter],
  );

  const statusCounts = useMemo(
    () =>
      items.reduce<Record<string, number>>((acc, item) => {
        const key = item.status || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [items],
  );

  const categoryCounts = useMemo(
    () =>
      items.reduce<Record<string, number>>((acc, item) => {
        const category = getCategory(item);
        if (category) acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
    [items],
  );

  const tabCounts = useMemo(
    () => ({
      all: items.length,
      open: statusCounts.open || 0,
      handoff: statusCounts.handoff || 0,
      closed: statusCounts.closed || 0,
    }),
    [items.length, statusCounts],
  );

  const openCount = statusCounts.open || 0;
  const handoffCount = statusCounts.handoff || 0;
  const leadCount = items.filter((item) => isRealLead(item.lead)).length;

  const handleSeeAll = useCallback(() => {
    setStatus('all');
    setQ('');
    setFilterLead(false);
    clearChannels();
    setDateRange(null);
    setActivePreset(null);
    setOpenFilter(null);
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
            <StatTile
              label='Total'
              value={items.length}
              icon={<List className='h-5 w-5' />}
              tone='gray'
            />
            <StatTile
              label='Complaint'
              value={categoryCounts.complaint || 0}
              icon={<AlertTriangle className='h-5 w-5' />}
              tone='error'
            />
            <StatTile
              label='Feedback'
              value={categoryCounts.feedback || 0}
              icon={<MessageCircle className='h-5 w-5' />}
              tone='brand'
            />
            <StatTile
              label='Order'
              value={categoryCounts.order || 0}
              icon={<Package className='h-5 w-5' />}
              tone='warning'
            />
            <StatTile
              label='Enquiry'
              value={categoryCounts.enquiry || 0}
              icon={<HelpCircle className='h-5 w-5' />}
              tone='brand'
            />
            <StatTile
              label='Open'
              value={openCount}
              icon={<CheckCircle2 className='h-5 w-5' />}
              tone='success'
            />
            <StatTile
              label='Handoff'
              value={handoffCount}
              icon={<ArrowRightLeft className='h-5 w-5' />}
              tone='warning'
            />
            <StatTile
              label='With lead'
              value={leadCount}
              icon={<Target className='h-5 w-5' />}
              tone='success'
            />
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
            status={status}
            setStatus={setStatus}
            tabCounts={tabCounts}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            q={q}
            setQ={setQ}
            onSearchSubmit={() => load()}
            onSeeAll={handleSeeAll}
            channelFilter={channelFilter}
            setChannelFilter={setChannelFilter}
            channels={channels}
            channelsLoading={channelsLoading}
            selectedChannels={selectedChannels}
            channelCounts={channelCounts}
            channelTotal={leadFilteredItems.length}
            dateRange={dateRange}
            setDateRange={setDateRange}
            activePreset={activePreset}
            setActivePreset={setActivePreset}
            filterLead={filterLead}
            setFilterLead={setFilterLead}
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
