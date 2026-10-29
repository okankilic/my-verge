import React, { useRef } from 'react';
import { X, Download, Upload, Volume2, RefreshCw, ShieldCheck, Heart } from 'lucide-react';
import { BucketItem, CategoryDefinition } from '../types';
import { exportBackup, saveBucketItems, saveCategories } from '../services/storage';
import { INITIAL_ITEMS } from '../data/initialData';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { playChimeSound } from '../services/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BucketItem[];
  categories: CategoryDefinition[];
  onReloadData: (items: BucketItem[], categories: CategoryDefinition[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  items,
  categories,
  onReloadData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportBackup(items, categories);
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
          alert('Backup restored successfully!');
          onClose();
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToSample = () => {
    if (window.confirm('Reset journal to original sample entries and categories?')) {
      saveBucketItems(INITIAL_ITEMS);
      saveCategories(DEFAULT_CATEGORIES);
      onReloadData(INITIAL_ITEMS, DEFAULT_CATEGORIES);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#FAF7F2] border border-[#1E1915]/15 rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#1E1915]/50 hover:text-[#1E1915] rounded-full hover:bg-black/5"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-serif-journal text-xl font-medium text-[#1E1915] mb-1">
          Journal Settings & Data
        </h2>
        <p className="text-xs text-[#1E1915]/65 mb-5">
          Privacy-first local storage with one-click export and import.
        </p>

        <div className="space-y-4">
          {/* Backup / Export */}
          <div className="bg-white border border-[#1E1915]/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-[#1E1915]">Export Full Backup</h4>
              <p className="text-[11px] text-[#1E1915]/60 mt-0.5">
                Download all your lists, categories, and reflections as JSON
              </p>
            </div>
            <button
              onClick={handleExport}
              className="min-h-[44px] px-3.5 py-1.5 text-xs font-semibold bg-[#1E1915] text-white rounded-xl hover:bg-[#332b24] transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Import / Restore */}
          <div className="bg-white border border-[#1E1915]/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-[#1E1915]">Restore from Backup</h4>
              <p className="text-[11px] text-[#1E1915]/60 mt-0.5">
                Load intentions from a previously saved JSON file
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-3.5 py-1.5 text-xs font-semibold bg-white border border-[#1E1915]/20 text-[#1E1915] rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 shrink-0"
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
          <div className="bg-white border border-[#1E1915]/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-[#1E1915]">Reminder Chime</h4>
              <p className="text-[11px] text-[#1E1915]/60 mt-0.5">
                Harmonic meditation bell synthesized via Web Audio API
              </p>
            </div>
            <button
              onClick={() => playChimeSound()}
              className="min-h-[44px] px-3.5 py-1.5 text-xs font-medium border border-[#1E1915]/20 rounded-xl hover:bg-[#FAF7F2] flex items-center gap-1.5 shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Test</span>
            </button>
          </div>

          {/* Reset to sample data */}
          <div className="pt-2">
            <button
              onClick={handleResetToSample}
              className="w-full min-h-[44px] px-4 py-2 text-xs text-red-700/80 hover:text-red-700 border border-red-200/60 rounded-xl hover:bg-red-50/50 flex items-center justify-center gap-1.5 transition-colors"
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
