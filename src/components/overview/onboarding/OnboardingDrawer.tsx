'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Theme } from '@/lib/theme';
import type { BizType } from '../types';
import { BIZ_OPTIONS, BizIcon, BIZ_QUESTIONS } from './data';
import type { OnboardingRoute, OnboardingRouteResult } from './types';
import { OnboardingSequentialStepper } from './OnboardingSequentialStepper';

export function OnboardingDrawer({
  onClose,
  onRunScrape,
  onRunUpload,
  onRunQuestions,
  onSetBizType,
  onGuessBizType,
  onCheckDupUrl,
  onCheckDupFile,
  onFinish,
  t,
  isDark,
}: {
  onClose: () => void;
  onRunScrape: (
    url: string,
  ) => Promise<{ analysisId: number | string; url: string }>;
  onRunUpload: (
    file: File,
    docCategory: string,
  ) => Promise<{
    documentId: number | string;
    jobId?: number | string | null;
    filename: string;
  }>;
  onRunQuestions: (
    answers: Record<number, string>,
    bizType: BizType,
    about: string,
  ) => Promise<{ addedCount: number }>;
  onSetBizType: (bizType: BizType) => Promise<void>;
  onGuessBizType?: () => Promise<BizType | null>;
  onCheckDupUrl?: (url: string) => Promise<boolean>;
  onCheckDupFile?: (filename: string) => Promise<boolean>;
  onFinish: (payload: {
    coachTab: 'manual' | 'catalogue' | 'website' | 'saved';
    pendingScrape?: { analysisId: number | string; url: string };
    pendingUpload?: {
      documentId: number | string;
      jobId?: number | string | null;
      filename: string;
    };
  }) => void;
  t: Theme;
  isDark: boolean;
}) {
  const accent = isDark ? '#8da6ff' : '#2563EB';
  const accentGradient = isDark
    ? 'linear-gradient(135deg, #8da6ff, #a8bfff)'
    : 'linear-gradient(135deg, #2563EB, #06B6D4)';
  const modalBg = isDark ? 'rgba(9,13,31,0.97)' : '#ffffff';
  const modalBorder = isDark ? 'rgba(141,166,255,0.18)' : 'rgba(15,23,42,0.08)';
  const modalShadow = isDark ? '0 40px 80px rgba(0,0,0,.6)' : t.cardShadow;

  type Phase = 'routes' | 'inputs' | 'running' | 'summary';
  const [phase, setPhase] = useState<Phase>('routes');
  const [routes, setRoutes] = useState<OnboardingRoute[]>([]);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState('');
  const [bizType, setBizType] = useState<BizType | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [aboutBusiness, setAboutBusiness] = useState('');

  const [dupUrlWarn, setDupUrlWarn] = useState(false);
  const [dupUrlChecking, setDupUrlChecking] = useState(false);
  const [dupFileWarn, setDupFileWarn] = useState(false);
  const [dupFileChecking, setDupFileChecking] = useState(false);

  // Debounced dedup check on URL
  useEffect(() => {
    if (!onCheckDupUrl) return;
    const u = scrapeUrl.trim();
    if (!u) {
      setDupUrlWarn(false);
      return;
    }
    setDupUrlChecking(true);
    const timer = setTimeout(async () => {
      const dup = await onCheckDupUrl(u);
      setDupUrlWarn(dup);
      setDupUrlChecking(false);
    }, 500);
    return () => {
      clearTimeout(timer);
      setDupUrlChecking(false);
    };
  }, [scrapeUrl, onCheckDupUrl]);

  // Dedup check on file pick
  useEffect(() => {
    if (!onCheckDupFile || !uploadFile) {
      setDupFileWarn(false);
      return;
    }
    let cancelled = false;
    setDupFileChecking(true);
    (async () => {
      const dup = await onCheckDupFile(uploadFile.name);
      if (!cancelled) {
        setDupFileWarn(dup);
        setDupFileChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uploadFile, onCheckDupFile]);

  function toggleRoute(r: OnboardingRoute) {
    setRoutes((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  }

  type InputStep = 'scrape' | 'upload' | 'biz-type' | 'questions' | 'about';
  const inputSteps: InputStep[] = useMemo(() => {
    const s: InputStep[] = [];
    if (routes.includes('scrape')) s.push('scrape');
    if (routes.includes('upload')) s.push('upload');
    if (routes.includes('questions')) s.push('biz-type', 'questions', 'about');
    return s;
  }, [routes]);
  const [inputIndex, setInputIndex] = useState(0);
  const currentInputStep = inputSteps[inputIndex] ?? null;

  useEffect(() => {
    if (phase === 'inputs') setInputIndex(0);
  }, [phase]);

  const [qIndex, setQIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const bizQuestions = bizType ? BIZ_QUESTIONS[bizType] : [];
  const currentQ = bizQuestions[qIndex];

  function commitAnswer(newIdx: number) {
    const upd = { ...answers };
    if (currentAnswer.trim()) upd[qIndex] = currentAnswer.trim();
    else delete upd[qIndex];
    setAnswers(upd);
    setQIndex(newIdx);
    setCurrentAnswer(upd[newIdx] || '');
  }

  function finishQuestions() {
    const upd = { ...answers };
    if (currentAnswer.trim()) upd[qIndex] = currentAnswer.trim();
    else delete upd[qIndex];
    setAnswers(upd);
    setInputIndex((i) => i + 1);
  }

  const [results, setResults] = useState<OnboardingRouteResult[]>([]);
  const [currentRoute, setCurrentRoute] = useState<OnboardingRoute | null>(
    null,
  );
  const [pendingScrape, setPendingScrape] = useState<{
    analysisId: number | string;
    url: string;
  } | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{
    documentId: number | string;
    jobId?: number | string | null;
    filename: string;
  } | null>(null);

  async function runAll() {
    setPhase('running');
    setResults([]);
    setPendingScrape(null);
    setPendingUpload(null);

    for (const r of routes) {
      setCurrentRoute(r);
      try {
        let count = 0;
        if (r === 'scrape') {
          const res = await onRunScrape(scrapeUrl.trim());
          setPendingScrape(res);
          // Draft count is unknown at kickoff — reported on FAQ page instead.
          count = 0;
        } else if (r === 'upload') {
          if (!uploadFile) throw new Error('No file selected');
          const res = await onRunUpload(uploadFile, docCategory);
          setPendingUpload(res);
          count = 0;
        } else if (r === 'questions') {
          if (!bizType) throw new Error('Missing business type');
          const res = await onRunQuestions(
            answers,
            bizType,
            aboutBusiness.trim(),
          );
          count = res.addedCount;
        }
        setResults((prev) => [...prev, { route: r, status: 'done', count }]);
      } catch (e: any) {
        setResults((prev) => [
          ...prev,
          { route: r, status: 'failed', message: e?.message || 'Failed' },
        ]);
      }
    }
    setCurrentRoute(null);
    setPhase('summary');
  }

  const [guessedBiz, setGuessedBiz] = useState<BizType | null>(null);
  const [finalBiz, setFinalBiz] = useState<BizType | null>(bizType);
  const [savingBiz, setSavingBiz] = useState(false);
  const bizAlreadyAsked = routes.includes('questions');

  useEffect(() => {
    if (phase !== 'summary') return;
    if (bizAlreadyAsked) return;
    if (!onGuessBizType) return;
    let cancelled = false;
    (async () => {
      try {
        const guess = await onGuessBizType();
        if (!cancelled && guess) {
          setGuessedBiz(guess);
          setFinalBiz(guess);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, bizAlreadyAsked, onGuessBizType]);

  async function commitBizAndFinish() {
    if (finalBiz && finalBiz !== bizType) {
      setSavingBiz(true);
      try {
        await onSetBizType(finalBiz);
      } finally {
        setSavingBiz(false);
      }
    }
    // Prioritise coaching whichever tab has activity waiting for the user.
    const coachTab: 'manual' | 'catalogue' | 'website' | 'saved' = pendingScrape
      ? 'website'
      : pendingUpload
        ? 'catalogue'
        : results.find((r) => r.route === 'questions' && r.status === 'done')
          ? 'manual'
          : 'manual';
    onFinish({
      coachTab,
      pendingScrape: pendingScrape ?? undefined,
      pendingUpload: pendingUpload ?? undefined,
    });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'running') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, phase]);

  const shell = (children: React.ReactNode, maxWidth = 640) => (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && phase !== 'running') onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: isDark ? 'rgba(0,0,0,.65)' : 'rgba(15,23,42,.35)',
      }}
    >
      <style>{`
        @keyframes od-slide-up { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes od-spin { to { transform: rotate(360deg); } }
      `}</style>
      <div
        style={{
          maxWidth,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: modalBg,
          border: `1px solid ${modalBorder}`,
          borderRadius: 20,
          padding: 26,
          boxShadow: modalShadow,
          animation: 'od-slide-up .35s cubic-bezier(.34,1.2,.64,1) both',
        }}
      >
        {children}
      </div>
    </div>
  );

  /* ============ PHASE 1: routes ============ */
  if (phase === 'routes') {
    const routeDefs: {
      id: OnboardingRoute;
      icon: string;
      title: string;
      detail: string;
      duration: string;
      tag?: string;
    }[] = [
      {
        id: 'scrape',
        icon: '🌐',
        title: 'Scrape my website',
        detail:
          'We visit your site, read the pages, and turn them into draft Q&As.',
        duration: '~30 sec',
        tag: 'fastest',
      },
      {
        id: 'upload',
        icon: '📄',
        title: 'Upload a document',
        detail: 'Menu, price list, brochure — we extract the entries for you.',
        duration: '~1 min',
      },
      {
        id: 'questions',
        icon: '✍️',
        title: 'Answer a few questions',
        detail:
          'We ask 8 quick questions about your business. No website needed.',
        duration: '~3 min',
      },
    ];
    return shell(
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 22,
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: isDark
                  ? 'rgba(141,166,255,0.12)'
                  : 'rgba(37,99,235,0.08)',
                border: `1px solid ${isDark ? 'rgba(141,166,255,0.25)' : 'rgba(37,99,235,0.2)'}`,
                borderRadius: 999,
                padding: '4px 12px',
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: accent,
                }}
              >
                Train your AI
              </span>
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: t.text,
                letterSpacing: '-.5px',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              How would you like to train your AI?
            </h2>
            <p
              style={{
                fontSize: 13,
                color: t.textSub,
                margin: '6px 0 0',
                lineHeight: 1.55,
              }}
            >
              Pick one or more. We&apos;ll run them in the order you picked.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: t.textMuted,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
          }}
        >
          {routeDefs.map((r) => {
            const selected = routes.includes(r.id);
            const order = selected ? routes.indexOf(r.id) + 1 : null;
            return (
              <button
                key={r.id}
                onClick={() => toggleRoute(r.id)}
                style={{
                  position: 'relative',
                  textAlign: 'left',
                  borderRadius: 14,
                  padding: 18,
                  cursor: 'pointer',
                  border: `1.5px solid ${selected ? accent : isDark ? 'rgba(120,130,180,0.18)' : 'rgba(15,23,42,0.08)'}`,
                  background: selected
                    ? isDark
                      ? 'rgba(141,166,255,0.10)'
                      : 'rgba(59,130,246,0.06)'
                    : isDark
                      ? 'rgba(18,22,44,0.7)'
                      : '#ffffff',
                  transition:
                    'border-color .18s, background .18s, transform .18s',
                  transform: selected ? 'translateY(-1px)' : 'none',
                }}
              >
                {order !== null && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      minWidth: 22,
                      height: 22,
                      borderRadius: 999,
                      padding: '0 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: accent,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {order}
                  </span>
                )}
                <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: t.text,
                    marginBottom: 4,
                  }}
                >
                  {r.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: t.textSub,
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                >
                  {r.detail}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                      color: t.textMuted,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(15,23,42,0.04)',
                    }}
                  >
                    {r.duration}
                  </span>
                  {r.tag && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '.05em',
                        textTransform: 'uppercase',
                        color: accent,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: isDark
                          ? 'rgba(141,166,255,0.14)'
                          : 'rgba(59,130,246,0.08)',
                      }}
                    >
                      {r.tag}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={onClose}
            style={{
              padding: '11px 16px',
              borderRadius: 10,
              background: 'transparent',
              border: `1px solid ${isDark ? 'rgba(141,166,255,0.16)' : 'rgba(15,23,42,0.08)'}`,
              color: t.textSub,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
          <button
            disabled={routes.length === 0}
            onClick={() => setPhase('inputs')}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 10,
              background:
                routes.length > 0
                  ? accentGradient
                  : isDark
                    ? 'rgba(255,255,255,.05)'
                    : 'rgba(15,23,42,.05)',
              border:
                routes.length > 0
                  ? `1px solid ${isDark ? 'rgba(141,166,255,0.4)' : 'rgba(37,99,235,0.35)'}`
                  : `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,0.08)'}`,
              color: routes.length > 0 ? '#fff' : t.textMuted,
              fontSize: 14,
              fontWeight: 700,
              cursor: routes.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow:
                routes.length > 0 && !isDark
                  ? '0 14px 30px rgba(37,99,235,0.22)'
                  : 'none',
            }}
          >
            {routes.length === 0
              ? 'Select at least one to continue'
              : routes.length === 1
                ? 'Continue →'
                : `Continue with ${routes.length} tasks →`}
          </button>
        </div>
      </>,
    );
  }

  /* ============ PHASE 2: inputs ============ */
  if (phase === 'inputs' && currentInputStep) {
    const progressPct = ((inputIndex + 1) / inputSteps.length) * 100;
    const stepTitleMap: Record<InputStep, string> = {
      'scrape': 'Which website should we scrape?',
      'upload': 'Which document should we read?',
      'biz-type': 'What type of business are you?',
      'questions': `Question ${qIndex + 1} of ${bizQuestions.length}`,
      'about': 'Anything else your AI should know?',
    };
    const canAdvance = (() => {
      if (currentInputStep === 'scrape') return scrapeUrl.trim().length > 0;
      if (currentInputStep === 'upload') return uploadFile !== null;
      if (currentInputStep === 'biz-type') return bizType !== null;
      if (currentInputStep === 'questions') return true;
      if (currentInputStep === 'about') return true;
      return false;
    })();

    function goBack() {
      if (currentInputStep === 'questions' && qIndex > 0) {
        commitAnswer(qIndex - 1);
        return;
      }
      if (inputIndex > 0) setInputIndex((i) => i - 1);
      else setPhase('routes');
    }
    function goNext() {
      if (currentInputStep === 'questions') {
        if (qIndex < bizQuestions.length - 1) commitAnswer(qIndex + 1);
        else finishQuestions();
        return;
      }
      if (inputIndex < inputSteps.length - 1) setInputIndex((i) => i + 1);
      else runAll();
    }

    return shell(
      <>
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: t.textMuted,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}
            >
              Step {inputIndex + 1} of {inputSteps.length}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                color: t.textMuted,
                cursor: 'pointer',
                padding: 4,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              height: 3,
              background: isDark
                ? 'rgba(141,166,255,0.08)'
                : 'rgba(37,99,235,0.08)',
              borderRadius: 999,
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: accentGradient,
                transition: 'width .4s cubic-bezier(.34,1.2,.64,1)',
              }}
            />
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: t.text,
              margin: 0,
              letterSpacing: '-.3px',
            }}
          >
            {stepTitleMap[currentInputStep]}
          </h2>
        </div>

        {currentInputStep === 'scrape' && (
          <div>
            <p
              style={{
                fontSize: 13,
                color: t.textSub,
                margin: '0 0 12px',
                lineHeight: 1.5,
              }}
            >
              We&apos;ll visit the pages, read the useful content, and turn it
              into draft Q&amp;As you can review.
            </p>
            <input
              autoFocus
              type='url'
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder='https://your-site.com'
              style={{
                width: '100%',
                borderRadius: 10,
                border: `1px solid ${dupUrlWarn ? '#d97706' : isDark ? 'rgba(141,166,255,0.18)' : 'rgba(37,99,235,0.15)'}`,
                background: isDark ? 'rgba(30,36,66,0.7)' : '#fff',
                padding: '12px 14px',
                fontSize: 14,
                color: t.text,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {dupUrlChecking && (
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>
                Checking…
              </div>
            )}
            {dupUrlWarn && !dupUrlChecking && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#b45309',
                  background: isDark ? 'rgba(217,119,6,0.10)' : '#fef3c7',
                  border: '1px solid rgba(217,119,6,0.25)',
                  lineHeight: 1.5,
                }}
              >
                It looks like this site has already been scraped. Running it
                again will create duplicate drafts.
              </div>
            )}
          </div>
        )}

        {currentInputStep === 'upload' && (
          <div>
            <p
              style={{
                fontSize: 13,
                color: t.textSub,
                margin: '0 0 12px',
                lineHeight: 1.5,
              }}
            >
              PDFs, price lists, menus, brochures. We&apos;ll extract the
              entries and let you review before they go live.
            </p>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
                borderRadius: 12,
                border: `2px dashed ${dupFileWarn ? '#d97706' : isDark ? 'rgba(141,166,255,0.25)' : 'rgba(37,99,235,0.2)'}`,
                background: isDark
                  ? 'rgba(141,166,255,0.04)'
                  : 'rgba(59,130,246,0.03)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                {uploadFile ? uploadFile.name : 'Click to choose a file'}
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
                {uploadFile
                  ? `${Math.round(uploadFile.size / 1024)} KB`
                  : 'PDF, DOCX, TXT accepted'}
              </div>
              <input
                type='file'
                accept='.pdf,.doc,.docx,.txt,.md'
                onChange={(e) => {
                  setUploadFile(e.target.files?.[0] ?? null);
                  setDocCategory('');
                }}
                style={{ display: 'none' }}
              />
            </label>

            {dupFileChecking && (
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>
                Checking…
              </div>
            )}
            {dupFileWarn && !dupFileChecking && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#b45309',
                  background: isDark ? 'rgba(217,119,6,0.10)' : '#fef3c7',
                  border: '1px solid rgba(217,119,6,0.25)',
                  lineHeight: 1.5,
                }}
              >
                A file with this name has already been uploaded. Continuing will
                create a duplicate document.
              </div>
            )}

            {uploadFile && (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  marginTop: 14,
                  fontSize: 12,
                  color: t.textSub,
                }}
              >
                What kind of document is this?
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: `1px solid ${isDark ? 'rgba(141,166,255,0.18)' : 'rgba(37,99,235,0.15)'}`,
                    background: isDark ? 'rgba(30,36,66,0.7)' : '#fff',
                    padding: '10px 12px',
                    fontSize: 13,
                    color: docCategory ? t.text : t.textMuted,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value=''>Auto-detect</option>
                  <option value='menu'>Menu</option>
                  <option value='catalogue'>Catalogue</option>
                  <option value='inventory'>Inventory</option>
                  <option value='invoice'>Invoice</option>
                  <option value='faq'>FAQ</option>
                  <option value='policy'>Policy</option>
                </select>
              </label>
            )}
          </div>
        )}

        {currentInputStep === 'biz-type' && (
          <div>
            <p
              style={{
                fontSize: 13,
                color: t.textSub,
                margin: '0 0 14px',
                lineHeight: 1.5,
              }}
            >
              We&apos;ll use this to pick the right questions.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 8,
              }}
            >
              {BIZ_OPTIONS.map((biz) => {
                const active = bizType === biz.id;
                const iconColor = active
                  ? accent
                  : isDark
                    ? '#a8bfff'
                    : '#64748b';
                return (
                  <button
                    key={biz.id}
                    onClick={() => setBizType(biz.id)}
                    style={{
                      borderRadius: 12,
                      padding: '14px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: `2px solid ${active ? accent : isDark ? 'rgba(120,130,180,0.2)' : 'rgba(15,23,42,0.08)'}`,
                      background: active
                        ? isDark
                          ? 'rgba(141,166,255,0.15)'
                          : 'rgba(37,99,235,0.08)'
                        : isDark
                          ? 'rgba(18,22,44,0.9)'
                          : '#fff',
                      transition: 'all .18s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      {BizIcon[biz.id](iconColor)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: active ? accent : t.text,
                      }}
                    >
                      {biz.label}
                    </div>
                    <div
                      style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}
                    >
                      {biz.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentInputStep === 'questions' && currentQ && (
          <div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: t.text,
                margin: '0 0 10px',
                lineHeight: 1.4,
              }}
            >
              {currentQ.q}
            </p>
            <textarea
              autoFocus
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') goNext();
              }}
              placeholder={currentQ.placeholder}
              rows={3}
              style={{
                width: '100%',
                borderRadius: 10,
                border: `1px solid ${isDark ? 'rgba(141,166,255,0.18)' : 'rgba(37,99,235,0.15)'}`,
                background: isDark ? 'rgba(30,36,66,0.7)' : '#fff',
                padding: '11px 13px',
                fontSize: 13,
                color: t.text,
                outline: 'none',
                resize: 'none',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>
              Optional · Cmd/Ctrl+Enter to continue
            </div>
          </div>
        )}

        {currentInputStep === 'about' && (
          <div>
            <p
              style={{
                fontSize: 13,
                color: t.textSub,
                margin: '0 0 12px',
                lineHeight: 1.5,
              }}
            >
              Anything important your AI should know. Also saved to your
              Settings.
            </p>
            <textarea
              autoFocus
              value={aboutBusiness}
              onChange={(e) => setAboutBusiness(e.target.value)}
              rows={6}
              placeholder="Example: We're a premium sofa brand. Customers usually ask about pricing, delivery, fabric options and warranty."
              style={{
                width: '100%',
                borderRadius: 12,
                border: `1px solid ${isDark ? 'rgba(141,166,255,0.18)' : 'rgba(37,99,235,0.15)'}`,
                background: isDark ? 'rgba(30,36,66,0.7)' : '#fff',
                padding: '13px 14px',
                fontSize: 13,
                color: t.text,
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={goBack}
            style={{
              padding: '11px 16px',
              borderRadius: 10,
              background: 'transparent',
              border: `1px solid ${isDark ? 'rgba(141,166,255,0.16)' : 'rgba(15,23,42,0.08)'}`,
              color: t.textSub,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          <button
            disabled={!canAdvance}
            onClick={goNext}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 10,
              background: canAdvance
                ? accentGradient
                : isDark
                  ? 'rgba(255,255,255,.05)'
                  : 'rgba(15,23,42,.05)',
              border: canAdvance
                ? `1px solid ${isDark ? 'rgba(141,166,255,0.4)' : 'rgba(37,99,235,0.35)'}`
                : `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,0.08)'}`,
              color: canAdvance ? '#fff' : t.textMuted,
              fontSize: 14,
              fontWeight: 700,
              cursor: canAdvance ? 'pointer' : 'not-allowed',
            }}
          >
            {inputIndex === inputSteps.length - 1 &&
            currentInputStep !== 'questions'
              ? 'Start training →'
              : currentInputStep === 'questions' &&
                  qIndex === bizQuestions.length - 1
                ? 'Continue →'
                : 'Next →'}
          </button>
          {currentInputStep === 'questions' && (
            <button
              onClick={goNext}
              style={{
                padding: '11px 16px',
                borderRadius: 10,
                background: 'transparent',
                border: `1px solid ${isDark ? 'rgba(141,166,255,0.16)' : 'rgba(37,99,235,0.15)'}`,
                color: t.textSub,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          )}
        </div>
      </>,
    );
  }

  /* ============ PHASE 3: running ============ */
  if (phase === 'running') {
    return shell(
      <>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: t.text,
            margin: 0,
            letterSpacing: '-.3px',
          }}
        >
          Starting your training
        </h2>
        <p
          style={{
            fontSize: 13,
            color: t.textSub,
            margin: '6px 0 20px',
            lineHeight: 1.5,
          }}
        >
          Kicking off each task — the scrape and upload will keep running on the
          FAQ page where you can watch them progress.
        </p>
        <OnboardingSequentialStepper
          routes={routes}
          results={results}
          currentRoute={currentRoute}
          t={t}
          isDark={isDark}
          accent={accent}
        />
      </>,
      560,
    );
  }

  /* ============ PHASE 4: summary ============ */
  const totalDrafts = results.reduce((s, r) => s + (r.count ?? 0), 0);
  const anyDone = results.some((r) => r.status === 'done');
  const anyFailed = results.some((r) => r.status === 'failed');

  return shell(
    <>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: anyFailed && !anyDone ? '#dc262614' : '#05966914',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            marginBottom: 10,
          }}
        >
          {anyFailed && !anyDone ? '!' : '✓'}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: t.text, margin: 0 }}>
          {anyDone ? 'Your AI is trained' : 'Nothing was added'}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: t.textSub,
            margin: '8px 0 0',
            lineHeight: 1.5,
          }}
        >
          {anyDone && totalDrafts > 0
            ? `${totalDrafts} ${totalDrafts === 1 ? 'draft is' : 'drafts are'} ready for you to review.`
            : 'You can try again from the FAQ page.'}
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <OnboardingSequentialStepper
          routes={routes}
          results={results}
          currentRoute={null}
          t={t}
          isDark={isDark}
          accent={accent}
        />
      </div>

      {!bizAlreadyAsked && anyDone && (
        <div
          style={{
            borderRadius: 12,
            border: `1px solid ${isDark ? 'rgba(141,166,255,0.15)' : 'rgba(15,23,42,0.06)'}`,
            padding: 12,
            marginBottom: 16,
            background: isDark
              ? 'rgba(141,166,255,0.04)'
              : 'rgba(59,130,246,0.03)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: t.text,
              marginBottom: 8,
            }}
          >
            Quick one — what kind of business is this?
            {guessedBiz && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 11,
                  color: t.textMuted,
                  fontWeight: 500,
                }}
              >
                (we guessed{' '}
                {BIZ_OPTIONS.find((b) => b.id === guessedBiz)?.label})
              </span>
            )}
          </div>
          <select
            value={finalBiz ?? ''}
            onChange={(e) =>
              setFinalBiz((e.target.value || null) as BizType | null)
            }
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${isDark ? 'rgba(141,166,255,0.18)' : 'rgba(37,99,235,0.15)'}`,
              background: isDark ? 'rgba(30,36,66,0.7)' : '#fff',
              color: t.text,
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value=''>— Skip this —</option>
            {BIZ_OPTIONS.map((biz) => (
              <option key={biz.id} value={biz.id}>
                {biz.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={commitBizAndFinish}
        disabled={savingBiz}
        style={{
          width: '100%',
          padding: '13px 0',
          borderRadius: 10,
          background: accentGradient,
          border: `1px solid ${isDark ? 'rgba(141,166,255,0.4)' : 'rgba(37,99,235,0.35)'}`,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: savingBiz ? 'default' : 'pointer',
          opacity: savingBiz ? 0.6 : 1,
        }}
      >
        {savingBiz ? 'Saving…' : anyDone ? 'Review drafts →' : 'Go to FAQ →'}
      </button>
    </>,
    520,
  );
}

