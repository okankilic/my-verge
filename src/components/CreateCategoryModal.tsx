import React, { useState } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';
import { CategoryDefinition } from '../types';
import { CATEGORY_VERBS } from '../data/categories';
import { AVAILABLE_CATEGORY_ICONS, renderCategoryIcon } from '../utils/categoryIcons';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDefinition[];
  onCreateCategory: (category: CategoryDefinition) => void;
}

const COLOR_PRESETS = [
  { label: 'Terracotta', color: '#B45309' },
  { label: 'Cobalt', color: '#2563EB' },
  { label: 'Forest', color: '#059669' },
  { label: 'Violet', color: '#7C3AED' },
  { label: 'Rust', color: '#C05621' },
  { label: 'Burgundy', color: '#BE185D' },
  { label: 'Ochre', color: '#D97706' },
  { label: 'Sage', color: '#4D7C0F' },
  { label: 'Indigo', color: '#4338CA' },
  { label: 'Espresso', color: '#332B24' },
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
}) => {
  const [selectedVerb, setSelectedVerb] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState('Sparkles');
  const [selectedColor, setSelectedColor] = useState('#B45309');
  const [tagline, setTagline] = useState('');
  const [subCategoriesInput, setSubCategoriesInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const usedVerbs = new Set(categories.map((c) => c.verb.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerb) {
      setError('Please pick an action for this category.');
      return;
    }
    const formatted = selectedVerb;

    // Parse subcategories from comma or newline separation
    const parsedSubCategories = subCategoriesInput
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const slug =
      formatted
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;

    const newCategory: CategoryDefinition = {
      id: `custom-${slug}-${Date.now().toString(36).slice(-4)}`,
      verb: formatted,
      icon: selectedIcon,
      tagline: tagline.trim() || `${formatted} milestones & experiences`,
      defaultSubCategories: parsedSubCategories,
      accentColor: selectedColor,
    };

    onCreateCategory(newCategory);
    // Reset state
    setSelectedVerb(null);
    setSelectedIcon('Sparkles');
    setSelectedColor('#B45309');
    setTagline('');
    setSubCategoriesInput('');
    setError('');
    onClose();
  };

  const previewDisplayName = selectedVerb ?? 'New Category';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-paper border border-ink/15 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/10 flex items-center justify-between bg-card">
          <div>
            <h2 className="font-serif-journal text-xl font-medium text-ink">
              New Custom Category
            </h2>
            <p className="text-xs text-ink/60 mt-0.5">
              Create a custom action horizon for your journal & intentions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Ribbon Preview */}
        <div className="px-5 py-3 bg-paper border-b border-ink/8 flex items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-wider text-ink/50 font-semibold">
            Ribbon Preview:
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-ink text-paper shadow-2xs">
            <span style={{ color: selectedColor }}>
              {renderCategoryIcon(selectedIcon, 'w-3.5 h-3.5')}
            </span>
            <span>{previewDisplayName}</span>
            <span className="text-[10px] opacity-70 font-mono">0</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 text-xs text-red-600 bg-red-500/10 border border-red-500/30 rounded-lg">
              {error}
            </div>
          )}

          {/* Action verb */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
              Action *
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-card border border-ink/10 rounded-lg">
              {CATEGORY_VERBS.map((verb) => {
                const isSelected = selectedVerb === verb;
                const isTaken = usedVerbs.has(verb.toLowerCase());
                return (
                  <button
                    key={verb}
                    type="button"
                    disabled={isTaken}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedVerb(verb);
                      if (error) setError('');
                    }}
                    className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-all ${
                      isSelected
                        ? 'bg-ink text-paper shadow-2xs'
                        : isTaken
                          ? 'text-ink/25 line-through cursor-not-allowed'
                          : 'text-ink/70 hover:text-ink hover:bg-paper'
                    }`}
                  >
                    {verb}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-ink/50 mt-1">
              Pick the action this category is about
            </p>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
              Select Icon
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-card border border-ink/10 rounded-lg">
              {AVAILABLE_CATEGORY_ICONS.map((opt) => {
                const isSelected = selectedIcon === opt.name;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setSelectedIcon(opt.name)}
                    title={opt.label}
                    className={`min-h-[36px] min-w-[36px] p-2 flex items-center justify-center rounded-lg transition-all ${
                      isSelected
                        ? 'bg-ink text-paper shadow-2xs scale-105'
                        : 'text-ink/60 hover:text-ink hover:bg-paper'
                    }`}
                  >
                    {renderCategoryIcon(opt.name, 'w-4 h-4')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color Palette */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
              Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2 bg-card border border-ink/10 rounded-lg">
              {COLOR_PRESETS.map((p) => {
                const isSelected = selectedColor === p.color;
                return (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setSelectedColor(p.color)}
                    title={p.label}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-offset-2 ring-offset-card ring-ink scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: p.color }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tagline / Motto */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1">
              Tagline or Horizon Theme (Optional)
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Rare skills, culinary rituals, and craft practices"
              className="w-full min-h-[40px] px-3 py-2 text-xs bg-card border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
            />
          </div>

          {/* Starter Sub-categories */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1">
              Initial Sub-Categories (Optional)
            </label>
            <input
              type="text"
              value={subCategoriesInput}
              onChange={(e) => setSubCategoriesInput(e.target.value)}
              placeholder="e.g. Languages, Woodworking, Pastry (comma separated)"
              className="w-full min-h-[40px] px-3 py-2 text-xs bg-card border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
            />
            <p className="text-[10px] text-ink/50 mt-1">
              Separate with commas. You can also add more sub-categories later when adding items.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink/10">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-ink/70 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedVerb}
              className="min-h-[40px] px-5 py-2 text-xs font-semibold text-paper bg-ink hover:bg-ink/85 disabled:opacity-40 disabled:hover:bg-ink rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Category</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
