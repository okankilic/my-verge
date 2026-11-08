import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Plus,
  Bell,
  Sparkles,
  Compass,
  CheckCircle2,
  Calendar,
  X,
  Dices,
} from 'lucide-react';

import {
  BucketItem,
  CategoryDefinition,
  ViewTab,
  WishExpense,
  WishStep,
  StepListKey,
} from './types';
import {
  loadBucketItems,
  saveBucketItems,
  loadCategories,
  saveCategories,
  loadTheme,
  saveTheme,
  ThemePreference,
  loadDefaultCurrency,
  saveDefaultCurrency,
} from './services/storage';
import { DEFAULT_CURRENCY } from './data/currencies';
import {
  playChimeSound,
  sendBrowserNotification,
  getDueReminderItems,
  getUnnotifiedDueItems,
} from './services/notifications';
import { saveAttachment, deleteAttachmentBlobs } from './services/attachments';
import { syncNativeReminders, onReminderTapped } from './services/reminderScheduler';
import { isNative, applyNativeTheme } from './services/platform';
import { onSharedContent, toDraft } from './services/shareInbox';
import { notify } from './services/dialogs';
import { photoKey } from './utils/photoKey';
import { newStep, stepProgress, toggleStep } from './utils/steps';
import { formatMoney, newExpense, stampCurrency, wishCurrency } from './utils/expenses';

import { TopNav } from './components/TopNav';
import { BottomTabBar } from './components/BottomTabBar';
import { FloatingActions } from './components/FloatingActions';
import { CategoryRibbon } from './components/CategoryRibbon';
import { EmptyState } from './components/EmptyState';
import { JournalList } from './components/JournalList';
import { ItemDetailDrawer } from './components/ItemDetailDrawer';
import { ItemFormDrawer } from './components/ItemFormDrawer';
import { MilestoneSheet } from './components/MilestoneSheet';
import { ReminderHorizonView } from './components/ReminderHorizonView';
import { horizonTime, targetDateTime } from './utils/targetDate';
import { VaultView, isInVault, keptCategoryIds, vaultDate } from './components/VaultView';
import { TimeRange, earlierYears, isInRange, isTimeInRange } from './utils/timeRange';
import { MilestonesArchiveView } from './components/MilestonesArchiveView';
import { InProgressView } from './components/InProgressView';
import { SerendipitySheet } from './components/SerendipitySheet';
import { SettingsView } from './components/SettingsView';
import { Sheet } from './components/Sheet';
import { DialogHost } from './components/DialogHost';

