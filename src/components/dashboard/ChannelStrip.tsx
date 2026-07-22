'use client';

import {
  FacebookIcon,
  GoogleMapIcon,
  InstagramIcon,
  TelegramIcon,
  WhatsAppIcon,
  YoutubeIcon,
} from '@/components/Icons';
import type { Theme } from '@/lib/theme';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ChannelInfo = {
  id: number;
  platform: string;
  is_active: boolean;
  account_name?: string;
  display_name?: string;
  username?: string;
};

/* ── Brand config for every platform ── */
const PLATFORM_CFG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    emoji: string;
    comingSoon?: boolean;
  }
> = {
  instagram: {
    label: 'Instagram',
    // gradient: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    icon: (
      <div style={{ width: 40, height: 40 }}>
        <InstagramIcon />
      </div>
    ),
    emoji: '📸',
  },
  telegram: {
    label: 'Telegram',
    // gradient: "linear-gradient(135deg, #2AABEE, #229ED9)",
    icon: (
      <div style={{ width: 40, height: 40 }}>
        <TelegramIcon />
      </div>
    ),
    emoji: '✈️',
  },
  facebook: {
    label: 'Facebook',
    // gradient: "linear-gradient(135deg, #1877F2, #0a5dc2)",
    icon: (
      <div style={{ width: 40, height: 40 }}>
        <FacebookIcon />
      </div>
    ),
    emoji: '👍',
  },
  // whatsapp: {
  //   label: 'WhatsApp',
  //   // gradient: "linear-gradient(135deg, #25D366, #128C7E)",
  //   icon: (
  //     <div style={{ width: 40, height: 40 }}>
  //       <WhatsAppIcon />
  //     </div>
  //   ),
  //   emoji: '💬',
  //   comingSoon: true,
  // },
website: {
  label: 'Website',
  icon: (
    <div style={{ width: 40, height: 40 }}>
      <span
        style={{
          width: 40,
          height: 40,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #6366f1, #2563eb)',
          color: '#fff',
          fontSize: 22,
          boxShadow: '0 10px 24px rgba(37, 99, 235, 0.25)',
        }}
      >
        🌐
      </span>
    </div>
  ),
  emoji: '🌐',
},
  googlemaps: {
    label: 'Google Maps',

    icon: (
      <div style={{ width: 40, height: 40 }}>
        <GoogleMapIcon />
      </div>
    ),
    emoji: '📍',
    comingSoon: false,
  },
  youtube: {
    label: 'YouTube',

    icon: (
      <div style={{ width: 40, height: 40 }}>
        <YoutubeIcon />
      </div>
    ),
    emoji: '▶️',
    comingSoon: true,
  },
};

const PLATFORM_KEYS = [
  'instagram',
  'telegram',
  'facebook',
  // 'whatsapp',
  'website',
  'googlemaps',
  'youtube',
];

function lightCardShadow(): string {
  return [
    '0 0 0 1px rgba(15,23,42,0.07)',
    '0 2px 4px rgba(15,23,42,0.05)',
    '0 8px 24px rgba(15,23,42,0.08)',
  ].join(', ');
}

export function ChannelStrip({
  channels,
  todayMessages,
  t,
  isDark,
}: {
  channels: ChannelInfo[];
  todayMessages: number;
  t: Theme;
  isDark: boolean;
}) {
  const router = useRouter();
  const [hov, setHov] = useState<number | null>(null);

  const goToChannels = () => {
    router.push('/channels');
  };

  const byPlatform: Record<string, ChannelInfo | undefined> = {};
  channels.forEach((c) => {
    byPlatform[c.platform.toLowerCase()] = c;
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
      }}
    >
      {PLATFORM_KEYS.map((key, idx) => {
        const cfg = PLATFORM_CFG[key];
        const channel = byPlatform[key];
        const isActive = channel?.is_active ?? false;
        const isComingSoon = cfg.comingSoon && !channel;
        const isHov = hov === idx;

        const cardShadow = isHov
          ? isDark
            ? '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(141,166,255,0.2)'
            : '0 0 0 1px rgba(99,102,241,0.2), 0 8px 28px rgba(15,23,42,0.14), 0 24px 48px rgba(15,23,42,0.10)'
          : isDark
            ? '0 2px 12px rgba(0,0,0,0.3)'
            : lightCardShadow();

        return (
          <div
            key={key}
            onClick={goToChannels}
            onMouseEnter={() => setHov(idx)}
            onMouseLeave={() => setHov(null)}
            style={{
              borderRadius: 18,
              padding: '16px 14px 14px',
              background: isDark ? 'rgba(18,22,44,0.85)' : '#ffffff',
              border: `1px solid ${
                isActive
                  ? isDark
                    ? 'rgba(141,166,255,0.3)'
                    : 'rgba(99,102,241,0.2)'
                  : isDark
                    ? 'rgba(120,130,200,0.15)'
                    : 'rgba(15,23,42,0.08)'
              }`,
              backdropFilter: isDark ? 'blur(18px)' : 'none',
              WebkitBackdropFilter: isDark ? 'blur(18px)' : 'none',
              boxShadow: cardShadow,
              transition:
                'transform .2s cubic-bezier(.34,1.4,.64,1), box-shadow .2s',
              transform: isHov ? 'translateY(-3px)' : 'none',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                opacity: isActive ? 1 : 0.55,
                borderRadius: '18px 18px 0 0',
              }}
            />

            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '-.02em',
                boxShadow: `0 4px 12px ${isActive ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.15)'}`,
                opacity: isComingSoon ? 0.7 : 1,
                transition: 'transform .2s, opacity .2s',
                transform: isHov ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {cfg.icon}
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: isComingSoon ? t.textMuted : t.text,
                marginBottom: 3,
                letterSpacing: '-.01em',
              }}
            >
              {cfg.label}
            </div>

            {isActive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
                    display: 'inline-block',
                    flexShrink: 0,
                    animation: 'livePulse 2s ease-in-out infinite',
                  }}
                />
                <span
                  style={{ fontSize: 11, fontWeight: 600, color: '#10b981' }}
                >
                  Live
                  {channel?.username
                    ? ` · @${channel.username}`
                    : channel?.account_name
                      ? ` · ${channel.account_name}`
                      : ''}
                </span>
              </div>
            ) : isComingSoon ? (
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 10,
                  fontWeight: 700,
                  color: t.textMuted,
                  background: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(15,23,42,0.05)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)'}`,
                  borderRadius: 999,
                  padding: '2px 8px',
                  letterSpacing: '.04em',
                }}
              >
                Coming soon
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 10,
                  fontWeight: 700,
                  color: isDark ? '#8da6ff' : '#2563EB',
                  background: isDark
                    ? 'rgba(141,166,255,0.10)'
                    : 'rgba(37,99,235,0.08)',
                  border: `1px solid ${isDark ? 'rgba(141,166,255,0.2)' : 'rgba(37,99,235,0.18)'}`,
                  borderRadius: 999,
                  padding: '2px 8px',
                  letterSpacing: '.04em',
                  cursor: 'pointer',
                }}
              >
                + Connect now
              </span>
            )}

            {isActive && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 10, color: t.textMuted }}>
                    Msgs today
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: isDark ? '#8da6ff' : '#2563EB',
                    }}
                  >
                    {todayMessages.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes livePulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
          50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0.05); }
        }
      `}</style>
    </div>
  );
}
