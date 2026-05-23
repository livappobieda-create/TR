const fs = require('fs');
const f = 'src/app/onboarding/page.tsx';
let content = fs.readFileSync(f, 'utf8');
content = content.replace(/e\.target\("([a-zA-Z0-9_]+)"\)/g, 'e.target.$1');
fs.writeFileSync(f, content);
