import type { AttentionItem, FaqGap, TopicItem } from '@/components/dashboard/DashboardPanels';

export function adaptTopics(raw: any): TopicItem[] {
  if (Array.isArray(raw))
    return raw.map((r: any) => ({ topic: r.topic, count: r.count }));
  if (Array.isArray(raw?.primary_breakdown))
    return raw.primary_breakdown.map((r: any) => ({
      topic: r.topic,
      count: r.count,
    }));
  return [];
}

export function adaptFaqGaps(raw: any): FaqGap[] {
  const list: any[] = raw?.items ?? raw?.gaps ?? [];
  return list.map((g: any) => ({
    query: g.query,
    count: g.count,
    last_seen: g.last_seen,
  }));
}

export function adaptAttentionFeed(raw: any): AttentionItem[] {
  const items: any[] = raw?.items ?? [];
  return items.map((i: any) => ({
    type: i.type,
    sender_name: i.sender_name ?? null,
    tenant_id: i.tenant_id ?? '',
    message: i.last_bot_message ?? i.message ?? null,
    silence_min: i.silence_minutes ?? null,
    created_at: i.created_at ?? i.detected_at ?? new Date().toISOString(),
  }));
}
