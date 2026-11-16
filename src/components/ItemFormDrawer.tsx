import React, { useState, useEffect, useRef } from 'react';
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
import { renderCategoryIcon, categoryColor, categoryLabel, categoryPlaceholder, categoryHint } from '../utils/categoryIcons';
import { Sheet } from './Sheet';
import { StepList } from './StepList';
import { newStep, toggleStep } from '../utils/steps';
import { CURRENCIES } from '../data/currencies';
import { currencySymbol } from '../utils/expenses';
import { InlineConfirm } from './InlineConfirm';
import { ReminderWhenFields, fieldClass, fieldLabelClass } from './ReminderWhenFields';
import { nextReminderDate, readReminderParts } from '../utils/reminderFields';
import { reminderTime } from '../services/notifications';
import { MessageKey, t } from '../i18n';
import { ALL_FORM_FIELDS, FormField, REMINDER_DEFAULTS, formFieldsFor } from '../data/categories';

// The author/creator labels for each verb that shows them; others use the Watch wording
const MEDIA_LABELS: Record<string, { creator: MessageKey; creatorPlaceholder: MessageKey; formatPlaceholder: MessageKey }> = {
  read: { creator: 'form.author', creatorPlaceholder: 'form.authorPlaceholder', formatPlaceholder: 'form.formatReadPlaceholder' },
  watch: { creator: 'form.director', creatorPlaceholder: 'form.directorPlaceholder', formatPlaceholder: 'form.formatWatchPlaceholder' },
  listen: { creator: 'form.artist', creatorPlaceholder: 'form.artistPlaceholder', formatPlaceholder: 'form.formatListenPlaceholder' },
};

// What the When field can hold. Past, Today and Tomorrow only exist in the form, on new plans:
// Past is saved as a finished plan, Today and Tomorrow as Until with that day's date
type WhenChoice = PriorityLevel | 'past' | 'today' | 'tomorrow';

// A local YYYY-MM-DD date, offsetDays from today
const localDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const todayLocal = () => localDate(0);

