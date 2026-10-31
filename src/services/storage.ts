import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { BucketItem, BudgetInfo, CategoryDefinition, WishStep } from '../types';
import { DEFAULT_CURRENCY, LEGACY_CURRENCY_SYMBOLS, isCurrencyCode } from '../data/currencies';
import { INITIAL_ITEMS } from '../data/initialData';
import { LEGACY_PRESET_PATHS } from '../data/presetPhotos';
import { photoKey } from '../utils/photoKey';
import { CATEGORY_VERB_ICONS, DEFAULT_CATEGORIES, KEEP_IN_VAULT_VERBS, MERGED_VERBS } from '../data/categories';
import { withStore } from './idb';
import { isNative } from './platform';

const ITEMS_STORAGE_KEY = 'my_verge_bucket_items_v1';
const CATEGORIES_STORAGE_KEY = 'my_verge_categories_v1';
const THEME_STORAGE_KEY = 'my_verge_theme_v1';
const CURRENCY_STORAGE_KEY = 'my_verge_currency_v1';

// Web: an IndexedDB key/value store. Native: one JSON file per key in the app's data
// directory, which the OS doesn't evict the way it can evict WebView storage.
const DB_NAME = 'my_verge_data_v1';
const STORE = 'kv';

async function readKey(key: string): Promise<string | null> {
  if (isNative) {
    try {
      const { data } = await Filesystem.readFile({
        path: `${key}.json`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return typeof data === 'string' ? data : await data.text();
    } catch {
      // Missing file: nothing saved yet
      return null;
    }
  }
  const value = await withStore<string | undefined>(DB_NAME, STORE, 'readonly', (store) =>
    store.get(key)
  );
  return value ?? null;
}

async function writeKey(key: string, value: string): Promise<void> {
  if (isNative) {
    await Filesystem.writeFile({
      path: `${key}.json`,
      data: value,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return;
  }
  await withStore(DB_NAME, STORE, 'readwrite', (store) => store.put(value, key));
}

// Writes to the same key run one after another, so a slow write never lands after a newer one
const writeQueues = new Map<string, Promise<void>>();

function queueWrite(key: string, value: string, label: string): void {
  const previous = writeQueues.get(key) ?? Promise.resolve();
  const next = previous
    .then(() => writeKey(key, value))
    .catch((err) => console.error(`Failed to save ${label} to storage:`, err));
  writeQueues.set(key, next);
}

export async function loadBucketItems(): Promise<BucketItem[]> {
  try {
    const raw = await readKey(ITEMS_STORAGE_KEY);
    if (!raw) {
      saveBucketItems(INITIAL_ITEMS);
      return INITIAL_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveBucketItems(INITIAL_ITEMS);
      return INITIAL_ITEMS;
    }
    return normalizeItems(parsed);
  } catch (err) {
    console.error('Failed to load bucket items from storage:', err);
    return INITIAL_ITEMS;
  }
}

const MERGED_CATEGORY_IDS: Record<string, string> = Object.fromEntries(
  Object.entries(MERGED_VERBS).map(([from, to]) => [from.toLowerCase(), to.toLowerCase()])
);

// Keeps only well-formed steps; an empty list becomes undefined
function cleanSteps(raw: unknown): WishStep[] | undefined {
  const steps = Array.isArray(raw)
    ? raw.filter((s) => s && typeof s.id === 'string' && typeof s.title === 'string' && s.title.trim())
    : [];
  return steps.length > 0 ? steps : undefined;
}

// Older builds had sub-categories; drop the field so it doesn't linger in saves and backups.
// Wishes in a retired verb move to the verb it merged into.
// Finished wishes from before "Keep in Vault" stay where the Vault used to show them.
// Preset photos saved under their old dev-only paths move to their public/presets ones, captions included.
// Malformed steps (in either checklist) and expenses are dropped.
// The budget's old currency symbol moves to the wish as an ISO code; invalid codes are dropped.
export function normalizeItems<T extends BucketItem>(raw: T[]): BucketItem[] {
  return raw.map((entry) => {
    const { subCategory: _subCategory, ...item } = entry as T & { subCategory?: string };
    if (item.photos?.some((p) => p in LEGACY_PRESET_PATHS)) {
      const notes: Record<string, string> = { ...item.photoNotes };
      item.photos = item.photos.map((p) => {
        const next = LEGACY_PRESET_PATHS[p];
        if (!next) return p;
        const note = notes[photoKey(p)];
        if (note !== undefined) {
          delete notes[photoKey(p)];
          notes[photoKey(next)] = note;
        }
        return next;
      });
      if (item.photoNotes) item.photoNotes = notes;
    }
    item.categoryId = MERGED_CATEGORY_IDS[item.categoryId] ?? item.categoryId;
    // The currency used to be a symbol on the budget; it's now an ISO code on the wish
    if (item.budget && 'currency' in item.budget) {
      const { currency: symbol, ...budget } = item.budget as BudgetInfo & { currency?: string };
      item.budget = budget;
      if (!isCurrencyCode(item.currency)) {
        item.currency = isCurrencyCode(symbol)
          ? symbol
          : (symbol && LEGACY_CURRENCY_SYMBOLS[symbol]) || DEFAULT_CURRENCY;
      }
    }
    if (item.currency !== undefined && !isCurrencyCode(item.currency)) item.currency = undefined;
    // Steps from a hand-edited or damaged backup: keep only well-formed ones
    if (item.steps !== undefined) item.steps = cleanSteps(item.steps);
    if (item.prepSteps !== undefined) item.prepSteps = cleanSteps(item.prepSteps);
    // Same for expenses: keep only ones with an id, a positive amount and a date
    if (item.expenses !== undefined) {
      const expenses = Array.isArray(item.expenses)
        ? item.expenses.filter(
            (e) =>
              e &&
              typeof e.id === 'string' &&
              typeof e.amount === 'number' &&
              Number.isFinite(e.amount) &&
              e.amount > 0 &&
              typeof e.spentAt === 'string'
          )
        : [];
      item.expenses = expenses.length > 0 ? expenses : undefined;
    }
    if (item.status === 'completed' && item.keptInVault === undefined) {
      item.keptInVault =
        item.categoryId === 'read' || item.categoryId === 'watch' || (item.budget?.estimatedCost ?? 0) > 0;
    }
    return item;
  });
}

export function saveBucketItems(items: BucketItem[]): void {
  queueWrite(ITEMS_STORAGE_KEY, JSON.stringify(items), 'bucket items');
}

// Older data stored the label in `name` (sometimes as "Want to X"); fold it into `verb`.
// Sub-categories were removed, so their list is dropped.
// Known verbs always get their fixed icon, replacing icons hand-picked by older builds.
// Every verb is a built-in category: missing ones are added, and the list follows the default order.
// Retired verbs are dropped (normalizeItems moves their wishes).
// Categories created by older builds are kept as they are, so their items keep pointing at them.
export function normalizeCategories(raw: unknown[]): CategoryDefinition[] {
  const stored = raw.map((entry) => {
    const { name, defaultSubCategories: _subCategories, ...cat } = entry as CategoryDefinition & {
      name?: string;
      defaultSubCategories?: string[];
    };
    const label = (cat.verb || name || '').replace(/^want to\s+/i, '').trim();
    const verb = label.charAt(0).toUpperCase() + label.slice(1);
    return {
      ...cat,
      verb,
      icon: CATEGORY_VERB_ICONS[verb] ?? cat.icon,
      keepInVault: cat.keepInVault ?? KEEP_IN_VAULT_VERBS.has(verb),
    };
  }).filter((cat) => !(cat.id in MERGED_CATEGORY_IDS));
  const storedVerbs = new Set(stored.map((cat) => cat.verb));
  const merged = [...stored, ...DEFAULT_CATEGORIES.filter((cat) => !storedVerbs.has(cat.verb))];
  const order = new Map(DEFAULT_CATEGORIES.map((cat, index) => [cat.verb, index]));
  const rank = (cat: CategoryDefinition) => order.get(cat.verb) ?? DEFAULT_CATEGORIES.length;
  return merged.sort((a, b) => rank(a) - rank(b));
}

export async function loadCategories(): Promise<CategoryDefinition[]> {
  try {
    const raw = await readKey(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return normalizeCategories(parsed);
  } catch (err) {
    console.error('Failed to load categories from storage:', err);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: CategoryDefinition[]): void {
  queueWrite(CATEGORIES_STORAGE_KEY, JSON.stringify(categories), 'categories');
}

export type ThemePreference = 'system' | 'light' | 'dark';

export async function loadTheme(): Promise<ThemePreference> {
  try {
    const raw = await readKey(THEME_STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : 'system';
  } catch {
    return 'system';
  }
}

export function saveTheme(theme: ThemePreference): void {
  queueWrite(THEME_STORAGE_KEY, theme, 'theme');
}

// The currency new wishes start with (Settings)
export async function loadDefaultCurrency(): Promise<string> {
  try {
    const raw = await readKey(CURRENCY_STORAGE_KEY);
    return isCurrencyCode(raw) ? raw : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export function saveDefaultCurrency(code: string): void {
  queueWrite(CURRENCY_STORAGE_KEY, code, 'currency');
}

// Web: download the JSON. Native: write it to the cache and open the share sheet (Save to Files, AirDrop, Drive...)
export async function exportBackup(items: BucketItem[], categories: CategoryDefinition[]): Promise<void> {
  const data = {
    appName: 'Make It Real',
    exportDate: new Date().toISOString(),
    items,
    categories,
  };
  const json = JSON.stringify(data, null, 2);
  const fileName = `make-it-real-backup-${new Date().toISOString().split('T')[0]}.json`;

  if (isNative) {
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: 'Make It Real backup', files: [uri] });
    return;
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
