const fs = require('fs');

const files = [
  'src/app/conversations/page.tsx',
  'src/app/leads/page.tsx',
  'src/app/channels/page.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove type any = any;
    content = content.replace(/type any = any;\n?/g, '');
    
    // Remove const LEADS_DARK = { ... };
    content = content.replace(/const LEADS_DARK = \{[\s\S]*?\};\n/g, '');
    content = content.replace(/const LEADS_LIGHT = \{[\s\S]*?\};\n/g, '');
    
    content = content.replace(/const CONV_DARK = \{[\s\S]*?\};\n/g, '');
    content = content.replace(/const CONV_LIGHT = \{[\s\S]*?\};\n/g, '');
    
    content = content.replace(/const CHAN_DARK = \{[\s\S]*?\};\n/g, '');
    content = content.replace(/const CHAN_LIGHT = \{[\s\S]*?\};\n/g, '');
    
    fs.writeFileSync(file, content);
  }
}
console.log('Cleaned TS files.');
