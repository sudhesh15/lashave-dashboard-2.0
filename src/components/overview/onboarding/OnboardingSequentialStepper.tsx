import type { Theme } from '@/lib/theme';
import type { OnboardingRoute, OnboardingRouteResult, OnboardingStepStatus } from './types';

export function OnboardingSequentialStepper({
  routes,
  results,
  currentRoute,
  t,
  isDark,
  accent,
}: {
  routes: OnboardingRoute[];
  results: OnboardingRouteResult[];
  currentRoute: OnboardingRoute | null;
  t: Theme;
  isDark: boolean;
  accent: string;
}) {
  const label: Record<OnboardingRoute, string> = {
    scrape: 'Scrape website',
    upload: 'Upload document',
    questions: 'Answer questions',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {routes.map((r, i) => {
        const result = results.find((x) => x.route === r);
        const status: OnboardingStepStatus =
          result?.status ?? (currentRoute === r ? 'running' : 'pending');
        const isDone = status === 'done';
        const isFailed = status === 'failed';
        const isRunning = status === 'running';
        const dotColor = isFailed
          ? '#dc2626'
          : isDone
            ? '#059669'
            : isRunning
              ? accent
              : t.textMuted;
        return (
          <div
            key={r}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${isRunning ? accent : isDark ? 'rgba(120,130,180,0.15)' : 'rgba(15,23,42,0.06)'}`,
              background: isRunning
                ? isDark
                  ? 'rgba(141,166,255,0.06)'
                  : 'rgba(59,130,246,0.04)'
                : 'transparent',
              transition: 'background .2s, border-color .2s',
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDone || isFailed ? dotColor : 'transparent',
                border: `2px solid ${dotColor}`,
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {isDone ? '✓' : isFailed ? '✕' : i + 1}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: t.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {label[r]}
              </div>
              <div style={{ fontSize: 11, color: t.textSub, marginTop: 2 }}>
                {isRunning
                  ? 'Running…'
                  : isDone
                    ? `Done · ${result?.count ?? 0} draft${result?.count === 1 ? '' : 's'}`
                    : isFailed
                      ? result?.message || 'Failed'
                      : 'Waiting'}
              </div>
            </div>
            {isRunning && (
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${accent}30`,
                  borderTopColor: accent,
                  animation: 'od-spin .7s linear infinite',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

