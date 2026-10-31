// Ids of the built-in categories (the lowercase verb); categories saved by older builds may have other ids
export type DefaultCategoryId =
  | 'go' | 'do' | 'buy' | 'remember' | 'read' | 'watch'
  | 'cook' | 'learn' | 'listen' | 'play' | 'make' | 'try'
  | 'taste' | 'visit' | 'write' | 'practice' | 'build' | 'grow'
  | 'collect' | 'give' | 'call' | 'see' | 'explore' | 'fix';

export type PriorityLevel = 'someday' | 'this_year' | 'this_month' | 'urgent';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CategoryDefinition {
  id: DefaultCategoryId | string;
  verb: string; // Action verb used as the category label, e.g. "Go", "Do", "Buy" (see CATEGORY_VERB_ICONS)
  icon: string; // Lucide icon identifier
  tagline: string;
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

// Metadata for a video/PDF whose bytes are stored in IndexedDB (src/services/attachments.ts)
export interface AttachmentMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  addedAt: string;
  note?: string; // optional caption, max 100 chars
}

export const MEDIA_NOTE_MAX_LENGTH = 100;

export interface BucketItem {
  id: string;
  categoryId: DefaultCategoryId | string;
  customCategoryName?: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  targetDate?: string;
  location?: LocationInfo;
  budget?: BudgetInfo;
  mediaMeta?: MediaMeta;
  photos: string[];
  photoNotes?: Record<string, string>; // keyed by photoKey(photo), see src/utils/photoKey.ts
  attachments?: AttachmentMeta[];
  linkUrl?: string;
  reminder?: ReminderConfig;
  status: 'active' | 'completed' | 'archived';
  startedAt?: string; // ISO timestamp, set while the item is in progress
  completedAt?: string;
  completionReflection?: string;
  completionRating?: number; // 1-5 stars or rating
  createdAt: string;
  updatedAt: string;
}

export type ViewTab = 'feed' | 'reminders' | 'inprogress' | 'vault' | 'milestones' | 'settings';
