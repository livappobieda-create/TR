const fs = require('fs');
const files = ['src/app/onboarding/page.tsx', 'src/components/trades/TradeEntryModal.tsx'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/t\.([a-zA-Z0-9_]+)/g, 't("$1")');
  fs.writeFileSync(f, content);
});
