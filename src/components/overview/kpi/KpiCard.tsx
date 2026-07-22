'use client';

import * as React from 'react';
import { useCallback, useRef, useState } from 'react';
import type { Theme } from '@/lib/theme';
import { useCounter, FlyingMessages, TargetRings, ChatBubbles, HandoffBadge } from './KpiOverlays';

/* ─────────────────────── KPI card ─────────────────────── */
export type CardVariant =
  | 'messages'
  | 'conversations'
  | 'leads'
  | 'handoffs'
  | 'dropoffs'
  | 'returning';

export function KpiCard({
  label,
  rawValue,
  sub,
  gradient,
  icon,
  delay,
  variant,
  t,
  isDark,
}: {
  label: string;
  rawValue: number;
  sub?: string;
  gradient: string;
  icon: React.ReactNode;
  delay: number;
  variant: CardVariant;
  t: Theme;
  isDark: boolean;
}) {
  const val = useCounter(rawValue);
  const [hov, setHov] = useState(false);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty(
      '--mx',
      `${((e.clientX - r.left) / r.width) * 100}%`,
    );
    ref.current.style.setProperty(
      '--my',
      `${((e.clientY - r.top) / r.height) * 100}%`,
    );
  }, []);
  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const id = Date.now();
    setRipples((p) => [
      ...p,
      { id, x: e.clientX - r.left, y: e.clientY - r.top },
    ]);
    setTimeout(() => setRipples((p) => p.filter((x) => x.id !== id)), 700);
  }, []);

  const cardBg = isDark ? (hov ? t.cardHovBg : t.cardBg) : '#ffffff';
  const borderColor = isDark
    ? hov
      ? t.cardBorderHov
      : t.cardBorder
    : 'rgba(15,23,42,0.08)';
  const cardShadow = hov
    ? t.cardHovShadow
    : isDark
      ? '0 2px 12px rgba(0,0,0,0.4)'
      : t.cardShadow;

  return (
    <div
      ref={ref}
      className='relative overflow-hidden rounded-2xl p-5 cursor-pointer select-none'
      style={{
        background: cardBg,
        border: `1px solid ${borderColor}`,
        backdropFilter: isDark ? 'blur(18px) saturate(160%)' : 'none',
        WebkitBackdropFilter: isDark ? 'blur(18px) saturate(160%)' : 'none',
        animation: `kpi-in .6s ease ${delay}ms both`,
        transition:
          'transform .22s cubic-bezier(.34,1.4,.64,1),box-shadow .22s,border-color .2s',
        transform: hov ? 'translateY(-5px) scale(1.025)' : 'none',
        boxShadow: cardShadow,
        minWidth: 0,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onMouseMove={onMove}
      onClick={onClick}
    >
      <div
        className='absolute inset-0 rounded-2xl pointer-events-none'
        style={{
          background: `radial-gradient(circle 90px at var(--mx,50%) var(--my,50%),${isDark ? 'rgba(141,166,255,0.06)' : 'rgba(99,102,241,0.05)'},transparent 70%)`,
          opacity: hov ? 1 : 0,
          transition: 'opacity .3s',
        }}
      />
      {ripples.map((rp) => (
        <div
          key={rp.id}
          className='absolute rounded-full pointer-events-none'
          style={{
            left: rp.x,
            top: rp.y,
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            background: 'rgba(99,102,241,0.12)',
            animation: 'ripple-out .65s ease-out both',
          }}
        />
      ))}
      <div
        className='absolute -top-8 -right-8 h-28 w-28 rounded-full blur-2xl pointer-events-none'
        style={{
          background: gradient,
          opacity: hov ? (isDark ? 0.3 : 0.18) : isDark ? 0.15 : 0.08,
          transform: hov ? 'scale(1.5)' : 'scale(1)',
          transition: 'all .5s',
        }}
      />

      <FlyingMessages active={hov && variant === 'messages'} />
      <TargetRings active={hov && variant === 'leads'} />
      <ChatBubbles active={hov && variant === 'conversations'} />
      <HandoffBadge active={hov && variant === 'handoffs'} />

      <div className='relative flex items-start justify-between mb-3 gap-2'>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: t.labelColor,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </p>
        <span
          style={{
            fontSize: 18,
            transition: 'all .3s',
            transform: hov ? 'scale(1.35) rotate(-10deg)' : 'scale(1)',
            opacity: hov ? 1 : 0.6,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      </div>
      <p
        className='relative tabular-nums leading-none kpi-value'
        style={{ fontWeight: 900, color: t.text }}
      >
        {val.toLocaleString()}
      </p>
      {sub && (
        <p className='relative mt-2' style={{ fontSize: 12, color: t.textSub }}>
          {sub}
        </p>
      )}

      {/* Bottom accent line */}
      <div className='absolute bottom-0 left-0 right-0 h-px overflow-hidden'>
        <div
          style={{
            height: '100%',
            background: gradient,
            opacity: hov ? 0.7 : 0.3,
            transform: hov ? 'scaleX(1)' : 'scaleX(.2)',
            transformOrigin: 'left',
            transition: 'all .45s',
          }}
        />
      </div>
    </div>
  );
}

