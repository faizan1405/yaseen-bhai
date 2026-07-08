// Localizes short controlled DB enum values (gender, marital status, etc.)
// that are stored in English in the database. These are UI-facing labels, but
// they are NOT free-text DB content — so instead of requiring an Urdu column,
// we map the known values to translation keys and fall back to the raw stored
// value if it is unrecognized. Keeps ProfileCard / filters / details clean.
import type { useI18n } from './I18nProvider';

type TFn = ReturnType<typeof useI18n>['t'];

// Map a stored value to its enums.* key stem (lowercased, spaces→underscore).
function enumKey(value: string): string {
  return 'enums.' + value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * localizeEnum(t, 'Female') -> 'خاتون' (ur) / 'Female' (en) / raw value if unknown.
 * Because t() returns the key itself when a translation is missing, we detect
 * that and fall back to the original English value so nothing ever shows a key.
 */
export function localizeEnum(t: TFn, value: string | null | undefined): string {
  if (!value) return '';
  const key = enumKey(value);
  const translated = t(key);
  return translated === key ? value : translated;
}
