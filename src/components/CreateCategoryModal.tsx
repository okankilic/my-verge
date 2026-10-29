import React, { useState } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';
import { CategoryDefinition } from '../types';
import { AVAILABLE_CATEGORY_ICONS, renderCategoryIcon } from '../utils/categoryIcons';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onCreateCategory,
}) => {
  const [actionName, setActionName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Sparkles');
  const [selectedColor, setSelectedColor] = useState('#B45309');
  const [tagline, setTagline] = useState('');
  const [subCategoriesInput, setSubCategoriesInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = actionName.trim();
    if (!trimmed) {
      setError('Please provide an action name for this category.');
      return;
    }

    // Standardize: strip any accidental "Want to " prefix and format with initial capital
    const cleaned = trimmed.replace(/^want to\s+/i, '').trim();
    const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

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
      name: formatted,
      verb: formatted,
      icon: selectedIcon,
      tagline: tagline.trim() || `${formatted} milestones & experiences`,
      defaultSubCategories: parsedSubCategories,
      accentColor: selectedColor,
    };

    onCreateCategory(newCategory);
    // Reset state
    setActionName('');
    setSelectedIcon('Sparkles');
    setSelectedColor('#B45309');
    setTagline('');
    setSubCategoriesInput('');
    setError('');
    onClose();
  };

  const previewDisplayName = actionName.trim()
    ? (actionName.trim().replace(/^want to\s+/i, '').trim().charAt(0).toUpperCase() +
       actionName.trim().replace(/^want to\s+/i, '').trim().slice(1)) || 'Action'
    : 'New Category';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#FAF7F2] border border-[#1E1915]/15 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E1915]/10 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-serif-journal text-xl font-medium text-[#1E1915]">
              New Custom Category
            </h2>
            <p className="text-xs text-[#1E1915]/60 mt-0.5">
              Create a custom action horizon for your journal & intentions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[#1E1915]/60 hover:text-[#1E1915] hover:bg-[#1E1915]/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Ribbon Preview */}
        <div className="px-5 py-3 bg-[#FAF7F2] border-b border-[#1E1915]/8 flex items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-wider text-[#1E1915]/50 font-semibold">
            Ribbon Preview:
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1E1915] text-[#FAF7F2] shadow-2xs">
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
            <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Action as Category Name */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#1E1915]/60 font-semibold mb-1">
              Action / Category Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={actionName}
                onChange={(e) => {
                  setActionName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Cook, Listen, Taste, Learn, Play, Craft"
                className="w-full min-h-[40px] px-3 py-2 text-xs bg-white border border-[#1E1915]/15 rounded-lg text-[#1E1915] focus:outline-none focus:border-[#1E1915]"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-[#1E1915]/50 mt-1">
              Use an action verb as your category name (e.g. Cook, Learn, Listen, Play)
            </p>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#1E1915]/60 font-semibold mb-1.5">
              Select Icon
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-white border border-[#1E1915]/10 rounded-lg">
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
                        ? 'bg-[#1E1915] text-[#FAF7F2] shadow-2xs scale-105'
                        : 'text-[#1E1915]/60 hover:text-[#1E1915] hover:bg-[#FAF7F2]'
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
            <label className="block text-xs uppercase tracking-wider text-[#1E1915]/60 font-semibold mb-1.5">
              Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white border border-[#1E1915]/10 rounded-lg">
              {COLOR_PRESETS.map((p) => {
                const isSelected = selectedColor === p.color;
                return (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setSelectedColor(p.color)}
                    title={p.label}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-offset-2 ring-[#1E1915] scale-110' : 'hover:scale-105'
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
            <label className="block text-xs uppercase tracking-wider text-[#1E1915]/60 font-semibold mb-1">
              Tagline or Horizon Theme (Optional)
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Rare skills, culinary rituals, and craft practices"
              className="w-full min-h-[40px] px-3 py-2 text-xs bg-white border border-[#1E1915]/15 rounded-lg text-[#1E1915] focus:outline-none focus:border-[#1E1915]"
            />
          </div>

          {/* Starter Sub-categories */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#1E1915]/60 font-semibold mb-1">
              Initial Sub-Categories (Optional)
            </label>
            <input
              type="text"
              value={subCategoriesInput}
              onChange={(e) => setSubCategoriesInput(e.target.value)}
              placeholder="e.g. Languages, Woodworking, Pastry (comma separated)"
              className="w-full min-h-[40px] px-3 py-2 text-xs bg-white border border-[#1E1915]/15 rounded-lg text-[#1E1915] focus:outline-none focus:border-[#1E1915]"
            />
            <p className="text-[10px] text-[#1E1915]/50 mt-1">
              Separate with commas. You can also add more sub-categories later when adding items.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E1915]/10">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#1E1915]/70 hover:text-[#1E1915] hover:bg-[#1E1915]/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!actionName.trim()}
              className="min-h-[40px] px-5 py-2 text-xs font-semibold text-[#FAF7F2] bg-[#1E1915] hover:bg-[#332B24] disabled:opacity-40 disabled:hover:bg-[#1E1915] rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
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
