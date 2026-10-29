export type DefaultCategoryId = 'go' | 'do' | 'buy' | 'remember' | 'read' | 'watch' | 'custom';

export type PriorityLevel = 'someday' | 'this_year' | 'this_month' | 'urgent';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CategoryDefinition {
  id: DefaultCategoryId | string;
  name: string; // Action used as category name, e.g. "Go", "Do", "Buy", "Remember", "Read", "Watch"
  verb?: string; // Optional action verb alias
  icon: string; // Lucide icon identifier
  tagline: string;
  defaultSubCategories: string[];
  accentColor: string;
}

export interface ReminderConfig {
  date: string; // ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm
  recurrence: RecurrenceType;
  snoozedUntil?: string | null;
  lastNotifiedAt?: string | null;
}

export interface LocationInfo {
  name: string;
  cityOrCountry?: string;
}

export interface BudgetInfo {
  estimatedCost: number;
  savedAmount: number;
  currency: string;
}

export interface MediaMeta {
  authorOrCreator?: string; // author for books, director for films, artisan for buys
  formatOrEdition?: string; // hardcover, kindle, 35mm, streaming, vinyl, etc.
  progress?: string;        // e.g. "Chapter 4" or "Season 2"
}

export interface BucketItem {
  id: string;
  categoryId: DefaultCategoryId | string;
  customCategoryName?: string;
  subCategory?: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  targetDate?: string;
  location?: LocationInfo;
  budget?: BudgetInfo;
  mediaMeta?: MediaMeta;
  photos: string[];
  linkUrl?: string;
  reminder?: ReminderConfig;
  status: 'active' | 'completed' | 'archived';
  completedAt?: string;
  completionReflection?: string;
  completionRating?: number; // 1-5 stars or rating
  createdAt: string;
  updatedAt: string;
}

export type ViewTab = 'feed' | 'reminders' | 'vault' | 'milestones';
export type FilterSortOption = 'targetDate' | 'priority' | 'newest' | 'alphabetical';
