import { LIGHT } from '@/lib/theme';

/* Overview-page-specific light theme override — brighter/cooler than the
   shared LIGHT palette used elsewhere in the app. */
export const OVERVIEW_LIGHT = {
  ...LIGHT,

  pageText: '#070F2D',
  text: '#070F2D',
  textSub: '#64748B',
  textMuted: '#8190AA',
  labelColor: '#111827',

  accent: '#3B82F6',
  accentSoft: 'rgba(59,130,246,0.14)',
  accentBg: 'rgba(59,130,246,0.08)',
  accentBorder: 'rgba(59,130,246,0.22)',

  cardBg: '#ffffff',
  cardHovBg: '#ffffff',
  cardBorder: 'rgba(15,23,42,0.06)',
  cardBorderHov: 'rgba(59,130,246,0.20)',

  cardShadow: [
    '0 1px 0 rgba(255,255,255,0.95) inset',
    '0 1px 2px rgba(15,23,42,0.04)',
    '0 12px 30px rgba(15,23,42,0.08)',
    '0 28px 70px rgba(15,23,42,0.10)',
  ].join(', '),

  cardHovShadow: [
    '0 1px 0 rgba(255,255,255,0.95) inset',
    '0 0 0 1px rgba(59,130,246,0.10)',
    '0 14px 34px rgba(59,130,246,0.13)',
    '0 34px 80px rgba(15,23,42,0.14)',
  ].join(', '),

  inputBg: '#ffffff',
  inputBorder: 'rgba(15,23,42,0.07)',
  tooltipBg: '#ffffff',
  tooltipBorder: 'rgba(15,23,42,0.08)',

  pipeBarBg: 'rgba(15,23,42,0.08)',
  latBarBg: 'rgba(15,23,42,0.08)',

  gridLine: 'rgba(15,23,42,0.08)',
  axisText: '#94A3B8',
  chartLinePrimary: '#3B82F6',
  chartLineHov: '#2563EB',
  chartFill0: 'rgba(59,130,246,0.16)',
  chartFill1: 'rgba(59,130,246,0.02)',

  heatEmpty: 'rgba(15,23,42,0.05)',
  heatL1: 'rgba(59,130,246,0.15)',
  heatL2: 'rgba(59,130,246,0.28)',
  heatL3: 'rgba(59,130,246,0.42)',
  heatL4: 'rgba(59,130,246,0.58)',
  heatL5: 'rgba(37,99,235,0.78)',
};
