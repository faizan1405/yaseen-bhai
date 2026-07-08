const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/app/HomeClient.tsx');
let content = fs.readFileSync(file, 'utf8');

// The main homepage content starts after `/* Main Homepage */`
// Let's locate the sections.
// 1. BismillahCalligraphy
content = content.replace(/<BismillahCalligraphy \/>\n/, '');

// 2. QuranVerseBlock -> Trust Stats
const trustStats = `
            {/* Trust Stats */}
            <section style={{ padding: '40px 0', backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--border-color)' }}>
              <div className="container" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', textAlign: 'center' }}>
                <div><h3 style={{ fontSize: '36px', color: 'var(--color-primary)', margin: 0 }}>5,000+</h3><p style={{ margin: 0, color: 'var(--color-muted)' }}>Verified Profiles</p></div>
                <div><h3 style={{ fontSize: '36px', color: 'var(--color-primary)', margin: 0 }}>100%</h3><p style={{ margin: 0, color: 'var(--color-muted)' }}>Privacy Control</p></div>
                <div><h3 style={{ fontSize: '36px', color: 'var(--color-primary)', margin: 0 }}>24/7</h3><p style={{ margin: 0, color: 'var(--color-muted)' }}>Admin Support</p></div>
              </div>
            </section>
`;
content = content.replace(/<QuranVerseBlock \/>/, trustStats);

// 4. Extract sections to reorder
const extractSection = (content, startComment, endMarker) => {
  const startIndex = content.indexOf(startComment);
  if (startIndex === -1) return { section: '', remainder: content };
  
  // Find next section comment or specific end marker
  const endIndex = content.indexOf(endMarker, startIndex + startComment.length);
  if (endIndex === -1) return { section: '', remainder: content };
  
  const section = content.substring(startIndex, endIndex);
  const remainder = content.substring(0, startIndex) + content.substring(endIndex);
  return { section, remainder };
};

// Wedding Support (remove)
let res = extractSection(content, '{/* Wedding & Event Support Section */}', '{/* FAQ Section */}');
content = res.remainder; // Drop wedding section

// Extract Success Stories
res = extractSection(content, '{/* Success Stories Preview */}', '{/* Premium Teaser Section */}');
const successStories = res.section;
content = res.remainder;

// Extract Premium Teaser
res = extractSection(content, '{/* Premium Teaser Section */}', '{/* FAQ Section */}'); // now FAQ is right after since wedding is removed
const premiumTeaser = res.section;
content = res.remainder;

// Find insertion point before FAQ
const faqIndex = content.indexOf('{/* FAQ Section */}');

// The required order:
// Trust stats (already added)
// Featured verified profiles (already there)
// How Asan Nikah works (already there)
// Privacy and verification (Trust & Family safety) (already there)
// (Add "Why choose Asan Nikah")
// Membership packages (premiumTeaser)
// Success stories (successStories)

const whyChoose = `
            {/* Why choose Asan Nikah */}
            <section style={{ backgroundColor: 'var(--color-surface)', padding: '80px 0' }}>
              <div className="container" style={{ textAlign: 'center' }}>
                <SectionHeading title="Why Choose Asan Nikah?" subtitle="A platform built for families with Islamic values at its core." scriptText="Our Values" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginTop: '40px' }}>
                  <div style={{ padding: '30px', borderRadius: '16px', backgroundColor: 'var(--color-bg)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🛡️</div>
                    <h3 style={{ fontSize: '20px', color: 'var(--color-text)', marginBottom: '10px' }}>Secure & Halal</h3>
                    <p style={{ color: 'var(--color-muted)' }}>We follow Islamic principles in our matchmaking process to ensure family-friendly interactions.</p>
                  </div>
                  <div style={{ padding: '30px', borderRadius: '16px', backgroundColor: 'var(--color-bg)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
                    <h3 style={{ fontSize: '20px', color: 'var(--color-text)', marginBottom: '10px' }}>Curated Matches</h3>
                    <p style={{ color: 'var(--color-muted)' }}>Our personalized matchmaking helps you find compatible partners efficiently.</p>
                  </div>
                  <div style={{ padding: '30px', borderRadius: '16px', backgroundColor: 'var(--color-bg)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>👁️</div>
                    <h3 style={{ fontSize: '20px', color: 'var(--color-text)', marginBottom: '10px' }}>Privacy First</h3>
                    <p style={{ color: 'var(--color-muted)' }}>Your photos and contact details are safe and only shared with your approval.</p>
                  </div>
                </div>
              </div>
            </section>
`;

// Insert the blocks before FAQ
const newOrderBlocks = whyChoose + premiumTeaser + successStories;
content = content.substring(0, faqIndex) + newOrderBlocks + content.substring(faqIndex);

fs.writeFileSync(file, content, 'utf8');
console.log('HomeClient.tsx sections reordered and cleaned up successfully.');
