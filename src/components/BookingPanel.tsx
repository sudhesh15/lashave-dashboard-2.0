import { useMemo, useState, useEffect, ReactElement } from 'react';
import { apiFetch } from '@/lib/api';

/* ───────────────────────── types ───────────────────────── */

type Booking = {
  id: string;
  customer_name?: string;
  start_time: string;
  end_time: string;
  channel?: string;
  profile_pic_url?: string;
  status: 'confirmed' | 'rescheduled' | 'cancelled' | string;
};

type SettingBooking = {
    booking_enabled: boolean,
  booking_slot_duration_minutes: string,
  booking_buffer_minutes:string,
  booking_timezone:string,
}

type Props = {
  t: {
    text: string;
    textSub: string;
    textMuted: string;
  };
  isDark: boolean;
};

type LogoPlatformCfg = {
  logoSrc: string | null;
  label: string;
  color: string;
  bg: string;
  border: string;
  filter: string;
};

const IST_OFFSET_MINUTES = 330;

function getTodayYmdIST() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Treat "2026-06-24T10:00:00+01:00" as 2026-06-24 10:00 IST.
// This intentionally ignores the +01:00 part.
function getISTWallTimeMs(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) return NaN;

  const [, yyyy, mm, dd, hh, min, ss = '0'] = match;

  const utcMs = Date.UTC(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
    Number(ss)
  );

  return utcMs - IST_OFFSET_MINUTES * 60 * 1000;
}

const isTodayIST = (value: string) => {
  return value.slice(0, 10) === getTodayYmdIST();
};

const isFutureIST = (value: string, now: number) => {
  const targetMs = getISTWallTimeMs(value);
  return Number.isFinite(targetMs) && targetMs > now;
};

const isPastOrCompletedIST = (value: string, now: number) => {
  const targetMs = getISTWallTimeMs(value);
  return Number.isFinite(targetMs) && targetMs <= now;
};
/* ───────────────────────── avatar fallback ───────────────────────── */
/* When there's no profile picture, show a colored initial instead of a
   blank gradient circle. Color is derived from the name so the same
   customer always gets the same color. */

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#60a5fa,#a78bfa,#34d399)',
  'linear-gradient(135deg,#f472b6,#fb923c)',
  'linear-gradient(135deg,#34d399,#22d3ee)',
  'linear-gradient(135deg,#a78bfa,#f472b6)',
  'linear-gradient(135deg,#fbbf24,#f87171)',
  'linear-gradient(135deg,#38bdf8,#818cf8)',
];

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const getAvatarGradient = (name?: string) =>
  name ? AVATAR_GRADIENTS[hashString(name) % AVATAR_GRADIENTS.length] : AVATAR_GRADIENTS[0];

const getInitial = (name?: string) => {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
};

/* ───────────────────────── platform glyphs (avatar corner badge) ───────────────────────── */
/* Small inline glyphs so the panel doesn't depend on external icon
   assets or extra packages. Each is rendered inside a colored badge. */

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="9" height="9" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="#fff" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.6" stroke="#fff" strokeWidth="2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="#fff" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="9" height="9" fill="none">
      <path
        d="M14.8 4H13c-2.2 0-3.8 1.6-3.8 3.8V10H7v3h2.2v7h3v-7h2.3l.5-3h-2.8V8.2c0-.7.4-1.1 1.1-1.1h1.5V4z"
        fill="#fff"
      />
    </svg>
  );
}

function WhatsappGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="9" height="9" fill="none">
      <path
        d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.5A9 9 0 1 0 12 3z"
        fill="#fff"
        opacity="0.18"
      />
      <path
        d="M8.8 7.6c.3-.6.5-.6.9-.6h.4c.3 0 .5.1.6.4l.7 1.6c.1.3.1.5-.1.7l-.5.6c-.2.2-.2.4-.1.6.5.9 1.4 1.8 2.3 2.3.2.1.4.1.6-.1l.6-.5c.2-.2.4-.2.7-.1l1.6.7c.3.1.4.3.4.6v.4c0 .4 0 .7-.6 1-1 .5-2.4.4-4-.6-1.3-.8-2.7-2.2-3.5-3.5-1-1.6-1.1-3.1-.6-4z"
        fill="#fff"
      />
    </svg>
  );
}

function TelegramGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="9" height="9" fill="none">
      <path
        d="M21 4 2.5 11.2c-.7.3-.7 1.3.1 1.5l4.4 1.4 1.7 5.3c.2.7 1.1.9 1.6.3l2.4-2.6 4.6 3.4c.6.4 1.4.1 1.6-.6l3-15c.1-.7-.6-1.3-1.3-.9z"
        fill="#fff"
      />
      <path d="M8.5 14.1 17 8.3l-7.1 7.3-.2 2.6z" fill="#27A7E5" opacity="0.35" />
    </svg>
  );
}

function YoutubeGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="9" height="9" fill="none">
      <path d="M10 9.3v5.4l5-2.7z" fill="#fff" />
    </svg>
  );
}

function ChatGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="9" height="9" fill="none">
      <path d="M4 5h16v10H8l-4 4V5z" fill="#fff" opacity="0.9" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path
        d="M5 5l14 14M19 5 5 19"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const PLATFORM_CFG: Record<
  string,
  { label: string; bg: string; Glyph: () => ReactElement }
> = {
  instagram: {
    label: 'Instagram',
    bg: 'linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4)',
    Glyph: InstagramGlyph,
  },
  whatsapp: { label: 'WhatsApp', bg: '#25D366', Glyph: WhatsappGlyph },
  telegram: { label: 'Telegram', bg: '#27A7E5', Glyph: TelegramGlyph },
  facebook: { label: 'Facebook', bg: '#1877F2', Glyph: FacebookGlyph },
  youtube: { label: 'YouTube', bg: '#FF0000', Glyph: YoutubeGlyph },
};

const DEFAULT_PLATFORM_CFG = { label: 'Chat', bg: '#64748b', Glyph: ChatGlyph };

// used for the avatar corner badge — unchanged glyph style
const getPlatformCfg = (channel?: string) =>
  (channel && PLATFORM_CFG[channel.toLowerCase()]) || DEFAULT_PLATFORM_CFG;

/* ───────────────────────── logo-image platform config (username icon) ───────────────────────── */
/* Same approach as ChannelFilter's PlatformIcon — real brand logo images,
   used only for the icon shown beside the username. */

const LOGO_PLATFORM_CFG: Record<
  string,
  { logoSrc: string; label: string; color: string; bg: string; border: string; filter: string }
> = {
  instagram: {
    logoSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg',
    label: 'Instagram',
    color: '#E879A0',
    bg: 'rgba(232,121,160,.14)',
    border: 'rgba(232,121,160,.38)',
    filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(304deg) brightness(95%) contrast(95%)',
  },
  youtube: {
    logoSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg',
    label: 'YouTube',
    color: '#FF0000',
    bg: 'rgba(255,0,0,.14)',
    border: 'rgba(255,0,0,.34)',
    filter: 'invert(11%) sepia(99%) saturate(7481%) hue-rotate(1deg) brightness(102%) contrast(111%)',
  },
  whatsapp: {
    logoSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg',
    label: 'WhatsApp',
    color: '#25D366',
    bg: 'rgba(37,211,102,.14)',
    border: 'rgba(37,211,102,.34)',
    filter: 'invert(64%) sepia(52%) saturate(456%) hue-rotate(95deg) brightness(96%) contrast(92%)',
  },
  telegram: {
    logoSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/telegram.svg',
    label: 'Telegram',
    color: '#229ED9',
    bg: 'rgba(34,158,217,.14)',
    border: 'rgba(34,158,217,.34)',
    filter: 'invert(44%) sepia(99%) saturate(400%) hue-rotate(165deg) brightness(95%) contrast(92%)',
  },
  facebook: {
    logoSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/facebook.svg',
    label: 'Facebook',
    color: '#1877F2',
    bg: 'rgba(24,119,242,.14)',
    border: 'rgba(24,119,242,.34)',
    filter: 'invert(29%) sepia(93%) saturate(1716%) hue-rotate(210deg) brightness(101%) contrast(96%)',
  },
};

const DEFAULT_LOGO_CFG = {
  logoSrc: null as string | null,
  label: 'Channel',
  color: '#64748B',
  bg: 'rgba(100,116,139,.12)',
  border: 'rgba(100,116,139,.24)',
  filter: 'invert(40%) sepia(8%) saturate(500%) hue-rotate(180deg) brightness(95%) contrast(90%)',
};

