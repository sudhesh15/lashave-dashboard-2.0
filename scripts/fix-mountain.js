const fs = require('fs');

const file = 'src/components/layout/MountainScene.tsx';
let content = fs.readFileSync(file, 'utf8');

// Sky gradient: replace with the requested #0076FF / #079CFF
content = content.replace(
  '          ? "linear-gradient(to bottom, #050a1a 0%, #0f1a3a 45%, #2a2248 92%, #2a2248 100%)"\n          : "linear-gradient(to bottom, #001a40 0%, #0047ab 45%, #005ce6 92%, #005ce6 100%)",',
  '          ? "linear-gradient(to bottom, #050a1a 0%, #0f1a3a 45%, #2a2248 92%, #2a2248 100%)"\n          : "linear-gradient(to bottom, #0076FF 0%, #0076FF 45%, #079CFF 92%, #079CFF 100%)",'
);

// Stars
content = content.replace('backgroundImage: isDark ? [', 'backgroundImage: [');
content = content.replace('        ].join(",") : "none",', '        ].join(","),');
content = content.replace('opacity: isDark ? 0.9 : 0,', 'opacity: 0.9,');

// Moon position/size
content = content.replace('right: isDark ? "22%" : "14%",', 'right: "22%",');
content = content.replace('bottom: isDark ? "48%" : "46%",', 'bottom: "48%",');
content = content.replace('width: isDark ? 110 : 80,', 'width: 110,');
content = content.replace('height: isDark ? 110 : 80,', 'height: 110,');

// Moon background
content = content.replace(
  '        background: isDark\n          ? "radial-gradient(circle at 50% 50%, #e8d7ff 0%, #e8d7ff 35%, #8a78d6 60%, transparent 78%)"\n          : "radial-gradient(circle at 50% 50%, #ffffff 0%, #ffffff 40%, #fff8d9 65%, transparent 78%)",',
  '        background: "radial-gradient(circle at 50% 50%, #e8d7ff 0%, #e8d7ff 35%, #8a78d6 60%, transparent 78%)",'
);

// Moon shadow
content = content.replace(
  '        boxShadow: isDark\n          ? "0 0 60px 10px rgba(180,160,230,0.5), 0 0 160px 40px rgba(140,120,200,0.25)"\n          : "0 0 50px 20px rgba(200,215,230,0.4), 0 0 100px 50px rgba(200,215,230,0.2)",',
  '        boxShadow: "0 0 60px 10px rgba(180,160,230,0.5), 0 0 160px 40px rgba(140,120,200,0.25)",'
);

// Haze
content = content.replace(
  '        background: isDark\n          ? "linear-gradient(to top, rgba(90,70,140,0.35), transparent)"\n          : "linear-gradient(to top, rgba(255,255,240,0.75), transparent)",',
  '        background: "linear-gradient(to top, rgba(90,70,140,0.35), transparent)",'
);

// Mountains
content = content.replace(/stopColor=\{isDark \? "(#[0-9a-fA-F]+)" : "(#[0-9a-fA-F]+)"\}/g, 'stopColor={"$1"}');
content = content.replace(/fill=\{isDark \? "(#[0-9a-fA-F]+)" : "(#[0-9a-fA-F]+)"\}/g, 'fill={"$1"}');

fs.writeFileSync(file, content);
console.log('Fixed mountain scene.');
