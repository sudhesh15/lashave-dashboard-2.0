/* ─────────────────────────────────────────────────────────────────────────────
   lib/theme.ts  —  Theme interface declared FIRST so DARK and LIGHT can use it.
   No "as const" anywhere — both objects satisfy Theme so t={t} works everywhere.
   ──────────────────────────────────────────────────────────────────────────── */

/* ── 1. Interface ── */
export interface Theme {
  cardShadow: string; cardShadowHov: string; cardBgHov: string;
  textPrimary: string; gloss: string; inputBorder: string; accentRgb: string;
  btnBg: string; btnBorder: string; btnColor: string;
  accentSoft: string; glassBg: string; glassBorder: string;
  skyTop?: string; skyMid?: string; skyHorizon?: string;
  veilCenter?: string; veilEdge?: string; veilTop?: string; veilBottom?: string;
  orb1?: string; orb2?: string; orb3?: string;
  pageBg: string; bg: string;
  topbarBg: string; topbarBorder: string;
  topbarText: string; topbarTextHov: string; topbarTextActive: string;
  topbarActiveBg: string; topbarHovBg: string;
  cardBg: string; cardHovBg: string;
  cardBorder: string; cardBorderHov: string; cardHovBorder: string;
  cardHovShadow: string;
  onbBg: string; onbSideBg: string; onbBorder: string; onbSideBorder: string;
  pulseFeedBg: string; tooltipBg: string; tooltipBorder: string;
  inputBg: string; latBarBg: string; pipeBarBg: string;
  channelBg: string; channelBorder: string;
  channelActiveBg: string; channelActiveBorder: string;
  dropdownBg: string; dropdownBorder: string; dropdownShadow: string;
  divider: string;
  stroke: string; gridLine: string; soft: string;
  text: string; textSub: string; textMuted: string;
  pageText: string; pageTextSub: string;
  labelColor: string; axisText: string;
  accent: string; accentGradient: string;
  chartLinePrimary: string; chartLineHov: string;
  chartFill0: string; chartFill1: string;
  heatEmpty: string; heatL1: string; heatL2: string;
  heatL3: string; heatL4: string; heatL5: string;
}

