import type { Theme } from '@/lib/theme';

export function HealthRing({ score, t }: { score: number; t: Theme }) {
  const SIZE = 52,
    R = 20,
    CIRC = 2 * Math.PI * R;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const offset = CIRC * (1 - Math.min(score / 100, 1));
  return (
    <div
      style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}
    >
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill='none'
          stroke={t.cardBorder}
          strokeWidth={5}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill='none'
          stroke={color}
          strokeWidth={5}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap='round'
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)',
            filter: `drop-shadow(0 0 4px ${color})`,
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
        <span style={{ fontSize: 11, fontWeight: 700, color, lineHeight: 1 }}>
          {score}
        </span>
        <span
          style={{ fontSize: 7, color: t.textMuted, letterSpacing: '.05em' }}
        >
          health
        </span>
      </div>
    </div>
  );
}

