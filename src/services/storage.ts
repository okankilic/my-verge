import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { BucketItem, CategoryDefinition } from '../types';
import { INITIAL_ITEMS } from '../data/initialData';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { isNative } from './platform';

const ITEMS_STORAGE_KEY = 'my_verge_bucket_items_v1';
const CATEGORIES_STORAGE_KEY = 'my_verge_categories_v1';
// Also read by the inline script in index.html; keep the two in sync
const THEME_STORAGE_KEY = 'my_verge_theme_v1';

export function loadBucketItems(): BucketItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_STORAGE_KEY);
    if (!raw) {
      saveBucketItems(INITIAL_ITEMS);
      return INITIAL_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveBucketItems(INITIAL_ITEMS);
      return INITIAL_ITEMS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load bucket items from storage:', err);
    return INITIAL_ITEMS;
  }
}

export function saveBucketItems(items: BucketItem[]): void {
  try {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save bucket items to storage:', err);
  }
}

export function loadCategories(): CategoryDefinition[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    // Migrate any legacy names starting with "Want to " to action names
    const cleaned = parsed.map((cat: CategoryDefinition) => {
      if (typeof cat.name === 'string' && /^want to\s+/i.test(cat.name)) {
        const action = cat.name.replace(/^want to\s+/i, '').trim();
        const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);
        return {
          ...cat,
          name: actionCapitalized,
          verb: actionCapitalized,
        };
      }
      return cat;
    });
    return cleaned;
  } catch (err) {
    console.error('Failed to load categories from storage:', err);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: CategoryDefinition[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories to storage:', err);
  }
}

export type ThemePreference = 'system' | 'light' | 'dark';

export function loadTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : 'system';
  } catch {
    return 'system';
  }
}

export function saveTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (err) {
    console.error('Failed to save theme to storage:', err);
  }
}

// Web: download the JSON. Native: write it to the cache and open the share sheet (Save to Files, AirDrop, Drive...)
export async function exportBackup(items: BucketItem[], categories: CategoryDefinition[]): Promise<void> {
  const data = {
    appName: 'My Verge',
    exportDate: new Date().toISOString(),
    items,
    categories,
  };
  const json = JSON.stringify(data, null, 2);
  const fileName = `my-verge-backup-${new Date().toISOString().split('T')[0]}.json`;

  if (isNative) {
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: 'My Verge backup', files: [uri] });
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
