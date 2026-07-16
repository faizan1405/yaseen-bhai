'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import { SectionHeading, SuccessStoryCard, PremiumFooter } from '../../components/NikahComponents';
import { useI18n } from '../../i18n/I18nProvider';

interface PublicStory {
  id: string;
  coupleNames: string;
  location: string | null;
  story: string;
  imageUrl: string | null;
  marriageDate: string | null;
  displayOrder: number;
  isFeatured: boolean;
}

function formatDate(value: string | null): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SuccessStoriesClient() {
  const router = useRouter();
  const { t } = useI18n();
  const [stories, setStories] = useState<PublicStory[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/success-stories')
      .then((res) => res.json())
      .then((data) => {
        if (active) setStories(Array.isArray(data.stories) ? data.stories : []);
      })
      .catch(() => {
        if (active) setStories([]);
      });
    return () => {
      active = false;
    };
  }, []);

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

          {stories === null ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading stories…
            </div>
          ) : stories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto' }}>
              Success stories will be shared here soon, InshaAllah.
            </div>
          ) : (
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              {stories.map((s, idx) => (
                <SuccessStoryCard
                  key={s.id}
                  names={s.coupleNames}
                  location={s.location || ''}
                  story={s.story}
                  weddingDate={formatDate(s.marriageDate)}
                  imageIndex={idx}
                  imageUrl={s.imageUrl}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <PremiumFooter onNavigate={handleNavigate} />
    </>
  );
}
