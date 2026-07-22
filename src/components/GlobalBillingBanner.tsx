'use client';
import { apiFetch } from '@/lib/api';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type StatusResp = {
  subscription_status: string;
  trial_ends_at: string | null;
};

export function GlobalBillingBanner() {
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    apiFetch<StatusResp>('/admin/billing/status', { auth: true })
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status || dismissed) return null;

  // Trial ending in < 3 days
  if (status.subscription_status === 'trialing' && status.trial_ends_at) {
    const daysLeft = Math.ceil(
      (new Date(status.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 3 && daysLeft > 0) {
      return (
        <div className='billing-banner billing-banner-warning'>
          <span>
            Your trial ends in <strong>{daysLeft} day{daysLeft === 1 ? '' : 's'}</strong>.
            <Link href='/profile?activeNav=subscription'> Add a payment method →</Link>
          </span>
          <button onClick={() => setDismissed(true)}>×</button>
        </div>
      );
    }
  }

  // Payment failed
  if (status.subscription_status === 'past_due') {
    return (
      <div className='billing-banner billing-banner-error'>
        <span>
          <strong>Payment failed.</strong> Update your payment method to keep your subscription.
          <Link href='/profile?activeNav=subscription'> Fix it →</Link>
        </span>
      </div>
    );
    // Note: past_due is NOT dismissible — critical action needed
  }

  return null;
}