/* ── 2. Dark theme — retinted to the TailAdmin brand/gray palette ── */
export const DARK: Theme = {
  cardShadow: "0px 4px 8px -2px rgba(16,24,40,0.1), 0px 2px 4px -2px rgba(16,24,40,0.06)", cardShadowHov: "0px 12px 16px -4px rgba(16,24,40,0.18), 0px 4px 6px -2px rgba(16,24,40,0.1)", cardBgHov: "#344054",
  textPrimary: "#fcfcfd", gloss: "rgba(255,255,255,0.06)", accentRgb: "70,95,255",
  btnBg: "rgba(255,255,255,0.05)", btnBorder: "rgba(255,255,255,0.1)", btnColor: "rgba(255,255,255,0.6)",
  accentSoft: "rgba(70,95,255,0.12)", glassBg: "rgba(255,255,255,0.08)", glassBorder: "rgba(255,255,255,0.16)",
  skyTop: "#03060f", skyMid: "#090f24", skyHorizon: "#1a163a",
  veilCenter: "rgba(3,6,18,0.62)", veilEdge: "rgba(3,6,18,0.28)", veilTop: "rgba(3,6,18,0.38)", veilBottom: "rgba(3,6,18,0.50)",
  // ── page / shell ──
  pageBg:           "#101828",
  bg:               "#101828",

  // ── topbar ──
  topbarBg:         "rgba(16,24,40,0.92)",
  topbarBorder:     "rgba(255,255,255,0.1)",
  topbarText:       "rgba(255,255,255,0.45)",
  topbarTextHov:    "rgba(255,255,255,0.75)",
  topbarTextActive: "#465fff",
  topbarActiveBg:   "rgba(70,95,255,0.12)",
  topbarHovBg:      "rgba(255,255,255,0.07)",

  // ── cards ──
  cardBg:           "#1d2939",
  cardHovBg:        "#344054",
  cardBorder:       "rgba(255,255,255,0.08)",
  cardBorderHov:    "rgba(117,146,255,0.35)",
  cardHovBorder:    "rgba(117,146,255,0.35)",       // alias kept for compat
  cardHovShadow:    "0px 12px 16px -4px rgba(16,24,40,0.18), 0 0 0 1px rgba(70,95,255,0.25)",

  // ── onboarding card ──
  onbBg:            "rgba(29,41,57,0.9)",
  onbSideBg:        "rgba(16,24,40,0.8)",
  onbBorder:        "rgba(117,146,255,0.18)",
  onbSideBorder:    "rgba(117,146,255,0.1)",

  // ── panels / misc backgrounds ──
  pulseFeedBg:      "rgba(29,41,57,0.9)",
  tooltipBg:        "rgba(16,24,40,0.95)",
  tooltipBorder:    "rgba(255,255,255,0.12)",
  inputBg:          "rgba(255,255,255,0.04)",
  inputBorder:      "rgba(255,255,255,0.12)",
  latBarBg:         "rgba(255,255,255,0.06)",
  pipeBarBg:        "rgba(255,255,255,0.06)",
  channelBg:        "rgba(29,41,57,0.85)",
  channelBorder:    "rgba(255,255,255,0.08)",
  channelActiveBg:  "rgba(70,95,255,0.08)",
  channelActiveBorder: "rgba(117,146,255,0.3)",
  dropdownBg:       "rgba(16,24,40,0.97)",
  dropdownBorder:   "rgba(255,255,255,0.08)",
  dropdownShadow:   "0px 20px 24px -4px rgba(16,24,40,0.3), 0px 8px 8px -4px rgba(16,24,40,0.15)",
  divider:          "rgba(255,255,255,0.06)",

  // ── borders / strokes ──
  stroke:           "rgba(255,255,255,0.08)",
  gridLine:         "rgba(255,255,255,0.04)",
  soft:             "rgba(255,255,255,0.1)",

  // ── text ──
  text:             "#fcfcfd",
  textSub:          "#98a2b3",
  textMuted:        "#475467",
  pageText:         "#fcfcfd",
  pageTextSub:      "#98a2b3",
  labelColor:       "#667085",
  axisText:         "#475467",

  // ── accent ──
  accent:           "#465fff",
  accentGradient:   "linear-gradient(135deg, #465fff, #7592ff)",

  // ── chart ──
  chartLinePrimary: "#465fff",
  chartLineHov:     "#7592ff",
  chartFill0:       "rgba(70,95,255,0.12)",
  chartFill1:       "rgba(70,95,255,0)",

  // ── heatmap ──
  heatEmpty:        "rgba(70,95,255,0.04)",
  heatL1:           "rgba(70,95,255,0.13)",
  heatL2:           "rgba(70,95,255,0.28)",
  heatL3:           "rgba(70,95,255,0.48)",
  heatL4:           "rgba(70,95,255,0.68)",
  heatL5:           "rgba(70,95,255,0.88)",
};

