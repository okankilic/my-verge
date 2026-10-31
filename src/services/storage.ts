import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { BucketItem, CategoryDefinition } from '../types';
import { INITIAL_ITEMS } from '../data/initialData';
import { CATEGORY_VERB_ICONS, DEFAULT_CATEGORIES } from '../data/categories';
import { withStore } from './idb';
import { isNative } from './platform';

const ITEMS_STORAGE_KEY = 'my_verge_bucket_items_v1';
const CATEGORIES_STORAGE_KEY = 'my_verge_categories_v1';
const THEME_STORAGE_KEY = 'my_verge_theme_v1';

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

// Older builds had sub-categories; drop the field so it doesn't linger in saves and backups.
export function normalizeItems<T extends BucketItem>(raw: T[]): BucketItem[] {
  return raw.map((entry) => {
    const { subCategory: _subCategory, ...item } = entry as T & { subCategory?: string };
    return item;
  });
}

export function saveBucketItems(items: BucketItem[]): void {
  queueWrite(ITEMS_STORAGE_KEY, JSON.stringify(items), 'bucket items');
}

// Older data stored the label in `name` (sometimes as "Want to X"); fold it into `verb`.
// Sub-categories were removed, so their list is dropped.
// Known verbs always get their fixed icon, replacing icons hand-picked by older builds.
export function normalizeCategories(raw: unknown[]): CategoryDefinition[] {
  return raw.map((entry) => {
    const { name, defaultSubCategories: _subCategories, ...cat } = entry as CategoryDefinition & {
      name?: string;
      defaultSubCategories?: string[];
    };
    const label = (cat.verb || name || '').replace(/^want to\s+/i, '').trim();
    const verb = label.charAt(0).toUpperCase() + label.slice(1);
    return { ...cat, verb, icon: CATEGORY_VERB_ICONS[verb] ?? cat.icon };
  });
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

// Web: download the JSON. Native: write it to the cache and open the share sheet (Save to Files, AirDrop, Drive...)
export async function exportBackup(items: BucketItem[], categories: CategoryDefinition[]): Promise<void> {
  const data = {
    appName: 'Nowish',
    exportDate: new Date().toISOString(),
    items,
    categories,
  };
  const json = JSON.stringify(data, null, 2);
  const fileName = `nowish-backup-${new Date().toISOString().split('T')[0]}.json`;

  if (isNative) {
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: 'Nowish backup', files: [uri] });
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
