'use client';

import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_HREF } from '@/lib/billing';
import { useBilling } from '@/lib/billing-context';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function TrialPill() {
  const { loading, isTrialing, isLocked, trialDaysLeft } = useBilling();

  if (loading) return null;
  if (!isTrialing && !isLocked) return null;

  const urgent = !isLocked && trialDaysLeft !== null && trialDaysLeft <= 3;

  return (
    <Link href={SUBSCRIPTION_HREF} className='shrink-0'>
      <Badge
        color={isLocked ? 'error' : urgent ? 'warning' : 'primary'}
        startIcon={
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isLocked
                ? 'bg-error-500'
                : urgent
                  ? 'bg-warning-500'
                  : 'bg-brand-500',
            )}
          />
        }
        className='cursor-pointer px-3 py-1.5 type-caption font-semibold uppercase'
      >
        {isLocked
          ? 'Subscribe to continue'
          : `Trial · ${trialDaysLeft ?? 0} day${trialDaysLeft === 1 ? '' : 's'} left`}
      </Badge>
    </Link>
  );
}
