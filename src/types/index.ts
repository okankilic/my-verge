export type PriorityLevel = 'someday' | 'this_year' | 'this_month' | 'urgent';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CategoryDefinition {
  id: string; // The lowercase verb for built-in categories; categories saved by older builds may have other ids
  verb: string; // Action verb used as the category label, e.g. "Go", "Do", "Buy" (see DEFAULT_CATEGORIES)
  icon: string; // Lucide icon identifier
  tagline: string;
  accentColor: string;
  keepInVault?: boolean; // Whether "Keep in Vault" starts on when one of its wishes is finished
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
  savedAmount: number; // in the wish's currency (BucketItem.currency)
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

// A smaller step toward a wish, ticked off on its own (BucketItem.steps)
export interface WishStep {
  id: string;
  title: string;
  doneAt?: string; // ISO timestamp, set while ticked
}

export const STEP_TITLE_MAX_LENGTH = 100;

// Which of a wish's checklists a step belongs to
export type StepListKey = 'steps' | 'prepSteps';

// Money spent on a wish along the way (BucketItem.expenses)
export interface WishExpense {
  id: string;
  amount: number; // > 0, in the wish's currency
  note?: string; // max EXPENSE_NOTE_MAX_LENGTH chars
  spentAt: string; // ISO timestamp
}

export const EXPENSE_NOTE_MAX_LENGTH = 60;

export interface BucketItem {
  id: string;
  categoryId: string;
  customCategoryName?: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  targetDate?: string;
  location?: LocationInfo;
  budget?: BudgetInfo;
  currency?: string; // ISO 4217 code for the budget and expenses; App stamps the Settings default on wishes without one
  mediaMeta?: MediaMeta;
  photos: string[];
  photoNotes?: Record<string, string>; // keyed by photoKey(photo), see src/utils/photoKey.ts
  attachments?: AttachmentMeta[];
  linkUrl?: string;
  prepSteps?: WishStep[]; // Checklist to get ready before starting, in order; starting or finishing leaves it as it is
  steps?: WishStep[]; // Checklist of smaller steps toward the wish, in order; finishing the wish leaves them as they are
  expenses?: WishExpense[]; // Money spent on the wish, oldest first; finishing the wish leaves them as they are
  reminder?: ReminderConfig;
  status: 'active' | 'completed' | 'archived';
  startedAt?: string; // ISO timestamp, set while the item is in progress
  completedAt?: string;
  completionReflection?: string;
  completionRating?: number; // 1-5 stars or rating
  keptInVault?: boolean; // A finished wish stays in the Vault only while this is set
  hiddenInMemories?: boolean; // A finished wish is left off the Memories timeline while this is set
  createdAt: string;
  updatedAt: string;
}

export type ViewTab = 'feed' | 'reminders' | 'inprogress' | 'vault' | 'milestones' | 'settings';
