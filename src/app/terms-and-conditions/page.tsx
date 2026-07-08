'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { SectionHeading, FloralCorner, PremiumFooter } from '../../components/NikahComponents';
import { useI18n } from '../../i18n/I18nProvider';

export default function TermsAndConditionsPage() {
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
            title={t('terms.title')}
            subtitle={t('terms.subtitle')}
            scriptText={t('terms.script')}
            as="h1"
          />

          <div className="card-theme-wrapper" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px', lineHeight: '1.8', color: 'var(--text-dark)' }}>
            <FloralCorner position="tl" color="var(--gold-accent)" />
            <FloralCorner position="tr" color="var(--gold-accent)" />

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h1')}</h2>
            <p style={{ marginBottom: '24px' }}>{t('terms.p1')}</p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h2')}</h2>
            <p style={{ marginBottom: '24px' }}>{t('terms.p2')}</p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h3')}</h2>
            <p style={{ marginBottom: '24px' }}>{t('terms.p3')}</p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h4')}</h2>
            <p style={{ marginBottom: '24px' }}>{t('terms.p4')}</p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h5')}</h2>
            <p style={{ marginBottom: '24px' }}>{t('terms.p5')}</p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h6')}</h2>
            <p style={{ marginBottom: '24px' }}>{t('terms.p6')}</p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h7')}</h2>
            <p style={{ marginBottom: '24px' }}>{t('terms.p7')}</p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h8')}</h2>
            <p style={{ marginBottom: '24px' }}>{t('terms.p8')}</p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h9')}</h2>
            <p style={{ marginBottom: '24px' }}>{t('terms.p9')}</p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h10')}</h2>
            <p style={{ marginBottom: '12px' }}>{t('terms.p10a')}</p>
            <p style={{ marginBottom: '12px' }}>{t('terms.p10bPre')} <strong>{t('terms.p10bStrong')}</strong>{t('terms.p10bPost')}</p>
            <p style={{ marginBottom: '24px' }}>{t('terms.p10c')}</p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('terms.h11')}</h2>
            <p>{t('terms.p11')}</p>
          </div>
        </div>
      </main>
      <PremiumFooter onNavigate={handleNavigate} />
    </>
  );
}
