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
} from './types';
import {
  loadBucketItems,
  saveBucketItems,
  loadCategories,
  saveCategories,
  loadTheme,
  saveTheme,
  ThemePreference,
} from './services/storage';
import {
  playChimeSound,
  sendBrowserNotification,
  getDueReminderItems,
  getUnnotifiedDueItems,
} from './services/notifications';
import { saveAttachment, deleteAttachmentBlobs } from './services/attachments';
import { syncNativeReminders, onReminderTapped } from './services/reminderScheduler';
import { isNative, applyNativeTheme } from './services/platform';
import { notify, notifyUndo, UNDO_MS } from './services/dialogs';
import { photoKey } from './utils/photoKey';

import { TopNav } from './components/TopNav';
import { BottomTabBar } from './components/BottomTabBar';
import { CategoryRibbon } from './components/CategoryRibbon';
import { JournalList } from './components/JournalList';
import { ItemDetailDrawer } from './components/ItemDetailDrawer';
import { ItemFormDrawer } from './components/ItemFormDrawer';
import { MilestoneSheet } from './components/MilestoneSheet';
import { ReminderRadarView } from './components/ReminderRadarView';
import { VaultView, isInVault } from './components/VaultView';
import { MilestonesArchiveView } from './components/MilestonesArchiveView';
import { InProgressView } from './components/InProgressView';
import { SerendipitySheet } from './components/SerendipitySheet';
import { SettingsView } from './components/SettingsView';
import { DialogHost } from './components/DialogHost';

