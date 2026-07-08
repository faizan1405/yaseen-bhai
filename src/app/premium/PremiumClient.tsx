'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import { SectionHeading, PremiumPlanCard, PremiumFooter, FloralCorner } from '../../components/NikahComponents';
import PackageInquiryForm from '../../components/PackageInquiryForm';
import { useI18n } from '../../i18n/I18nProvider';

export default function PremiumClient() {
  const router = useRouter();
  const { t, tList } = useI18n();
  const {
    isLoggedIn,
    hasPaid300,
    activePackages,
    handleRazorpayCheckout,
    pendingProfileId,
    userProfile,
    setIsRegistering,
    setRegStep,
    setShowLoginModal,
  } = useApp();

  const isFormComplete = isLoggedIn && userProfile?.profileCompletionStatus === 'COMPLETE';

  const [inquiryPackage, setInquiryPackage] = useState<string | null>(null);

  const handleCompleteForm = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      router.push('/');
      return;
    }
    setIsRegistering(true);
    setRegStep(1);
    router.push('/');
  };

  const handleNavigate = (view: string) => {
    router.push('/' + (view === 'home' ? '' : view));
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow">
        {pendingProfileId && (
          <div className="font-sans" style={{
            background: 'linear-gradient(135deg, rgba(111,29,53,0.08) 0%, rgba(184,146,74,0.08) 100%)',
            borderBottom: '2px solid var(--gold-accent)',
            padding: '14px 24px',
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--deep-maroon)',
            fontWeight: 600,
          }}>
            {t('premium.pendingBanner')}
          </div>
        )}
        <div className="container font-sans" style={{ padding: '40px 0 80px 0' }}>
          <SectionHeading
            title={t('premium.title')}
            subtitle={t('premium.subtitle')}
            scriptText={t('premium.script')}
            as="h1"
          />

          <div style={{ marginBottom: '40px', borderRadius: 'var(--border-radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-premium)', position: 'relative', height: '300px' }}>
            <Image
              src="/images/commitment.png"
              alt={t('premium.heroAlt')}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
            />
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(to right, rgba(111, 29, 53, 0.7), rgba(111, 29, 53, 0.1))',
              display: 'flex',
               alignItems: 'center',
              padding: '0 40px'
            }}>
              <div style={{ color: 'white', maxWidth: '500px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', marginBottom: '12px' }}>{t('premium.commitmentTitle')}</h3>
                <p style={{ fontSize: '15px', lineHeight: '1.6', opacity: 0.9 }}>
                  {t('premium.commitmentBody')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', marginBottom: '60px' }}>
            <PremiumPlanCard
              title={t('premium.monthlyTitle')}
              price={300}
              gstRate={0.18}
              billingText="monthly"
              features={tList('premium.monthlyFeatures')}
              isActive={hasPaid300}
              ctaText={t('premium.buyMonthly')}
              onActivate={() => handleRazorpayCheckout('monthly_membership', 300, 'Standard Monthly Membership')}
              onInquire={() => setInquiryPackage('₹300 Monthly Membership')}
              whatsappMessage={t('premium.waMonthly')}
              imageUrl="/images/monthly_active.png"
              hidePrices={!isFormComplete}
              isLoggedIn={isLoggedIn}
              onCompleteForm={handleCompleteForm}
              onShowLogin={() => setShowLoginModal(true)}
            />
            <PremiumPlanCard
              title={t('premium.goodTitle')}
              price={5500}
              gstRate={0.18}
              billingText="one-time base"
              features={tList('premium.goodFeatures')}
              isActive={activePackages.includes('good_profile_package')}
              ctaText={t('premium.buyGood')}
              onActivate={() => handleRazorpayCheckout('good_profile_package', 5500, 'Good Profile Package')}
              onInquire={() => setInquiryPackage('₹5,500 Good Profiles Package')}
              whatsappMessage={t('premium.waGood')}
              badgeText={t('premium.badgeStarter')}
              planTier="basic"
              imageUrl="/images/good_profile.png"
              hidePrices={!isFormComplete}
              isLoggedIn={isLoggedIn}
              onCompleteForm={handleCompleteForm}
              onShowLogin={() => setShowLoginModal(true)}
            />
            <PremiumPlanCard
              title={t('premium.secondTitle')}
              price={11000}
              gstRate={0.18}
              billingText="one-time fee"
              features={tList('premium.secondFeatures')}
              isActive={activePackages.includes('second_marriage_package')}
              ctaText={t('premium.buySecond')}
              onActivate={() => handleRazorpayCheckout('second_marriage_package', 11000, 'Second Marriage')}
              onInquire={() => setInquiryPackage('₹11,000 Second Marriage')}
              whatsappMessage={t('premium.waSecond')}
              badgeText={t('premium.badgeSecond')}
              planTier="silver"
              imageUrl="/images/second_marriage.png"
              hidePrices={!isFormComplete}
              isLoggedIn={isLoggedIn}
              onCompleteForm={handleCompleteForm}
              onShowLogin={() => setShowLoginModal(true)}
            />
            <PremiumPlanCard
              title={t('premium.premiumTitle')}
              price={21000}
              gstRate={0.18}
              billingText="one-time base"
              features={tList('premium.premiumFeatures')}
              isActive={activePackages.includes('high_profile_package')}
              ctaText={t('premium.buyPremium')}
              onActivate={() => handleRazorpayCheckout('high_profile_package', 21000, 'Premium Match Access')}
              onInquire={() => setInquiryPackage('₹21,000 Premium Match Access')}
              whatsappMessage={t('premium.waPremium')}
              badgeText={t('premium.badgePremium')}
              planTier="gold"
              imageUrl="/images/high_profile.png"
              hidePrices={!isFormComplete}
              isLoggedIn={isLoggedIn}
              onCompleteForm={handleCompleteForm}
              onShowLogin={() => setShowLoginModal(true)}
            />
          </div>

          {/* Features Comparison Grid */}
          <div className="card-theme-wrapper" style={{ padding: '36px', marginBottom: '40px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--deep-maroon)', marginBottom: '24px', textAlign: 'center' }}>{t('premium.matrixTitle')}</h3>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', height: '40px', color: 'var(--deep-maroon)', fontWeight: 'bold' }}>
                    <th style={{ textAlign: 'left', padding: '12px' }}>{t('premium.colFeature')}</th>
                    <th>{t('premium.colGood')}</th>
                    <th>{t('premium.colSecond')}</th>
                    <th>{t('premium.colPremium')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>{t('premium.rowDirectory')}</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>{t('premium.rowUnblur')}</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>{t('premium.rowValidity')}</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>{t('premium.rowSecondDir')}</td>
                    <td>—</td>
                    <td>✓</td>
                    <td>✓</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>{t('premium.rowPremiumDir')}</td>
                    <td>—</td>
                    <td>—</td>
                    <td>✓</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>{t('premium.rowMatchmaking')}</td>
                    <td>{t('premium.valBasicMatch')}</td>
                    <td>{t('premium.valPriorityMatch')}</td>
                    <td>{t('premium.valHighPriorityMatch')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>{t('premium.rowShortlist')}</td>
                    <td>—</td>
                    <td>{t('premium.valAssistance')}</td>
                    <td>{t('premium.valPersonalized')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>{t('premium.rowFamily')}</td>
                    <td>—</td>
                    <td>{t('premium.valSupport')}</td>
                    <td>{t('premium.valMeetingSupport')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                    <td style={{ textAlign: 'left', padding: '12px' }}>{t('premium.rowAgent')}</td>
                    <td>—</td>
                    <td>—</td>
                    <td>✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Package Inquiry Modal overlay */}
      {inquiryPackage && (
        <div className="modal-overlay font-sans" onClick={() => setInquiryPackage(null)}>
          <div className="card-theme-wrapper" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', margin: '20px', border: '2px solid var(--gold-accent)', padding: '32px', position: 'relative' }}>
            <FloralCorner position="tl" color="var(--gold-accent)" />
            <FloralCorner position="tr" color="var(--gold-accent)" />
            <button
              onClick={() => setInquiryPackage(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                fontSize: '24px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--deep-maroon)', marginBottom: '16px', textAlign: 'center' }}>
              {t('premium.inquiryModalTitle')}
            </h3>
            <PackageInquiryForm
              defaultPackage={inquiryPackage}
              onSuccess={() => setInquiryPackage(null)}
              onCancel={() => setInquiryPackage(null)}
            />
          </div>
        </div>
      )}

      <PremiumFooter onNavigate={handleNavigate} />
    </>
  );
}
