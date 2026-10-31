// Currencies a wish can be priced in, stored as ISO 4217 codes (BucketItem.currency)
export const CURRENCIES: { code: string; label: string }[] = [
  { code: 'USD', label: 'US dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British pound' },
  { code: 'TRY', label: 'Turkish lira' },
  { code: 'JPY', label: 'Japanese yen' },
  { code: 'CHF', label: 'Swiss franc' },
  { code: 'CAD', label: 'Canadian dollar' },
  { code: 'AUD', label: 'Australian dollar' },
  { code: 'CNY', label: 'Chinese yuan' },
  { code: 'INR', label: 'Indian rupee' },
  { code: 'SEK', label: 'Swedish krona' },
  { code: 'NOK', label: 'Norwegian krone' },
  { code: 'DKK', label: 'Danish krone' },
  { code: 'PLN', label: 'Polish złoty' },
  { code: 'BRL', label: 'Brazilian real' },
  { code: 'MXN', label: 'Mexican peso' },
];

export const DEFAULT_CURRENCY = 'USD';

// Older builds stored a symbol on the budget; these map to their codes (anything else becomes USD)
export const LEGACY_CURRENCY_SYMBOLS: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '₺': 'TRY',
  '¥': 'JPY',
};

export const isCurrencyCode = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Z]{3}$/.test(value);
