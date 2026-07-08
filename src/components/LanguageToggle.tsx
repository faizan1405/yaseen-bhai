'use client';

import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

interface LanguageToggleProps {
  /** 'nav' = compact pill for the header, 'block' = full-width for mobile drawer. */
  variant?: 'nav' | 'block';
  className?: string;
}

/**
 * Language switch button. Shows "اردو" while in English and "English" while in
 * Urdu, and flips the whole site instantly (no reload). The choice is persisted
 * by the I18nProvider (localStorage + cookie).
 */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'nav',
  className = '',
}) => {
  const { toggleLang, t, lang } = useI18n();

  // The label is the language we switch TO. When in English the label is Urdu
  // (so render it with the Urdu font); when in Urdu the label is "English".
  const labelIsUrdu = lang === 'en';

  return (
    <button
      type="button"
      onClick={toggleLang}
      className={`lang-toggle lang-toggle-${variant} ${className}`}
      aria-label={t('language.ariaLabel')}
      title={t('language.ariaLabel')}
    >
      <svg
        className="lang-toggle-icon"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span
        className="lang-toggle-label"
        style={labelIsUrdu ? { fontFamily: 'var(--font-urdu)' } : undefined}
      >
        {t('language.switchTo')}
      </span>
    </button>
  );
};

export default LanguageToggle;
