import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  DollarSign,
  Link as LinkIcon,
} from 'lucide-react';
import {
  BucketItem,
  CategoryDefinition,
  PriorityLevel,
  RecurrenceType,
  WishStep,
} from '../types';
import { renderCategoryIcon } from '../utils/categoryIcons';
import { Sheet } from './Sheet';
import { StepList } from './StepList';
import { newStep, toggleStep } from '../utils/steps';
import { CURRENCIES } from '../data/currencies';
import { currencySymbol } from '../utils/expenses';

// Title placeholder per category id
const TITLE_PLACEHOLDERS: Record<string, string> = {
  go: 'e.g., Hike the coastal trails of Cabo de Gata',
  workout: 'e.g., Run a 10K without stopping',
  buy: 'e.g., Wood-fired stoneware teapot',
  pay: 'e.g., Renew the car insurance',
  remember: 'e.g., Attention is the rarest and purest generosity',
  read: 'e.g., Invisible Cities by Italo Calvino',
  watch: 'e.g., Cinema Paradiso in 35mm restoration',
  listen: 'e.g., Kind of Blue on vinyl, start to finish',
  cook: "e.g., Grandma's sourdough loaf",
  taste: 'e.g., Khao soi at a Chiang Mai night market',
  learn: 'e.g., Hold a simple conversation in Italian',
  make: 'e.g., Hand-bind a leather hardcover journal',
  play: 'e.g., Finish a game of Go with a friend',
  call: 'e.g., Catch up with an old school friend',
  give: 'e.g., Plant a tree for a friend',
  fix: 'e.g., Repair the squeaky bedroom door',
};

interface ItemFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<BucketItem>) => void;
  categories: CategoryDefinition[];
  editingItem?: BucketItem | null;
  // Prefills a new wish, e.g. from content shared by another app
  draft?: Partial<BucketItem> | null;
  defaultCategoryId?: string;
  defaultCurrency: string; // ISO code new wishes start with (Settings)
}

