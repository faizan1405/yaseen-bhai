'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import { SectionHeading, FloralCorner, PremiumFooter } from '../../components/NikahComponents';
import { useI18n } from '../../i18n/I18nProvider';

interface Step {
  num: number;
  // Translation-key stems resolved with t() at render time.
  titleKey: string;
  descKey: string;
  altKey: string;
  img: string;
}

const steps: Step[] = [
  { num: 1, titleKey: 'howItWorks.step1Title', descKey: 'howItWorks.step1Desc', altKey: 'howItWorks.step1Alt', img: '/images/hiw-1.png' },
  { num: 2, titleKey: 'howItWorks.step2Title', descKey: 'howItWorks.step2Desc', altKey: 'howItWorks.step2Alt', img: '/images/hiw-2.png' },
  { num: 3, titleKey: 'howItWorks.step3Title', descKey: 'howItWorks.step3Desc', altKey: 'howItWorks.step3Alt', img: '/images/hiw-3.png' },
  { num: 4, titleKey: 'howItWorks.step4Title', descKey: 'howItWorks.step4Desc', altKey: 'howItWorks.step4Alt', img: '/images/hiw-4.png' },
];

export default function HowItWorksClient() {
  const router = useRouter();
  const { t } = useI18n();

  const handleNavigate = (view: string) => {
    router.push('/' + (view === 'home' ? '' : view));
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <div className="container font-sans" style={{ padding: '40px 0 80px 0' }}>
          <SectionHeading
            title={t('howItWorks.title')}
            subtitle={t('howItWorks.subtitle')}
            scriptText={t('howItWorks.script')}
            as="h1"
          />

          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {steps.map((step) => (
              <div
                key={step.num}
                className="hiw-card"
                style={{
                  position: 'relative',
                  borderRadius: 'var(--border-radius-lg)',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px -12px rgba(111, 29, 53, 0.25)',
                  border: '1px solid rgba(184, 146, 74, 0.35)',
                }}
              >
                {/* Full-cover background image */}
                <Image
                  src={step.img}
                  alt={t(step.altKey)}
                  fill
                  sizes="(max-width: 640px) 100vw, 900px"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  priority={step.num <= 2}
                />

                {/* Gradient overlay — dark at bottom for text legibility */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to top, rgba(111,29,53,0.93) 0%, rgba(111,29,53,0.55) 42%, rgba(0,0,0,0.06) 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Step number badge — top-left */}
                <div
                  style={{
                    position: 'absolute',
                    top: '24px',
                    left: '28px',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: '2px solid var(--antique-gold)',
                    backgroundColor: 'rgba(184, 146, 74, 0.22)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F5D78C',
                    fontWeight: '700',
                    fontSize: '17px',
                    zIndex: 2,
                  }}
                >
                  {step.num}
                </div>

                {/* Text overlay — bottom */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '28px 32px 32px',
                    zIndex: 2,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '22px',
                      color: '#ffffff',
                      marginBottom: '8px',
                      fontWeight: '600',
                      letterSpacing: '0.01em',
                      textShadow: '0 2px 10px rgba(0,0,0,0.35)',
                    }}
                  >
                    {t(step.titleKey)}
                  </h3>
                  <p
                    style={{
                      color: 'rgba(255, 255, 255, 0.88)',
                      fontSize: '14.5px',
                      lineHeight: '1.65',
                      textShadow: '0 1px 4px rgba(0,0,0,0.45)',
                      maxWidth: '620px',
                    }}
                  >
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="arch-container max-w-2xl mx-auto p-8 text-center gold-rim gold-glow" style={{ maxWidth: '600px', margin: '48px auto 0 auto', padding: '32px', textAlign: 'center' }}>
            <FloralCorner position="tl" />
            <FloralCorner position="br" />
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--deep-maroon)', marginBottom: '12px' }}>{t('howItWorks.faqTitle')}</h4>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', fontSize: '13.5px' }}>
              <p><strong>{t('howItWorks.faq1Q')}</strong><br />{t('howItWorks.faq1A')}</p>
              <p><strong>{t('howItWorks.faq2Q')}</strong><br />{t('howItWorks.faq2A')}</p>
            </div>
          </div>
        </div>
      </main>
      <PremiumFooter onNavigate={handleNavigate} />
    </>
  );
}