/* ── 3. Light theme — flat TailAdmin light palette (brand blue on white/gray) ── */
export const LIGHT: Theme = {
  cardShadow: "0px 1px 3px 0px rgba(16,24,40,0.1), 0px 1px 2px 0px rgba(16,24,40,0.06)", cardShadowHov: "0px 12px 16px -4px rgba(16,24,40,0.08), 0px 4px 6px -2px rgba(16,24,40,0.03)", cardBgHov: "#ffffff",
  textPrimary: "#101828", gloss: "rgba(0,0,0,0.02)", accentRgb: "70,95,255",
  btnBg: "rgba(0,0,0,0.04)", btnBorder: "rgba(0,0,0,0.08)", btnColor: "rgba(0,0,0,0.6)",
  accentSoft: "rgba(70,95,255,0.1)", glassBg: "rgba(255,255,255,0.08)", glassBorder: "rgba(255,255,255,0.16)",
  skyTop: "#f1ece6", skyMid: "#f8f6f3", skyHorizon: "#ffffff",
  veilCenter: "rgba(248,246,243,0.62)", veilEdge: "rgba(248,246,243,0.20)", veilTop: "rgba(248,246,243,0.30)", veilBottom: "rgba(241,236,230,0.55)",
  orb1: "#465fff", orb2: "#0ba5ec", orb3: "#7592ff",
  // ── page / shell ──
  pageBg:           "#fcfcfd",
  bg:               "#fcfcfd",

  // ── topbar ──
  topbarBg:         "#ffffff",
  topbarBorder:     "#e4e7ec",
  topbarText:       "#667085",
  topbarTextHov:    "#344054",
  topbarTextActive: "#465fff",
  topbarActiveBg:   "#ecf3ff",
  topbarHovBg:      "#f2f4f7",

  // ── cards ──
  cardBg:           "#ffffff",
  cardHovBg:        "#ffffff",
  cardBorder:       "#e4e7ec",
  cardBorderHov:    "#9cb9ff",
  cardHovBorder:    "#9cb9ff",
  cardHovShadow:    "0px 12px 16px -4px rgba(16,24,40,0.08), 0px 4px 6px -2px rgba(16,24,40,0.03), 0 0 0 1px #9cb9ff",

  // ── onboarding card ──
  onbBg:            "rgba(255,255,255,0.98)",
  onbSideBg:        "#f9fafb",
  onbBorder:        "#e4e7ec",
  onbSideBorder:    "#f2f4f7",

  // ── panels / misc backgrounds ──
  pulseFeedBg:      "rgba(255,255,255,0.95)",
  tooltipBg:        "#ffffff",
  tooltipBorder:    "#e4e7ec",
  inputBg:          "#ffffff",
  inputBorder:      "#d0d5dd",
  latBarBg:         "#f2f4f7",
  pipeBarBg:        "#f2f4f7",
  channelBg:        "#ffffff",
  channelBorder:    "#e4e7ec",
  channelActiveBg:  "#ecf3ff",
  channelActiveBorder: "#465fff",
  dropdownBg:       "#ffffff",
  dropdownBorder:   "#e4e7ec",
  dropdownShadow:   "0px 12px 16px -4px rgba(16,24,40,0.08), 0px 4px 6px -2px rgba(16,24,40,0.03)",
  divider:          "#f2f4f7",

  // ── borders / strokes ──
  stroke:           "#e4e7ec",
  gridLine:         "#f2f4f7",
  soft:             "#f9fafb",

  // ── text ──
  text:             "#101828",
  textSub:          "#667085",
  textMuted:        "#98a2b3",
  pageText:         "#101828",
  pageTextSub:      "#667085",
  labelColor:       "#98a2b3",
  axisText:         "#98a2b3",

  // ── accent ──
  accent:           "#465fff",
  accentGradient:   "linear-gradient(135deg, #465fff, #7592ff)",

  // ── chart ──
  chartLinePrimary: "#465fff",
  chartLineHov:     "#7592ff",
  chartFill0:       "rgba(70,95,255,0.10)",
  chartFill1:       "rgba(70,95,255,0)",

  // ── heatmap ──
  heatEmpty:        "rgba(70,95,255,0.04)",
  heatL1:           "rgba(70,95,255,0.13)",
  heatL2:           "rgba(70,95,255,0.28)",
  heatL3:           "rgba(70,95,255,0.48)",
  heatL4:           "rgba(70,95,255,0.68)",
  heatL5:           "rgba(70,95,255,0.88)",
};

/* ── Status colours (used by DashboardPanels AttentionFeed) ── */
export const STATUS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  dropoff:   { bg: "rgba(239,68,68,0.10)",   text: "#dc2626", dot: "#ef4444", label: "Drop-off"   },
  handoff:   { bg: "rgba(245,158,11,0.10)",  text: "#d97706", dot: "#f59e0b", label: "Handoff"    },
  returning: { bg: "rgba(6,182,212,0.10)",   text: "#0891b2", dot: "#06b6d4", label: "Returning"  },
  faq_gap:   { bg: "rgba(124,58,237,0.10)",  text: "#7c3aed", dot: "#8b5cf6", label: "FAQ gap"    },
  won:       { bg: "rgba(16,185,129,0.10)",  text: "#059669", dot: "#10b981", label: "Won"        },
  open:      { bg: "rgba(37,99,235,0.10)",   text: "#1d4ed8", dot: "#3b82f6", label: "Open"       },
  default:   { bg: "rgba(100,116,139,0.10)", text: "#475569", dot: "#64748b", label: "Activity"   },
};

/* ── Pipeline bar + text colours (used in pipeline panel) ── */
export const PIPELINE: Record<string, { bar: string; glow: string; text: string; pie: string }> = {
  new:       { bar:"#60a5fa", glow:"#3b82f630", text:"#93c5fd",  pie:"#3b82f6" },
  contacted: { bar:"#fbbf24", glow:"#f59e0b30", text:"#fde68a",  pie:"#f59e0b" },
  qualified: { bar:"#a78bfa", glow:"#8b5cf630", text:"#c4b5fd",  pie:"#8b5cf6" },
  won:       { bar:"#34d399", glow:"#10b98130", text:"#6ee7b7",  pie:"#10b981" },
  lost:      { bar:"#f87171", glow:"#ef444430", text:"#fca5a5",  pie:"#ef4444" },
};

export const PIPELINE_LIGHT_TEXT: Record<string, string> = {
  new:       "#1D4ED8",
  contacted: "#B45309",
  qualified: "#6D28D9",
  won:       "#065F46",
  lost:      "#991B1B",
};