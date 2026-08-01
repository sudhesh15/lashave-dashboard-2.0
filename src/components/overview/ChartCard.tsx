'use client';

import * as React from 'react';
import { useState } from 'react';
import type { Theme } from '@/lib/theme';

export function ChartCard({
  children,
  t,
  isDark,
  style = {} as React.CSSProperties,
  className = '',
}: {
  children: React.ReactNode;
  t: Theme;
  isDark: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [hov, setHov] = useState(false);
  const cardShadow = hov
    ? t.cardHovShadow
    : isDark
      ? '0 2px 12px rgba(0,0,0,0.4)'
      : t.cardShadow;

  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-300 ${className}`}
      style={{
        border: `1px solid ${isDark ? (hov ? t.cardBorderHov : t.cardBorder) : 'rgba(15,23,42,0.08)'}`,
        background: hov ? t.cardHovBg : t.cardBg,
        backdropFilter: isDark ? 'blur(18px) saturate(160%)' : 'none',
        WebkitBackdropFilter: isDark ? 'blur(18px) saturate(160%)' : 'none',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: cardShadow,
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        ...style,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </div>
  );
}

