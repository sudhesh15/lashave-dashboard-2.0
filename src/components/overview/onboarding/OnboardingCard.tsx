'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import type { Theme } from '@/lib/theme';

export function OnboardingCard({
  hasFaqs,
  hasChannels,
  onTrainAI,
  onConnectChannel,
  t,
  isDark,
  tenantId,
}: {
  hasFaqs: boolean;
  hasChannels: boolean;
  onTrainAI: () => void;
  onConnectChannel: () => void;
  t: Theme;
  isDark: boolean;
  tenantId?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [btnHov, setBtnHov] = useState(false);
  const [dimHov, setDimHov] = useState(false);
  const [stepHov, setStepHov] = useState<number | null>(null);

  // ── internal logic — UNCHANGED ──────────────────────────────────────────
  const allDone = hasFaqs && hasChannels;

  useEffect(() => {
    if (!allDone || dismissed) return;
    const timer = setTimeout(() => setDismissed(true), 1200);
    return () => clearTimeout(timer);
  }, [allDone, dismissed]);

  if (dismissed) return null;

  const steps = [
    { title: 'Create account', done: true, active: false },
    { title: 'Train your AI', done: hasFaqs, active: !hasFaqs },
    {
      title: 'Connect a channel',
      done: hasChannels,
      active: hasFaqs && !hasChannels,
    },
  ];
  const activeStepIdx = steps.findIndex((s) => s.active);
  const activeStep = activeStepIdx >= 0 ? steps[activeStepIdx] : null;
  const stepNum = activeStepIdx >= 0 ? activeStepIdx + 1 : 3;
  const progress = steps.filter((s) => s.done).length;
  // ────────────────────────────────────────────────────────────────────────

  // ── Glass colour system — full dark / light dual-mode, all rgba() ──────────
  //
  // Dark:  glass over a dark scene  → white rgba highlights, indigo tint
  // Light: glass over a light scene → dark rgba shadows, white gloss layers
  //
  const G = isDark
    ? {
        // ── DARK MODE ────────────────────────────────────────────────────────────
        // Card: frosted dark glass with subtle indigo tint
        cardBg:
          'linear-gradient(145deg,rgba(255,255,255,0.058) 0%,rgba(255,255,255,0.028) 50%,rgba(129,140,248,0.040) 100%)',
        cardBorder: 'rgba(255,255,255,0.10)',
        cardBorderHov: 'rgba(129,140,248,0.34)',
        cardShadow:
          '0 4px 6px rgba(0,0,0,0.24),0 16px 48px rgba(0,0,0,0.50),0 2px 4px rgba(0,0,0,0.32),' +
          'inset 0 1px 0 rgba(255,255,255,0.12),inset 0 -1px 0 rgba(0,0,0,0.20)',
        cardShadowHov:
          '0 4px 6px rgba(0,0,0,0.24),0 20px 60px rgba(0,0,0,0.56),' +
          '0 0 0 1px rgba(129,140,248,0.16),0 0 36px rgba(99,102,241,0.12),' +
          'inset 0 1px 0 rgba(255,255,255,0.16),inset 0 -1px 0 rgba(0,0,0,0.22)',
        // Sidebar: marginally darker/less transparent than card
        sidebarBg:
          'linear-gradient(160deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.02) 100%)',
        sidebarBdr: 'rgba(255,255,255,0.07)',
        // Typography
        text: 'rgba(248,250,252,0.96)',
        textSub: 'rgba(241,245,249,0.55)',
        textMuted: 'rgba(255, 255, 255, 1)',
        // Accent — indigo, lighter for dark bg
        accentFg: 'rgba(165,180,252,0.94)',
        accentBg: 'rgba(99,102,241,0.13)',
        accentBdr: 'rgba(129,140,248,0.26)',
        accentBgHov: 'rgba(99,102,241,0.24)',
        accentBdrHov: 'rgba(129,140,248,0.46)',
        // Success — emerald
        doneFg: 'rgba(52,211,153,0.94)',
        doneBg: 'rgba(16,185,129,0.13)',
        doneBdr: 'rgba(16,185,129,0.28)',
        // Neutral
        neutralBg: 'rgba(255,255,255,0.05)',
        neutralBdr: 'rgba(255,255,255,0.09)',
        neutralBgHov: 'rgba(255,255,255,0.08)',
        neutralBdrHov: 'rgba(255,255,255,0.16)',
        // Track
        trackBg: 'rgba(255,255,255,0.08)',
        connDone:
          'linear-gradient(to bottom,rgba(16,185,129,0.72),rgba(16,185,129,0.10))',
        connPending: 'rgba(255,255,255,0.07)',
        // Gloss — bright top edge highlight
        gloss:
          'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.22) 40%,rgba(255,255,255,0.22) 60%,transparent 100%)',
        // Blur
        blur: 'blur(28px) saturate(160%)',
      }
    : {
        // ── LIGHT MODE ───────────────────────────────────────────────────────────
        // Card: bright white glass — strong white surface, subtle blue tint at bottom
        cardBg:
          'linear-gradient(145deg,rgba(255,255,255,0.92) 0%,rgba(255,255,255,0.82) 60%,rgba(224,231,255,0.50) 100%)',
        cardBorder: 'rgba(15,23,42,0.08)',
        cardBorderHov: 'rgba(99,102,241,0.28)',
        cardShadow:
          '0 1px 3px rgba(15,23,42,0.06),0 8px 28px rgba(15,23,42,0.09),0 2px 6px rgba(15,23,42,0.05),' +
          'inset 0 1px 0 rgba(255,255,255,0.98),inset 0 -1px 0 rgba(15,23,42,0.05)',
        cardShadowHov:
          '0 2px 4px rgba(15,23,42,0.06),0 12px 36px rgba(15,23,42,0.12),' +
          '0 0 0 1px rgba(99,102,241,0.12),0 0 28px rgba(99,102,241,0.06),' +
          'inset 0 1px 0 rgba(255,255,255,1),inset 0 -1px 0 rgba(15,23,42,0.06)',
        // Sidebar: very slightly off-white, reads as a tinted panel
        sidebarBg:
          'linear-gradient(160deg,rgba(248,249,255,0.96) 0%,rgba(243,244,255,0.90) 100%)',
        sidebarBdr: 'rgba(15,23,42,0.07)',
        // Typography
        text: 'rgba(15, 23, 42, 0.96)',
        textSub: 'rgba(15,23,42,0.56)',
        textMuted: 'rgba(15,23,42,0.38)',
        // Accent — indigo, darker/saturated for light bg
        accentFg: 'rgba(67,56,202,0.95)',
        accentBg: 'rgba(99,102,241,0.08)',
        accentBdr: 'rgba(99,102,241,0.22)',
        accentBgHov: 'rgba(99,102,241,0.14)',
        accentBdrHov: 'rgba(99,102,241,0.38)',
        // Success — emerald, darker for light bg
        doneFg: 'rgba(5,150,105,0.95)',
        doneBg: 'rgba(16,185,129,0.08)',
        doneBdr: 'rgba(16,185,129,0.22)',
        // Neutral
        neutralBg: 'rgba(15,23,42,0.04)',
        neutralBdr: 'rgba(15,23,42,0.09)',
        neutralBgHov: 'rgba(15,23,42,0.07)',
        neutralBdrHov: 'rgba(15,23,42,0.14)',
        // Track
        trackBg: 'rgba(15,23,42,0.07)',
        connDone:
          'linear-gradient(to bottom,rgba(5,150,105,0.65),rgba(5,150,105,0.08))',
        connPending: 'rgba(15,23,42,0.07)',
        // Gloss — barely-there shimmer on bright surface
        gloss:
          'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.80) 40%,rgba(255,255,255,0.80) 60%,transparent 100%)',
        // Blur
        blur: 'blur(22px) saturate(140%)',
      };

  // ── Step icon ─────────────────────────────────────────────────────────────
  function StepIcon({ s, i }: { s: (typeof steps)[0]; i: number }) {
    const scale = stepHov === i ? 'scale(1.12)' : 'scale(1)';
    const base: React.CSSProperties = {
      width: 24,
      height: 24,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform .22s cubic-bezier(.34,1.4,.64,1), box-shadow .22s',
      transform: scale,
    };
    if (s.done)
      return (
        <div
          style={{
            ...base,
            background: G.doneBg,
            border: `1px solid ${G.doneBdr}`,
            boxShadow:
              stepHov === i
                ? '0 0 14px rgba(16,185,129,0.28)'
                : '0 0 0 rgba(16,185,129,0)',
          }}
        >
          <svg width='11' height='11' viewBox='0 0 11 11' fill='none'>
            <path
              d='M2 5.5l2.5 2.5 4.5-5'
              stroke='rgba(52,211,153,0.95)'
              strokeWidth='1.8'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
      );
    if (s.active)
      return (
        <div
          style={{
            ...base,
            background: G.accentBg,
            border: `1px solid ${G.accentBdr}`,
            boxShadow: isDark
              ? '0 0 10px rgba(99,102,241,0.22)'
              : '0 0 8px rgba(99,102,241,0.16)',
            animation: 'ob-glow 2s ease infinite',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: G.accentFg,
              animation: 'ob-pulse 1.6s ease infinite',
            }}
          />
        </div>
      );
    return (
      <div
        style={{
          ...base,
          background: G.neutralBg,
          border: `1px solid ${G.neutralBdr}`,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: G.textMuted,
            lineHeight: 1,
          }}
        >
          {i + 1}
        </span>
      </div>
    );
  }

  return (
    <>
      <style>{`
  @keyframes ob-slide-up {
    from { opacity:0; transform:translateY(20px) scale(.97); }
    to   { opacity:1; transform:none; }
  }
  @keyframes ob-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:.4; transform:scale(.6); }
  }
  @keyframes ob-glow {
    0%,100% { box-shadow:${isDark ? '0 0 8px rgba(99,102,241,0.20)' : '0 0 8px rgba(99,102,241,0.14)'}; }
    50%     { box-shadow:${isDark ? '0 0 18px rgba(99,102,241,0.44)' : '0 0 14px rgba(99,102,241,0.28)'}; }
  }
  .ob-card { transition:border-color .22s ease,box-shadow .22s ease; }
  .ob-cta  { transition:background .18s,border-color .18s,transform .18s cubic-bezier(.34,1.2,.64,1),box-shadow .18s; }
  .ob-arrow{ transition:transform .18s,background .15s; }

  /* ===== MOBILE RESPONSIVE FIXES ===== */
  @media (max-width: 640px) {
    .onboard-grid {
      display: block !important; /* force stacking */
      width: calc(105 % - 24px);
      margin: 12px auto;
    }

    .onboard-sidebar,
    .onboard-grid > div:nth-child(2) {
      width: 100% !important; /* full width */
      padding: 12px !important;
      text-align: center !important;
      display: block !important;
    }

    /* Center main content icons and text */
    .onboard-grid > div:nth-child(2) {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: flex-start;
    }

    /* Shrink headings & paragraphs */
    h3 { font-size: 16px !important; }
    p { font-size: 12px !important; line-height: 1.45 !important; }

    /* Shrink badges, step indicators & icons */
    .onboard-grid span { font-size: 9px !important; }
    .onboard-grid svg { width: 18px !important; height: 18px !important; }

    /* CTA button full width */
    .ob-cta {
      width: 100% !important;
      min-width: unset !important;
      justify-content: center !important;
      padding: 10px 12px !important;
      font-size: 13px !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
    }
       .pipeline-container {
      display: flex !important;           /* horizontal layout */
      flex-direction: row !important;     /* row instead of column */
      justify-content: space-between !important; /* spread segments evenly */
      align-items: center !important;     /* center vertically */
      gap: 4px !important;                /* spacing between segments */
      width: 100% !important;             /* full width of card */
    }

    .pipeline-segment {
      flex: 1 1 0%;                       /* each segment stretches evenly */
      height: 3px !important;             /* thickness of the line */
      border-radius: 999px !important;
      background: #ccc !important;        /* default inactive color */
    }

    .pipeline-segment.done {
      background: #10b981 !important;     /* done segment color */
      box-shadow: 0 0 6px rgba(16,185,129,0.32);
    }

    .pipeline-segment.active {
      background: #6366F1 !important;     /* active step color */
      box-shadow: 0 0 6px rgba(99,102,241,0.34);
    }
  
  }
`}</style>

      <div
        className='onboard-grid ob-card'
        style={{
          display: 'grid',
          gridTemplateColumns: '176px 1fr',
          borderRadius: 20,
          overflow: 'hidden',
          background: G.cardBg,
          backdropFilter: G.blur,
          WebkitBackdropFilter: G.blur,
          border: `1px solid ${G.cardBorder}`,
          boxShadow: G.cardShadow,
          animation: 'ob-slide-up .46s cubic-bezier(.34,1.2,.64,1) both',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = G.cardBorderHov;
          el.style.boxShadow = G.cardShadowHov;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = G.cardBorder;
          el.style.boxShadow = G.cardShadow;
        }}
      >
        {/* top gloss line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: G.gloss,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />

        {/* ── Sidebar ── */}
        <div
          className='onboard-sidebar'
          style={{
            background: G.sidebarBg,
            borderRight: `1px solid ${G.sidebarBdr}`,
            padding: '18px 14px',
            position: 'relative',
          }}
        >
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: G.text,
              marginBottom: 14,
            }}
          >
            Getting started
          </p>

          {/* progress pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 8,
              background: G.accentBg,
              border: `1px solid ${G.accentBdr}`,
              marginBottom: 18,
              fontSize: 11,
              fontWeight: 600,
              color: G.accentFg,
            }}
          >
            <svg
              width='13'
              height='13'
              viewBox='0 0 24 24'
              fill='none'
              stroke={G.accentFg}
              strokeWidth='2'
              strokeLinecap='round'
            >
              <polyline points='22 12 18 12 15 21 9 3 6 12 2 12' />
            </svg>
            {progress} / {steps.length} complete
          </div>

          {/* steps */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {steps.map((s, i) => {
              const isLast = i === steps.length - 1;
              const nameColor = s.done
                ? G.doneFg
                : s.active
                  ? G.text
                  : G.textMuted;
              return (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'stretch', gap: 9 }}
                  onMouseEnter={() => setStepHov(i)}
                  onMouseLeave={() => setStepHov(null)}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <StepIcon s={s} i={i} />
                    {!isLast && (
                      <div
                        style={{
                          width: 1.5,
                          flex: 1,
                          minHeight: 18,
                          borderRadius: 1,
                          margin: '3px 0',
                          background: s.done ? G.connDone : G.connPending,
                          transition: 'background .3s',
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{ paddingBottom: isLast ? 0 : 15, paddingTop: 2 }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: s.active ? 700 : 500,
                        color: nameColor,
                        margin: 0,
                        lineHeight: 1.35,
                        transition: 'color .2s',
                      }}
                    >
                      {s.title}
                    </p>
                    {s.done && (
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: G.doneFg,
                          margin: '2px 0 0',
                          opacity: 0.75,
                        }}
                      >
                        Done
                      </p>
                    )}
                    {s.active && (
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: G.accentFg,
                          margin: '2px 0 0',
                          opacity: 0.8,
                        }}
                      >
                        In progress
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            minHeight: '260px',
          }}
        >
          {/* ── Main content ── */}
          <div
            style={{
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            <div>
              {/* header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                {/* badge */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: allDone ? G.doneBg : G.accentBg,
                    border: `1px solid ${allDone ? G.doneBdr : G.accentBdr}`,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: allDone ? G.doneFg : G.accentFg,
                  }}
                >
                  {allDone ? (
                    <>
                      <svg
                        width='10'
                        height='10'
                        viewBox='0 0 10 10'
                        fill='none'
                      >
                        <path
                          d='M2 5l2 2L8 3'
                          stroke={G.doneFg}
                          strokeWidth='1.8'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                      All done!
                    </>
                  ) : (
                    `Step ${stepNum} of 3`
                  )}
                </span>

                {/* dismiss */}
                <button
                  onClick={() => setDismissed(true)}
                  onMouseEnter={() => setDimHov(true)}
                  onMouseLeave={() => setDimHov(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: dimHov ? G.neutralBgHov : 'transparent',
                    border: `1px solid ${dimHov ? G.neutralBdrHov : 'rgba(255,255,255,0.06)'}`,
                    padding: '3px 9px',
                    borderRadius: 7,
                    fontSize: 11,
                    color: dimHov ? 'rgba(255,255,255,0.60)' : G.textMuted,
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  <svg
                    width='10'
                    height='10'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                  >
                    <line x1='18' y1='6' x2='6' y2='18' />
                    <line x1='6' y1='6' x2='18' y2='18' />
                  </svg>
                  Dismiss
                </button>
              </div>

              {/* segmented progress track */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {steps.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 999,
                      background: s.done
                        ? isDark
                          ? 'rgba(16,185,129,0.85)'
                          : 'rgba(5,150,105,0.82)'
                        : s.active
                          ? 'rgba(99,102,241,0.85)'
                          : G.trackBg,
                      boxShadow: s.done
                        ? isDark
                          ? '0 0 6px rgba(16,185,129,0.32)'
                          : '0 0 5px rgba(5,150,105,0.22)'
                        : s.active
                          ? isDark
                            ? '0 0 6px rgba(99,102,241,0.34)'
                            : '0 0 5px rgba(99,102,241,0.24)'
                          : 'none',
                      transition: 'background .4s',
                    }}
                  />
                ))}
              </div>

              {/* icon box + heading */}
              {/* icon box + heading */}
              {allDone ? (
                <>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      background: isDark
                        ? 'linear-gradient(135deg,rgba(16,185,129,.18),rgba(52,211,153,.10))'
                        : 'linear-gradient(135deg,#ECFDF5,#F0FDF4)',
                      border: isDark
                        ? '1px solid rgba(52,211,153,.20)'
                        : '1px solid rgba(16,185,129,.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                      boxShadow: isDark
                        ? '0 14px 34px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.10)'
                        : '0 12px 28px rgba(16,185,129,.10), inset 0 1px 0 rgba(255,255,255,.9)',
                    }}
                  >
                    <svg
                      width='22'
                      height='22'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke={G.doneFg}
                      strokeWidth='1.9'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z' />
                      <path d='M9 12l2 2 4-4' />
                    </svg>
                  </div>

                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: G.text,
                      margin: '0 0 6px',
                      letterSpacing: '-.3px',
                    }}
                  >
                    Your AI is live!
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: G.textSub,
                      margin: 0,
                      lineHeight: 1.62,
                    }}
                  >
                    Your AI is trained and connected to a channel. It's already
                    replying to customers.
                  </p>
                </>
              ) : activeStep?.title === 'Train your AI' ? (
                <>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      background: isDark
                        ? 'linear-gradient(135deg,rgba(99,102,241,.20),rgba(168,85,247,.12))'
                        : 'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
                      border: isDark
                        ? '1px solid rgba(255,255,255,.10)'
                        : '1px solid rgba(99,102,241,.14)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                      boxShadow: isDark
                        ? '0 14px 34px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.10)'
                        : '0 12px 28px rgba(79,70,229,.10), inset 0 1px 0 rgba(255,255,255,.9)',
                    }}
                  >
                    <svg
                      width='22'
                      height='22'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke={G.accentFg}
                      strokeWidth='1.8'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <circle cx='6' cy='12' r='2' />
                      <circle cx='18' cy='6' r='2' />
                      <circle cx='18' cy='18' r='2' />
                      <circle cx='12' cy='12' r='2.5' />

                      <path d='M8 12h2' />
                      <path d='M14 11l2-3' />
                      <path d='M14 13l2 3' />
                    </svg>
                  </div>

                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: G.text,
                      margin: '0 0 6px',
                      letterSpacing: '-.3px',
                    }}
                  >
                    Train your AI on your business
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: G.textSub,
                      margin: '0 0 16px',
                      lineHeight: 1.62,
                    }}
                  >
                    Pick your business type and answer a few quick questions.
                    Takes about two minutes.
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      background: isDark
                        ? 'linear-gradient(135deg,rgba(99,102,241,.20),rgba(56,189,248,.10))'
                        : 'linear-gradient(135deg,#EEF2FF,#ECFEFF)',
                      border: isDark
                        ? '1px solid rgba(255,255,255,.10)'
                        : '1px solid rgba(99,102,241,.14)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                      boxShadow: isDark
                        ? '0 14px 34px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.10)'
                        : '0 12px 28px rgba(79,70,229,.10), inset 0 1px 0 rgba(255,255,255,.9)',
                    }}
                  >
                    <svg
                      width='22'
                      height='22'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke={G.accentFg}
                      strokeWidth='1.8'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M8 8v4' />
                      <path d='M16 8v4' />
                      <path d='M7 12h10' />
                      <path d='M12 12v6' />
                      <path d='M9 18h6' />
                    </svg>
                  </div>

                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: G.text,
                      margin: '0 0 6px',
                      letterSpacing: '-.3px',
                    }}
                  >
                    Connect your first channel
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: G.textSub,
                      margin: '0 0 16px',
                      lineHeight: 1.62,
                    }}
                  >
                    Your AI is ready. Connect Instagram, Telegram or Facebook
                    and it goes live instantly.
                  </p>
                </>
              )}
            </div>

            {/* CTA */}
            {/* CTA */}
            {!allDone && (
              <button
                onClick={
                  activeStep?.title === 'Train your AI'
                    ? onTrainAI
                    : onConnectChannel
                }
                onMouseEnter={() => setBtnHov(true)}
                onMouseLeave={() => setBtnHov(false)}
                className='ob-cta'
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  width: 'fit-content',
                  minWidth: 180,
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: isDark
                    ? btnHov
                      ? 'rgba(255,255,255,.11)'
                      : 'rgba(255,255,255,.07)'
                    : btnHov
                      ? 'rgba(255,255,255,.88)'
                      : 'rgba(255,255,255,.76)',

                  border: btnHov
                    ? '1px solid rgba(129,140,248,.38)'
                    : isDark
                      ? '1px solid rgba(255,255,255,.10)'
                      : '1px solid rgba(99,102,241,.12)',

                  boxShadow: btnHov
                    ? isDark
                      ? `
      0 0 0 1px rgba(129,140,248,.22),
      0 0 22px rgba(129,140,248,.18),
      inset 0 1px 0 rgba(255,255,255,.14)
    `
                      : `
      0 0 0 1px rgba(99,102,241,.10),
      0 8px 24px rgba(99,102,241,.10),
      inset 0 1px 0 rgba(255,255,255,.9)
     `
                    : isDark
                      ? 'inset 0 1px 0 rgba(255,255,255,.10)'
                      : '0 4px 14px rgba(15,23,42,.05)',

                  // CLEAN THEME-SAFE CTA

                  transform: btnHov ? 'translateY(-1px) scale(1.01)' : 'none',

                  color: isDark ? '#F8FAFC' : '#312E81',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '-.1px',
                  transition: 'all .2s cubic-bezier(.34,1.2,.64,1)',
                }}
              >
                <span>
                  {activeStep?.title === 'Train your AI'
                    ? 'Start training'
                    : 'Connect channel'}
                </span>

                <div
                  className='ob-arrow'
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    flexShrink: 0,

                    background: isDark
                      ? btnHov
                        ? 'rgba(255,255,255,0.18)'
                        : 'rgba(255,255,255,0.12)'
                      : btnHov
                        ? 'rgba(79,70,229,0.12)'
                        : 'rgba(79,70,229,0.08)',

                    border: `1px solid ${
                      isDark ? 'rgba(255,255,255,0.10)' : 'rgba(79,70,229,0.12)'
                    }`,

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                    transform: btnHov ? 'translateX(2px)' : 'none',
                  }}
                >
                  <svg
                    width='13'
                    height='13'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke={isDark ? G.text : 'rgba(67,56,202,0.92)'}
                    strokeWidth='2.2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <line x1='5' y1='12' x2='19' y2='12' />
                    <polyline points='12 5 19 12 12 19' />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

