const fs = require('fs');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/AnaTheme/g, 'any');
  content = content.replace(/PageTheme/g, 'any');
  fs.writeFileSync(filePath, content);
}

[
  'src/app/conversations/page.tsx',
  'src/app/leads/page.tsx',
  'src/app/analytics/page.tsx',
  'src/app/faq/page.tsx',
  'src/app/channels/page.tsx',
  'src/app/settings/page.tsx'
].forEach(fixFile);

// Fix DashboardPanels
const dashPanelsPath = 'src/components/dashboard/DashboardPanels.tsx';
if (fs.existsSync(dashPanelsPath)) {
  let dp = fs.readFileSync(dashPanelsPath, 'utf8');
  dp = dp.replace(/dot:\s+STATUS\.danger,/g, 'dot: STATUS.danger.text,');
  dp = dp.replace(/border:\s+STATUS\.danger,/g, 'border: STATUS.danger.text,');
  dp = dp.replace(/dot:\s+STATUS\.success,/g, 'dot: STATUS.success.text,');
  dp = dp.replace(/border:\s+STATUS\.success,/g, 'border: STATUS.success.text,');
  dp = dp.replace(/dot:\s+STATUS\.warning,/g, 'dot: STATUS.warning.text,');
  dp = dp.replace(/border:\s+STATUS\.warning,/g, 'border: STATUS.warning.text,');
  fs.writeFileSync(dashPanelsPath, dp);
}
console.log("Done");
