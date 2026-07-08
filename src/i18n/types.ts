import type en from './en';

// The English dictionary is the source of truth for the shape of a translation.
// A DeepPartial is used for other languages so a locale may omit keys and fall
// back to English at runtime without a type error.
export type Translation = DeepPartial<typeof en>;

export type Locale = 'en' | 'ur';

export const LOCALES: Locale[] = ['en', 'ur'];
export const DEFAULT_LOCALE: Locale = 'en';

// Direction per locale. Urdu is right-to-left.
export const DIR: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ur: 'rtl',
};

// localStorage key + cookie name used to persist the visitor's choice.
export const STORAGE_KEY = 'asannikah.lang';

type DeepPartial<T> = {
  // Arrays (e.g. feature lists) stay whole arrays; nested objects recurse.
  [K in keyof T]?: T[K] extends (infer U)[]
    ? U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
