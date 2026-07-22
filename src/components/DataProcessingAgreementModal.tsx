'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export type SocialChannel =
  | 'instagram'
  | 'facebook'
  | 'telegram'
  | 'youtube'
  | 'google'
  | 'google reviews'
  | 'website';

const PLATFORM_LABELS: Record<SocialChannel, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  telegram: 'Telegram',
  youtube: 'YouTube',
  google: 'Google Reviews',
  'google reviews': 'Google Reviews',
  website: 'Website Chat',
};

function getPlatformLabel(channel: SocialChannel): string {
  return PLATFORM_LABELS[channel] || channel;
}

type Props = {
  platform: SocialChannel;
  isDark: boolean;
  onAccepted: () => void;
  onClose: () => void;
};

export default function DataProcessingAgreementModal({
  platform,
  isDark,
  onAccepted,
  onClose,
}: Props) {
  const [accepted, setAccepted] = useState(false);
  const [privacyUrl, setPrivacyUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const platformLabel = getPlatformLabel(platform);

  async function handleAccept() {
    setError('');
    if (!accepted) {
      setError('Confirm the data-processing instructions to continue.');
      return;
    }
    try {
      setSaving(true);
      await apiFetch('/admin/processing-acceptance', {
        method: 'POST',
        auth: true,
        body: {
          accepted: true,
          privacy_notice_url: privacyUrl.trim() || null,
        },
      });
      onAccepted();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || `Could not enable ${platformLabel}.`);
    } finally {
      setSaving(false);
    }
  }

  const bg = isDark ? 'rgba(12,14,21,.97)' : '#ffffff';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSub = isDark ? 'rgba(226,232,240,.65)' : '#475569';
  const border = isDark ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.10)';

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        background: isDark ? 'rgba(0,0,0,.8)' : 'rgba(15,23,42,.45)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
          background: bg, borderRadius: 22,
          border: `1px solid ${border}`,
          padding: 28,
          boxShadow: '0 40px 90px rgba(0,0,0,.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 900, color: textPrimary, margin: '0 0 4px' }}>
              Customer data processing
            </h2>
            <p style={{ fontSize: 12, color: textSub, margin: 0 }}>{platformLabel}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%', border: `1px solid ${border}`,
              background: 'transparent', color: textSub, cursor: 'pointer', fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ marginTop: 16, fontSize: 13, lineHeight: 1.6, color: textSub }}>
          By enabling {platformLabel}, you instruct Lashvae to receive, store and
          process customer messages, comments and related account information on
          behalf of your business.
        </p>
        <p style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: textSub }}>
          Depending on the features you enable, processing may include AI-assisted
          replies, conversation classification, lead identification, sentiment
          analysis and business insights.
        </p>

        <div style={{
          marginTop: 14, padding: 14, borderRadius: 12, fontSize: 12.5, lineHeight: 1.6,
          background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(15,23,42,.03)', color: textSub,
        }}>
          Your business remains responsible for identifying an appropriate lawful
          basis and providing customers with the required privacy information.
        </div>

        <label style={{ display: 'block', marginTop: 18, fontSize: 12, fontWeight: 700, color: textPrimary }}>
          Business privacy notice URL
        </label>
        <input
          type="url"
          value={privacyUrl}
          onChange={(e) => setPrivacyUrl(e.target.value)}
          placeholder="https://yourbusiness.com/privacy"
          style={{
            marginTop: 8, width: '100%', boxSizing: 'border-box',
            borderRadius: 10, border: `1px solid ${border}`, padding: '10px 12px',
            fontSize: 13, background: isDark ? 'rgba(255,255,255,.04)' : '#fff', color: textPrimary,
          }}
        />

        <label style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{ marginTop: 3, width: 15, height: 15, flexShrink: 0 }}
          />
          <span style={{ fontSize: 12.5, lineHeight: 1.55, color: textSub }}>
            I confirm that my business instructs Lashvae to receive, store and
            process customer messages, comments and related account information
            on its behalf. My business is responsible for identifying an
            appropriate lawful basis and providing the required privacy
            information to its customers.
          </span>
        </label>

        <p style={{ marginTop: 10, fontSize: 11, color: textSub, opacity: 0.8 }}>
          By continuing, you also accept the Lashvae Data Processing Agreement
          and Privacy Terms.
        </p>

        {error && (
          <p style={{ marginTop: 12, fontSize: 12.5, color: '#dc2626' }}>{error}</p>
        )}

        <button
          onClick={handleAccept}
          disabled={!accepted || saving}
          style={{
            marginTop: 20, width: '100%', padding: '12px 0', borderRadius: 12,
            border: 'none', fontSize: 13, fontWeight: 800, color: '#fff',
            background: accepted ? '#111827' : (isDark ? 'rgba(255,255,255,.12)' : '#cbd5e1'),
            cursor: !accepted || saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : `Accept and continue`}
        </button>
      </div>
    </div>
  );
}