export default function App() {
  // State
  const [items, setItems] = useState<BucketItem[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  // Storage is async; nothing is saved, synced or rendered until the stored data is loaded
  const [isHydrated, setIsHydrated] = useState(false);
  // Storage couldn't be read: show a retry screen, and never save over what's stored
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  // The stored wishes couldn't be understood and were set aside; tell the user once the app is up
  const keptItemsCopyRef = useRef(false);
  const [currentTab, setCurrentTab] = useState<ViewTab>('feed');
  // Each tab keeps its own category pick
  const [categoryByTab, setCategoryByTab] = useState<Partial<Record<ViewTab, string>>>({});
  const selectedCategoryId = categoryByTab[currentTab] ?? 'all';
  const setSelectedCategoryId = (id: string, tab: ViewTab = currentTab) =>
    setCategoryByTab((prev) => ({ ...prev, [tab]: id }));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // The Vault's time filter, in memory only like the category picks
  const [vaultRange, setVaultRange] = useState<TimeRange>('all');
  const [horizonRange, setHorizonRange] = useState<TimeRange>('all');
  // The wish just started, scrolled to and highlighted on Now
  const [focusedNowId, setFocusedNowId] = useState<string | null>(null);

  // Sheets
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null);
  const [viewingItem, setViewingItem] = useState<BucketItem | null>(null);
  const [celebratingItem, setCelebratingItem] = useState<BucketItem | null>(null);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const [isSerendipityOpen, setIsSerendipityOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVaultRangeOpen, setIsVaultRangeOpen] = useState(false);
  const [isHorizonRangeOpen, setIsHorizonRangeOpen] = useState(false);

  // Desktop Mobile Frame Toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Appearance: 'system' follows prefers-color-scheme, otherwise forced via data-theme
  const [theme, setTheme] = useState<ThemePreference>('system');

  // The currency new wishes start with; each wish keeps its own once it has one
  const [defaultCurrency, setDefaultCurrency] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadBucketItems(), loadCategories(), loadTheme(), loadDefaultCurrency()])
      .then(([loadedItems, loadedCategories, loadedTheme, loadedCurrency]) => {
        if (cancelled) return;
        keptItemsCopyRef.current = Boolean(loadedItems.keptCopyAs);
        setItems(stampCurrency(loadedItems.value, loadedCurrency));
        setCategories(loadedCategories.value);
        setTheme(loadedTheme);
        setDefaultCurrency(loadedCurrency);
        setLoadFailed(false);
        setIsHydrated(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load stored data:', err);
        setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  // DialogHost (a child) registers in its own effect, which runs before this one
  useEffect(() => {
    if (!isHydrated || !keptItemsCopyRef.current) return;
    keptItemsCopyRef.current = false;
    notify(
      "Your saved plans couldn't be opened, so the samples are here for now. A copy is kept safe on this device.",
      'info',
      { durationMs: 10000 }
    );
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const root = document.documentElement;
    if (theme === 'system') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = theme;
    }
    saveTheme(theme);
    applyNativeTheme(theme);
  }, [theme, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveDefaultCurrency(defaultCurrency);
  }, [defaultCurrency, isHydrated]);

  // Active Reminder In-App Toast
  const [activeToastItem, setActiveToastItem] = useState<BucketItem | null>(null);

  // Persist items and hand reminders to the OS (native only)
  useEffect(() => {
    if (!isHydrated) return;
    saveBucketItems(items);
    syncNativeReminders(items);
  }, [items, isHydrated]);

  // Tapping a native reminder notification opens that item
  const [tappedItemId, setTappedItemId] = useState<string | null>(null);
  useEffect(() => onReminderTapped(setTappedItemId), []);
  useEffect(() => {
    if (!tappedItemId || !isHydrated) return;
    const item = items.find((i) => i.id === tappedItemId);
    if (item) setViewingItem(item);
    setTappedItemId(null);
  }, [tappedItemId, items, isHydrated]);

  // Links, text and photos shared from other apps open the New wish form prefilled (native only).
  // They queue while the form is open, so a share never wipes what's being typed.
  const [shareDraft, setShareDraft] = useState<Partial<BucketItem> | null>(null);
  const [queuedShares, setQueuedShares] = useState<Partial<BucketItem>[]>([]);
  useEffect(
    () =>
      onSharedContent((payload) => {
        toDraft(payload).then((draft) => setQueuedShares((prev) => [...prev, draft]));
      }),
    []
  );
  useEffect(() => {
    if (!isHydrated || isFormOpen || queuedShares.length === 0) return;
    setEditingItem(null);
    setShareDraft(queuedShares[0]);
    setQueuedShares((prev) => prev.slice(1));
    setIsFormOpen(true);
  }, [queuedShares, isFormOpen, isHydrated]);

  // Persist categories
  useEffect(() => {
    if (!isHydrated) return;
    saveCategories(categories);
  }, [categories, isHydrated]);

  // Periodic Reminder Checker (checks every 30 seconds); each occurrence alerts once, via lastNotifiedAt
  useEffect(() => {
    const checkReminders = () => {
      const fresh = getUnnotifiedDueItems(items);
      if (fresh.length === 0) return;
      const firstDue = fresh[0];
      setActiveToastItem(firstDue);
      playChimeSound();
      sendBrowserNotification(
        firstDue.title,
        "It's time for this plan!"
      );
      const nowIso = new Date().toISOString();
      const freshIds = new Set(fresh.map((i) => i.id));
      setItems((prev) =>
        prev.map((i) =>
          freshIds.has(i.id) && i.reminder
            ? { ...i, reminder: { ...i.reminder, lastNotifiedAt: nowIso } }
            : i
        )
      );
    };

    if (!isHydrated) return;
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [items, isHydrated]);

  // Overdue and due count for horizon badge
  const dueRemindersCount = useMemo(() => {
    return getDueReminderItems(items).length;
  }, [items]);

  // Handlers
  const handleSaveItem = (itemData: Partial<BucketItem>) => {
    const nowIso = new Date().toISOString();
    if (editingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? ({
                ...item,
                ...itemData,
                updatedAt: nowIso,
              } as BucketItem)
            : item
        )
      );
      if (viewingItem?.id === editingItem.id) {
        setViewingItem((prev) => (prev ? ({ ...prev, ...itemData, updatedAt: nowIso } as BucketItem) : null));
      }
    } else {
      const newItem: BucketItem = {
        id: `verge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        categoryId: itemData.categoryId || 'go',
        title: itemData.title || 'Untitled plan',
        description: itemData.description || '',
        priority: itemData.priority || 'this_year',
        targetDate: itemData.targetDate,
        location: itemData.location,
        budget: itemData.budget,
        currency: itemData.currency || defaultCurrency,
        mediaMeta: itemData.mediaMeta,
        photos: itemData.photos || [],
        linkUrl: itemData.linkUrl,
        prepSteps: itemData.prepSteps,
        steps: itemData.steps,
        reminder: itemData.reminder,
        status: 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setItems((prev) => [newItem, ...prev]);
      // New wishes land at the top of the Journal; say so when it isn't the tab on screen
      if (currentTab !== 'feed') {
        notify('Added to your Plans!', 'success', {
          action: { label: 'Open', onAction: () => setCurrentTab('feed') },
        });
      }
    }
  };

  // Applies a patch to an item and to the open detail sheet, if it shows that item
  const patchItem = (id: string, patch: Partial<BucketItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setViewingItem((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  // The ✓ buttons confirm through InlineConfirm before calling this, so there's no Undo.
  // Finished plans can't be reopened, so this only ever completes.
  const handleToggleComplete = (item: BucketItem) => {
    if (item.status === 'completed') return;
    notify(`You did it: "${item.title}"!`, 'success');
    const nowIso = new Date().toISOString();

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D98F6B', '#E9BD78', '#9BAE91', '#B5A1C8'],
      });
    } catch (err) {
      // graceful
    }
    playChimeSound();

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'completed',
              startedAt: undefined,
              completedAt: nowIso,
              // Every finish starts on the Memories timeline; the sheet's switch can hide it
              hiddenInMemories: false,
              updatedAt: nowIso,
            }
          : i
      )
    );

    setCelebratingItem({
      ...item,
      status: 'completed',
      startedAt: undefined,
      completedAt: nowIso,
      hiddenInMemories: false,
    });
    setIsMilestoneOpen(true);
    if (viewingItem?.id === item.id) {
      setViewingItem(null);
    }
  };

  const handleToggleHiddenInMemories = (item: BucketItem) => {
    const hiddenInMemories = !item.hiddenInMemories;
    patchItem(item.id, { hiddenInMemories });
    setCelebratingItem((prev) => (prev?.id === item.id ? { ...prev, hiddenInMemories } : prev));
  };

  // Start confirms through InlineConfirm before calling this, so there's no Undo.
  // There's no Stop: a started plan is finished or deleted, never moved back to the Journal.
  const handleStart = (item: BucketItem) => {
    if (item.startedAt || item.status !== 'active') return;
    // Prep never blocks starting; the toast just mentions what's still left
    const prepLeft = stepProgress(item.prepSteps);
    const leftCount = prepLeft.total - prepLeft.done;
    const prepNote = leftCount > 0 ? ` ${leftCount} prep ${leftCount === 1 ? 'item' : 'items'} to go.` : '';
    notify(`"${item.title}" is on Now. Enjoy!${prepNote}`, 'success');
    const nowIso = new Date().toISOString();
    const startedAt = nowIso;

    // Take the user to the wish they just started
    setCurrentTab('inprogress');
    setCategoryByTab((prev) => {
      const pick = prev.inprogress;
      return pick && pick !== 'all' && pick !== item.categoryId ? { ...prev, inprogress: undefined } : prev;
    });
    setViewingItem((prev) => (prev?.id === item.id ? null : prev));
    setFocusedNowId(item.id);

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              startedAt,
              updatedAt: nowIso,
            }
          : i
      )
    );

    if (viewingItem?.id === item.id) {
      setViewingItem((prev) => (prev ? { ...prev, startedAt, updatedAt: nowIso } : prev));
    }
  };

  // Applies a change to one of an item's checklists (steps or prep), working from the latest copy so quick taps don't undo each other
  const updateSteps = (id: string, change: (steps: WishStep[]) => WishStep[], list: StepListKey = 'steps') => {
    const nowIso = new Date().toISOString();
    const apply = (i: BucketItem): BucketItem => {
      const steps = change(i[list] || []);
      return { ...i, [list]: steps.length > 0 ? steps : undefined, updatedAt: nowIso };
    };
    setItems((prev) => prev.map((i) => (i.id === id ? apply(i) : i)));
    setViewingItem((prev) => (prev?.id === id ? apply(prev) : prev));
  };

  const handleToggleStep = (item: BucketItem, stepId: string, list: StepListKey = 'steps') => {
    updateSteps(item.id, (steps) => toggleStep(steps, stepId), list);
  };

  const handleAddStep = (item: BucketItem, title: string, list: StepListKey = 'steps') => {
    updateSteps(item.id, (steps) => [...steps, newStep(title)], list);
  };

  const handleRemoveStep = (item: BucketItem, stepId: string, list: StepListKey = 'steps') => {
    const step = item[list]?.find((s) => s.id === stepId);
    if (!step) return;
    // StepList confirms the removal first
    updateSteps(item.id, (steps) => steps.filter((s) => s.id !== stepId), list);
    notify(`Removed "${step.title}".`, 'info');
  };

  // Applies a change to an item's expenses, working from the latest copy like updateSteps
  const updateExpenses = (id: string, change: (expenses: WishExpense[]) => WishExpense[]) => {
    const nowIso = new Date().toISOString();
    const apply = (i: BucketItem): BucketItem => {
      const expenses = change(i.expenses || []);
      return { ...i, expenses: expenses.length > 0 ? expenses : undefined, updatedAt: nowIso };
    };
    setItems((prev) => prev.map((i) => (i.id === id ? apply(i) : i)));
    setViewingItem((prev) => (prev?.id === id ? apply(prev) : prev));
    // The finish sheet can log expenses too
    setCelebratingItem((prev) => (prev?.id === id ? apply(prev) : prev));
  };

  const handleAddExpense = (item: BucketItem, amount: number, note?: string) => {
    updateExpenses(item.id, (expenses) => [...expenses, newExpense(amount, note)]);
    notify(`Logged ${formatMoney(amount, wishCurrency(item))} on "${item.title}".`, 'success');
  };

  const handleRemoveExpense = (item: BucketItem, expenseId: string) => {
    const expense = item.expenses?.find((e) => e.id === expenseId);
    if (!expense) return;
    // ExpenseList confirms the removal first
    updateExpenses(item.id, (expenses) => expenses.filter((e) => e.id !== expenseId));
    notify(`Removed ${formatMoney(expense.amount, wishCurrency(item))} expense.`, 'info');
  };

  const handleAddPhoto = (item: BucketItem, photoDataUrl: string, note?: string) => {
    const nowIso = new Date().toISOString();
    const append = (i: BucketItem): BucketItem => ({
      ...i,
      photos: [...(i.photos || []), photoDataUrl],
      photoNotes: note ? { ...i.photoNotes, [photoKey(photoDataUrl)]: note } : i.photoNotes,
      updatedAt: nowIso,
    });

    setItems((prev) => prev.map((i) => (i.id === item.id ? append(i) : i)));
    if (viewingItem?.id === item.id) {
      setViewingItem((prev) => (prev ? append(prev) : prev));
    }
  };

  // Videos and PDFs are stored as files (native) or in IndexedDB (web); the item keeps only their metadata
  const handleAddAttachment = async (item: BucketItem, file: File, note?: string) => {
    try {
      const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      await saveAttachment(id, file);
      const nowIso = new Date().toISOString();
      const append = (i: BucketItem): BucketItem => ({
        ...i,
        attachments: [
          ...(i.attachments || []),
          { id, name: file.name, mimeType: file.type, size: file.size, addedAt: nowIso, note },
        ],
        updatedAt: nowIso,
      });

      setItems((prev) => prev.map((i) => (i.id === item.id ? append(i) : i)));
      if (viewingItem?.id === item.id) {
        setViewingItem((prev) => (prev ? append(prev) : prev));
      }
    } catch (err) {
      console.error('Failed to add file:', err);
      notify(`Couldn't add "${file.name}". Try again?`, 'error');
    }
  };

  const handleSaveReflection =(itemId: string, reflection: string, rating: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              completionReflection: reflection,
              completionRating: rating,
              updatedAt: new Date().toISOString(),
            }
          : i
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return;
    const target = items[index];

    // Delete is confirmed inline first, so its files can go right away
    const attachmentIds = target.attachments?.map((a) => a.id) || [];
    if (attachmentIds.length > 0) {
      deleteAttachmentBlobs(attachmentIds).catch((err) => console.error('Failed to delete attachments:', err));
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
    if (activeToastItem?.id === id) {
      setActiveToastItem(null);
    }
    if (viewingItem?.id === id) {
      setViewingItem(null);
    }

    notify(`"${target.title}" is gone.`, 'info');
  };

  // Closing the global search also clears it, so no hidden filter stays applied
  const handleToggleSearch = () => {
    if (isSearchOpen) setSearchQuery('');
    setIsSearchOpen(!isSearchOpen);
  };

  // Global search: every tab renders from these items
  const searchedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location?.name.toLowerCase().includes(q) ||
        item.mediaMeta?.authorOrCreator?.toLowerCase().includes(q) ||
        item.steps?.some((s) => s.title.toLowerCase().includes(q)) ||
        item.prepSteps?.some((s) => s.title.toLowerCase().includes(q)) ||
        item.expenses?.some((e) => e.note?.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Categories whose done plans the Vault keeps (set in Settings)
  const keptIds = useMemo(() => keptCategoryIds(categories), [categories]);

  // Items each tab lists, so the category ribbon counts match what the tab shows
  const inTabScope = (item: BucketItem) => {
    switch (currentTab) {
      case 'feed':
        return item.status === 'active' && !item.startedAt;
      case 'inprogress':
        return item.status === 'active' && Boolean(item.startedAt);
      case 'reminders':
        return (
          item.status === 'active' &&
          (Boolean(item.reminder?.date) || targetDateTime(item) !== null) &&
          (horizonRange === 'all' || isTimeInRange(horizonTime(item), horizonRange))
        );
      case 'vault':
        return isInVault(item, keptIds) && isInRange(vaultDate(item), vaultRange);
      case 'milestones':
        return item.status === 'completed' && !item.hiddenInMemories;
      default:
        return false;
    }
  };

  // Dynamic counts
  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    searchedItems.forEach((item) => {
      if (inTabScope(item)) {
        counts['all'] = (counts['all'] || 0) + 1;
        counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [searchedItems, currentTab, vaultRange, horizonRange, keptIds]);

  // Global category filter: every tab renders from these items
  const filteredItems = useMemo(() => {
    if (selectedCategoryId === 'all') return searchedItems;
    return searchedItems.filter((item) => item.categoryId === selectedCategoryId);
  }, [searchedItems, selectedCategoryId]);

  // Vault items within the picked time; the year picks come from every Vault wish
  const vaultItems = useMemo(
    () => filteredItems.filter((item) => isInRange(vaultDate(item), vaultRange)),
    [filteredItems, vaultRange]
  );
  // Horizon plans within the picked time (a due reminder counts as now)
  const horizonItems = useMemo(
    () =>
      horizonRange === 'all'
        ? filteredItems
        : filteredItems.filter((item) => isTimeInRange(horizonTime(item), horizonRange)),
    [filteredItems, horizonRange]
  );
  const vaultYearRanges = useMemo(
    () => earlierYears(searchedItems.filter((i) => isInVault(i, keptIds)).map(vaultDate)),
    [searchedItems, keptIds]
  );

  // Filtered Feed Items, in the user's priority order (the order of the items array)
  const filteredActiveItems = useMemo(() => {
    return filteredItems.filter((item) => item.status === 'active' && !item.startedAt);
  }, [filteredItems]);

  // Reorder only the visible subset: the dragged items swap among the array slots they
  // already occupy, so items hidden by filters or search keep their positions
  const handleReorderJournal = (orderedIds: string[]) => {
    setItems((prev) => {
      const visible = new Set(orderedIds);
      const byId = new Map(prev.map((i) => [i.id, i]));
      const next = [...prev];
      let cursor = 0;
      prev.forEach((item, index) => {
        if (visible.has(item.id)) {
          next[index] = byId.get(orderedIds[cursor++])!;
        }
      });
      return next;
    });
  };

  // In-progress items, most recently started first
  const inProgressItems = useMemo(() => {
    return filteredItems
      .filter((item) => item.status === 'active' && item.startedAt)
      .sort((a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime());
  }, [filteredItems]);

  // Empty states offer Clear only while search or the tab's category pick hides plans
  const clearFilters =
    selectedCategoryId !== 'all' || searchQuery.trim() !== ''
      ? () => {
          setSelectedCategoryId('all');
          setSearchQuery('');
        }
      : undefined;

  if (!isHydrated) {
    if (!loadFailed) return <div className="min-h-screen bg-page" />;
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <div className="max-w-xs text-center space-y-3">
          <h1 className="font-serif-journal text-lg text-ink">Your journal didn't open this time</h1>
          <p className="text-sm text-ink/60">Your plans are still saved on this device. Try again?</p>
          <button
            type="button"
            onClick={() => {
              setLoadFailed(false);
              setLoadAttempt((n) => n + 1);
            }}
            className="min-h-[44px] px-5 bg-ink text-paper text-sm font-semibold rounded-lg hover:bg-ink/85 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen paper-texture flex flex-col selection:bg-accent/20 selection:text-ink">
      {/* Top Application Navigation */}
      <TopNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeRemindersCount={dueRemindersCount}
        isMobileFrame={isMobileFrame}
        showMobileFrameToggle={!isNative}
        onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
        onOpenSerendipity={() => setIsSerendipityOpen(true)}
        isSearchOpen={isSearchOpen}
        onCloseSearch={handleToggleSearch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen((open) => !open)}
      />

      {/* Main Container */}
      <div className="flex-1 flex justify-center py-3 sm:py-5 px-3 sm:px-6">
        <main
          className={`w-full transition-all duration-300 ${
            isMobileFrame
              ? 'max-w-[420px] bg-card border border-ink/15 rounded-[38px] p-4 shadow-2xl relative my-auto min-h-[780px] overflow-hidden'
              : 'max-w-3xl'
          }`}
        >
          {/* Simulated Mobile Status Notch when in Mobile Frame Mode */}
          {isMobileFrame && (
            <div className="flex items-center justify-between pb-3 pt-1 text-[11px] font-mono text-ink/50 px-2 select-none border-b border-ink/8 mb-3">
              <span>9:41</span>
              <div className="w-16 h-3 bg-ink/10 rounded-full" />
              <span>5G · 100%</span>
            </div>
          )}

          {/* In-App Active Reminder Notification Toast */}
          {activeToastItem && (
            <div className="mb-3.5 p-3 bg-warm border border-alert/30 rounded-2xl shadow-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div
                onClick={() => setViewingItem(activeToastItem)}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-alert shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] uppercase tracking-wider text-alert font-bold block">
                    Reminder
                  </span>
                  <span className="text-xs font-semibold text-ink truncate block">
                    {activeToastItem.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveToastItem(null)}
                  aria-label="Dismiss reminder"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink/50 hover:text-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Global Category Ribbon */}
          <div className="mb-3">
            <CategoryRibbon
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              countsByCategory={countsByCategory}
            />
          </div>

          {/* TAB 1: STREAMLINED JOURNAL FEED */}
          {currentTab === 'feed' && (
            <div className="space-y-3">
              {/* Clean Single Paper Card Container for Items */}
              {filteredActiveItems.length === 0 ? (
                <EmptyState
                  icon={<Compass className="w-6 h-6 stroke-[1.5]" />}
                  title="Ready for your next plan"
                  hint="Tap New to add one."
                  onClearFilters={clearFilters}
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setIsFormOpen(true);
                      }}
                      className="min-h-[44px] px-4 bg-ink text-paper text-xs font-semibold rounded-lg hover:bg-ink/85 transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New</span>
                    </button>
                  }
                />
              ) : (
                <JournalList
                  items={filteredActiveItems}
                  categories={categories}
                  onToggleComplete={handleToggleComplete}
                  onStart={handleStart}
                  onDelete={handleDeleteItem}
                  onSelect={(it) => setViewingItem(it)}
                  onReorder={handleReorderJournal}
                />
              )}
            </div>
          )}

          {/* TAB 2: REMINDER HORIZON */}
          {currentTab === 'reminders' && (
            <ReminderHorizonView
              items={horizonItems}
              range={horizonRange}
              onRangeChange={setHorizonRange}
              isRangeOpen={isHorizonRangeOpen}
              onOpenRange={() => setIsHorizonRangeOpen(true)}
              onCloseRange={() => setIsHorizonRangeOpen(false)}
              categories={categories}
              onNotificationsEnabled={() => syncNativeReminders(items)}
              onToggleComplete={handleToggleComplete}
              onStart={handleStart}
              onDelete={handleDeleteItem}
              onSelect={(it) => setViewingItem(it)}
              onClearFilters={clearFilters}
            />
          )}

          {/* TAB: IN PROGRESS (NOW) */}
          {currentTab === 'inprogress' && (
            <InProgressView
              items={inProgressItems}
              categories={categories}
              onSelect={(it) => setViewingItem(it)}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteItem}
              onAddPhoto={handleAddPhoto}
              onAddAttachment={handleAddAttachment}
              onToggleStep={handleToggleStep}
              onAddExpense={handleAddExpense}
              focusId={focusedNowId}
              onFocusDone={() => setFocusedNowId(null)}
              onClearFilters={clearFilters}
            />
          )}

          {/* TAB 3: CURATED VAULT & SHELF */}
          {currentTab === 'vault' && (
            <VaultView
              items={vaultItems}
              range={vaultRange}
              yearRanges={vaultYearRanges}
              onRangeChange={setVaultRange}
              isRangeOpen={isVaultRangeOpen}
              onOpenRange={() => setIsVaultRangeOpen(true)}
              onCloseRange={() => setIsVaultRangeOpen(false)}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onSelect={(it) => setViewingItem(it)}
              onClearFilters={clearFilters}
            />
          )}

          {/* TAB 4: RETROSPECTIVE MEMORIES */}
          {currentTab === 'milestones' && (
            <MilestonesArchiveView
              items={filteredItems}
              categories={categories}
              onSelect={(it) => setViewingItem(it)}
              onEdit={(it) => {
                setCelebratingItem(it);
                setIsMilestoneOpen(true);
              }}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteItem}
              onAddPhoto={handleAddPhoto}
              onAddAttachment={handleAddAttachment}
              onAddExpense={handleAddExpense}
              onClearFilters={clearFilters}
            />
          )}

          {/* Bottom spacer: keeps content clear of the mobile tab bar and the floating Search/New buttons */}
          <div aria-hidden className="pb-36 md:pb-24" />
        </main>
      </div>

      {/* Floating Search and New, on every width */}
      <FloatingActions
        onOpenCreate={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        isSearchOpen={isSearchOpen}
        onToggleSearch={handleToggleSearch}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomTabBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeRemindersCount={dueRemindersCount}
      />

      {/* Settings, toggled by the gear in TopNav. Before the other sheets so a drawer opened by a reminder or share lands on top */}
      <Sheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        width="md"
        labelledBy="settings-sheet-title"
      >
        <SettingsView
          items={items}
          categories={categories}
          onReloadData={(newItems, newCats) => {
            setItems(stampCurrency(newItems, defaultCurrency));
            setCategories(newCats);
            // The selected categories may no longer exist
            setCategoryByTab({});
            setVaultRange('all');
            setHorizonRange('all');
            setActiveToastItem(null);
          }}
          onCategoriesChange={setCategories}
          theme={theme}
          onThemeChange={setTheme}
          defaultCurrency={defaultCurrency}
          onDefaultCurrencyChange={setDefaultCurrency}
          onNotificationsEnabled={() => syncNativeReminders(items)}
          onClose={() => setIsSettingsOpen(false)}
        />
      </Sheet>

      {/* Item Detail Sheet (Tap-to-Inspect) */}
      <ItemDetailDrawer
        item={viewingItem}
        isOpen={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
        onEdit={(it) => {
          setViewingItem(null);
          setEditingItem(it);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteItem}
        onToggleComplete={handleToggleComplete}
        onStart={handleStart}
        onToggleHiddenInMemories={handleToggleHiddenInMemories}
        onToggleStep={handleToggleStep}
        onAddStep={handleAddStep}
        onRemoveStep={handleRemoveStep}
        onAddExpense={handleAddExpense}
        onRemoveExpense={handleRemoveExpense}
        categoryDef={
          viewingItem
            ? categories.find((c) => c.id === viewingItem.categoryId)
            : undefined
        }
      />

      {/* Item Form Drawer (Create / Edit) */}
      <ItemFormDrawer
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
          setShareDraft(null);
        }}
        onSave={handleSaveItem}
        categories={categories}
        editingItem={editingItem}
        draft={shareDraft}
        defaultCategoryId={selectedCategoryId}
        defaultCurrency={defaultCurrency}
      />

      {/* Milestone Accomplishment Sheet */}
      <MilestoneSheet
        key={celebratingItem?.id ?? 'none'}
        isOpen={isMilestoneOpen}
        item={celebratingItem}
        onClose={() => {
          setIsMilestoneOpen(false);
          setCelebratingItem(null);
        }}
        onSaveReflection={handleSaveReflection}
        onToggleHide={handleToggleHiddenInMemories}
        onAddExpense={handleAddExpense}
        onRemoveExpense={handleRemoveExpense}
      />

      {/* Serendipity Inspiration Sheet */}
      <SerendipitySheet
        isOpen={isSerendipityOpen}
        onClose={() => setIsSerendipityOpen(false)}
        items={items}
        categories={categories}
        onSelectFocus={(item) => {
          const dest: ViewTab = item.startedAt ? 'inprogress' : 'feed';
          setSelectedCategoryId(item.categoryId, dest);
          setCurrentTab(dest);
          setViewingItem(item);
        }}
      />

      {/* In-app notices with Undo (replaces window.alert; there are no confirm dialogs) */}
      <DialogHost />
    </div>
  );
}
