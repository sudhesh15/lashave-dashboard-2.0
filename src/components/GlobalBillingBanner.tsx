'use client';

import { TrialEndingBanner } from '@/components/billing/FeatureGate';
import { Alert } from '@/components/ui/alert';
import { SUBSCRIPTION_HREF } from '@/lib/billing';
import { useBilling } from '@/lib/billing-context';
import Link from 'next/link';
import { useState } from 'react';

export function GlobalBillingBanner() {
  const { loading, isLocked, status } = useBilling();
  const [dismissedTrial, setDismissedTrial] = useState(false);

  if (loading) return null;

  if (isLocked) {
    return (
      <div className='px-4 pt-4 md:px-6'>
        <Alert
          variant='error'
          title='Your free trial has ended'
          message='AI replies are paused on all channels. Upgrade to restore automation — your data is still saved.'
          showLink
          linkHref={SUBSCRIPTION_HREF}
          linkText='Choose a plan'
        />
      </div>
    );
  }

  if (status?.subscription_status === 'past_due') {
    return (
      <div className='billing-banner billing-banner-error'>
        <span>
          <strong>Payment failed.</strong> Update your payment method to keep your
          subscription.
          <Link href={SUBSCRIPTION_HREF}> Fix it →</Link>
        </span>
      </div>
    );
  }

  if (dismissedTrial) return null;

  return (
    <div className='px-4 pt-4 md:px-6'>
      <div className='relative'>
        <TrialEndingBanner />
        {status?.subscription_status === 'trialing' &&
          status.trial_days_left !== null &&
          status.trial_days_left <= 3 &&
          status.trial_days_left > 0 && (
            <button
              type='button'
              onClick={() => setDismissedTrial(true)}
              className='absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              aria-label='Dismiss trial reminder'
            >
              ×
            </button>
          )}
      </div>
    </div>
  );
}
