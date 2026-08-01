'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Theme } from '@/lib/theme';
import type { Overview, TS } from './types';

export function LivePulseFeed({
  overview,
  todayMessages,
  handoffConvCount,
  tsHandoffs,
  wonCount,
  qualifiedCount,
  t,
  isDark,
}: {
  overview: Overview | null;
  todayMessages: number;
  handoffConvCount: number;
  tsHandoffs: TS | null;
  wonCount: number;
  qualifiedCount: number;
  t: Theme;
  isDark: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const handoffsToday = useMemo(() => {
    if (!tsHandoffs?.points?.length) return 0;
    const today = new Date().toISOString().slice(0, 10);
    return tsHandoffs.points.find((p) => p.t.startsWith(today))?.v ?? 0;
  }, [tsHandoffs]);
  const winRate = overview?.total_leads
    ? `${wonCount} won · ${qualifiedCount} qualified`
    : 'No leads yet';
  const responseQuality =
    overview?.avg_latency_ms != null
      ? overview.avg_latency_ms < 1000
        ? 'Lightning fast ⚡'
        : overview.avg_latency_ms < 2500
          ? 'Solid & steady'
          : 'Room to optimize'
      : 'Measuring...';
  const errorCount = overview?.total_errors ?? 0;
  const accent = isDark ? '#8da6ff' : '#2563EB';

  const pulses = useMemo(
    () => [
      {
        icon: '✨',
        accent,
        tag: greeting.toUpperCase(),
        line1: "You're building something real.",
        line2: 'Every message matters 💜',
      },
      {
        icon: '⚡',
        accent: isDark ? '#fbbf24' : '#d97706',
        tag: 'TODAY',
        line1: `${todayMessages.toLocaleString()} messages sent today`,
        line2: 'Keep the momentum going →',
      },
      {
        icon: '🔥',
        accent: '#f97316',
        tag: 'LIVE NOW',
        line1: `${overview?.open_conversations ?? 0} active conversations`,
        line2: `${handoffConvCount} currently with your team`,
      },
      {
        icon: '🎯',
        accent: '#22c55e',
        tag: 'PIPELINE',
        line1: `${overview?.total_leads ?? 0} leads in the funnel`,
        line2: `${handoffsToday} handed off today`,
      },
      {
        icon: '🚀',
        accent,
        tag: 'VELOCITY',
        line1: winRate,
        line2: responseQuality,
      },
      {
        icon: '🛡️',
        accent: '#84cc16',
        tag: 'HEALTH',
        line1:
          errorCount === 0
            ? 'Flawless — nothing slipping through'
            : `${errorCount} errors logged`,
        line2:
          errorCount === 0 ? 'System running clean ✅' : 'Monitoring closely',
      },
    ],
    [
      overview,
      todayMessages,
      handoffConvCount,
      handoffsToday,
      winRate,
      responseQuality,
      errorCount,
      greeting,
      isDark,
      accent,
    ],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setActiveIdx((i) => (i + 1) % pulses.length);
        setAnimKey((k) => k + 1);
        setIsExiting(false);
      }, 380);
    }, 3800);
    return () => clearInterval(interval);
  }, [pulses.length]);

  const p = pulses[activeIdx];

  const feedBg = isDark ? 'rgba(18,22,44,0.9)' : '#ffffff';
  const feedBorder = isDark ? t.cardBorder : 'rgba(15,23,42,0.08)';
  const feedShadow = isDark ? 'none' : t.cardShadow;

  return (
    <>
      <style>{`
        .pulse-feed {
          width: 290px;
          min-width: 290px;
          max-width: 290px;
          align-self: flex-start;
        }
        .pulse-feed .pulse-line1 {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.3;
          min-height: 34px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pulse-feed .pulse-line2 {
          font-size: 11px;
          line-height: 1.35;
          min-height: 15px;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-top: 2px;
        }
        @media (min-width: 768px) {
          .pulse-feed {
            align-self: flex-end;
          }
        }
        @media (max-width: 640px) {
          .pulse-feed {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div className='relative text-right pb-1 select-none pulse-feed'>
        <div className='flex items-center justify-end gap-1.5 mb-2.5'>
          {pulses.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIsExiting(true);
                setTimeout(() => {
                  setActiveIdx(i);
                  setAnimKey((k) => k + 1);
                  setIsExiting(false);
                }, 280);
              }}
              style={{
                width: i === activeIdx ? 18 : 5,
                height: 5,
                borderRadius: 9999,
                background: i === activeIdx ? p.accent : t.cardBorder,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all .4s cubic-bezier(.34,1.4,.64,1)',
                boxShadow: i === activeIdx ? `0 0 8px ${p.accent}` : 'none',
              }}
            />
          ))}
        </div>
        <div
          key={animKey}
          style={{
            background: feedBg,
            backdropFilter: isDark ? 'blur(18px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(18px)' : 'none',
            border: `1px solid ${isDark ? p.accent + '30' : 'rgba(15,23,42,0.08)'}`,
            borderRadius: 14,
            padding: '10px 14px',
            boxShadow: feedShadow,
            animation: isExiting
              ? 'pulse-exit .35s cubic-bezier(.4,0,1,1) forwards'
              : 'pulse-enter .45s cubic-bezier(.34,1.2,.64,1) both',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-60%',
              width: '50%',
              height: '100%',
              background:
                'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)',
              animation: 'feed-shimmer 2.6s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          <div className='flex items-start gap-3'>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                flexShrink: 0,
                background: `${p.accent}15`,
                border: `1px solid ${p.accent}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                animation:
                  'icon-bounce .5s cubic-bezier(.34,1.8,.64,1) .05s both',
              }}
            >
              {p.icon}
            </div>
            <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '.14em',
                  color: p.accent,
                  marginBottom: 3,
                  animation: 'tag-in .35s ease .08s both',
                }}
              >
                {p.tag}
              </div>
              <div
                className='pulse-line1'
                style={{
                  color: t.text,
                  animation: 'line-in .4s ease .12s both',
                }}
              >
                {p.line1}
              </div>
              <div
                className='pulse-line2'
                style={{
                  color: t.textSub,
                  animation: 'line-in .4s ease .2s both',
                }}
              >
                {p.line2}
              </div>
            </div>
          </div>
          <div
            style={{
              height: 2,
              background: isDark ? t.cardBorder : 'rgba(15,23,42,0.06)',
              borderRadius: 9999,
              marginTop: 10,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 9999,
                background: p.accent,
                animation: 'progress-drain 3.8s linear both',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
