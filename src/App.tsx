import React, { useState, useEffect, useMemo } from 'react';
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
  DefaultCategoryId,
  FilterSortOption,
  PriorityLevel,
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
} from './services/notifications';
import { saveAttachmentBlob, deleteAttachmentBlobs } from './services/attachments';
import { syncNativeReminders, onReminderTapped } from './services/reminderScheduler';
import { isNative, applyNativeTheme } from './services/platform';
import { confirmAction, notify } from './services/dialogs';
import { photoKey } from './utils/photoKey';

import { TopNav } from './components/TopNav';
import { BottomTabBar } from './components/BottomTabBar';
import { CategoryRibbon } from './components/CategoryRibbon';
import { ItemRow } from './components/ItemRow';
import { ItemDetailDrawer } from './components/ItemDetailDrawer';
import { ItemFormDrawer } from './components/ItemFormDrawer';
import { MilestoneModal } from './components/MilestoneModal';
import { ReminderRadarView } from './components/ReminderRadarView';
import { VaultView } from './components/VaultView';
import { MilestonesArchiveView } from './components/MilestonesArchiveView';
import { InProgressView } from './components/InProgressView';
import { SerendipityModal } from './components/SerendipityModal';
import { SettingsView } from './components/SettingsView';
import { CreateCategoryModal } from './components/CreateCategoryModal';
import { DialogHost } from './components/DialogHost';

