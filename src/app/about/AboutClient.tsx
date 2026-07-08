'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import { SectionHeading, FloralCorner, PremiumFooter } from '../../components/NikahComponents';
import { useI18n } from '../../i18n/I18nProvider';

export default function AboutClient() {
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
            title={t('about.title')}
            subtitle={t('about.subtitle')}
            scriptText={t('about.script')}
            as="h1"
          />

          <div style={{ maxWidth: '800px', margin: '0 auto 40px auto', borderRadius: 'var(--border-radius-xl)', overflow: 'hidden', height: '300px', position: 'relative', boxShadow: 'var(--shadow-premium)' }}>
            <Image
              src="/images/nikah-1.jpeg"
              alt={t('about.heroAlt')}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
            />
          </div>

          <div className="arch-container max-w-4xl mx-auto p-12 gold-rim gold-glow" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
            <FloralCorner position="tl" color="var(--gold-accent)" />
            <FloralCorner position="tr" color="var(--gold-accent)" />
            <FloralCorner position="bl" color="var(--gold-accent)" />
            <FloralCorner position="br" color="var(--gold-accent)" />

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--deep-maroon)', marginBottom: '16px', textAlign: 'center' }}>
              {t('about.cardHeading')}
            </h3>

            <div style={{ color: 'var(--text-dark)', fontSize: '15px', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <p>{t('about.p1')}</p>
              <p>{t('about.p2')}</p>
              <p>
                {t('about.p3pre')}<Link href="/how-it-works" style={{ textDecoration: 'underline', color: 'var(--deep-maroon)', fontWeight: 'bold' }}>{t('about.p3link1')}</Link>{t('about.p3mid')}<Link href="/premium" style={{ textDecoration: 'underline', color: 'var(--deep-maroon)', fontWeight: 'bold' }}>{t('about.p3link2')}</Link>{t('about.p3post')}
              </p>
              <p>{t('about.p4')}</p>
            </div>
          </div>
        </div>
      </main>
      <PremiumFooter onNavigate={handleNavigate} />
    </>
  );
}
