'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import { SectionHeading, FloralCorner, PremiumFooter } from '../../components/NikahComponents';
import { useI18n } from '../../i18n/I18nProvider';

export default function SafetyClient() {
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
            title={t('safety.title')}
            subtitle={t('safety.subtitle')}
            scriptText={t('safety.script')}
            as="h1"
          />

          <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', borderRadius: 'var(--border-radius-xl)', overflow: 'hidden', height: '240px', position: 'relative', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}>
            <Image
              src="/images/nikah-2.jpeg"
              alt={t('safety.heroAlt')}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center 60%' }}
            />
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(to right, rgba(253, 248, 245, 0.8), rgba(253, 248, 245, 0.4))'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="card-theme-wrapper" style={{ padding: '30px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--deep-maroon)', marginBottom: '12px' }}>{t('safety.card1Title')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {t('safety.card1PreLink')}<Link href="/how-it-works" style={{ textDecoration: 'underline', color: 'var(--deep-maroon)', fontWeight: 'bold' }}>{t('safety.card1Link')}</Link>{t('safety.card1Post')}
              </p>
            </div>

            <div className="card-theme-wrapper" style={{ padding: '30px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--deep-maroon)', marginBottom: '12px' }}>{t('safety.card2Title')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {t('safety.card2Body')}
              </p>
            </div>

            <div className="card-theme-wrapper" style={{ padding: '30px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--deep-maroon)', marginBottom: '12px' }}>{t('safety.card3Title')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {t('safety.card3Body')}
              </p>
            </div>
          </div>

          <div className="card-theme-wrapper" style={{ maxWidth: '800px', margin: '48px auto 0 auto', padding: '40px' }}>
            <FloralCorner position="tl" color="var(--gold-accent)" />
            <FloralCorner position="tr" color="var(--gold-accent)" />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--deep-maroon)', marginBottom: '16px', textAlign: 'center' }}>{t('safety.adviceTitle')}</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-dark)' }}>
              <li>{t('safety.advice1')}</li>
              <li>{t('safety.advice2')}</li>
              <li>{t('safety.advice3')}</li>
              <li>{t('safety.advice4Pre')}<Link href="/contact" style={{ textDecoration: 'underline', color: 'var(--deep-maroon)', fontWeight: 'bold' }}>{t('safety.advice4Link')}</Link>{t('safety.advice4Post')}</li>
            </ul>
          </div>
        </div>
      </main>
      <PremiumFooter onNavigate={handleNavigate} />
    </>
  );
}
