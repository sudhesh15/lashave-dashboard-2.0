const fs = require('fs');

const filePath = 'src/lib/theme.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Add missing properties to interface
content = content.replace('export interface Theme {', `export interface Theme {
  cardShadow: string; cardShadowHov: string; cardBgHov: string;
  textPrimary: string; gloss: string;
  inputBg: string; inputBorder: string;
  btnBg: string; btnBorder: string; btnColor: string;
  accentSoft: string; glassBg: string; glassBorder: string;
  skyTop?: string; skyMid?: string; skyHorizon?: string;
  veilCenter?: string; veilEdge?: string; veilTop?: string; veilBottom?: string;
  orb1?: string; orb2?: string; orb3?: string;`);

// Add defaults to DARK
content = content.replace('export const DARK: Theme = {', `export const DARK: Theme = {
  cardShadow: "0 4px 20px rgba(0,0,0,0.45)", cardShadowHov: "0 20px 60px rgba(0,0,0,0.6)", cardBgHov: "rgba(24,30,58,0.95)",
  textPrimary: "#F8FAFC", gloss: "rgba(255,255,255,0.06)",
  inputBg: "rgba(0,0,0,0.2)", inputBorder: "rgba(255,255,255,0.1)",
  btnBg: "rgba(255,255,255,0.05)", btnBorder: "rgba(255,255,255,0.1)", btnColor: "rgba(255,255,255,0.6)",
  accentSoft: "rgba(141,166,255,0.12)", glassBg: "rgba(255,255,255,0.08)", glassBorder: "rgba(255,255,255,0.16)",
  skyTop: "#03060f", skyMid: "#090f24", skyHorizon: "#1a163a",
  veilCenter: "rgba(3,6,18,0.62)", veilEdge: "rgba(3,6,18,0.28)", veilTop: "rgba(3,6,18,0.38)", veilBottom: "rgba(3,6,18,0.50)",`);

// Add defaults to LIGHT
// We are using Night Command Aurora for LIGHT
content = content.replace('export const LIGHT: Theme = {', `export const LIGHT: Theme = {
  cardShadow: "0 24px 70px rgba(0,0,0,0.28)", cardShadowHov: "0 30px 90px rgba(0,0,0,0.35)", cardBgHov: "#ffffff",
  textPrimary: "#0B1024", gloss: "rgba(0,0,0,0.02)",
  inputBg: "rgba(0,0,0,0.02)", inputBorder: "rgba(0,0,0,0.08)",
  btnBg: "rgba(0,0,0,0.04)", btnBorder: "rgba(0,0,0,0.08)", btnColor: "rgba(0,0,0,0.6)",
  accentSoft: "rgba(59,130,246,0.1)", glassBg: "rgba(255,255,255,0.08)", glassBorder: "rgba(255,255,255,0.16)",
  skyTop: "#f1ece6", skyMid: "#f8f6f3", skyHorizon: "#ffffff",
  veilCenter: "rgba(248,246,243,0.62)", veilEdge: "rgba(248,246,243,0.20)", veilTop: "rgba(248,246,243,0.30)", veilBottom: "rgba(241,236,230,0.55)",
  orb1: "#1D4ED8", orb2: "#06B6D4", orb3: "#3B82F6",`);

fs.writeFileSync(filePath, content);
console.log('Fixed theme properties');
