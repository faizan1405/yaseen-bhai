'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import en from './en';
import ur from './ur';
import {
  Locale,
  DIR,
  DEFAULT_LOCALE,
  STORAGE_KEY,
  LOCALES,
} from './types';

const DICTS = { en, ur } as const;

interface I18nContextValue {
  lang: Locale;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  setLang: (lang: Locale) => void;
  toggleLang: () => void;
  /**
   * Translate a dot-notated key, e.g. t('nav.home').
   * Falls back to the English value, then to the raw key, if not found.
   * `vars` interpolates {placeholders} in the string.
   */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /**
   * Resolve a key whose value is a string array (e.g. package feature lists),
   * falling back to the English array, then to an empty array.
   */
  tList: (key: string) => string[];
  /**
   * Pick the right value from a DB record that may carry `_ur` fields.
   * pickDb(profile, 'city') -> profile.city_ur (Urdu) || profile.city (fallback)
   */
  pickDb: <T extends Record<string, unknown>>(obj: T | null | undefined, field: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolve(dict: unknown, key: string): string | undefined {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict) as string | undefined;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, name) =>
    name in vars ? String(vars[name]) : `{${name}}`
  );
}

function readInitialLang(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (LOCALES as string[]).includes(stored)) return stored as Locale;
  } catch {
    /* localStorage blocked (private mode) — fall through */
  }
  return DEFAULT_LOCALE;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start from the default so server and first client render match
  // (avoids hydration mismatch). The stored preference is applied in an effect.
  const [lang, setLangState] = useState<Locale>(DEFAULT_LOCALE);

  // Apply persisted preference once mounted.
  useEffect(() => {
    const initial = readInitialLang();
    if (initial !== lang) setLangState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep <html lang> / <html dir> and persistence in sync with the language.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const dir = DIR[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.setAttribute('data-lang', lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
      // Cookie mirror so the preference is also available to the server / other
      // tabs and survives across visits (1 year).
      document.cookie = `${STORAGE_KEY}=${lang};path=/;max-age=31536000;samesite=lax`;
    } catch {
      /* ignore storage errors */
    }
  }, [lang]);

  const setLang = useCallback((next: Locale) => setLangState(next), []);
  const toggleLang = useCallback(
    () => setLangState((prev) => (prev === 'en' ? 'ur' : 'en')),
    []
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const primary = resolve(DICTS[lang], key);
      if (typeof primary === 'string') return interpolate(primary, vars);
      const fallback = resolve(DICTS.en, key);
      if (typeof fallback === 'string') return interpolate(fallback, vars);
      return key;
    },
    [lang]
  );

  const tList = useCallback(
    (key: string): string[] => {
      const primary = resolve(DICTS[lang], key);
      if (Array.isArray(primary)) return primary as string[];
      const fallback = resolve(DICTS.en, key);
      if (Array.isArray(fallback)) return fallback as string[];
      return [];
    },
    [lang]
  );

  const pickDb = useCallback(
    <T extends Record<string, unknown>>(obj: T | null | undefined, field: string): string => {
      if (!obj) return '';
      if (lang === 'ur') {
        const localized = obj[`${field}_ur`];
        if (typeof localized === 'string' && localized.trim()) return localized;
      }
      const base = obj[field];
      return typeof base === 'string' ? base : base != null ? String(base) : '';
    },
    [lang]
  );

  const value: I18nContextValue = {
    lang,
    dir: DIR[lang],
    isRTL: lang === 'ur',
    setLang,
    toggleLang,
    t,
    tList,
    pickDb,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an <I18nProvider>');
  }
  return ctx;
}

export default I18nProvider;