export default function App() {
  // State
  const [items, setItems] = useState<BucketItem[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  // Storage is async; nothing is saved, synced or rendered until the stored data is loaded
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentTab, setCurrentTab] = useState<ViewTab>('inprogress');
  // Each tab keeps its own category pick
  const [categoryByTab, setCategoryByTab] = useState<Partial<Record<ViewTab, string>>>({});
  const selectedCategoryId = categoryByTab[currentTab] ?? 'all';
  const setSelectedCategoryId = (id: string, tab: ViewTab = currentTab) =>
    setCategoryByTab((prev) => ({ ...prev, [tab]: id }));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sheets
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null);
  const [viewingItem, setViewingItem] = useState<BucketItem | null>(null);
  const [celebratingItem, setCelebratingItem] = useState<BucketItem | null>(null);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const [isSerendipityOpen, setIsSerendipityOpen] = useState(false);

  // Attachment blobs of deleted items are removed only once their Undo window has passed
  const pendingBlobDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Desktop Mobile Frame Toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Appearance: 'system' follows prefers-color-scheme, otherwise forced via data-theme
  const [theme, setTheme] = useState<ThemePreference>('system');

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadBucketItems(), loadCategories(), loadTheme()]).then(
      ([loadedItems, loadedCategories, loadedTheme]) => {
        if (cancelled) return;
        setItems(loadedItems);
        setCategories(loadedCategories);
        setTheme(loadedTheme);
        setIsHydrated(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

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
        `Nowish: ${firstDue.title}`,
        `Reminder for your bucket list wish: ${firstDue.title}`
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

  // Overdue and due count for radar badge
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
        title: itemData.title || 'Untitled Wish',
        description: itemData.description || '',
        priority: itemData.priority || 'this_year',
        targetDate: itemData.targetDate,
        location: itemData.location,
        budget: itemData.budget,
        mediaMeta: itemData.mediaMeta,
        photos: itemData.photos || [],
        linkUrl: itemData.linkUrl,
        reminder: itemData.reminder,
        status: 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setItems((prev) => [newItem, ...prev]);
      // New wishes land at the top of the Journal; say so when it isn't the tab on screen
      if (currentTab !== 'feed') {
        notify('Added to your Journal.', 'success', {
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

  // No confirm step: the change applies at once and the toast offers Undo
  const handleToggleComplete = (item: BucketItem) => {
    const isNowCompleted = item.status !== 'completed';
    const previous: Partial<BucketItem> = {
      status: item.status,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      keptInVault: item.keptInVault,
      // A note written in the reflection sheet goes away with the completion it belongs to
      completionReflection: item.completionReflection,
      completionRating: item.completionRating,
      updatedAt: item.updatedAt,
    };
    notifyUndo(isNowCompleted ? `Accomplished "${item.title}".` : `"${item.title}" is back in your Journal.`, () => {
      patchItem(item.id, previous);
      // Dropping the celebrated item hides its reflection sheet (MilestoneSheet renders nothing without one)
      if (isNowCompleted) {
        setCelebratingItem((prev) => (prev?.id === item.id ? null : prev));
      }
    });
    const nowIso = new Date().toISOString();

    if (isNowCompleted) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#4A6B56', '#B45309', '#1E1915', '#F5E6D3'],
        });
      } catch (err) {
        // graceful
      }
      playChimeSound();

      // The finish sheet's "Keep in Vault" switch starts from the category's setting
      const keptInVault = Boolean(categories.find((c) => c.id === item.categoryId)?.keepInVault);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'completed',
                startedAt: undefined,
                completedAt: nowIso,
                keptInVault,
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
        keptInVault,
      });
      setIsMilestoneOpen(true);
      if (viewingItem?.id === item.id) {
        setViewingItem(null);
      }
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'active',
                completedAt: undefined,
                updatedAt: nowIso,
              }
            : i
        )
      );
    }
  };

  const handleToggleKeptInVault = (item: BucketItem) => {
    const keptInVault = !item.keptInVault;
    patchItem(item.id, { keptInVault });
    setCelebratingItem((prev) => (prev?.id === item.id ? { ...prev, keptInVault } : prev));
  };

  const handleToggleStarted = (item: BucketItem) => {
    const previous = { startedAt: item.startedAt, updatedAt: item.updatedAt };
    notifyUndo(
      item.startedAt ? `Stopped "${item.title}".` : `Started "${item.title}". It's on Now.`,
      () => patchItem(item.id, previous)
    );
    const nowIso = new Date().toISOString();
    const startedAt = item.startedAt ? undefined : nowIso;

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
      notify(`Could not add "${file.name}".`, 'error');
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

    const attachmentIds = target.attachments?.map((a) => a.id) || [];
    if (attachmentIds.length > 0) {
      pendingBlobDeletes.current.set(
        id,
        setTimeout(() => {
          pendingBlobDeletes.current.delete(id);
          deleteAttachmentBlobs(attachmentIds).catch((err) =>
            console.error('Failed to delete attachments:', err)
          );
          // A second past the toast, so a last-moment Undo never finds its files gone
        }, UNDO_MS + 1000)
      );
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
    if (activeToastItem?.id === id) {
      setActiveToastItem(null);
    }
    if (viewingItem?.id === id) {
      setViewingItem(null);
    }

    notifyUndo(`Deleted "${target.title}".`, () => {
      clearTimeout(pendingBlobDeletes.current.get(id));
      pendingBlobDeletes.current.delete(id);
      // Back into the slot it had, as far as the list still allows
      setItems((prev) =>
        prev.some((i) => i.id === id)
          ? prev
          : [...prev.slice(0, index), target, ...prev.slice(index)]
      );
    });
  };

  const handleSnooze = (item: BucketItem, days: number) => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + days);
    const snoozeIso = snoozeDate.toISOString();

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              reminder: i.reminder
                ? {
                    ...i.reminder,
                    snoozedUntil: snoozeIso,
                  }
                : undefined,
              updatedAt: new Date().toISOString(),
            }
          : i
      )
    );

    if (activeToastItem?.id === item.id) {
      setActiveToastItem(null);
    }
    if (viewingItem?.id === item.id) {
      setViewingItem((prev) =>
        prev && prev.reminder
          ? { ...prev, reminder: { ...prev.reminder, snoozedUntil: snoozeIso } }
          : prev
      );
    }
  };

  // Closing the global search also clears it, so no hidden filter stays applied
  const handleToggleSearch = () => {
    if (isSearchOpen) setSearchQuery('');
    setIsSearchOpen(!isSearchOpen);
  };

  // Global search: every tab except Settings renders from these items
  const searchedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location?.name.toLowerCase().includes(q) ||
        item.mediaMeta?.authorOrCreator?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Items each tab lists, so the category ribbon counts match what the tab shows
  const inTabScope = (item: BucketItem) => {
    switch (currentTab) {
      case 'feed':
        return item.status === 'active' && !item.startedAt;
      case 'inprogress':
        return item.status === 'active' && Boolean(item.startedAt);
      case 'reminders':
        return item.status === 'active' && Boolean(item.reminder?.date);
      case 'vault':
        return isInVault(item);
      case 'milestones':
        return item.status === 'completed';
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
  }, [searchedItems, currentTab]);

  // Global category filter: every tab except Settings renders from these items
  const filteredItems = useMemo(() => {
    if (selectedCategoryId === 'all') return searchedItems;
    return searchedItems.filter((item) => item.categoryId === selectedCategoryId);
  }, [searchedItems, selectedCategoryId]);

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

  if (!isHydrated) return <div className="min-h-screen bg-page" />;

  return (
    <div className="min-h-screen paper-texture flex flex-col selection:bg-[#B45309]/20 selection:text-ink">
      {/* Top Application Navigation */}
      <TopNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeRemindersCount={dueRemindersCount}
        isMobileFrame={isMobileFrame}
        showMobileFrameToggle={!isNative}
        onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
        onOpenCreate={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        onOpenSerendipity={() => setIsSerendipityOpen(true)}
        isSearchOpen={isSearchOpen}
        onToggleSearch={handleToggleSearch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
            <div className="mb-3.5 p-3 bg-warm border border-[#C05621]/30 rounded-2xl shadow-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div
                onClick={() => setViewingItem(activeToastItem)}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-[#C05621] shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] uppercase tracking-wider text-[#C05621] font-bold block">
                    Alert Due
                  </span>
                  <span className="text-xs font-semibold text-ink truncate block">
                    {activeToastItem.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleSnooze(activeToastItem, 1)}
                  title="Snooze 1 day"
                  className="min-h-[44px] px-2.5 py-1 text-xs font-medium bg-card border border-ink/15 rounded-lg hover:bg-paper text-ink"
                >
                  Snooze
                </button>
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
          {currentTab !== 'settings' && (
            <div className="mb-3">
              <CategoryRibbon
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                countsByCategory={countsByCategory}
              />
            </div>
          )}

          {/* TAB 1: STREAMLINED JOURNAL FEED */}
          {currentTab === 'feed' && (
            <div className="space-y-3">
              {/* Clean Single Paper Card Container for Items */}
              {filteredActiveItems.length === 0 ? (
                <div className="p-10 text-center bg-card border border-ink/10 rounded-lg space-y-3 mt-3">
                  <div className="w-12 h-12 bg-paper text-ink/40 rounded-lg mx-auto flex items-center justify-center">
                    <Compass className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h3 className="font-serif-journal text-base font-medium text-ink">
                    No active aspirations found
                  </h3>
                  <p className="text-xs text-ink/60 max-w-xs mx-auto">
                    Add your next wish or clear filters to see your lists.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {(selectedCategoryId !== 'all' || searchQuery.trim() !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId('all');
                          setSearchQuery('');
                        }}
                        className="min-h-[40px] px-3.5 py-2 bg-card border border-ink/15 text-ink text-xs font-semibold rounded-lg hover:bg-paper transition-all"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setIsFormOpen(true);
                      }}
                      className="min-h-[40px] px-4 py-2 bg-ink text-paper text-xs font-semibold rounded-lg hover:bg-ink/85 transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New</span>
                    </button>
                  </div>
                </div>
              ) : (
                <JournalList
                  items={filteredActiveItems}
                  categories={categories}
                  onToggleComplete={handleToggleComplete}
                  onToggleStarted={handleToggleStarted}
                  onDelete={handleDeleteItem}
                  onSelect={(it) => setViewingItem(it)}
                  onReorder={handleReorderJournal}
                />
              )}
            </div>
          )}

          {/* TAB 2: REMINDER RADAR */}
          {currentTab === 'reminders' && (
            <ReminderRadarView
              items={filteredItems}
              categories={categories}
              onSnooze={handleSnooze}
              onNotificationsEnabled={() => syncNativeReminders(items)}
              onToggleComplete={handleToggleComplete}
              onToggleStarted={handleToggleStarted}
              onDelete={handleDeleteItem}
              onSelect={(it) => setViewingItem(it)}
            />
          )}

          {/* TAB: IN PROGRESS (NOW) */}
          {currentTab === 'inprogress' && (
            <InProgressView
              items={inProgressItems}
              categories={categories}
              onSelect={(it) => setViewingItem(it)}
              onToggleComplete={handleToggleComplete}
              onStop={handleToggleStarted}
              onDelete={handleDeleteItem}
              onAddPhoto={handleAddPhoto}
              onAddAttachment={handleAddAttachment}
            />
          )}

          {/* TAB 3: CURATED VAULT & SHELF */}
          {currentTab === 'vault' && (
            <VaultView
              items={filteredItems}
              categories={categories}
              onSelect={(it) => setViewingItem(it)}
              onToggleComplete={handleToggleComplete}
              onEdit={(it) => {
                setEditingItem(it);
                setIsFormOpen(true);
              }}
            />
          )}

          {/* TAB 4: RETROSPECTIVE MEMORIES */}
          {currentTab === 'milestones' && (
            <MilestonesArchiveView
              items={filteredItems}
              categories={categories}
              onSelect={(it) => setViewingItem(it)}
              onToggleComplete={handleToggleComplete}
              onEdit={(it) => {
                setCelebratingItem(it);
                setIsMilestoneOpen(true);
              }}
            />
          )}

          {/* TAB 5: SETTINGS & BACKUP */}
          {currentTab === 'settings' && (
            <SettingsView
              items={items}
              categories={categories}
              onReloadData={(newItems, newCats) => {
                setItems(newItems);
                setCategories(newCats);
                // The selected categories may no longer exist
                setCategoryByTab({});
                setActiveToastItem(null);
              }}
              onCategoriesChange={setCategories}
              theme={theme}
              onThemeChange={setTheme}
              onNotificationsEnabled={() => syncNativeReminders(items)}
            />
          )}

          {/* Bottom spacer: keeps content clear of the mobile tab bar */}
          <div aria-hidden className="pb-16 md:pb-4" />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomTabBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeRemindersCount={dueRemindersCount}
        onOpenCreate={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        isSearchOpen={isSearchOpen}
        onToggleSearch={handleToggleSearch}
      />

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
        onToggleStarted={handleToggleStarted}
        onToggleKeptInVault={handleToggleKeptInVault}
        onSnooze={handleSnooze}
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
        }}
        onSave={handleSaveItem}
        categories={categories}
        editingItem={editingItem}
        defaultCategoryId={selectedCategoryId}
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
        onToggleKeep={handleToggleKeptInVault}
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
