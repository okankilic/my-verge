import { BucketItem, CategoryDefinition } from '../types';
import { INITIAL_ITEMS } from '../data/initialData';
import { DEFAULT_CATEGORIES } from '../data/categories';

const ITEMS_STORAGE_KEY = 'my_verge_bucket_items_v1';
const CATEGORIES_STORAGE_KEY = 'my_verge_categories_v1';

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

export function exportBackup(items: BucketItem[], categories: CategoryDefinition[]): void {
  const data = {
    appName: 'My Verge',
    exportDate: new Date().toISOString(),
    items,
    categories,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `my-verge-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
