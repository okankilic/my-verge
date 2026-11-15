import { en, type Entry, type MessageKey } from './locales/en';
import { de } from './locales/de';
import { es } from './locales/es';
import { tr } from './locales/tr';

export type Locale = 'en' | 'de' | 'es' | 'tr';
export type LanguagePreference = 'system' | Locale;
export type { MessageKey } from './locales/en';

export const LOCALES: Locale[] = ['en', 'de', 'es', 'tr'];

// Each language's own name, shown in the Settings picker
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  tr: 'Türkçe',
};

const CATALOGS: Record<Locale, Record<MessageKey, Entry>> = { en, de, es, tr };

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as string[]).includes(value);

// The first device/browser language the app has a catalog for, else English
export function detectLocale(): Locale {
  const langs =
    typeof navigator !== 'undefined' ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : [];
  for (const lang of langs) {
    const primary = (lang || '').toLowerCase().split('-')[0];
    if (isLocale(primary)) return primary;
  }
  return 'en';
}

export const resolveLocale = (pref: LanguagePreference): Locale => (pref === 'system' ? detectLocale() : pref);

// Module-level so services and helpers outside React can translate too. App re-renders the whole
// tree when the language changes, so components pick the new locale up on that render.
let currentLocale: Locale = detectLocale();
applyDocumentLang(currentLocale);

function applyDocumentLang(locale: Locale) {
  if (typeof document === 'undefined') return;
  // CSS `uppercase` and hyphenation follow <html lang> (e.g. Turkish dotted İ)
  document.documentElement.lang = locale;
  document.title = `Wishcrumbs — ${CATALOGS[locale]['brand.tagline']}`;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  applyDocumentLang(locale);
}

export const getLocale = (): Locale => currentLocale;

export type Vars = Record<string, string | number>;

const pluralRules = new Map<Locale, Intl.PluralRules>();
function pluralCategory(locale: Locale, count: number): Intl.LDMLPluralRule {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }
  return rules.select(count);
}

// Translates a key: `{name}` placeholders are filled from vars, and a plural entry picks its form from vars.count
export function t(key: MessageKey, vars?: Vars): string {
  const entry = CATALOGS[currentLocale][key] ?? en[key];
  let text: string;
  if (typeof entry === 'string') {
    text = entry;
  } else {
    const count = Number(vars?.count ?? 0);
    const form = pluralCategory(currentLocale, count);
    text = (form === 'one' ? entry.one : undefined) ?? entry.other;
  }
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(name === 'count' ? formatNumber(Number(vars[name])) : vars[name]) : match
  );
}

// True when the catalog has this key (used for per-id lookups such as categories and samples)
export const hasKey = (key: string): key is MessageKey => key in en;

// Dates and numbers always use the app's language, never the browser default
export const formatDate = (date: Date | number | string, options: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleDateString(currentLocale, options);

export const formatTime = (date: Date | number | string, options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }) =>
  new Date(date).toLocaleTimeString(currentLocale, options);

export const formatDateTime = (date: Date | number | string, options: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleString(currentLocale, options);

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  value.toLocaleString(currentLocale, options);
