const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/components/NikahComponents.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace old CSS variables and hex codes with new variables
// For ProfileCard border:
content = content.replace(/border: '1\.5px solid rgba\(184, 146, 74, 0\.22\)'/g, "border: '1px solid var(--border-color)'");

// Top gradient bar in ProfileCard:
// Remove it or make it purely primary color
content = content.replace(
  /background: 'linear-gradient\\(90deg, var\\(--theme-accent\\) 0%, var\\(--gold-accent\\) 60%, var\\(--theme-accent\\) 100%\\)'/g,
  "background: 'var(--color-primary)'"
);

// Photo fallback background
content = content.replace(
  /background: 'linear-gradient\\(135deg, var\\(--soft-cream\\) 0%, var\\(--warm-ivory\\) 40%, var\\(--gold-light\\) 100%\\)'/g,
  "background: '#f1f5f9'"
);

// Badges
content = content.replace(/background: 'linear-gradient\\(135deg,var\\(--antique-gold\\),#c8a052\\)'/g, "background: 'var(--color-accent)'");
content = content.replace(/background: 'linear-gradient\\(135deg,var\\(--deep-maroon\\),#8b2252\\)'/g, "background: 'var(--color-primary)'");
content = content.replace(/background: '#059669'/g, "background: 'var(--color-primary)'");
content = content.replace(/boxShadow: '0 2px 8px rgba\\(5,150,105,0\\.35\\)'/g, "boxShadow: 'none'");
content = content.replace(/boxShadow: '0 2px 8px rgba\\(184,146,74,0\\.35\\)'/g, "boxShadow: 'none'");
content = content.replace(/boxShadow: '0 2px 8px rgba\\(111,29,53,0\\.3\\)'/g, "boxShadow: 'none'");

// SuccessStoryCard
content = content.replace(/border: '1\.5px solid var\\(--gold-accent\\)'/g, "border: '1px solid var(--border-color)'");
content = content.replace(/color: 'var\\(--deep-maroon\\)'/g, "color: 'var(--color-primary)'");
content = content.replace(/color: 'var\\(--gold-dark\\)'/g, "color: 'var(--color-primary-dark)'");
content = content.replace(/color: 'var\\(--primary-brand\\)'/g, "color: 'var(--color-text)'");

// Remove FloralCorners globally from NikahComponents
content = content.replace(/<FloralCorner[^>]*\/>/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log('NikahComponents.tsx styles modernized.');
