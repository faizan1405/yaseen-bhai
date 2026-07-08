'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nProvider';

export const HeroSection: React.FC = () => {
  const router = useRouter();
  const { t } = useI18n();
  const {
    isLoggedIn,
    setIsRegistering,
    setRegStep,
    setShowLoginModal
  } = useApp();

  const handleFindMatch = () => {
    router.push('/search');
  };

  const handleCreateProfile = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
    } else {
      setIsRegistering(true);
      setRegStep(1);
    }
  };

  return (
    <section style={{ backgroundColor: 'var(--color-bg)', padding: '60px 20px', minHeight: '85vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
        
        {/* Left Side: Text and CTAs */}
        <div style={{ maxWidth: '600px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary-dark)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%' }}></span>
            {t('hero.trustBadge')}
          </div>

          <h1 style={{ color: 'var(--color-text)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.02em' }}>
            {t('hero.titleLead')} <span style={{ color: 'var(--color-primary)' }}>{t('hero.titleHighlight')}</span>{t('hero.titleTrail')}
          </h1>

          <p style={{ color: 'var(--color-muted)', fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '40px' }}>
            {t('hero.subtitle')}
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}>
            <button
              onClick={handleFindMatch}
              className="btn btn-primary"
              style={{ padding: '16px 32px', fontSize: '16px', borderRadius: '12px' }}
            >
              {t('hero.ctaFind')}
            </button>
            <button
              onClick={handleCreateProfile}
              className="btn btn-secondary"
              style={{ padding: '16px 32px', fontSize: '16px', borderRadius: '12px' }}
            >
              {t('hero.ctaProfiles')}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '24px', color: 'var(--color-text)', fontSize: '14px', fontWeight: 500, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              {t('hero.featVerified')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              {t('hero.featPrivacy')}
            </div>
          </div>
        </div>

        {/* Right Side: Visual/Cards */}
        <div style={{ position: 'relative', height: '100%', minHeight: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* Decorative background shape */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'linear-gradient(135deg, #d1fae5 0%, #fef3c7 100%)', borderRadius: '50%', opacity: 0.5, filter: 'blur(40px)', zIndex: 0 }}></div>
          
          {/* Main profile card preview */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            background: 'var(--color-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
            width: '100%',
            maxWidth: '360px',
            border: '1px solid var(--border-color)',
            transform: 'rotate(-2deg)'
          }}>
            <div style={{ width: '100%', height: '240px', backgroundColor: '#e2e8f0', borderRadius: '16px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
              <Image src="/images/nikah-1.jpeg" alt="Profile match" fill style={{ objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                {t('hero.cardVerified')}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: 'var(--color-text)' }}>{t('hero.cardLooking')}</h3>
              <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '14px' }}>{t('hero.cardDetails')}</p>
              <p style={{ margin: '4px 0 0 0', color: 'var(--color-muted)', fontSize: '14px' }}>{t('hero.cardLocation')}</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px' }}>{t('hero.cardSendRequest')}</button>
          </div>

          {/* Secondary floating card */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '-20px',
            zIndex: 3,
            background: 'var(--color-surface)',
            padding: '16px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-accent)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: 'var(--color-text)' }}>{t('hero.cardSecure')}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>{t('hero.cardFamily')}</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
