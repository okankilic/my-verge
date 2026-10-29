import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Plus,
  Bell,
  Settings,
  Sparkles,
  Compass,
  CheckCircle2,
  Calendar,
  X,
  SlidersHorizontal,
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
} from './services/storage';
import {
  playChimeSound,
  sendBrowserNotification,
  getDueReminderItems,
} from './services/notifications';

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
import { SerendipityModal } from './components/SerendipityModal';
import { SettingsModal } from './components/SettingsModal';
import { CreateCategoryModal } from './components/CreateCategoryModal';

export default function App() {
  // State
  const [items, setItems] = useState<BucketItem[]>(() => loadBucketItems());
  const [categories, setCategories] = useState<CategoryDefinition[]>(() => loadCategories());
  const [currentTab, setCurrentTab] = useState<ViewTab>('feed');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<FilterSortOption>('targetDate');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Modals & Drawers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null);
  const [viewingItem, setViewingItem] = useState<BucketItem | null>(null);
  const [celebratingItem, setCelebratingItem] = useState<BucketItem | null>(null);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const [isSerendipityOpen, setIsSerendipityOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  // Desktop Mobile Frame Toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Active Reminder In-App Toast
  const [activeToastItem, setActiveToastItem] = useState<BucketItem | null>(null);

  // Persist items
  useEffect(() => {
    saveBucketItems(items);
  }, [items]);

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
      if (item.status === 'active') {
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

  const handleToggleComplete = (item: BucketItem) => {
    const isNowCompleted = item.status !== 'completed';
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
                completedAt: nowIso,
                updatedAt: nowIso,
              }
            : i
        )
      );

      setCelebratingItem({
        ...item,
        status: 'completed',
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

  const handleSaveReflection = (itemId: string, reflection: string, rating: number) => {
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
    if (window.confirm('Remove this intention from your bucket journal?')) {
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

  // Filtered & Sorted Feed Items
  const filteredActiveItems = useMemo(() => {
    return items
      .filter((item) => {
        if (item.status !== 'active') return false;

        if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
          return false;
        }

        if (selectedSubCategory !== 'all' && item.subCategory !== selectedSubCategory) {
          return false;
        }

        if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchSub = item.subCategory?.toLowerCase().includes(q);
          const matchLoc = item.location?.name.toLowerCase().includes(q);
          const matchAuthor = item.mediaMeta?.authorOrCreator?.toLowerCase().includes(q);
          return matchTitle || matchDesc || matchSub || matchLoc || matchAuthor;
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
  }, [items, selectedCategoryId, selectedSubCategory, priorityFilter, searchQuery, sortOption]);

  return (
    <div className="min-h-screen paper-texture flex flex-col selection:bg-[#B45309]/20 selection:text-[#1E1915]">
      {/* Top Application Navigation */}
      <TopNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeRemindersCount={dueRemindersCount}
        isMobileFrame={isMobileFrame}
        onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
        isFilterOpen={isFilterOpen}
        onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
        hasActiveFilters={searchQuery.trim() !== '' || priorityFilter !== 'all'}
        onOpenCreate={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        onOpenSerendipity={() => setIsSerendipityOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex justify-center py-3 sm:py-5 px-3 sm:px-6">
        <main
          className={`w-full transition-all duration-300 ${
            isMobileFrame
              ? 'max-w-[420px] bg-white border border-[#1E1915]/15 rounded-[38px] p-4 shadow-2xl relative my-auto min-h-[780px] overflow-hidden'
              : 'max-w-3xl'
          }`}
        >
          {/* Simulated Mobile Status Notch when in Mobile Frame Mode */}
          {isMobileFrame && (
            <div className="flex items-center justify-between pb-3 pt-1 text-[11px] font-mono text-[#1E1915]/50 px-2 select-none border-b border-[#1E1915]/8 mb-3">
              <span>9:41</span>
              <div className="w-16 h-3 bg-[#1E1915]/10 rounded-full" />
              <span>5G · 100%</span>
            </div>
          )}

          {/* In-App Active Reminder Notification Toast */}
          {activeToastItem && (
            <div className="mb-3.5 p-3 bg-[#FFF8EE] border border-[#C05621]/30 rounded-2xl shadow-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div
                onClick={() => setViewingItem(activeToastItem)}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-[#C05621] shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] uppercase tracking-wider text-[#C05621] font-bold block">
                    Alert Due
                  </span>
                  <span className="text-xs font-semibold text-[#1E1915] truncate block">
                    {activeToastItem.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleSnooze(activeToastItem, 1)}
                  className="min-h-[34px] px-2.5 py-1 text-xs font-medium bg-white border border-[#1E1915]/15 rounded-lg hover:bg-[#FAF7F2] text-[#1E1915]"
                >
                  Snooze 1d
                </button>
                <button
                  onClick={() => setActiveToastItem(null)}
                  className="min-h-[34px] min-w-[34px] flex items-center justify-center text-[#1E1915]/50 hover:text-[#1E1915]"
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
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
                sortOption={sortOption}
                onSortOptionChange={setSortOption}
                isFilterOpen={isFilterOpen}
                onOpenCreateCategory={() => setIsCreateCategoryOpen(true)}
              />

              {/* Clean Single Paper Card Container for Items */}
              {filteredActiveItems.length === 0 ? (
                <div className="p-10 text-center bg-white border border-[#1E1915]/10 rounded-lg space-y-3 mt-3">
                  <div className="w-12 h-12 bg-[#FAF7F2] text-[#1E1915]/40 rounded-lg mx-auto flex items-center justify-center">
                    <Compass className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h3 className="font-serif-journal text-base font-medium text-[#1E1915]">
                    No active aspirations found
                  </h3>
                  <p className="text-xs text-[#1E1915]/60 max-w-xs mx-auto">
                    Record your next intention or clear filters to see your lists.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {(selectedCategoryId !== 'all' ||
                      selectedSubCategory !== 'all' ||
                      searchQuery.trim() !== '' ||
                      priorityFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId('all');
                          setSelectedSubCategory('all');
                          setSearchQuery('');
                          setPriorityFilter('all');
                        }}
                        className="min-h-[40px] px-3.5 py-2 bg-white border border-[#1E1915]/15 text-[#1E1915] text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] transition-all"
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
                      className="min-h-[40px] px-4 py-2 bg-[#1E1915] text-white text-xs font-semibold rounded-lg hover:bg-[#332b24] transition-all"
                    >
                      + Add Intention
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-3.5">
                  {filteredActiveItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      categoryDef={categories.find((c) => c.id === item.categoryId)}
                      onToggleComplete={handleToggleComplete}
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
              items={items}
              categories={categories}
              onSnooze={handleSnooze}
              onCustomSnooze={handleCustomSnooze}
              onToggleComplete={handleToggleComplete}
              onEdit={(it) => {
                setEditingItem(it);
                setIsFormOpen(true);
              }}
            />
          )}

          {/* TAB 3: CURATED VAULT & SHELF */}
          {currentTab === 'vault' && (
            <VaultView
              items={items}
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
              items={items}
              categories={categories}
              onToggleComplete={handleToggleComplete}
              onEdit={(it) => {
                setCelebratingItem(it);
                setIsMilestoneOpen(true);
              }}
            />
          )}

          {/* Quiet Minimal Footer */}
          <footer className="mt-10 pt-5 border-t border-[#1E1915]/8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#1E1915]/45 gap-2 pb-16 md:pb-4">
            <span className="font-serif-journal italic">
              My Verge — Standing on the threshold of experience
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-[#1E1915] flex items-center gap-1 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings & Backup</span>
            </button>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomTabBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeRemindersCount={dueRemindersCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
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
          setCurrentTab('feed');
          setViewingItem(item);
        }}
      />

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        items={items}
        categories={categories}
        onReloadData={(newItems, newCats) => {
          setItems(newItems);
          setCategories(newCats);
        }}
      />

      {/* Create Custom Category Modal */}
      <CreateCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
}
