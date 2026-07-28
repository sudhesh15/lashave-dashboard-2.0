'use client';

// ─────────────────────────────────────────────────────────
// Subscription Tab — drop-in replacement for
//   {activeNav === "subscription" && <EmptyPanel .../>}
//
// Wire it into src/app/profile/page.tsx like:
//   {activeNav === "subscription" && <SubscriptionTab me={me} />}
//
// Backend contract (already live and tested on staging):
//   GET  /admin/billing/status      — plan, cycle, status, period dates, Stripe flags
//   GET  /admin/me/usage            — usage counters + limits per plan
//   POST /admin/billing/checkout    — {plan_id, billing_cycle} -> {url}
//   POST /admin/billing/portal      — {} -> {url}
//
// Redirect targets Stripe drops the user at after Checkout / Portal:
//   /profile?activeNav=subscription&status=success&session_id=cs_...
//   /profile?activeNav=subscription&status=cancelled
// ─────────────────────────────────────────────────────────

import { apiFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────
// Types — match backend response shapes exactly
// ─────────────────────────────────────────────────────────

type BillingStatus = {
  tenant_id: string;
  plan_id: 'starter' | 'pro' | 'business';
  billing_cycle: 'monthly' | 'annual' | null;
  subscription_status:
    | 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  has_stripe_customer: boolean;
  has_active_subscription: boolean;
};

type UsageSummary = {
  plan_id: string;
  plan_name: string;
  subscription_status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  usage: {
    ai_messages: { used: number; limit: number };
    channels: { used: number; limit: number };
    team_seats: { used: number; limit: number };
    knowledge_docs: { used: number; limit: number };
  };
  features: {
    growth_reports: boolean;
    booking: boolean;
    widget: boolean;
  };
};

// Static plan display data — matches PLANS in backend/plans.py
// Keep prices in sync with Stripe dashboard (they're display-only here).
const PLAN_INFO = {
  starter: {
    name: 'Starter',
    priceMonthly: 19,
    priceAnnual: 190,
    tagline: 'For solo founders getting started',
    features: [
      '1,000 AI messages / month',
      '2 connected channels',
      '1 team member',
      '10 knowledge documents',
      'Website chat widget',
      'Booking system',
    ],
  },
  pro: {
    name: 'Pro',
    priceMonthly: 59,
    priceAnnual: 590,
    tagline: 'For growing businesses',
    features: [
      '5,000 AI messages / month',
      '5 connected channels',
      '3 team members',
      '50 knowledge documents',
      'Growth reports & AI consultant',
      'Priority support',
    ],
    highlighted: true,
  },
  business: {
    name: 'Business',
    priceMonthly: 149,
    priceAnnual: 1490,
    tagline: 'For serious operators',
    features: [
      '25,000 AI messages / month',
      'Unlimited channels',
      '10 team members',
      'Unlimited knowledge docs',
      'Everything in Pro',
      'Dedicated support',
    ],
  },
} as const;

// ─────────────────────────────────────────────────────────
// Small utilities
// ─────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function pct(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

// ─────────────────────────────────────────────────────────
// Main tab component
// ─────────────────────────────────────────────────────────

export default function SubscriptionTab({ me }: { me: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState<'checkout' | 'portal' | null>(null);
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');

  // Load current state
  const refresh = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([
        apiFetch<BillingStatus>('/admin/billing/status', { auth: true }),
        apiFetch<UsageSummary>('/admin/me/usage', { auth: true }),
      ]);
      setStatus(s);
      setUsage(u);
      if (s.billing_cycle) setCycle(s.billing_cycle);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load billing info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Handle Stripe redirects — Stripe drops the user back here
  // with ?status=success or ?status=cancelled after Checkout / Portal
  useEffect(() => {
    const st = searchParams.get('status');
    if (st === 'success') {
      setToast('Payment successful — updating your plan…');
      // Webhooks take 1–3 seconds to land — poll for the change
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        await refresh();
        if (attempts >= 10) {
          clearInterval(poll);
          setToast('');
          // Clear the query param
          router.replace('/profile');
        }
      }, 1000);
      return () => clearInterval(poll);
    }
    if (st === 'cancelled') {
      setToast('Checkout cancelled — no charge was made.');
      setTimeout(() => setToast(''), 4000);
      router.replace('/profile');
    }
  }, [searchParams, refresh, router]);

  async function startCheckout(planId: string, billingCycle: string) {
    setBusy('checkout');
    try {
      const { url } = await apiFetch<{ url: string; session_id: string }>(
        '/admin/billing/checkout',
        {
          auth: true,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle }),
        }
      );
      window.location.href = url;
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start checkout');
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy('portal');
    try {
      const { url } = await apiFetch<{ url: string }>(
        '/admin/billing/portal',
        { auth: true, method: 'POST' }
      );
      window.location.href = url;
    } catch (e: any) {
      setError(e?.message ?? 'Failed to open billing portal');
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <>
        <div className='panel-head'>
          <div>
            <div className='panel-title'>Subscription</div>
            <div className='panel-sub'>Loading your plan…</div>
          </div>
        </div>
        <div className='panel-body'>
          <div style={{ opacity: 0.4, padding: 24, textAlign: 'center' }}>
            Loading…
          </div>
        </div>
      </>
    );
  }

  if (error && !status) {
    return (
      <>
        <div className='panel-head'>
          <div>
            <div className='panel-title'>Subscription</div>
            <div className='panel-sub'>Something went wrong</div>
          </div>
        </div>
        <div className='panel-body'>
          <div className='form-error'>{error}</div>
        </div>
      </>
    );
  }

  const isTrialing = status?.subscription_status === 'trialing';
  const isPastDue = status?.subscription_status === 'past_due';
  const isCanceled = status?.subscription_status === 'canceled';
  const isNoSub =
    status?.subscription_status === 'none' ||
    !status?.has_active_subscription;

  const trialDaysLeft = daysUntil(status?.trial_ends_at ?? null);
  const currentPlan = usage?.plan_id ?? 'starter';
  const currentPlanInfo = PLAN_INFO[currentPlan as keyof typeof PLAN_INFO];

  return (
    <>
      <div className='panel-head'>
        <div>
          <div className='panel-title'>Subscription</div>
          <div className='panel-sub'>
            {isTrialing
              ? `Free trial · ${trialDaysLeft} days remaining`
              : isNoSub
                ? 'Choose a plan to unlock full access'
                : `${currentPlanInfo?.name ?? 'Plan'} · ${status?.billing_cycle ?? 'monthly'}`}
          </div>
        </div>
      </div>

      <div className='panel-body'>
        {toast && <div className='sub-toast'>{toast}</div>}
        {error && status && <div className='form-error'>{error}</div>}

        {/* ─── Status banners ─────────────────────────────────────── */}
        {isPastDue && (
          <div className='sub-banner sub-banner-error'>
            <div className='sub-banner-title'>Payment failed</div>
            <div className='sub-banner-body'>
              We couldn't charge your card. Please update your payment method
              to keep your subscription active.
            </div>
            <button
              className='sub-btn-primary'
              onClick={openPortal}
              disabled={busy !== null}
            >
              {busy === 'portal' ? 'Opening…' : 'Update payment method'}
            </button>
          </div>
        )}

        {isTrialing && trialDaysLeft !== null && trialDaysLeft <= 3 && (
          <div className='sub-banner sub-banner-warning'>
            <div className='sub-banner-title'>
              Trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'}
            </div>
            <div className='sub-banner-body'>
              Add a payment method to keep your Pro features when the trial ends.
            </div>
          </div>
        )}

        {/* ─── Current plan card ──────────────────────────────────── */}
        {usage && (
          <div className='sub-current-card'>
            <div className='sub-current-head'>
              <div>
                <div className='sub-current-plan-name'>
                  {currentPlanInfo?.name ?? 'Unknown'} Plan
                  {isTrialing && <span className='sub-badge'>Trial</span>}
                  {isPastDue && <span className='sub-badge sub-badge-error'>Past due</span>}
                  {isCanceled && <span className='sub-badge sub-badge-muted'>Canceled</span>}
                </div>
                <div className='sub-current-tagline'>
                  {currentPlanInfo?.tagline}
                </div>
              </div>
              {status?.has_active_subscription && (
                <button
                  className='sub-btn-ghost'
                  onClick={openPortal}
                  disabled={busy !== null}
                >
                  {busy === 'portal' ? 'Opening…' : 'Manage billing'}
                </button>
              )}
            </div>

            {status?.current_period_end && !isTrialing && (
              <div className='sub-renewal'>
                {isCanceled
                  ? `Access ends ${fmtDate(status.current_period_end)}`
                  : `Renews ${fmtDate(status.current_period_end)}`}
              </div>
            )}

            <div className='sub-usage-grid'>
              <UsageBar
                label='AI messages this month'
                used={usage.usage.ai_messages.used}
                limit={usage.usage.ai_messages.limit}
              />
              <UsageBar
                label='Connected channels'
                used={usage.usage.channels.used}
                limit={5}
              />
              <UsageBar
                label='Knowledge documents'
                used={usage.usage.knowledge_docs.used}
                limit={20}
              />
            </div>
          </div>
        )}

        {/* ─── Plans grid (show for none / canceled / trialing / upgrade path) ─── */}
        {(isNoSub || isTrialing || isCanceled || currentPlan !== 'business') && (
          <>
            <div className='sub-plans-head'>
              <div>
                <div className='sub-section-title'>
                  {isNoSub || isCanceled ? 'Choose your plan' : 'Upgrade your plan'}
                </div>
                <div className='sub-section-sub'>
                  {cycle === 'annual'
                    ? 'Save ~17% with annual billing'
                    : 'Switch to annual to save ~17%'}
                </div>
              </div>
              <div className='sub-cycle-toggle'>
                <button
                  className={cycle === 'monthly' ? 'active' : ''}
                  onClick={() => setCycle('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={cycle === 'annual' ? 'active' : ''}
                  onClick={() => setCycle('annual')}
                >
                  Annual
                </button>
              </div>
            </div>

            <div className='sub-plans-grid'>
              {(['starter', 'pro', 'business'] as const).map((pid) => {
                const info = PLAN_INFO[pid];
                const price = cycle === 'monthly' ? info.priceMonthly : info.priceAnnual;
                const perMonthAnnual = Math.round(info.priceAnnual / 12);
                const isCurrent = currentPlan === pid && !isTrialing && !isNoSub && !isCanceled;
                const isHighlighted = 'highlighted' in info && info.highlighted;

                return (
                  <div
                    key={pid}
                    className={`sub-plan-card ${isHighlighted ? 'sub-plan-highlight' : ''} ${isCurrent ? 'sub-plan-current' : ''}`}
                  >
                    {isHighlighted && <div className='sub-plan-tag'>Most popular</div>}
                    <div className='sub-plan-name'>{info.name}</div>
                    <div className='sub-plan-tagline'>{info.tagline}</div>
                    <div className='sub-plan-price'>
                      <span className='sub-plan-price-num'>${price}</span>
                      <span className='sub-plan-price-per'>
                        /{cycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {cycle === 'annual' && (
                      <div className='sub-plan-annual-hint'>
                        ${perMonthAnnual}/month billed annually
                      </div>
                    )}
                    <ul className='sub-plan-features'>
                      {info.features.map((f) => (
                        <li key={f}>
                          <span className='sub-plan-check'>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={isCurrent ? 'sub-btn-ghost' : 'sub-btn-primary'}
                      disabled={isCurrent || busy !== null}
                      onClick={() => startCheckout(pid, cycle)}
                    >
                      {isCurrent
                        ? 'Current plan'
                        : busy === 'checkout'
                          ? 'Opening checkout…'
                          : status?.has_active_subscription
                            ? `Switch to ${info.name}`
                            : `Subscribe to ${info.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ─── Styles ─────────────────────────────────────────────── */}
      <style jsx>{`
        .sub-toast {
          padding: 10px 14px;
          background: rgba(245, 158, 11, 0.14);
          border: 1px solid rgba(245, 158, 11, 0.32);
          color: #fbbf24;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
        }
        .sub-banner {
          padding: 16px 18px;
          border-radius: 12px;
          margin-bottom: 20px;
          border: 1px solid;
        }
        .sub-banner-error {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.32);
          color: ${isDark ? '#fecaca' : '#7f1d1d'};
        }
        .sub-banner-warning {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.32);
          color: ${isDark ? '#fbbf24' : '#78350f'};
        }
        .sub-banner-title {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .sub-banner-body {
          font-size: 13px;
          opacity: 0.85;
          margin-bottom: 12px;
        }
        .sub-current-card {
          padding: 20px 22px;
          border-radius: 14px;
          background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
          margin-bottom: 28px;
        }
        .sub-current-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 6px;
        }
        .sub-current-plan-name {
          font-size: 18px;
          font-weight: 700;
          color: ${isDark ? '#f8fafc' : '#0f172a'};
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sub-current-tagline {
          font-size: 13px;
          color: ${isDark ? 'rgba(248,250,252,0.55)' : 'rgba(15,23,42,0.55)'};
          margin-top: 2px;
        }
        .sub-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(245, 158, 11, 0.18);
          color: #fbbf24;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sub-badge-error {
          background: rgba(239, 68, 68, 0.18);
          color: #fca5a5;
        }
        .sub-badge-muted {
          background: rgba(148, 163, 184, 0.18);
          color: #94a3b8;
        }
        .sub-renewal {
          font-size: 12px;
          color: ${isDark ? 'rgba(248,250,252,0.55)' : 'rgba(15,23,42,0.55)'};
          margin-bottom: 20px;
        }
        .sub-usage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        .sub-plans-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }
        .sub-section-title {
          font-size: 16px;
          font-weight: 700;
          color: ${isDark ? '#f8fafc' : '#0f172a'};
        }
        .sub-section-sub {
          font-size: 13px;
          color: ${isDark ? 'rgba(248,250,252,0.55)' : 'rgba(15,23,42,0.55)'};
          margin-top: 2px;
        }
        .sub-cycle-toggle {
          display: inline-flex;
          padding: 4px;
          background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
          border-radius: 10px;
          gap: 2px;
        }
        .sub-cycle-toggle button {
          padding: 6px 14px;
          border: none;
          background: transparent;
          color: ${isDark ? 'rgba(248,250,252,0.62)' : 'rgba(15,23,42,0.62)'};
          font-size: 13px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sub-cycle-toggle button.active {
          background: ${isDark ? 'rgba(245,158,11,0.14)' : '#fff'};
          color: ${isDark ? '#fbbf24' : '#b45309'};
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }
        .sub-plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .sub-plan-card {
          position: relative;
          padding: 22px 20px;
          border-radius: 14px;
          background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)'};
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
          display: flex;
          flex-direction: column;
        }
        .sub-plan-highlight {
          border-color: rgba(245, 158, 11, 0.5);
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }
        .sub-plan-current {
          border-color: rgba(34, 197, 94, 0.4);
        }
        .sub-plan-tag {
          position: absolute;
          top: -10px;
          right: 16px;
          padding: 3px 10px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          font-size: 10px;
          font-weight: 700;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sub-plan-name {
          font-size: 16px;
          font-weight: 700;
          color: ${isDark ? '#f8fafc' : '#0f172a'};
        }
        .sub-plan-tagline {
          font-size: 12px;
          color: ${isDark ? 'rgba(248,250,252,0.55)' : 'rgba(15,23,42,0.55)'};
          margin-top: 4px;
          margin-bottom: 16px;
        }
        .sub-plan-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 4px;
        }
        .sub-plan-price-num {
          font-size: 32px;
          font-weight: 800;
          color: ${isDark ? '#f8fafc' : '#0f172a'};
        }
        .sub-plan-price-per {
          font-size: 14px;
          color: ${isDark ? 'rgba(248,250,252,0.55)' : 'rgba(15,23,42,0.55)'};
        }
        .sub-plan-annual-hint {
          font-size: 11px;
          color: ${isDark ? 'rgba(248,250,252,0.42)' : 'rgba(15,23,42,0.42)'};
          margin-bottom: 12px;
        }
        .sub-plan-features {
          list-style: none;
          padding: 0;
          margin: 12px 0 22px 0;
          flex: 1;
        }
        .sub-plan-features li {
          font-size: 13px;
          color: ${isDark ? 'rgba(248,250,252,0.75)' : 'rgba(15,23,42,0.75)'};
          padding: 5px 0;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .sub-plan-check {
          color: #10b981;
          font-weight: 700;
        }
        .sub-btn-primary {
          padding: 10px 18px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.28);
        }
        .sub-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }
        .sub-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .sub-btn-ghost {
          padding: 10px 18px;
          border-radius: 10px;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)'};
          background: transparent;
          color: ${isDark ? 'rgba(248,250,252,0.85)' : 'rgba(15,23,42,0.85)'};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sub-btn-ghost:hover:not(:disabled) {
          background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
        }
        .sub-btn-ghost:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Usage bar sub-component
// ─────────────────────────────────────────────────────────

function UsageBar({
  label, used, limit,
}: {
  label: string; used: number; limit: number;
}) {
  const { isDark } = useTheme();
  const percentage = pct(used, limit);
  const isOver = used >= limit;
  const isNear = percentage >= 80 && !isOver;
  const barColor = isOver
    ? '#ef4444'
    : isNear
      ? '#10b981'
      : '#38bdf8';

  const size = 96;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  const trackColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={barColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 0.4s ease, stroke 0.2s',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: isOver ? '#ef4444' : isDark ? '#f8fafc' : '#0f172a',
              lineHeight: 1,
            }}
          >
            {percentage}%
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              marginTop: 2,
              color: isDark ? 'rgba(248,250,252,0.6)' : 'rgba(15,23,42,0.6)',
            }}
          >
            {used.toLocaleString()}/{limit >= 9999 ? '∞' : limit.toLocaleString()}
          </span>
        </div>
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: isDark ? 'rgba(248,250,252,0.72)' : 'rgba(15,23,42,0.72)',
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
}