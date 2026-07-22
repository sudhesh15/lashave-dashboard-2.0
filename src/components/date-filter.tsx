'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export type DateRangeValue = { from: string; to: string } | null;

export function DateFilter({
  dateRange,
  activePreset,
  setDateRange,
  setActivePreset,
  open,
  onToggle,
  onClose,
}: {
  dateRange: DateRangeValue;
  activePreset: number | null;
  setDateRange: (range: DateRangeValue) => void;
  setActivePreset: (preset: number | null) => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const toDateStr = (d: Date) => d.toISOString().split('T')[0];
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return toDateStr(d);
  };

  const formatDate = (str: string) =>
    new Date(str + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="relative shrink-0">
      <Button
        variant="outline"
        onClick={onToggle}
        className={cn(
          dateRange &&
            'border-brand-300 bg-brand-50 text-brand-500 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-400',
        )}
      >
        <Calendar className="size-4" />
        {dateRange ? `${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}` : 'Date'}
      </Button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Today', days: 0 },
              { label: '7 days', days: 7 },
              { label: '30 days', days: 30 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  if (activePreset === preset.days) {
                    setActivePreset(null);
                    setDateRange(null);
                    return;
                  }

                  setActivePreset(preset.days);
                  setDateRange({ from: daysAgo(preset.days), to: toDateStr(new Date()) });
                }}
                className={cn(
                  'rounded-lg border px-2 py-2 text-theme-xs font-medium transition',
                  activePreset === preset.days
                    ? 'border-brand-300 bg-brand-50 text-brand-500 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-400'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
              From
              <input
                type="date"
                value={dateRange?.from ?? ''}
                onChange={(event) => {
                  setActivePreset(null);
                  setDateRange({
                    from: event.target.value,
                    to: dateRange?.to ?? toDateStr(new Date()),
                  });
                }}
                className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-300"
              />
            </label>

            <label className="grid gap-1.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
              To
              <input
                type="date"
                value={dateRange?.to ?? ''}
                onChange={(event) => {
                  setActivePreset(null);
                  setDateRange({
                    from: dateRange?.from ?? toDateStr(new Date()),
                    to: event.target.value,
                  });
                }}
                className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-300"
              />
            </label>
          </div>

          {dateRange && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => {
                setActivePreset(null);
                setDateRange(null);
                onClose();
              }}
            >
              Clear date
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
