import { CategoryDefinition, RecurrenceType } from '../types';

// Verbs whose finished wishes are kept in the Vault unless the user changes it in Settings
export const KEEP_IN_VAULT_VERBS = new Set(['Read', 'Watch', 'Buy']);

const category = (verb: string, icon: string, tagline: string, accentColor: string): CategoryDefinition => ({
  id: verb.toLowerCase(),
  verb,
  icon,
  tagline,
  accentColor,
  keepInVault: KEEP_IN_VAULT_VERBS.has(verb),
});

// Every verb is a built-in category, each with its fixed Lucide icon
export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  category('Go', 'Compass', 'Places, trips & sights worth seeing', '#B45309'), // amber/terracotta
  category('Visit', 'MapPin', 'People & places to drop in on', '#0369A1'), // ocean blue
  category('Workout', 'Dumbbell', 'Runs, classes & training goals', '#3B82F6'), // cobalt
  category('Buy', 'ShoppingBag', 'Lovely things to own & collect', '#059669'), // forest emerald
  category('Pay', 'Receipt', 'Bills, subscriptions & debts to settle', '#0D9488'), // sea green
  category('Remember', 'Feather', 'Mantras, lessons, gratitude & life anniversaries', '#7C3AED'), // violet ink
  category('Read', 'BookOpen', 'Books, essays, philosophy & classic literature', '#C05621'), // rust
  category('Watch', 'Film', 'Auteur cinema, documentaries & stage arts', '#BE185D'), // rose / burgundy
  category('Listen', 'Headphones', 'Albums, podcasts & live music', '#0891B2'), // teal
  category('Cook', 'ChefHat', 'Recipes & dishes to make at home', '#D97706'), // ochre
  category('Taste', 'Utensils', 'Restaurants, street food & flavors to try', '#65A30D'), // olive
  category('Learn', 'GraduationCap', 'Languages, courses & skills to practice', '#4338CA'), // indigo
  category('Research', 'Microscope', 'Topics, questions & options to look into', '#475569'), // slate
  category('See', 'Eye', 'Exhibitions, landmarks & wonders to take in', '#9333EA'), // purple
  category('Try', 'FlaskConical', 'New hobbies, experiences & first times', '#A21CAF'), // fuchsia
  category('Play', 'Gamepad2', 'Games, sports & playful pursuits', '#DB2777'), // pink
  category('Call', 'Phone', 'People to reach out to & catch up with', '#2563EB'), // blue
  category('Give', 'Gift', 'Gifts, kindness & ways to give back', '#E11D48'), // rose
  category('Fix', 'Wrench', 'Repairs, chores & loose ends', '#57534E'), // stone
];

export const CATEGORY_VERB_ICONS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((cat) => [cat.verb, cat.icon])
);

// Verbs retired from older builds, and the verb their wishes moved to
export const MERGED_VERBS: Record<string, string> = {
  Explore: 'Go', Grow: 'Go', Do: 'Go',
  Practice: 'Learn', Make: 'Learn', Build: 'Learn', Write: 'Learn', Collect: 'Buy',
};

// The plan form's fields after Category and Title. form-fields.md describes these; keep the two in sync
export type FormField = 'when' | 'media' | 'notes' | 'link' | 'where' | 'prep' | 'steps' | 'reminder' | 'budget';

// The full order, used for categories without their own list (custom-* ones from older builds)
export const ALL_FORM_FIELDS: FormField[] = ['when', 'media', 'notes', 'link', 'where', 'prep', 'steps', 'reminder', 'budget'];

// Which fields each verb's form shows, in order; the rest are hidden unless they already hold a value
export const FORM_FIELDS: Record<string, FormField[]> = {
  go: ['where', 'when', 'prep', 'steps', 'budget', 'reminder', 'notes', 'link'],
  visit: ['where', 'when', 'reminder', 'notes'],
  workout: ['when', 'steps', 'reminder', 'notes'],
  buy: ['when', 'link', 'budget', 'notes'],
  pay: ['reminder', 'budget', 'link', 'notes'],
  remember: ['reminder', 'notes'],
  read: ['when', 'media', 'link', 'notes'],
  watch: ['when', 'media', 'link', 'notes'],
  listen: ['when', 'media', 'link', 'notes'],
  cook: ['when', 'prep', 'steps', 'link', 'notes'],
  taste: ['when', 'where', 'link', 'budget', 'notes'],
  learn: ['when', 'steps', 'link', 'budget', 'reminder', 'notes'],
  research: ['when', 'steps', 'link', 'notes'],
  see: ['when', 'where', 'link', 'reminder', 'notes'],
  try: ['when', 'where', 'prep', 'budget', 'notes'],
  play: ['when', 'where', 'reminder', 'notes'],
  call: ['when', 'reminder', 'notes'],
  give: ['when', 'budget', 'reminder', 'notes', 'link'],
  fix: ['when', 'prep', 'steps', 'budget', 'notes'],
};

export const formFieldsFor = (categoryId: string): FormField[] => FORM_FIELDS[categoryId] ?? ALL_FORM_FIELDS;

// Verbs whose new plans start with the reminder on, repeating like this
export const REMINDER_DEFAULTS: Record<string, Exclude<RecurrenceType, 'none'>> = {
  pay: 'monthly',
  remember: 'yearly',
};
