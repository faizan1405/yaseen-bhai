'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nProvider';

interface ProfileInterestFormProps {
  profileId: string;
  profileName?: string;
  profileCategory?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProfileInterestForm: React.FC<ProfileInterestFormProps> = ({
  profileId,
  profileName,
  profileCategory,
  onSuccess,
  onCancel
}) => {
  const { userProfile, isLoggedIn, getRequestHeaders, setReloadTrigger } = useApp();
  const { t } = useI18n();
  const resolvedProfileName = profileName ?? t('interestForm.protectedProfile');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [packageInterest, setPackageInterest] = useState('');
  const [honey, setHoney] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pre-fill user profile fields
  useEffect(() => {
    if (isLoggedIn && userProfile) {
      setFullName(userProfile.fullName || '');
      setPhone(userProfile.phoneNumber || '');
      setCity(userProfile.city || '');
      if ((userProfile as any).email) {
        setEmail((userProfile as any).email);
      }
    }
  }, [isLoggedIn, userProfile]);

  // Set default package interest if profile has a category
  useEffect(() => {
    if (profileCategory === 'good_profile') {
      setPackageInterest('₹500 Good Profiles Package');
    } else if (profileCategory === 'second_marriage') {
      setPackageInterest('₹600 Second Marriage');
    } else if (profileCategory === 'high_profile') {
      setPackageInterest('₹800 Premium Match Access');
    }
  }, [profileCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const sourcePage = typeof window !== 'undefined' ? `${window.location.pathname}?id=${profileId}` : `/search?id=${profileId}`;

    try {
      const headers = getRequestHeaders();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fullName,
          phone,
          email: email || undefined,
          city,
          message: message || undefined,
          inquiryType: 'Profile Help',
          interestedPackage: packageInterest || undefined,
          interestedProfileId: profileId,
          sourcePage,
          _honey: honey
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('interestForm.errorGeneric'));
      }

      setSuccessMsg(data.message || t('interestForm.successDefault'));
      setMessage('');
      setReloadTrigger((prev: number) => prev + 1);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-interest-form font-sans">
      {successMsg ? (
        <div style={{
          textAlign: 'center',
          padding: '24px 12px',
          backgroundColor: 'rgba(248, 241, 231, 0.95)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1.5px solid var(--gold-accent)'
        }}>
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>❤️</span>
          <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-brand)', fontSize: '18px', marginBottom: '6px' }}>
            {t('interestForm.successTitle')}
          </h4>
          <p style={{ color: 'var(--text-dark)', fontSize: '13px', lineHeight: '1.5' }}>
            {successMsg} {t('interestForm.successSuffix')}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            backgroundColor: 'var(--warm-ivory)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            color: 'var(--text-dark)',
            marginBottom: '8px'
          }}>
            📍 {t('interestForm.expressingIntro')} <strong>{resolvedProfileName}</strong>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t('interestForm.note')}
            </span>
          </div>

          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(4, 120, 87, 0.08)',
              color: 'var(--deep-maroon)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              border: '1px solid rgba(4,120,87,0.15)'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="form-group" style={{ display: 'none' }}>
            <label htmlFor="_honey">{t('interestForm.honeyLabel')}</label>
            <input type="text" id="_honey" name="_honey" value={honey} onChange={(e) => setHoney(e.target.value)} tabIndex={-1} autoComplete="off" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="interestFullName">{t('interestForm.fullName')}</label>
            <input
              id="interestFullName"
              type="text"
              className="form-control"
              placeholder={t('interestForm.phFullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-mobile-1">
            <div className="form-group">
              <label className="form-label" htmlFor="interestPhone">{t('interestForm.phone')}</label>
              <input
                id="interestPhone"
                type="tel"
                className="form-control"
                placeholder={t('interestForm.phPhone')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="interestCity">{t('interestForm.city')}</label>
              <input
                id="interestCity"
                type="text"
                className="form-control"
                placeholder={t('interestForm.phCity')}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="interestEmail">{t('interestForm.email')} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('interestForm.optional')}</span></label>
            <input
              id="interestEmail"
              type="email"
              className="form-control"
              placeholder={t('interestForm.phEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="interestPackage">{t('interestForm.interestedPackage')} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('interestForm.optional')}</span></label>
            <select
              id="interestPackage"
              className="form-control"
              value={packageInterest}
              onChange={(e) => setPackageInterest(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">{t('interestForm.optNone')}</option>
              <option value="₹300 Monthly Membership">{t('interestForm.optMonthly')}</option>
              <option value="₹500 Good Profiles Package">{t('interestForm.optGood')}</option>
              <option value="₹600 Second Marriage">{t('interestForm.optSecond')}</option>
              <option value="₹800 Premium Match Access">{t('interestForm.optPremium')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="interestMessage">{t('interestForm.message')} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('interestForm.optional')}</span></label>
            <textarea
              id="interestMessage"
              className="form-control"
              rows={2}
              placeholder={t('interestForm.phMessage')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            {onCancel && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                style={{ flex: 1, padding: '8px' }}
                disabled={isSubmitting}
              >
                {t('interestForm.cancel')}
              </button>
            )}
            <button
              type="submit"
              className="btn btn-gold"
              style={{ flex: 2, padding: '8px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('interestForm.submitting') : t('interestForm.submit')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfileInterestForm;
