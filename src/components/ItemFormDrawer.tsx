import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Calendar,
  Bell,
  MapPin,
  DollarSign,
  Link as LinkIcon,
  BookOpen,
  Film,
  Camera,
  Check,
} from 'lucide-react';
import {
  BucketItem,
  CategoryDefinition,
  DefaultCategoryId,
  PriorityLevel,
  RecurrenceType,
} from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';

interface ItemFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<BucketItem>) => void;
  categories: CategoryDefinition[];
  editingItem?: BucketItem | null;
  defaultCategoryId?: string;
}

const PRESET_PHOTOS = [
  { label: 'Kyoto Moss Garden', url: '/src/assets/images/kyoto_temple_garden_1793277649785.jpg' },
  { label: 'Library Reading Table', url: '/src/assets/images/bookstack_library_desk_1793277650295.jpg' },
  { label: 'Artisan Ceramic Teapot', url: '/src/assets/images/artisan_ceramic_vessel_1793277650446.jpg' },
  { label: 'Arthouse Cinema Theater', url: '/src/assets/images/arthouse_cinema_theater_1793277651133.jpg' },
];

export const ItemFormDrawer: React.FC<ItemFormDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingItem,
  defaultCategoryId,
}) => {
  const [categoryId, setCategoryId] = useState<string>('go');
  const [subCategory, setSubCategory] = useState<string>('');
  const [newSubInput, setNewSubInput] = useState<string>('');
  const [isAddingNewSub, setIsAddingNewSub] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('this_year');
  const [targetDate, setTargetDate] = useState<string>('');
  
  // Reminder state
  const [enableReminder, setEnableReminder] = useState<boolean>(false);
  const [reminderDate, setReminderDate] = useState<string>('');
  const [reminderRecurrence, setReminderRecurrence] = useState<RecurrenceType>('none');

  // Media Meta
  const [authorOrCreator, setAuthorOrCreator] = useState<string>('');
  const [formatOrEdition, setFormatOrEdition] = useState<string>('');

  // Location & Budget
  const [locationName, setLocationName] = useState<string>('');
  const [locationCity, setLocationCity] = useState<string>('');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [savedAmount, setSavedAmount] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');

  // Photo
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');

  // Populate form if editing
  useEffect(() => {
    if (editingItem) {
      setCategoryId(editingItem.categoryId);
      setSubCategory(editingItem.subCategory || '');
      setTitle(editingItem.title);
      setDescription(editingItem.description || '');
      setPriority(editingItem.priority || 'this_year');
      setTargetDate(editingItem.targetDate || '');
      
      if (editingItem.reminder?.date) {
        setEnableReminder(true);
        setReminderDate(editingItem.reminder.date);
        setReminderRecurrence(editingItem.reminder.recurrence || 'none');
      } else {
        setEnableReminder(false);
        setReminderDate('');
        setReminderRecurrence('none');
      }

      setAuthorOrCreator(editingItem.mediaMeta?.authorOrCreator || '');
      setFormatOrEdition(editingItem.mediaMeta?.formatOrEdition || '');
      setLocationName(editingItem.location?.name || '');
      setLocationCity(editingItem.location?.cityOrCountry || '');
      setEstimatedCost(editingItem.budget?.estimatedCost?.toString() || '');
      setSavedAmount(editingItem.budget?.savedAmount?.toString() || '');
      setLinkUrl(editingItem.linkUrl || '');
      setSelectedPhoto(editingItem.photos?.[0] || '');
    } else {
      // New item defaults
      const initialCat = defaultCategoryId && defaultCategoryId !== 'all' ? defaultCategoryId : 'go';
      setCategoryId(initialCat);
      const activeCatDef = categories.find((c) => c.id === initialCat);
      setSubCategory(activeCatDef?.defaultSubCategories[0] || '');
      setTitle('');
      setDescription('');
      setPriority('this_year');
      setTargetDate('');
      setEnableReminder(false);
      setReminderDate('');
      setReminderRecurrence('none');
      setAuthorOrCreator('');
      setFormatOrEdition('');
      setLocationName('');
      setLocationCity('');
      setEstimatedCost('');
      setSavedAmount('');
      setLinkUrl('');
      setSelectedPhoto('');
      setCustomPhotoUrl('');
    }
  }, [editingItem, defaultCategoryId, isOpen, categories]);

  // When category changes, auto-select first subcategory if empty
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    const catDef = categories.find((c) => c.id === newCatId);
    if (catDef && catDef.defaultSubCategories.length > 0) {
      setSubCategory(catDef.defaultSubCategories[0]);
    } else {
      setSubCategory('');
    }
  };

  const handleAddNewSub = () => {
    if (!newSubInput.trim()) return;
    setSubCategory(newSubInput.trim());
    setNewSubInput('');
    setIsAddingNewSub(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cover = selectedPhoto || customPhotoUrl.trim();
    // The form only edits the cover; keep photos captured on the Now tab (stored as data URLs)
    const capturedPhotos = (editingItem?.photos || []).filter(
      (p) => p !== cover && p.startsWith('data:')
    );
    const photos = cover ? [cover, ...capturedPhotos] : capturedPhotos;

    const itemData: Partial<BucketItem> = {
      categoryId,
      subCategory: subCategory.trim() || undefined,
      title: title.trim(),
      description: description.trim(),
      priority,
      targetDate: targetDate || undefined,
      photos,
      linkUrl: linkUrl.trim() || undefined,
    };

    if (authorOrCreator.trim() || formatOrEdition.trim()) {
      itemData.mediaMeta = {
        authorOrCreator: authorOrCreator.trim() || undefined,
        formatOrEdition: formatOrEdition.trim() || undefined,
      };
    }

    if (locationName.trim()) {
      itemData.location = {
        name: locationName.trim(),
        cityOrCountry: locationCity.trim() || undefined,
      };
    }

    if (estimatedCost) {
      itemData.budget = {
        estimatedCost: parseFloat(estimatedCost) || 0,
        savedAmount: parseFloat(savedAmount) || 0,
        currency: '$',
      };
    }

    if (enableReminder && reminderDate) {
      // Keep snooze/alert state unless the schedule itself changed, so unrelated edits don't re-chime
      const prev = editingItem?.reminder;
      const unchanged = prev?.date === reminderDate && prev?.recurrence === reminderRecurrence;
      itemData.reminder = {
        date: reminderDate,
        recurrence: reminderRecurrence,
        snoozedUntil: unchanged ? prev.snoozedUntil ?? null : null,
        lastNotifiedAt: unchanged ? prev.lastNotifiedAt ?? null : null,
      };
    } else {
      itemData.reminder = undefined;
    }

    onSave(itemData);
    onClose();
  };

  if (!isOpen) return null;

  const currentCatDef = categories.find((c) => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Container (slides up on mobile, slides in on tablet/desktop) */}
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] sm:max-h-full sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-xl bg-paper border-t sm:border-l border-ink/15 rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col overflow-hidden">
        {/* Mobile Grab Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-ink/20 rounded-full mx-auto my-3" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/10 flex items-center justify-between">
          <div>
            <h2 className="font-serif-journal text-xl font-medium text-ink">
              {editingItem ? 'Edit Intention' : 'Capture Intention'}
            </h2>
            <p className="text-xs text-ink/60 mt-0.5">
              Give your upcoming dream shape, timeline, and reminders
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-ink/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Step 1: Category Selection */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`min-h-[48px] p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-ink bg-ink text-paper font-semibold shadow-xs'
                        : 'border-ink/15 bg-card text-ink/80 hover:border-ink/30'
                    }`}
                  >
                    <span style={{ color: isSelected ? 'var(--color-paper)' : cat.accentColor }}>
                      {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                    </span>
                    <span className="text-[11px] leading-tight truncate max-w-full">
                      {cat.verb}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Sub-category Selection & Creation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-ink/60 font-semibold">
                Sub-Category
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewSub(!isAddingNewSub)}
                className="text-xs text-[#B45309] hover:underline font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Custom Sub-category</span>
              </button>
            </div>

            {/* List of subcategories for this category */}
            <div className="flex flex-wrap gap-1.5">
              {currentCatDef?.defaultSubCategories.map((sub) => (
                <button
                  type="button"
                  key={sub}
                  onClick={() => setSubCategory(sub)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs transition-all ${
                    subCategory === sub
                      ? 'bg-ink text-paper font-medium shadow-xs'
                      : 'bg-card border border-ink/15 text-ink/70 hover:border-ink/30'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {isAddingNewSub && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="text"
                  value={newSubInput}
                  onChange={(e) => setNewSubInput(e.target.value)}
                  placeholder="e.g. Classic Noir, Solo Hiking, Artisan Woodwork"
                  className="flex-1 min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-lg text-ink focus:outline-none focus:border-ink"
                />
                <button
                  type="button"
                  onClick={handleAddNewSub}
                  className="min-h-[44px] px-4 py-2 bg-ink text-paper text-xs font-medium rounded-lg hover:bg-ink/85"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                Intention Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  categoryId === 'read'
                    ? 'e.g., Invisible Cities by Italo Calvino'
                    : categoryId === 'watch'
                    ? 'e.g., Cinema Paradiso in 35mm Restoration'
                    : categoryId === 'go'
                    ? 'e.g., Hike the Coastal Trails of Cabo de Gata'
                    : categoryId === 'buy'
                    ? 'e.g., Wood-Fired Stoneware Teapot'
                    : categoryId === 'remember'
                    ? 'e.g., Attention is the rarest and purest generosity'
                    : 'e.g., Hand-bind a leather hardcover journal'
                }
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-card border border-ink/20 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink"
              />
            </div>

            {/* Read & Watch specialized author/creator metadata */}
            {(categoryId === 'read' || categoryId === 'watch') && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-card rounded-xl border border-ink/10">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-ink/60 font-semibold mb-1">
                    {categoryId === 'read' ? 'Author / Writer' : 'Director / Creator'}
                  </label>
                  <input
                    type="text"
                    value={authorOrCreator}
                    onChange={(e) => setAuthorOrCreator(e.target.value)}
                    placeholder={categoryId === 'read' ? 'e.g. Italo Calvino' : 'e.g. Denis Villeneuve'}
                    className="w-full min-h-[38px] px-2.5 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-ink/60 font-semibold mb-1">
                    Format / Edition
                  </label>
                  <input
                    type="text"
                    value={formatOrEdition}
                    onChange={(e) => setFormatOrEdition(e.target.value)}
                    placeholder={categoryId === 'read' ? 'Hardcover, Audiobook' : '35mm, Criterion, Theater'}
                    className="w-full min-h-[38px] px-2.5 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                Notes & Reflections
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why does this matter? What specific feeling or memory does it hold?"
                className="w-full px-3.5 py-2.5 text-sm bg-card border border-ink/20 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink"
              />
            </div>
          </div>

          {/* Step 4: Priority & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                Timeframe / Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-xl text-ink focus:outline-none focus:border-ink"
              >
                <option value="this_month">This Month (High Focus)</option>
                <option value="this_year">This Year (Current Chapter)</option>
                <option value="someday">Someday (Long Horizon)</option>
                <option value="urgent">Urgent Intention</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-xl text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </div>

          {/* Step 5: Scheduled Reminders Engine */}
          <div className="p-4 rounded-2xl bg-card border border-ink/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#B45309]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Scheduled Reminder Alert
                </span>
              </div>
              <input
                type="checkbox"
                id="enableReminder"
                checked={enableReminder}
                onChange={(e) => setEnableReminder(e.target.checked)}
                className="w-4 h-4 rounded text-ink border-ink/20 focus:ring-0 cursor-pointer"
              />
            </div>

            {enableReminder && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-ink/8">
                <div>
                  <label className="block text-[11px] text-ink/60 font-medium mb-1">
                    Alert Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    required={enableReminder}
                    className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-ink/60 font-medium mb-1">
                    Recurrence
                  </label>
                  <select
                    value={reminderRecurrence}
                    onChange={(e) => setReminderRecurrence(e.target.value as RecurrenceType)}
                    className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
                  >
                    <option value="none">One-time Alert</option>
                    <option value="daily">Daily Nudge</option>
                    <option value="weekly">Weekly Gentle Reminder</option>
                    <option value="monthly">Monthly Check-in</option>
                    <option value="yearly">Yearly Milestone</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Step 6: Location & Budget Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div className="p-3.5 bg-card rounded-2xl border border-ink/10 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <MapPin className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Geographic Place</span>
              </div>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Place or venue name"
                className="w-full min-h-[38px] px-2.5 py-1 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none"
              />
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="City, Country"
                className="w-full min-h-[38px] px-2.5 py-1 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none"
              />
            </div>

            {/* Budget */}
            <div className="p-3.5 bg-card rounded-2xl border border-ink/10 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <DollarSign className="w-3.5 h-3.5 text-[#059669]" />
                <span>Budget & Savings</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="Target ($)"
                  className="min-h-[38px] px-2.5 py-1 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={savedAmount}
                  onChange={(e) => setSavedAmount(e.target.value)}
                  placeholder="Saved ($)"
                  className="min-h-[38px] px-2.5 py-1 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none"
                />
              </div>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Reference URL or shop link"
                className="w-full min-h-[38px] px-2.5 py-1 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none"
              />
            </div>
          </div>

          {/* Step 7: Visual Photograph Attachment */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold">
              Inspirational Photo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_PHOTOS.map((preset) => {
                const isSelected = selectedPhoto === preset.url;
                return (
                  <button
                    type="button"
                    key={preset.url}
                    onClick={() => {
                      setSelectedPhoto(isSelected ? '' : preset.url);
                      setCustomPhotoUrl('');
                    }}
                    className={`relative rounded-xl overflow-hidden border aspect-[4/3] group text-left ${
                      isSelected
                        ? 'ring-2 ring-ink border-transparent'
                        : 'border-ink/15 hover:border-ink/40'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-1.5 flex items-end">
                      <span className="text-[10px] text-white font-medium leading-tight">
                        {preset.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-ink text-paper rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-ink/50 shrink-0" />
              <input
                type="url"
                value={customPhotoUrl}
                onChange={(e) => {
                  setCustomPhotoUrl(e.target.value);
                  setSelectedPhoto('');
                }}
                placeholder="Or paste any custom image web link..."
                className="flex-1 min-h-[38px] px-3 py-1.5 text-xs bg-card border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </div>
        </form>

        {/* Fixed Sticky Confirmation Bottom Bar */}
        <div className="p-4 bg-paper border-t border-ink/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold text-ink/70 hover:text-ink rounded-xl hover:bg-ink/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="min-h-[44px] px-6 py-2.5 text-xs font-semibold text-paper bg-ink hover:bg-ink/85 active:scale-98 rounded-xl shadow-md transition-all"
          >
            {editingItem ? 'Save Changes' : 'Record Intention'}
          </button>
        </div>
      </div>
    </div>
  );
};