export const ItemFormDrawer: React.FC<ItemFormDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingItem,
  draft,
  defaultCategoryId,
  defaultCurrency,
}) => {
  const [categoryId, setCategoryId] = useState<string>('go');
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
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [linkUrl, setLinkUrl] = useState<string>('');


  // Smaller steps toward the wish
  const [steps, setSteps] = useState<WishStep[]>([]);
  const [stepDraft, setStepDraft] = useState<string>('');
  // What to get ready before starting
  const [prepSteps, setPrepSteps] = useState<WishStep[]>([]);
  const [prepDraft, setPrepDraft] = useState<string>('');

  // Populate form if editing
  useEffect(() => {
    if (editingItem) {
      setCategoryId(editingItem.categoryId);
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
      setCurrency(editingItem.currency || defaultCurrency);
      setLinkUrl(editingItem.linkUrl || '');
      setSteps(editingItem.steps || []);
      setStepDraft('');
      setPrepSteps(editingItem.prepSteps || []);
      setPrepDraft('');
    } else {
      // New item defaults
      const initialCat = defaultCategoryId && defaultCategoryId !== 'all' ? defaultCategoryId : 'go';
      setCategoryId(initialCat);
      setTitle(draft?.title || '');
      setDescription(draft?.description || '');
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
      setCurrency(defaultCurrency);
      setLinkUrl(draft?.linkUrl || '');
      setSteps([]);
      setStepDraft('');
      setPrepSteps([]);
      setPrepDraft('');
    }
  }, [editingItem, draft, defaultCategoryId, defaultCurrency, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // A step typed but not yet added still counts
    const pendingStep = stepDraft.trim();
    const allSteps = pendingStep ? [...steps, newStep(pendingStep)] : steps;
    const pendingPrep = prepDraft.trim();
    const allPrep = pendingPrep ? [...prepSteps, newStep(pendingPrep)] : prepSteps;

    const itemData: Partial<BucketItem> = {
      categoryId,
      title: title.trim(),
      description: description.trim(),
      // Until needs its date; without one the wish falls back to This year
      priority: priority === 'until' && !targetDate ? 'this_year' : priority,
      targetDate: priority === 'until' ? targetDate || undefined : undefined,
      // Photos are added on the Now card, so an edit leaves them alone; a shared image becomes the cover
      ...(editingItem ? {} : { photos: draft?.photos ?? [] }),
      linkUrl: linkUrl.trim() || undefined,
      prepSteps: allPrep.length > 0 ? allPrep : undefined,
      steps: allSteps.length > 0 ? allSteps : undefined,
      currency,
    };

    // Blank fields are set to undefined (not left out) so an edit clears them; App merges itemData over the item
    const progress = editingItem?.mediaMeta?.progress; // not edited here, so kept
    itemData.mediaMeta =
      authorOrCreator.trim() || formatOrEdition.trim() || progress
        ? {
            authorOrCreator: authorOrCreator.trim() || undefined,
            formatOrEdition: formatOrEdition.trim() || undefined,
            progress,
          }
        : undefined;

    itemData.location = locationName.trim()
      ? { name: locationName.trim(), cityOrCountry: locationCity.trim() || undefined }
      : undefined;

    const target = parseFloat(estimatedCost);
    itemData.budget =
      target > 0 ? { estimatedCost: target, savedAmount: parseFloat(savedAmount) || 0 } : undefined;

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

  return (
    <Sheet isOpen onClose={onClose} width="xl" labelledBy="item-form-title">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/10 flex items-center justify-between">
          <div>
            <h2 id="item-form-title" className="font-serif-journal text-xl font-medium text-ink">
              {editingItem ? 'Edit plan' : 'New plan'}
            </h2>
            <p className="text-xs text-ink/60 mt-0.5">
              What do you want to make real?
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-ink/60 hover:text-ink hover:bg-ink/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="item-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Step 1: Category Selection */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-2">
              Category
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
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

          {/* Step 2: Title & Description */}
          <div className="space-y-4">
            <div>
              <label htmlFor="item-title" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                Title *
              </label>
              <input
                id="item-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={TITLE_PLACEHOLDERS[categoryId] || 'e.g., Something you want to make real'}
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-card border border-ink/20 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink"
              />
            </div>

            {/* Read & Watch specialized author/creator metadata */}
            {(categoryId === 'read' || categoryId === 'watch') && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-card rounded-xl border border-ink/10">
                <div>
                  <label htmlFor="item-author" className="block text-[11px] uppercase tracking-wider text-ink/60 font-semibold mb-1">
                    {categoryId === 'read' ? 'Author / Writer' : 'Director / Creator'}
                  </label>
                  <input
                    id="item-author"
                    type="text"
                    value={authorOrCreator}
                    onChange={(e) => setAuthorOrCreator(e.target.value)}
                    placeholder={categoryId === 'read' ? 'e.g. Italo Calvino' : 'e.g. Denis Villeneuve'}
                    className="w-full min-h-[44px] px-2.5 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label htmlFor="item-format" className="block text-[11px] uppercase tracking-wider text-ink/60 font-semibold mb-1">
                    Format / Edition
                  </label>
                  <input
                    id="item-format"
                    type="text"
                    value={formatOrEdition}
                    onChange={(e) => setFormatOrEdition(e.target.value)}
                    placeholder={categoryId === 'read' ? 'Hardcover, Audiobook' : '35mm, Criterion, Theater'}
                    className="w-full min-h-[44px] px-2.5 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="item-notes" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                Notes
              </label>
              <textarea
                id="item-notes"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why does this matter to you?"
                className="w-full px-3.5 py-2.5 text-sm bg-card border border-ink/20 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink"
              />
            </div>

            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-ink/50 shrink-0" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Link, e.g. a shop or reference page"
                aria-label="Link"
                className="flex-1 min-h-[44px] px-3 py-1.5 text-xs bg-card border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </div>

          {/* Step 3: When, plus its date for Until */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="item-priority" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                When
              </label>
              <select
                id="item-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-xl text-ink focus:outline-none focus:border-ink"
              >
                <option value="urgent">Urgent</option>
                <option value="this_month">This month</option>
                <option value="this_year">This year</option>
                <option value="someday">Someday</option>
                <option value="until">Until</option>
              </select>
            </div>

            {priority === 'until' && (
            <div>
              <label htmlFor="item-target-date" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                Target date
              </label>
              <input
                id="item-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-xl text-ink focus:outline-none focus:border-ink"
              />
            </div>
            )}
          </div>

          {/* Step 4: Where */}
          <div>
            <label htmlFor="item-place" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
              Where
            </label>
            <div className="space-y-2">
              <input
                id="item-place"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Place or venue name"
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-xl text-ink focus:outline-none focus:border-ink"
              />
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="City, Country"
                aria-label="City or country"
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-xl text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </div>

          <StepList
            kind="prep"
            steps={prepSteps}
            onToggle={(stepId) => setPrepSteps((prev) => toggleStep(prev, stepId))}
            onAdd={(stepTitle) => setPrepSteps((prev) => [...prev, newStep(stepTitle)])}
            onRemove={(stepId) => setPrepSteps((prev) => prev.filter((s) => s.id !== stepId))}
            draft={prepDraft}
            onDraftChange={setPrepDraft}
          />

          <StepList
            steps={steps}
            onToggle={(stepId) => setSteps((prev) => toggleStep(prev, stepId))}
            onAdd={(stepTitle) => setSteps((prev) => [...prev, newStep(stepTitle)])}
            onRemove={(stepId) => setSteps((prev) => prev.filter((s) => s.id !== stepId))}
            draft={stepDraft}
            onDraftChange={setStepDraft}
          />

          {/* Step 5: Scheduled Reminders Engine */}
          <div className="p-4 rounded-2xl bg-card border border-ink/10 space-y-3">
            {/* The whole row toggles, so the tap target is the full width */}
            <label htmlFor="enableReminder" className="min-h-[44px] flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Reminder
                </span>
              </span>
              <input
                type="checkbox"
                id="enableReminder"
                checked={enableReminder}
                onChange={(e) => setEnableReminder(e.target.checked)}
                className="w-5 h-5 rounded text-ink border-ink/20 focus:ring-0 cursor-pointer"
              />
            </label>

            {enableReminder && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-ink/8">
                <div>
                  <label htmlFor="item-reminder-date" className="block text-[11px] text-ink/60 font-medium mb-1">
                    Date & time
                  </label>
                  <input
                    id="item-reminder-date"
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    required={enableReminder}
                    className="w-full min-h-[44px] px-3 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label htmlFor="item-reminder-repeat" className="block text-[11px] text-ink/60 font-medium mb-1">
                    Repeat
                  </label>
                  <select
                    id="item-reminder-repeat"
                    value={reminderRecurrence}
                    onChange={(e) => setReminderRecurrence(e.target.value as RecurrenceType)}
                    className="w-full min-h-[44px] px-3 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
                  >
                    <option value="none">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Step 6: Budget */}
          <div>
            <div className="p-3.5 bg-card rounded-2xl border border-ink/10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <DollarSign className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Budget</span>
                </div>
                {/* One currency per wish, for its budget and expenses */}
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  aria-label="Currency"
                  title="Currency for this plan's budget and expenses"
                  className="min-h-[44px] px-2 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} · {currencySymbol(c.code)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="Target"
                  aria-label="Target amount"
                  className="min-h-[44px] px-2.5 py-1 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={savedAmount}
                  onChange={(e) => setSavedAmount(e.target.value)}
                  placeholder="Saved"
                  aria-label="Saved amount"
                  className="min-h-[44px] px-2.5 py-1 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-ink/50">Set a target to track your savings.</p>
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
          {/* Submits the form, so the browser checks required fields first */}
          <button
            type="submit"
            form="item-form"
            className="min-h-[44px] px-6 py-2.5 text-xs font-semibold text-paper bg-ink hover:bg-ink/85 active:scale-98 rounded-xl shadow-md transition-all"
          >
            Save
          </button>
        </div>
    </Sheet>
  );
};
