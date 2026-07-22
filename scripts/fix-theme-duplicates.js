const fs = require('fs');

const filePath = 'src/lib/theme.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Remove duplicate inputBg and inputBorder inserted by me
content = content.replace('  inputBg: "rgba(0,0,0,0.2)", inputBorder: "rgba(255,255,255,0.1)",\n', '');
content = content.replace('  inputBg: "rgba(0,0,0,0.02)", inputBorder: "rgba(0,0,0,0.08)",\n', '');

// Add inputBorder properly next to the original inputBg
content = content.replace('  inputBg:          "rgba(255,255,255,0.04)",\n', '  inputBg:          "rgba(255,255,255,0.04)",\n  inputBorder:      "rgba(255,255,255,0.12)",\n');
content = content.replace('  inputBg:          "#F1F5F9",\n', '  inputBg:          "rgba(255,255,255,0.10)",\n  inputBorder:      "rgba(255,255,255,0.18)",\n');

fs.writeFileSync(filePath, content);