export default function App() {
  // State
  const [items, setItems] = useState<BucketItem[]>(() => loadBucketItems());
  const [categories, setCategories] = useState<CategoryDefinition[]>(() => loadCategories());
  const [currentTab, setCurrentTab] = useState<ViewTab>('inprogress');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOption] = useState<FilterSortOption>('targetDate');

  // Modals & Drawers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null);
  const [viewingItem, setViewingItem] = useState<BucketItem | null>(null);
  const [celebratingItem, setCelebratingItem] = useState<BucketItem | null>(null);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const [isSerendipityOpen, setIsSerendipityOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  // Desktop Mobile Frame Toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Appearance: 'system' follows prefers-color-scheme, otherwise forced via data-theme
  const [theme, setTheme] = useState<ThemePreference>(() => loadTheme());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = theme;
    }
    saveTheme(theme);
    applyNativeTheme(theme);
  }, [theme]);

  // Active Reminder In-App Toast
  const [activeToastItem, setActiveToastItem] = useState<BucketItem | null>(null);

  // Persist items and hand reminders to the OS (native only)
  useEffect(() => {
    saveBucketItems(items);
    syncNativeReminders(items);
  }, [items]);

  // Tapping a native reminder notification opens that item
  const [tappedItemId, setTappedItemId] = useState<string | null>(null);
  useEffect(() => onReminderTapped(setTappedItemId), []);
  useEffect(() => {
    if (!tappedItemId) return;
    const item = items.find((i) => i.id === tappedItemId);
    if (item) setViewingItem(item);
    setTappedItemId(null);
  }, [tappedItemId, items]);

  // Persist categories
  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  // Periodic Reminder Checker (checks every 30 seconds)
  useEffect(() => {
    const checkReminders = () => {
      const due = getDueReminderItems(items);
      if (due.length > 0) {
        const firstDue = due[0];
        setActiveToastItem(firstDue);
        playChimeSound();
        sendBrowserNotification(
          `My Verge: ${firstDue.title}`,
          `Reminder for your bucket list intention: ${firstDue.title}`
        );
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [items]);

  // Dynamic counts
  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    items.forEach((item) => {
      if (item.status === 'active' && !item.startedAt) {
        counts['all'] = (counts['all'] || 0) + 1;
        counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const countsBySubCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      if (
        item.status === 'active' &&
        !item.startedAt &&
        item.subCategory &&
        (selectedCategoryId === 'all' || item.categoryId === selectedCategoryId)
      ) {
        counts[item.subCategory] = (counts[item.subCategory] || 0) + 1;
      }
    });
    return counts;
  }, [items, selectedCategoryId]);

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
        subCategory: itemData.subCategory,
        title: itemData.title || 'Untitled Intention',
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
    }
  };

  const handleToggleComplete = async (item: BucketItem) => {
    const isNowCompleted = item.status !== 'completed';
    if (
      isNowCompleted &&
      !(await confirmAction({
        title: 'Mark as accomplished?',
        message: item.title,
        confirmLabel: 'Accomplish',
      }))
    ) {
      return;
    }
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

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'completed',
                startedAt: undefined,
                completedAt: nowIso,
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

  const handleToggleStarted = async (item: BucketItem) => {
    if (
      item.startedAt &&
      !(await confirmAction({
        title: 'Stop this intention?',
        message: `"${item.title}" will move back to your Journal.`,
        confirmLabel: 'Stop',
      }))
    ) {
      return;
    }
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

  // Videos and PDFs are stored in IndexedDB; the item keeps only their metadata
  const handleAddAttachment = async (item: BucketItem, file: File, note?: string) => {
    try {
      const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      await saveAttachmentBlob(id, file);
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

  const handleDeleteItem = async (id: string) => {
    const target = items.find((i) => i.id === id);
    const confirmed = await confirmAction({
      title: target ? `Delete "${target.title}"?` : 'Delete this intention?',
      message: 'This also removes its photos and files.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (confirmed) {
      const attachmentIds = target?.attachments?.map((a) => a.id) || [];
      deleteAttachmentBlobs(attachmentIds).catch((err) =>
        console.error('Failed to delete attachments:', err)
      );
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (activeToastItem?.id === id) {
        setActiveToastItem(null);
      }
      if (viewingItem?.id === id) {
        setViewingItem(null);
      }
    }
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

  const handleCustomSnooze = (item: BucketItem, dateIso: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              reminder: i.reminder
                ? {
                    ...i.reminder,
                    snoozedUntil: dateIso,
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
  };

  const handleAddSubCategory = (categoryId: string, newSubCategory: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId && !cat.defaultSubCategories.includes(newSubCategory)) {
          return {
            ...cat,
            defaultSubCategories: [...cat.defaultSubCategories, newSubCategory],
          };
        }
        return cat;
      })
    );
  };

  const handleCreateCategory = (newCategory: CategoryDefinition) => {
    setCategories((prev) => [...prev, newCategory]);
    setSelectedCategoryId(newCategory.id);
    setSelectedSubCategory('all');
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
        item.subCategory?.toLowerCase().includes(q) ||
        item.location?.name.toLowerCase().includes(q) ||
        item.mediaMeta?.authorOrCreator?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Filtered & Sorted Feed Items
  const filteredActiveItems = useMemo(() => {
    return searchedItems
      .filter((item) => {
        if (item.status !== 'active' || item.startedAt) return false;

        if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
          return false;
        }

        if (selectedSubCategory !== 'all' && item.subCategory !== selectedSubCategory) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'targetDate') {
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        }
        if (sortOption === 'priority') {
          const weights: Record<PriorityLevel, number> = {
            urgent: 4,
            this_month: 3,
            this_year: 2,
            someday: 1,
          };
          return weights[b.priority] - weights[a.priority];
        }
        if (sortOption === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortOption === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [searchedItems, selectedCategoryId, selectedSubCategory, sortOption]);

  // In-progress items, most recently started first
  const inProgressItems = useMemo(() => {
    return searchedItems
      .filter((item) => item.status === 'active' && item.startedAt)
      .sort((a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime());
  }, [searchedItems]);

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
                  className="min-h-[34px] px-2.5 py-1 text-xs font-medium bg-card border border-ink/15 rounded-lg hover:bg-paper text-ink"
                >
                  Snooze 1d
                </button>
                <button
                  onClick={() => setActiveToastItem(null)}
                  className="min-h-[34px] min-w-[34px] flex items-center justify-center text-ink/50 hover:text-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: STREAMLINED JOURNAL FEED */}
          {currentTab === 'feed' && (
            <div className="space-y-3">
              {/* Category Ribbon: Categories row or Sub-categories row with Up icon */}
              <CategoryRibbon
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={(catId) => {
                  setSelectedCategoryId(catId);
                  setSelectedSubCategory('all');
                }}
                selectedSubCategory={selectedSubCategory}
                onSelectSubCategory={setSelectedSubCategory}
                countsByCategory={countsByCategory}
                countsBySubCategory={countsBySubCategory}
                onOpenCreateCategory={() => setIsCreateCategoryOpen(true)}
              />

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
                    Record your next intention or clear filters to see your lists.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {(selectedCategoryId !== 'all' ||
                      selectedSubCategory !== 'all' ||
                      searchQuery.trim() !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId('all');
                          setSelectedSubCategory('all');
                          setSearchQuery('');
                        }}
                        className="min-h-[40px] px-3.5 py-2 bg-card border border-ink/15 text-ink text-xs font-semibold rounded-lg hover:bg-paper transition-all"
                      >
                        Clear Filters
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setIsFormOpen(true);
                      }}
                      className="min-h-[40px] px-4 py-2 bg-ink text-paper text-xs font-semibold rounded-lg hover:bg-ink/85 transition-all"
                    >
                      + Add Intention
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-2.5">
                  {filteredActiveItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      categoryDef={categories.find((c) => c.id === item.categoryId)}
                      onToggleComplete={handleToggleComplete}
                      onToggleStarted={handleToggleStarted}
                      onDelete={handleDeleteItem}
                      onSelect={(it) => setViewingItem(it)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REMINDER RADAR */}
          {currentTab === 'reminders' && (
            <ReminderRadarView
              items={searchedItems}
              categories={categories}
              onSnooze={handleSnooze}
              onCustomSnooze={handleCustomSnooze}
              onNotificationsEnabled={() => syncNativeReminders(items)}
              onToggleComplete={handleToggleComplete}
              onToggleStarted={handleToggleStarted}
              onDelete={handleDeleteItem}
              onEdit={(it) => {
                setEditingItem(it);
                setIsFormOpen(true);
              }}
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
              items={searchedItems}
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
              items={searchedItems}
              categories={categories}
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
              }}
              theme={theme}
              onThemeChange={setTheme}
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

      {/* Milestone Accomplishment Modal */}
      <MilestoneModal
        isOpen={isMilestoneOpen}
        item={celebratingItem}
        onClose={() => {
          setIsMilestoneOpen(false);
          setCelebratingItem(null);
        }}
        onSaveReflection={handleSaveReflection}
      />

      {/* Serendipity Inspiration Modal */}
      <SerendipityModal
        isOpen={isSerendipityOpen}
        onClose={() => setIsSerendipityOpen(false)}
        items={items}
        categories={categories}
        onSelectFocus={(item) => {
          setSelectedCategoryId(item.categoryId);
          if (item.subCategory) {
            setSelectedSubCategory(item.subCategory);
          }
          setCurrentTab(item.startedAt ? 'inprogress' : 'feed');
          setViewingItem(item);
        }}
      />

      {/* Create Custom Category Modal */}
      <CreateCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        onCreateCategory={handleCreateCategory}
      />

      {/* In-app confirm sheet + notices (replaces window.confirm / alert) */}
      <DialogHost />
    </div>
  );
}
