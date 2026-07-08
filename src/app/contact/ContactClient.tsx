'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import { SectionHeading, FloralCorner, PremiumFooter } from '../../components/NikahComponents';
import LeadForm from '../../components/LeadForm';
import { BusinessLocation, defaultBusinessLocation } from '../../lib/businessLocation';
import { getSupportWhatsAppLink } from '../../lib/whatsapp';
import { useI18n } from '../../i18n/I18nProvider';

export default function ContactClient() {
  const router = useRouter();
  const { t } = useI18n();
  const [location, setLocation] = useState<BusinessLocation>(defaultBusinessLocation);

  useEffect(() => {
    fetch('/api/business-location')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setLocation(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load business location:', err);
      });
  }, []);

  const handleNavigate = (view: string) => {
    router.push('/' + (view === 'home' ? '' : view));
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <div className="container font-sans" style={{ padding: '40px 0 80px 0' }}>
          <SectionHeading
            title={t('contact.title')}
            subtitle={t('contact.subtitle')}
            scriptText={t('contact.script')}
            as="h1"
          />

          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="card-theme-wrapper" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: '160px' }}>
                <Image src="/images/nikah-1.jpeg" fill style={{ objectFit: 'cover', objectPosition: 'center 30%' }} alt={t('contact.heroAlt')} />
              </div>
              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--deep-maroon)' }}>{t('contact.detailsTitle')}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>📍 {location.address}</p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  📞 {t('contact.callUs')} <a href={`tel:${location.phoneRaw}`} className="ltr-value" style={{ color: 'var(--deep-maroon)', fontWeight: 'bold', textDecoration: 'underline' }}>{location.phone}</a> {t('contact.callHours')}
                </p>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span>💬 {t('contact.whatsappLabel')} <strong className="ltr-value" style={{ color: 'var(--deep-maroon)' }}>+91 96754 83125</strong></span>
                  <a
                    href={getSupportWhatsAppLink(t('contact.supportWhatsappMsg'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      backgroundColor: '#25D366',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      padding: '8px 16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      transition: 'var(--transition-smooth)',
                      width: 'fit-content',
                      marginTop: '2px'
                    }}
                  >
                    {t('contact.chatWhatsapp')}
                  </a>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('contact.verificationDept')}</p>
                
                {/* Social media connections */}
                {(location.facebookUrl || location.instagramUrl || location.youtubeUrl || location.linkedinUrl || location.twitterUrl) && (
                  <>
                    <hr style={{ borderColor: 'var(--border-color)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--deep-maroon)', fontWeight: 600 }}>{t('contact.followUs')}</h4>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {location.facebookUrl && (
                          <a
                            href={location.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--gold-accent)' }}
                            aria-label="Visit Asan Nikah on Facebook"
                          >
                            Facebook
                          </a>
                        )}
                        {location.instagramUrl && (
                          <a
                            href={location.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--gold-accent)' }}
                            aria-label="Visit Asan Nikah on Instagram"
                          >
                            Instagram
                          </a>
                        )}
                        {location.youtubeUrl && (
                          <a
                            href={location.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--gold-accent)' }}
                            aria-label="Visit Asan Nikah on YouTube"
                          >
                            YouTube
                          </a>
                        )}
                        {location.linkedinUrl && (
                          <a
                            href={location.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--gold-accent)' }}
                            aria-label="Visit Asan Nikah on LinkedIn"
                          >
                            LinkedIn
                          </a>
                        )}
                        {location.twitterUrl && (
                          <a
                            href={location.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--gold-accent)' }}
                            aria-label="Visit Asan Nikah on X"
                          >
                            X / Twitter
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                <hr style={{ borderColor: 'var(--border-color)' }} />
                <span style={{ fontSize: '12.5px', color: 'var(--gold-accent)', fontWeight: 600 }}>{t('contact.callbackNote')}</span>
              </div>
            </div>

            <div className="card-theme-wrapper" style={{ gridColumn: 'span 2', padding: '32px' }}>
              <FloralCorner position="tl" color="var(--gold-accent)" />
              <FloralCorner position="tr" color="var(--gold-accent)" />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--deep-maroon)', marginBottom: '16px' }}>{t('contact.formTitle')}</h3>
              <LeadForm defaultInquiryType="General Inquiry" />
            </div>
          </div>
        </div>
      </main>

      <PremiumFooter onNavigate={handleNavigate} />
    </>
  );
}
