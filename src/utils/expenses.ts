import { BucketItem, WishExpense } from '../types';
import { DEFAULT_CURRENCY } from '../data/currencies';

const formatters = new Map<string, Intl.NumberFormat>();

// One formatter per currency and whole/fractional style, so lists don't rebuild them
function formatterFor(code: string, whole: boolean): Intl.NumberFormat {
  const key = `${code}:${whole}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

// Formats an amount in a currency code for the user's locale, e.g. "$1,800" or "1.234,50 €"
export function formatMoney(amount: number | undefined, code: string = DEFAULT_CURRENCY): string {
  const value = amount ?? 0;
  try {
    return formatterFor(code, Number.isInteger(value)).format(value);
  } catch {
    return `${code} ${value.toLocaleString()}`;
  }
}

// The short symbol shown in front of an amount input and in currency pickers, e.g. "€" or "₺"
export function currencySymbol(code: string = DEFAULT_CURRENCY): string {
  try {
    return (
      new Intl.NumberFormat(undefined, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? code
    );
  } catch {
    return code;
  }
}

export const wishCurrency = (item: BucketItem): string => item.currency ?? DEFAULT_CURRENCY;

// Gives wishes without a currency the default, so changing the default later only affects new wishes
export const stampCurrency = (items: BucketItem[], code: string): BucketItem[] =>
  items.some((i) => !i.currency) ? items.map((i) => (i.currency ? i : { ...i, currency: code })) : items;

export function expenseTotal(expenses: WishExpense[] | undefined): number {
  return (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);
}

export function newExpense(amount: number, note?: string): WishExpense {
  return {
    id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    amount,
    note: note || undefined,
    spentAt: new Date().toISOString(),
  };
}

// Reads a typed amount, accepting a comma as the decimal separator; null unless it's above zero
export function parseAmount(text: string): number | null {
  const amount = Number(text.trim().replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}
