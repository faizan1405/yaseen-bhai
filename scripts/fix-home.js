const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/app/HomeClient.tsx');
let content = fs.readFileSync(file, 'utf8');

// Find the misplaced section at the start
const useClientIndex = content.indexOf("'use client';");
const misplacedContent = content.substring(0, useClientIndex);

// Remove the misplaced content from the top
content = content.substring(useClientIndex);

// Find the insertion point near the bottom.
// Let's look for "FinalCTA" or "PremiumFooter" if FAQ doesn't have a comment.
const finalCtaIndex = content.indexOf('<FinalCTA />');
if (finalCtaIndex !== -1) {
  content = content.substring(0, finalCtaIndex) + misplacedContent + content.substring(finalCtaIndex);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HomeClient.tsx layout');
