'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import { SectionHeading, SuccessStoryCard, PremiumFooter } from '../../components/NikahComponents';
import { useI18n } from '../../i18n/I18nProvider';

export default function SuccessStoriesClient() {
  const router = useRouter();
  const { t } = useI18n();

  const handleNavigate = (view: string) => {
    router.push('/' + (view === 'home' ? '' : view));
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow" style={{ position: 'relative' }}>
        {/* Background Image Layer */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <Image
             src="/images/nikah-4.jpeg"
             alt={t('stories.title')}
             fill
             style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to bottom, rgba(253, 248, 245, 0.85), rgba(253, 248, 245, 0.95))'
          }} />
        </div>

        <div className="container font-sans" style={{ padding: '60px 0 80px 0', position: 'relative', zIndex: 1 }}>
          <SectionHeading
            title={t('stories.title')}
            subtitle={t('stories.subtitle')}
            scriptText={t('stories.script')}
            as="h1"
          />

          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            <SuccessStoryCard
              names={t('stories.story1Names')}
              location={t('stories.story1Location')}
              story={t('stories.story1Story')}
              weddingDate="May 12, 2025"
              imageIndex={0}
            />
            <SuccessStoryCard
              names={t('stories.story2Names')}
              location={t('stories.story2Location')}
              story={t('stories.story2Story')}
              weddingDate="April 4, 2026"
              imageIndex={1}
            />
            <SuccessStoryCard
              names={t('stories.story3Names')}
              location={t('stories.story3Location')}
              story={t('stories.story3Story')}
              weddingDate="Dec 15, 2024"
              imageIndex={2}
            />
          </div>
        </div>
      </main>
      <PremiumFooter onNavigate={handleNavigate} />
    </>
  );
}
