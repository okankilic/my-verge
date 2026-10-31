import React, { useEffect, useRef, useState } from 'react';
import { Bell, Download, Upload, Volume2, RefreshCw } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { exportBackup, normalizeCategories, normalizeItems, ThemePreference } from '../services/storage';
import { INITIAL_ITEMS } from '../data/initialData';
import { DEFAULT_CATEGORIES } from '../data/categories';
import {
  playChimeSound,
  getNotificationPermission,
  requestNotificationPermission,
} from '../services/notifications';
import { deleteAttachmentBlobs } from '../services/attachments';
import { notify } from '../services/dialogs';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { CURRENCIES } from '../data/currencies';
import { currencySymbol } from '../utils/expenses';

interface SettingsViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onReloadData: (items: BucketItem[], categories: CategoryDefinition[]) => void;
  onCategoriesChange: (categories: CategoryDefinition[]) => void;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  defaultCurrency: string;
  onDefaultCurrencyChange: (code: string) => void;
  onNotificationsEnabled: () => void;
}

// Inline two-step confirm for the irreversible actions here (no confirm dialogs in this app)
const InlineConfirm: React.FC<{
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ message, confirmLabel, onConfirm, onCancel }) => (
  <div role="group" className="mt-3 pt-3 border-t border-ink/10 animate-in fade-in duration-150">
    <p className="text-xs text-ink/75 leading-relaxed break-words">{message}</p>
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 min-h-[44px] px-4 text-xs font-medium text-ink bg-paper border border-ink/15 rounded-xl active:bg-paper-deep transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="flex-1 min-h-[44px] px-4 text-xs font-semibold text-white bg-red-600 rounded-xl active:bg-red-700 transition-colors"
      >
        {confirmLabel}
      </button>
    </div>
  </div>
);

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  items,
  categories,
  onReloadData,
  onCategoriesChange,
  theme,
  onThemeChange,
  defaultCurrency,
  onDefaultCurrencyChange,
  onNotificationsEnabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notificationState, setNotificationState] = useState<string>('unsupported');
  const [pendingRestore, setPendingRestore] = useState<{
    items: BucketItem[];
    categories: CategoryDefinition[];
    fileName: string;
  } | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  useEffect(() => {
    getNotificationPermission().then(setNotificationState);
  }, []);

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotificationState(res);
    if (res === 'granted') onNotificationsEnabled();
  };

  // Drop attachment blobs that the incoming items no longer reference
  const deleteOrphanedBlobs = (nextItems: BucketItem[]) => {
    const keep = new Set(nextItems.flatMap((i) => i.attachments?.map((a) => a.id) ?? []));
    const orphaned = items
      .flatMap((i) => i.attachments?.map((a) => a.id) ?? [])
      .filter((id) => !keep.has(id));
    deleteAttachmentBlobs(orphaned).catch((err) =>
      console.error('Failed to delete attachments:', err)
    );
  };

  const handleExport = () => {
    exportBackup(items, categories).catch((err) => {
      // Dismissing the native share sheet rejects; that's not an error worth showing
      if (/cancel/i.test(String(err?.message ?? err))) return;
      console.error('Backup export failed:', err);
      notify("Couldn't save the backup. Try again?", 'error');
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange
    e.target.value = '';
    if (!file) return;

    let parsed: { items?: unknown; categories?: unknown };
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      notify("That file couldn't be read. Is it a Make It Real backup?", 'error');
      return;
    }

    // Keep only entries that look like items, and fill in fields the views rely on
    const importedItems: BucketItem[] = Array.isArray(parsed.items)
      ? normalizeItems(
          parsed.items
            .filter(
              (i): i is BucketItem =>
                Boolean(i) && typeof i.id === 'string' && typeof i.title === 'string'
            )
            .map((i) => ({ ...i, description: i.description ?? '', photos: i.photos ?? [] }))
        )
      : [];
    if (importedItems.length === 0) {
      notify("That doesn't look like a Make It Real backup.", 'error');
      return;
    }
    const importedCategories =
      Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? normalizeCategories(parsed.categories)
        : categories;

    // Applied only after the inline confirm below
    setPendingRestore({ items: importedItems, categories: importedCategories, fileName: file.name });
  };

  const handleConfirmRestore = () => {
    if (!pendingRestore) return;
    deleteOrphanedBlobs(pendingRestore.items);
    onReloadData(pendingRestore.items, pendingRestore.categories);
    setPendingRestore(null);
    notify('Welcome back! Your journal is restored.', 'success');
  };

  const handleResetToSample = () => {
    deleteOrphanedBlobs(INITIAL_ITEMS);
    onReloadData(INITIAL_ITEMS, DEFAULT_CATEGORIES);
    setIsConfirmingReset(false);
    notify('Fresh start! The samples are back.', 'success');
  };

  return (
    <div className="max-w-xl mx-auto animate-in fade-in duration-150">
      <div>

        <div className="space-y-4">
          {/* Appearance */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold text-ink">Appearance</h4>
            <div role="radiogroup" aria-label="Appearance" className="flex items-center gap-1 p-1 bg-paper rounded-xl">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={theme === opt.value}
                  onClick={() => onThemeChange(opt.value)}
                  className={`min-h-[44px] px-3 text-xs rounded-lg transition-colors ${
                    theme === opt.value
                      ? 'bg-ink text-paper font-semibold shadow-2xs'
                      : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Currency: what new wishes start with; each wish can change its own */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-ink">Currency</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">
                New wishes start with this. You can change it on each wish.
              </p>
            </div>
            <select
              value={defaultCurrency}
              onChange={(e) => onDefaultCurrencyChange(e.target.value)}
              aria-label="Default currency"
              className="shrink-0 min-h-[44px] px-3 text-xs bg-paper border border-ink/15 rounded-xl text-ink focus:outline-none focus:border-ink"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {currencySymbol(c.code)} · {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vault: which categories' finished wishes start out kept */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4">
            <h4 className="text-xs font-semibold text-ink">Keep finished wishes from</h4>
            <p className="text-[11px] text-ink/60 mt-0.5">
              Keep in Vault starts on for these categories. You can still change it each time you finish a wish.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isOn = Boolean(cat.keepInVault);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isOn}
                    onClick={() =>
                      onCategoriesChange(
                        categories.map((c) => (c.id === cat.id ? { ...c, keepInVault: !isOn } : c))
                      )
                    }
                    className={`min-h-[44px] px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                      isOn
                        ? 'border-ink bg-ink text-paper font-semibold'
                        : 'border-ink/15 bg-paper text-ink/75'
                    }`}
                  >
                    <span style={isOn ? undefined : { color: cat.accentColor }}>
                      {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                    </span>
                    <span>{cat.verb}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backup / Export */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-ink">Export Full Backup</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">
                Download all your lists, categories, and reflections as JSON
              </p>
            </div>
            <button
              onClick={handleExport}
              className="min-h-[44px] px-3.5 py-1.5 text-xs font-semibold bg-ink text-paper rounded-xl hover:bg-ink/85 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Import / Restore */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-ink">Restore from Backup</h4>
                <p className="text-[11px] text-ink/60 mt-0.5">
                  Load wishes from a previously saved JSON file
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] px-3.5 py-1.5 text-xs font-semibold bg-card border border-ink/20 text-ink rounded-xl hover:bg-paper transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
            </div>
            {pendingRestore && (
              <InlineConfirm
                message={`This swaps your journal for ${pendingRestore.items.length} ${
                  pendingRestore.items.length === 1 ? 'entry' : 'entries'
                } from "${pendingRestore.fileName}".`}
                confirmLabel="Restore"
                onConfirm={handleConfirmRestore}
                onCancel={() => setPendingRestore(null)}
              />
            )}
          </div>

          {/* Notifications */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-ink">Reminder Alerts</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">
                {notificationState === 'granted'
                  ? 'On. Reminders arrive as notifications.'
                  : notificationState === 'denied'
                    ? 'Off. Turn them on in your system settings.'
                    : notificationState === 'unsupported'
                      ? "This device can't show notifications."
                      : 'Get a nudge when a reminder is due.'}
              </p>
            </div>
            {notificationState === 'default' && (
              <button
                onClick={handleEnableNotifications}
                className="min-h-[44px] px-3.5 py-1.5 text-xs font-semibold bg-ink text-paper rounded-xl hover:bg-ink/85 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable</span>
              </button>
            )}
          </div>

          {/* Sound Chime Preview */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-ink">Reminder Chime</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">
                A soft bell that plays with each reminder.
              </p>
            </div>
            <button
              onClick={() => playChimeSound()}
              className="min-h-[44px] px-3.5 py-1.5 text-xs font-medium border border-ink/20 rounded-xl hover:bg-paper flex items-center gap-1.5 shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Test</span>
            </button>
          </div>

          {/* Reset to sample data */}
          <div className="pt-2">
            {isConfirmingReset ? (
              <div className="bg-card border border-red-500/30 rounded-2xl p-4">
                <h4 className="text-xs font-semibold text-ink">Reset to sample journal?</h4>
                <InlineConfirm
                  message="This swaps your wishes, photos and files for the samples."
                  confirmLabel="Reset"
                  onConfirm={handleResetToSample}
                  onCancel={() => setIsConfirmingReset(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingReset(true)}
                className="w-full min-h-[44px] px-4 py-2 text-xs text-red-600/80 hover:text-red-600 border border-red-500/30 rounded-xl hover:bg-red-500/10 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
