import React, { useRef } from 'react';
import { Download, Upload, Volume2, RefreshCw } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import {
  exportBackup,
  saveBucketItems,
  saveCategories,
  ThemePreference,
} from '../services/storage';
import { INITIAL_ITEMS } from '../data/initialData';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { playChimeSound } from '../services/notifications';
import { confirmAction, notify } from '../services/dialogs';

interface SettingsViewProps {
  items: BucketItem[];
  categories: CategoryDefinition[];
  onReloadData: (items: BucketItem[], categories: CategoryDefinition[]) => void;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  items,
  categories,
  onReloadData,
  theme,
  onThemeChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportBackup(items, categories).catch((err) => {
      // Dismissing the native share sheet rejects; that's not an error worth showing
      if (/cancel/i.test(String(err?.message ?? err))) return;
      console.error('Backup export failed:', err);
      notify('Could not export the backup.', 'error');
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.items && Array.isArray(parsed.items)) {
          saveBucketItems(parsed.items);
          if (parsed.categories && Array.isArray(parsed.categories)) {
            saveCategories(parsed.categories);
            onReloadData(parsed.items, parsed.categories);
          } else {
            onReloadData(parsed.items, categories);
          }
          notify('Backup restored successfully.', 'success');
        } else {
          notify('Invalid backup file format.', 'error');
        }
      } catch (err) {
        notify('Failed to parse backup file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToSample = async () => {
    const confirmed = await confirmAction({
      title: 'Reset to sample journal?',
      message: 'Your entries and categories will be replaced with the original samples.',
      confirmLabel: 'Reset',
      tone: 'danger',
    });
    if (confirmed) {
      saveBucketItems(INITIAL_ITEMS);
      saveCategories(DEFAULT_CATEGORIES);
      onReloadData(INITIAL_ITEMS, DEFAULT_CATEGORIES);
    }
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
                  className={`min-h-[36px] px-3 text-xs rounded-lg transition-colors ${
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

          {/* Backup / Export */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
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
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-ink">Restore from Backup</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">
                Load intentions from a previously saved JSON file
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

          {/* Sound Chime Preview */}
          <div className="bg-card border border-ink/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-ink">Reminder Chime</h4>
              <p className="text-[11px] text-ink/60 mt-0.5">
                Harmonic meditation bell synthesized via Web Audio API
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
            <button
              onClick={handleResetToSample}
              className="w-full min-h-[44px] px-4 py-2 text-xs text-red-600/80 hover:text-red-600 border border-red-500/30 rounded-xl hover:bg-red-500/10 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Sample Intentions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