// The stored timeframe and target date for a When choice; Until without a date falls back to This year.
// A new plan whose verb doesn't ask When (Pay, Remember) is Someday; an edit keeps what it has
const resolveWhen = (
  choice: WhenChoice,
  targetDate: string,
  isNewWithoutWhen = false
): Pick<BucketItem, 'priority' | 'targetDate'> => {
  if (isNewWithoutWhen) return { priority: 'someday', targetDate: undefined };
  if (choice === 'today') return { priority: 'until', targetDate: localDate(0) };
  if (choice === 'tomorrow') return { priority: 'until', targetDate: localDate(1) };
  if (choice === 'until' && targetDate) return { priority: 'until', targetDate };
  if (choice === 'past' || choice === 'until') return { priority: 'this_year', targetDate: undefined };
  return { priority: choice, targetDate: undefined };
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
  const [priority, setPriority] = useState<WhenChoice>('this_year');
  const [targetDate, setTargetDate] = useState<string>('');
  const [doneOn, setDoneOn] = useState<string>('');
  
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
  const [enableBudget, setEnableBudget] = useState<boolean>(false);
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

  // Closing with unsaved changes, and switching the currency of a plan with amounts, confirm first
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
  const baselineRef = useRef<string | null>(null);
  // Fields the verb hides but that held a value when the form opened or the verb changed; they stay shown
  const [revealed, setRevealed] = useState<FormField[]>([]);
  // The reminder a verb default turned on, so switching verbs can take it back if it wasn't touched
  const autoReminderRef = useRef<string | null>(null);
  const [baselineToken, setBaselineToken] = useState(0);

  // Populate form if editing
  useEffect(() => {
    if (editingItem) {
      setCategoryId(editingItem.categoryId);
      autoReminderRef.current = null;
      setTitle(editingItem.title);
      setDescription(editingItem.description || '');
      setPriority(editingItem.priority || 'this_year');
      setTargetDate(editingItem.targetDate || '');
      setDoneOn('');
      
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
      setEnableBudget((editingItem.budget?.estimatedCost ?? 0) > 0);
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
      setDoneOn('');
      const reminderDefault = REMINDER_DEFAULTS[initialCat];
      const defaultDate = reminderDefault ? nextReminderDate(reminderDefault, readReminderParts('')) : '';
      setEnableReminder(Boolean(reminderDefault));
      setReminderDate(defaultDate);
      setReminderRecurrence(reminderDefault ?? 'none');
      autoReminderRef.current = reminderDefault ? `${reminderDefault}|${defaultDate}` : null;
      setAuthorOrCreator('');
      setFormatOrEdition('');
      setLocationName('');
      setLocationCity('');
      setEnableBudget(false);
      setEstimatedCost('');
      setSavedAmount('');
      setCurrency(defaultCurrency);
      setLinkUrl(draft?.linkUrl || '');
      setSteps([]);
      setStepDraft('');
      setPrepSteps([]);
      setPrepDraft('');
    }
    setIsConfirmingDiscard(false);
    setPendingCurrency(null);
    // The baseline is taken on the next render, once the fields above hold their new values
    setBaselineToken((n) => n + 1);
  }, [editingItem, draft, defaultCategoryId, defaultCurrency, isOpen]);

  const snapshot = JSON.stringify({
    categoryId, title, description, priority, targetDate, doneOn, enableReminder, reminderDate, reminderRecurrence,
    authorOrCreator, formatOrEdition, locationName, locationCity, enableBudget, estimatedCost, savedAmount, currency,
    linkUrl, steps, stepDraft, prepSteps, prepDraft,
  });
  useEffect(() => {
    baselineRef.current = snapshot;
    setRevealed(hiddenWithValues(categoryId));
  }, [baselineToken]);

  // Backdrop, Escape, X and Cancel all come through here
  const requestClose = () => {
    // Read the baseline now: it is set after the render that fills the form, with no render following
    const isDirty = baselineRef.current !== null && snapshot !== baselineRef.current;
    if (isDirty) setIsConfirmingDiscard(true);
    else onClose();
  };

  const hasAmounts = Boolean(estimatedCost.trim() || savedAmount.trim() || editingItem?.expenses?.length);
  const handleCurrencyChange = (code: string) => {
    if (code === currency) return;
    if (hasAmounts) setPendingCurrency(code);
    else setCurrency(code);
  };

  // Whether a field holds something worth keeping on screen. When counts only when it's more than a default
  const hasValue = (field: FormField): boolean => {
    switch (field) {
      case 'when': return !['this_year', 'someday'].includes(priority);
      case 'media': return Boolean(authorOrCreator.trim() || formatOrEdition.trim());
      case 'notes': return Boolean(description.trim());
      case 'link': return Boolean(linkUrl.trim());
      case 'where': return Boolean(locationName.trim() || locationCity.trim());
      case 'prep': return prepSteps.length > 0 || Boolean(prepDraft.trim());
      case 'steps': return steps.length > 0 || Boolean(stepDraft.trim());
      case 'reminder': return enableReminder;
      case 'budget': return enableBudget;
    }
  };
  const hiddenWithValues = (catId: string) => {
    const listed = formFieldsFor(catId);
    return ALL_FORM_FIELDS.filter((f) => !listed.includes(f) && hasValue(f));
  };

  // The verb's own fields in its order, then any hidden field that holds a value, so nothing saved is out of sight
  const listedFields = formFieldsFor(categoryId);
  const visibleFields = [
    ...listedFields,
    ...ALL_FORM_FIELDS.filter((f) => !listedFields.includes(f) && (revealed.includes(f) || hasValue(f))),
  ];
  const mediaLabels = MEDIA_LABELS[categoryId] ?? MEDIA_LABELS.watch;
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedHint = categoryHint(selectedCategory);

  // A new plan takes the verb's reminder default; one a previous default turned on, untouched, is taken back
  const handleCategoryChange = (next: string) => {
    if (next === categoryId) return;
    setCategoryId(next);
    let reminderOn = enableReminder;
    if (!editingItem) {
      if (autoReminderRef.current && autoReminderRef.current === `${reminderRecurrence}|${reminderDate}` && enableReminder) {
        setEnableReminder(false);
        setReminderDate('');
        setReminderRecurrence('none');
        reminderOn = false;
      }
      autoReminderRef.current = null;
      const reminderDefault = REMINDER_DEFAULTS[next];
      if (reminderDefault && !reminderOn) {
        const date = nextReminderDate(reminderDefault, readReminderParts(''));
        setEnableReminder(true);
        setReminderRecurrence(reminderDefault);
        setReminderDate(date);
        autoReminderRef.current = `${reminderDefault}|${date}`;
        reminderOn = true;
      }
    }
    setRevealed(hiddenWithValues(next).filter((f) => f !== 'reminder' || reminderOn));
  };

  const handleWhenChange = (next: WhenChoice) => {
    setPriority(next);
    if (next === 'past' && !doneOn) setDoneOn(todayLocal());
  };

  // A repeating reminder needs a date ahead of it; one already in the future stays as picked
  const handleRepeatChange = (next: RecurrenceType) => {
    setReminderRecurrence(next);
    if (next === 'none') return;
    const current = reminderDate ? reminderTime(reminderDate).getTime() : NaN;
    if (!(current > Date.now())) setReminderDate(nextReminderDate(next, readReminderParts(reminderDate)));
  };

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
      ...resolveWhen(priority, targetDate, !editingItem && !visibleFields.includes('when')),
      // Photos are added on the Now card, so an edit leaves them alone; a shared image becomes the cover
      ...(editingItem ? {} : { photos: draft?.photos ?? [] }),
      linkUrl: linkUrl.trim() || undefined,
      prepSteps: priority !== 'past' && allPrep.length > 0 ? allPrep : undefined,
      steps: allSteps.length > 0 ? allSteps : undefined,
      currency,
      // Already done: straight to Moments. Today is stamped now; an earlier day at local noon, clear of time zone shifts
      ...(priority === 'past'
        ? {
            status: 'completed' as const,
            completedAt: (doneOn === todayLocal() ? new Date() : new Date(`${doneOn}T12:00`)).toISOString(),
          }
        : {}),
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
      enableBudget && target > 0 ? { estimatedCost: target, savedAmount: parseFloat(savedAmount) || 0 } : undefined;

    if (priority !== 'past' && enableReminder && reminderDate) {
      // Keep alert state unless the schedule itself changed, so unrelated edits don't re-chime
      const prev = editingItem?.reminder;
      const unchanged = prev?.date === reminderDate && prev?.recurrence === reminderRecurrence;
      itemData.reminder = {
        date: reminderDate,
        recurrence: reminderRecurrence,
        lastNotifiedAt: unchanged ? prev.lastNotifiedAt ?? null : null,
      };
    } else {
      itemData.reminder = undefined;
    }

    onSave(itemData);
    onClose();
  };

  // Each field's block, rendered in the order the verb lists them (src/data/categories.ts, form-fields.md)
  const sections: Record<FormField, () => React.ReactNode> = {
    when: () => (
      <>
            {/* When, plus its date for Until or Past */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="item-priority" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                  {t('form.when')}
                </label>
                <select
                  id="item-priority"
                  value={priority}
                  onChange={(e) => handleWhenChange(e.target.value as WhenChoice)}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-xl text-ink focus:outline-none focus:border-ink"
                >
                  {/* Past to future. Only a new plan can be logged as already done or pinned to today or tomorrow */}
                  {!editingItem && (
                    <>
                      <option value="past">{t('when.past')}</option>
                      <option value="today">{t('when.today')}</option>
                      <option value="tomorrow">{t('when.tomorrow')}</option>
                    </>
                  )}
                  <option value="this_week">{t('when.thisWeek')}</option>
                  <option value="this_month">{t('when.thisMonth')}</option>
                  <option value="this_year">{t('when.thisYear')}</option>
                  <option value="until">{t('when.until')}</option>
                  <option value="someday">{t('when.someday')}</option>
                </select>
              </div>

              {priority === 'until' && (
              <div>
                <label htmlFor="item-target-date" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                  {t('form.targetDate')}
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

              {priority === 'past' && (
              <div>
                <label htmlFor="item-done-on" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                  {t('form.doneOn')}
                </label>
                <input
                  id="item-done-on"
                  type="date"
                  required
                  max={todayLocal()}
                  value={doneOn}
                  onChange={(e) => setDoneOn(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-xl text-ink focus:outline-none focus:border-ink"
                />
              </div>
              )}
            </div>
      </>
    ),
    media: () => (
      <>
            {/* Read & Watch specialized author/creator metadata */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-card rounded-xl border border-ink/10">
                <div>
                  <label htmlFor="item-author" className="block text-[11px] uppercase tracking-wider text-ink/60 font-semibold mb-1">
                    {t(mediaLabels.creator)}
                  </label>
                  <input
                    id="item-author"
                    type="text"
                    value={authorOrCreator}
                    onChange={(e) => setAuthorOrCreator(e.target.value)}
                    placeholder={t(mediaLabels.creatorPlaceholder)}
                    className="w-full min-h-[44px] px-2.5 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label htmlFor="item-format" className="block text-[11px] uppercase tracking-wider text-ink/60 font-semibold mb-1">
                    {t('form.format')}
                  </label>
                  <input
                    id="item-format"
                    type="text"
                    value={formatOrEdition}
                    onChange={(e) => setFormatOrEdition(e.target.value)}
                    placeholder={t(mediaLabels.formatPlaceholder)}
                    className="w-full min-h-[44px] px-2.5 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>
      </>
    ),
    notes: () => (
      <>
            <div>
              <label htmlFor="item-notes" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                {t('form.notes')}
              </label>
              <textarea
                id="item-notes"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.notesPlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm bg-card border border-ink/20 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink"
              />
            </div>
      </>
    ),
    link: () => (
      <>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-ink/50 shrink-0" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder={t('form.linkPlaceholder')}
                aria-label={t('form.link')}
                className="flex-1 min-h-[44px] px-3 py-1.5 text-xs bg-card border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink"
              />
            </div>
      </>
    ),
    where: () => (
      <>
          {/* Step 4: Where */}
          <div>
            <label htmlFor="item-place" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
              {t('form.where')}
            </label>
            <div className="space-y-2">
              <input
                id="item-place"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={t('form.placePlaceholder')}
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-xl text-ink focus:outline-none focus:border-ink"
              />
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder={t('form.city')}
                aria-label={t('form.city')}
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-card border border-ink/20 rounded-xl text-ink focus:outline-none focus:border-ink"
              />
            </div>
          </div>
      </>
    ),
    prep: () => (
      <>
          {priority !== 'past' && (
            <StepList
              kind="prep"
              steps={prepSteps}
              onToggle={(stepId) => setPrepSteps((prev) => toggleStep(prev, stepId))}
              onAdd={(stepTitle) => setPrepSteps((prev) => [...prev, newStep(stepTitle)])}
              onRemove={(stepId) => setPrepSteps((prev) => prev.filter((s) => s.id !== stepId))}
              draft={prepDraft}
              onDraftChange={setPrepDraft}
            />
          )}
      </>
    ),
    steps: () => (
      <>
          <StepList
            steps={steps}
            onToggle={(stepId) => setSteps((prev) => toggleStep(prev, stepId))}
            onAdd={(stepTitle) => setSteps((prev) => [...prev, newStep(stepTitle)])}
            onRemove={(stepId) => setSteps((prev) => prev.filter((s) => s.id !== stepId))}
            draft={stepDraft}
            onDraftChange={setStepDraft}
          />
      </>
    ),
    reminder: () => (
      <>
          {/* Step 5: Scheduled Reminders Engine */}
          {priority !== 'past' && (
            <div className="p-4 rounded-2xl bg-card border border-ink/10 space-y-3">
              {/* The whole row toggles, so the tap target is the full width */}
              <label htmlFor="enableReminder" className="min-h-[44px] flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink">
                    {t('form.reminder')}
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
                <div className="pt-2 space-y-3 border-t border-ink/8">
                  <div>
                    <label htmlFor="item-reminder-repeat" className={fieldLabelClass}>
                      {t('form.repeat')}
                    </label>
                    <select
                      id="item-reminder-repeat"
                      value={reminderRecurrence}
                      onChange={(e) => handleRepeatChange(e.target.value as RecurrenceType)}
                      className={fieldClass}
                    >
                      <option value="none">{t('repeat.none')}</option>
                      <option value="daily">{t('repeat.daily')}</option>
                      <option value="weekly">{t('repeat.weekly')}</option>
                      <option value="monthly">{t('repeat.monthly')}</option>
                      <option value="yearly">{t('repeat.yearly')}</option>
                    </select>
                  </div>
                  <ReminderWhenFields
                    recurrence={reminderRecurrence}
                    value={reminderDate}
                    onChange={setReminderDate}
                  />
                </div>
              )}
            </div>
          )}
      </>
    ),
    budget: () => (
      <>
          {/* Step 6: Budget, laid out like the Reminder card above */}
          <div className="p-4 rounded-2xl bg-card border border-ink/10 space-y-3">
            {/* The whole row toggles, so the tap target is the full width */}
            <label htmlFor="enableBudget" className="min-h-[44px] flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-ink">{t('form.budget')}</span>
              </span>
              <input
                type="checkbox"
                id="enableBudget"
                checked={enableBudget}
                onChange={(e) => {
                  setEnableBudget(e.target.checked);
                  setPendingCurrency(null);
                }}
                className="w-5 h-5 rounded text-ink border-ink/20 focus:ring-0 cursor-pointer"
              />
            </label>

            {enableBudget && (
              <div className="pt-2 space-y-3 border-t border-ink/8">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="item-budget-target" className={fieldLabelClass}>
                      {t('form.target')}
                    </label>
                    <input
                      id="item-budget-target"
                      type="number"
                      min="0"
                      step="any"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="item-budget-currency" className={fieldLabelClass}>
                      {t('form.currency')}
                    </label>
                    {/* One currency per wish, for its budget and expenses */}
                    <select
                      id="item-budget-currency"
                      value={pendingCurrency ?? currency}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                      title={t('form.currencyTitle')}
                      className={fieldClass}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} · {currencySymbol(c.code)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Saved is for tracking progress later, so a new plan only asks for the target */}
                  {editingItem && (
                    <div className="col-span-2">
                      <label htmlFor="item-budget-saved" className={fieldLabelClass}>
                        {t('form.saved')}
                      </label>
                      <input
                        id="item-budget-saved"
                        type="number"
                        min="0"
                        step="any"
                        value={savedAmount}
                        onChange={(e) => setSavedAmount(e.target.value)}
                        className={fieldClass}
                      />
                    </div>
                  )}
                </div>
                {pendingCurrency && (
                  <InlineConfirm
                    tone="positive"
                    message={t('form.switchCurrency', { code: pendingCurrency })}
                    confirmLabel={t('actions.switch')}
                    onCancel={() => setPendingCurrency(null)}
                    onConfirm={() => {
                      setCurrency(pendingCurrency);
                      setPendingCurrency(null);
                    }}
                  />
                )}
                <p className="text-[11px] text-ink/50">{t('form.budgetHint')}</p>
              </div>
            )}
          </div>
      </>
    ),
  };

  if (!isOpen) return null;

  return (
    <Sheet isOpen onClose={requestClose} width="xl" labelledBy="item-form-title">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/10 flex items-center justify-between">
          <div>
            <h2 id="item-form-title" className="font-serif-journal text-xl font-medium text-ink">
              {editingItem ? t('actions.editPlan') : t('actions.newPlan')}
            </h2>
            <p className="text-xs text-ink/60 mt-0.5">
              {t('form.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label={t('actions.close')}
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
              {t('form.category')}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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
                    <span style={{ color: isSelected ? 'var(--color-paper)' : categoryColor(cat.accentColor) }}>
                      {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                    </span>
                    <span className="text-[11px] leading-tight truncate max-w-full">
                      {categoryLabel(cat)}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedHint && <p className="mt-2 text-xs text-ink/60">{selectedHint}</p>}
          </div>

            <div>
              <label htmlFor="item-title" className="block text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1.5">
                {t('form.title')}
              </label>
              <input
                id="item-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={categoryPlaceholder(selectedCategory)}
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-card border border-ink/20 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink"
              />
            </div>

          {visibleFields.map((field) => (
            <React.Fragment key={field}>{sections[field]()}</React.Fragment>
          ))}
        </form>

        {/* Fixed Sticky Confirmation Bottom Bar */}
        <div className="p-4 bg-paper border-t border-ink/10">
          {isConfirmingDiscard && (
            <InlineConfirm
              className="mb-3"
              message={t('form.discardConfirm')}
              confirmLabel={t('actions.discard')}
              cancelLabel={t('actions.keep')}
              onCancel={() => setIsConfirmingDiscard(false)}
              onConfirm={() => {
                setIsConfirmingDiscard(false);
                onClose();
              }}
            />
          )}
          <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={requestClose}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold text-ink/70 hover:text-ink rounded-xl hover:bg-ink/5 transition-colors"
          >
            {t('actions.cancel')}
          </button>
          {/* Submits the form, so the browser checks required fields first */}
          <button
            type="submit"
            form="item-form"
            className="min-h-[44px] px-6 py-2.5 text-xs font-semibold text-paper bg-ink hover:bg-ink/85 active:scale-98 rounded-xl shadow-md transition-all"
          >
            {t('actions.save')}
          </button>
          </div>
        </div>
    </Sheet>
  );
};