function getLogoPlatformCfg(channel?: string): LogoPlatformCfg {
  return (
    (channel ? LOGO_PLATFORM_CFG[channel.toLowerCase()] : undefined) ?? {
      ...DEFAULT_LOGO_CFG,
      label: channel || 'Channel',
    }
  );
}

function PlatformIcon({
  cfg,
  size = 15,
}: {
  cfg: ReturnType<typeof getLogoPlatformCfg>;
  size?: number;
}) {
  if (!cfg?.logoSrc) return <span style={{ fontSize: size }}>📡</span>;

  return (
    <span
      style={{
        width: size + 6,
        height: size + 6,
        borderRadius: 5,
        background: cfg.bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src={cfg.logoSrc}
        alt={cfg.label}
        style={{
          width: size,
          height: size,
          filter: cfg.filter,
        }}
      />
    </span>
  );
}

/* ───────────────────────── countdown badge ───────────────────────── */

function formatCountdown(target: string, now: number) {
  const targetTime = getISTWallTimeMs(target);

  if (!Number.isFinite(targetTime)) {
    console.log('Invalid target date:', target);
    return null;
  }

  const diff = targetTime - now;

  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

function CountdownBadge({ target, now, isDark }: { target: string; now: number; isDark: boolean }) {
  const value = formatCountdown(target, now);
  if (!value) return null;

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        padding: '4px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
        color: isDark ? '#fbbf24' : '#b45309',
        background: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.15)',
        letterSpacing: '.02em',
      }}
    >
      ⏱ {value}
    </span>
  );
}

/* ───────────────────────── close button ───────────────────────── */
/* Bigger hit-area, a visible border so it reads as a real control, and
   a hover state that nudges it red so "close" is unambiguous. */

