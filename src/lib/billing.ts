export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type BillingFeature = 'growth_reports' | 'booking' | 'widget';

export type BillingStatus = {
  tenant_id: string;
  plan_id: string | null;
  billing_cycle: 'monthly' | 'annual' | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  trial_days_left: number | null;
  trial_eligible: boolean;
  locked: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  has_stripe_customer: boolean;
  has_active_subscription: boolean;
  currency?: string | null;
  complimentary_credits?: number;
};

export type UsageMetric = {
  used: number;
  limit: number;
  remaining: number;
  topup_remaining: number;
};

export type UsageSummary = {
  plan_id: string;
  plan_name: string;
  subscription_status: string;
  locked: boolean;
  trial_ends_at: string | null;
  current_period_end: string | null;
  conversations: UsageMetric;
  channels: UsageMetric;
  knowledge_docs: UsageMetric;
  team_seats: UsageMetric;
  features: Record<BillingFeature, boolean>;
};

export const SUBSCRIPTION_HREF = '/profile?activeNav=subscription';

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const difference = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(difference / 86_400_000));
}

export function fmtBillingDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function metricFrom(
  primary:
    | {
        used?: number;
        limit?: number;
        remaining?: number;
        topup_remaining?: number;
      }
    | undefined,
  fallbackLimit: number,
): UsageMetric {
  const used = primary?.used ?? 0;
  const limit = primary?.limit ?? fallbackLimit;
  const remaining =
    primary?.remaining ?? Math.max(0, limit - used);

  return {
    used,
    limit,
    remaining,
    topup_remaining: primary?.topup_remaining ?? 0,
  };
}

export function normalizeUsage(raw: Record<string, unknown> | null): UsageSummary | null {
  if (!raw) return null;

  const nested = (raw.usage ?? {}) as Record<string, unknown>;
  const conversationsRaw = (raw.conversations ?? nested.ai_messages) as
    | {
        used?: number;
        limit?: number;
        remaining?: number;
        topup_remaining?: number;
      }
    | undefined;
  const channelsRaw = (raw.channels ?? nested.channels) as
    | { used?: number; limit?: number; remaining?: number }
    | undefined;
  const knowledgeRaw = (raw.knowledge_docs ?? nested.knowledge_docs) as
    | { used?: number; limit?: number; remaining?: number }
    | undefined;
  const seatsRaw = (raw.team_seats ?? nested.team_seats) as
    | { used?: number; limit?: number; remaining?: number }
    | undefined;
  const features = (raw.features ?? {}) as Partial<Record<BillingFeature, boolean>>;

  return {
    plan_id: String(raw.plan_id ?? 'starter'),
    plan_name: String(raw.plan_name ?? 'Plan'),
    subscription_status: String(raw.subscription_status ?? 'none'),
    locked: Boolean(raw.locked),
    trial_ends_at: (raw.trial_ends_at as string | null) ?? null,
    current_period_end: (raw.current_period_end as string | null) ?? null,
    conversations: metricFrom(conversationsRaw, 150),
    channels: metricFrom(channelsRaw, 99),
    knowledge_docs: metricFrom(knowledgeRaw, 99),
    team_seats: metricFrom(seatsRaw, 99),
    features: {
      growth_reports: Boolean(features.growth_reports),
      booking: Boolean(features.booking),
      widget: Boolean(features.widget),
    },
  };
}

export function normalizeBillingStatus(
  raw: Record<string, unknown> | null,
): BillingStatus | null {
  if (!raw) return null;

  const trialEndsAt = (raw.trial_ends_at as string | null) ?? null;
  const trialDaysLeft =
    typeof raw.trial_days_left === 'number'
      ? raw.trial_days_left
      : daysUntil(trialEndsAt);

  return {
    tenant_id: String(raw.tenant_id ?? ''),
    plan_id: (raw.plan_id as string | null) ?? null,
    billing_cycle: (raw.billing_cycle as BillingStatus['billing_cycle']) ?? null,
    subscription_status: (raw.subscription_status as SubscriptionStatus) ?? 'none',
    trial_ends_at: trialEndsAt,
    trial_days_left: trialDaysLeft,
    trial_eligible: Boolean(raw.trial_eligible),
    locked: Boolean(raw.locked),
    current_period_start: (raw.current_period_start as string | null) ?? null,
    current_period_end: (raw.current_period_end as string | null) ?? null,
    has_stripe_customer: Boolean(raw.has_stripe_customer),
    has_active_subscription: Boolean(raw.has_active_subscription),
    currency: (raw.currency as string | null) ?? null,
    complimentary_credits:
      typeof raw.complimentary_credits === 'number'
        ? raw.complimentary_credits
        : undefined,
  };
}

export function isTrialing(status: BillingStatus | null, usage: UsageSummary | null) {
  if (!status) return false;
  const locked = status.locked || usage?.locked;
  return status.subscription_status === 'trialing' && !locked;
}

export function isAccountLocked(status: BillingStatus | null, usage: UsageSummary | null) {
  return Boolean(status?.locked || usage?.locked);
}

export function hasFeatureAccess(
  feature: BillingFeature,
  status: BillingStatus | null,
  usage: UsageSummary | null,
) {
  if (isAccountLocked(status, usage)) return false;
  if (usage?.features?.[feature]) return true;
  if (isTrialing(status, usage)) return true;
  return false;
}

export function isConversationLimitReached(usage: UsageSummary | null) {
  if (!usage) return false;
  return usage.conversations.used >= usage.conversations.limit;
}

export function isChannelLimitReached(usage: UsageSummary | null) {
  if (!usage) return false;
  if (usage.channels.limit <= 0) return false;
  return usage.channels.used >= usage.channels.limit;
}

export function conversationUsagePercent(usage: UsageSummary | null) {
  if (!usage || usage.conversations.limit <= 0) return 0;
  return Math.min(
    100,
    Math.round((usage.conversations.used / usage.conversations.limit) * 100),
  );
}
