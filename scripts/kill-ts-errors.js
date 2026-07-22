const fs = require('fs');

const files = [
  'src/app/conversations/page.tsx',
  'src/app/leads/page.tsx',
  'src/app/channels/page.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/LeadsTheme/g, 'any');
    content = content.replace(/ConvTheme/g, 'any');
    content = content.replace(/ChannelTheme/g, 'any');
    
    // Some places might have `typeof LEADS_DARK` instead of LeadsTheme
    content = content.replace(/typeof LEADS_DARK/g, 'any');
    content = content.replace(/typeof CONV_DARK/g, 'any');
    content = content.replace(/typeof CHAN_DARK/g, 'any');
    
    fs.writeFileSync(file, content);
  }
}