function CloseButton({
  isDark,
  textSub,
  onClose,
}: {
  isDark: boolean;
  textSub: string;
  onClose: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClose}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Close bookings panel"
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${
          hover
            ? 'rgba(248,113,113,0.45)'
            : isDark
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(15,23,42,0.1)'
        }`,
        background: hover
          ? 'rgba(248,113,113,0.16)'
          : isDark
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(15,23,42,0.04)',
        color: hover ? '#f87171' : textSub,
        cursor: 'pointer',
        transition: 'background .15s ease, color .15s ease, border-color .15s ease, transform .15s ease',
        transform: hover ? 'scale(1.06)' : 'scale(1)',
      }}
    >
      <CloseGlyph />
    </button>
  );
}

/* ───────────────────────── component ───────────────────────── */

export default function BookingPanel({ t, isDark }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [isEnabled,setIsEnabled] = useState<Boolean>();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<{ items: Booking[] }>(
          '/admin/bookings',
          { auth: true },
        );

        setBookings(res.items || []);
      } catch (err) {
        console.error('Booking fetch failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async() => {
      try {
          const res = await apiFetch<SettingBooking>(
          '/admin/booking/settings',
          { auth: true },
        );
        setIsEnabled(res.booking_enabled)
      } catch (err) {
        console.error('Booking fetch failed:', err);
      }
    })()
  },[])

  // Drives the live countdown and lets bookings drop out of "Today"
  // automatically once their start time has passed.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ───── helpers ───── */

const formatTime = (value: string) => {
  const timePart = value.slice(11, 16); // "11:50"
  const [h, m] = timePart.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

  const formatSlot = (start: string, end?: string) =>
    end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);

  const formatDateTime = (value: string) =>
    `${new Date(value).toLocaleDateString()} • ${new Date(
      value,
    ).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'rescheduled':
        return '#f59e0b';
      case 'cancelled':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  /* ───── derived state ───── */

const todayBookings = useMemo(
  () =>
    bookings.filter(
      (b) =>
        b.status !== 'cancelled' &&
        isTodayIST(b.start_time) &&
        isFutureIST(b.start_time, now),
    ),
  [bookings, now],
);

const upcomingBookings = useMemo(
  () =>
    bookings
      .filter((b) => isFutureIST(b.start_time, now) && b.status !== 'cancelled')
      .slice(0, 6),
  [bookings, now],
);

  const todayCount = todayBookings.length;

  /* ───── UI ───── */

  if(!isEnabled){
    return <></>
  }

  // Collapsed state: a small re-openable chip instead of the full panel.
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 14px',
          borderRadius: 14,
          border: `1px solid ${
            isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
          }`,
          background: isDark ? 'rgba(17,24,39,0.65)' : 'rgba(255,255,255,0.85)',
          color: t.text,
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Bookings
        {todayCount > 0 && (
          <span
            style={{
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: 999,
              background: '#ec4899',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {todayCount}
          </span>
        )}
      </button>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 18,
          background: isDark
            ? 'rgba(17,24,39,0.65)'
            : 'rgba(255,255,255,0.85)',
          color: t.textSub,
        }}
      >
        Loading bookings...
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 16,
        background: isDark
          ? 'rgba(17,24,39,0.65)'
          : 'rgba(255,255,255,0.85)',
        border: `1px solid ${
          isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
        }`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Thin, theme-aware scrollbar for the today list so it stays tidy
          whether there are 2 bookings or 200. */}
      <style>{`
        .bp-today-scroll::-webkit-scrollbar { width: 6px; }
        .bp-today-scroll::-webkit-scrollbar-track { background: transparent; }
        .bp-today-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.16)'};
          border-radius: 999px;
        }
        .bp-today-scroll::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.28)'};
        }
        .bp-today-scroll { scrollbar-width: thin; }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p
            style={{
              fontSize: 10,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: t.textSub,
              fontWeight: 700,
            }}
          >
            Bookings
          </p>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: t.text }}>
            Today’s Schedule
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {todayCount > 0 && (
            <div
              style={{
                position: 'relative',
                width: 30,
                height: 30,
                borderRadius: 999,
                background:
                  'radial-gradient(circle at 30% 30%, #ff4d6d, #ec4899, #f97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {todayCount}

              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 999,
                  animation: 'pulse-ring 1.5s infinite',
                  border: '12px solid rgba(255,255,255,0.4)',
                }}
              />
            </div>
          )}

          <CloseButton isDark={isDark} textSub={t.textSub} onClose={() => setIsOpen(false)} />
        </div>
      </div>

      {/* TODAY */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: t.textSub, marginBottom: 6 }}>
          Today
        </p>

        {todayCount === 0 ? (
          <div style={{ fontSize: 13, color: t.textMuted }}>
            No bookings today
          </div>
        ) : (
          <div
            className="bp-today-scroll"
            onClick={() => window.location.href = "/availability"}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxHeight: 190,
              overflowY: 'auto',
            }}
          >
            {todayBookings.map((b) => {
              const platform = getPlatformCfg(b.channel);
              const logoCfg = getLogoPlatformCfg(b.channel);

              return (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(15,23,42,0.03)',
                    cursor: 'pointer',
                  }}
                >
                  {/* LEFT */}
                  <div style={{ display: 'flex', gap: 10, minWidth: 0, flexShrink: 0 }}>
                    <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
                      {b.profile_pic_url ? (
                        <img
                          src={b.profile_pic_url}
                          alt=""
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            background: getAvatarGradient(b.customer_name),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {getInitial(b.customer_name)}
                        </div>
                      )}

                      {/* channel logo badge — unchanged, still on avatar corner */}
                      <div
                        title={platform.label}
                        style={{
                          position: 'absolute',
                          bottom: -3,
                          right: -3,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          background: platform.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${isDark ? '#111827' : '#ffffff'}`,
                        }}
                      >
                        <platform.Glyph />
                      </div>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: t.text,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {b.customer_name ?? 'Customer'}
                        </p>

                        {/* CHANNEL LOGO — real brand logo, beside the username */}
                        <PlatformIcon cfg={logoCfg} size={13} />
                      </div>

                      <p style={{ fontSize: 11, color: t.textSub, whiteSpace: 'nowrap' }}>
                        {formatSlot(b.start_time, b.end_time)}
                      </p>
                    </div>
                  </div>

                  {/* SLOT — sits in the actual middle of the row */}
                  <div
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      color: t.textSub,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatSlot(b.start_time, b.end_time)}
                  </div>

                  {/* RIGHT: timer + status, pinned to the edge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <CountdownBadge target={b.start_time} now={now} isDark={isDark} />

                    <span
                      style={{
                        fontSize: 10,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: statusColor(b.status),
                        color: '#fff',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPCOMING */}
      <div>
        <p style={{ fontSize: 12, color: t.textSub, marginBottom: 6 }}>
          Upcoming
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {upcomingBookings.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: t.textSub,
              }}
            >
              <span>{b.customer_name ?? 'Customer'}</span>
              <span>{formatDateTime(b.start_time)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}