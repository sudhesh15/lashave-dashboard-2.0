const fs = require('fs');

function migratePage(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Import MountainScene if not already imported
  if (!content.includes('MountainScene')) {
    content = content.replace(
      'import { useTheme } from "@/lib/theme-context";',
      'import { useTheme } from "@/lib/theme-context";\nimport { MountainScene } from "@/components/layout/MountainScene";'
    );
  }

  // 2. Remove inline themes (DARK_THEME, LIGHT_THEME, ANA_DARK, ANA_LIGHT, etc.)
  content = content.replace(/const (DARK_THEME|LIGHT_THEME|ANA_DARK|ANA_LIGHT) = \{[\s\S]*?\};\n/g, '');
  content = content.replace(/type PageTheme = typeof [A-Z_]+;\n/g, '');
  content = content.replace(/type AnaTheme = typeof [A-Z_]+;\n/g, '');

  // 3. Find and remove inline MountainScene function
  const mountainSceneRegex = /\/\* ──+ MountainScene.*?\nfunction MountainScene\(\{ isDark \}: \{ isDark: boolean \}\) \{[\s\S]*?\}\n/g;
  content = content.replace(mountainSceneRegex, '');
  // also look for just function MountainScene...
  const altMountainSceneRegex = /\/\* .*?\*\/\nfunction MountainScene\(\{ isDark \}: \{ isDark: boolean \}\) \{[\s\S]*?\}\n\n\/\* ──+ Avatar/g;
  content = content.replace(altMountainSceneRegex, '/* ─────────────────────── Avatar');

  // 4. Update the th / t definitions in the main exported page function
  // Replace `const th = isDark ? ... : ...;` with nothing since we get t from useTheme
  content = content.replace(/const th = isDark \? [A-Z_]+ : [A-Z_]+;\n/g, '');
  
  // Replace `const { isDark } = useTheme();` with `const { isDark, t: th } = useTheme();`
  // so we can just use `th` where it was used.
  if (content.includes('const { isDark } = useTheme();')) {
    content = content.replace('const { isDark } = useTheme();', 'const { isDark, t: th } = useTheme();');
  }

  // For analytics which already had `const { isDark, t } = useTheme();`
  // We can just add `const th = t;`
  if (content.includes('const { isDark, t } = useTheme();')) {
    content = content.replace('const { isDark, t } = useTheme();', 'const { isDark, t } = useTheme();\n  const th = t;');
  }

  // 5. Replace inline MountainScene usage
  // Some pages had <MountainScene isDark={isDark} />
  // We want <MountainScene isDark={true} />
  content = content.replace(/<MountainScene isDark=\{isDark\} \/>/g, '<MountainScene isDark={true} />');

  // 6. Map custom theme properties to global ones if they exist in the file.
  // Example: th.cardBgHov -> th.cardHovBg
  content = content.replace(/th\.cardBgHov/g, 'th.cardHovBg');
  content = content.replace(/th\.textPrimary/g, 'th.text');
  content = content.replace(/th\.accentSoft/g, 'th.onbSideBg'); // Map accentSoft to a similar global token
  content = content.replace(/th\.btnBorder/g, 'th.cardBorder');
  content = content.replace(/th\.btnBg/g, 'th.cardBg');
  content = content.replace(/th\.btnColor/g, 'th.textSub');

  // 7. Remove any inline Theme types from component props
  content = content.replace(/th: PageTheme/g, 'th: any');
  content = content.replace(/th: AnaTheme/g, 'th: any');

  fs.writeFileSync(filePath, content);
  console.log('Migrated', filePath);
}

const pages = [
  'src/app/conversations/page.tsx',
  'src/app/leads/page.tsx',
  'src/app/analytics/page.tsx',
  'src/app/faq/page.tsx',
  'src/app/channels/page.tsx',
  'src/app/settings/page.tsx'
];

pages.forEach(migratePage);

