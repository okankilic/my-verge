import { CategoryDefinition, RecurrenceType } from '../types';

// Verbs whose finished wishes are kept in the Vault unless the user changes it in Settings
export const KEEP_IN_VAULT_VERBS = new Set(['Read', 'Watch', 'Buy']);

const category = (verb: string, icon: string, accentColor: string): CategoryDefinition => ({
  id: verb.toLowerCase(),
  verb,
  icon,
  accentColor,
  keepInVault: KEEP_IN_VAULT_VERBS.has(verb),
});

// Every verb is a built-in category, each with its fixed Lucide icon, in the order the form and ribbon show them:
// going out, culture, growing, people, then life admin. Go stays first since it's the form's default
export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  category('Go', 'Compass', '#B45309'), // amber/terracotta
  category('Try', 'FlaskConical', '#A21CAF'), // fuchsia
  category('Read', 'BookOpen', '#C05621'), // rust
  category('Watch', 'Film', '#BE185D'), // rose / burgundy
  category('Listen', 'Headphones', '#0891B2'), // teal
  category('Learn', 'GraduationCap', '#4338CA'), // indigo
  category('Workout', 'Dumbbell', '#3B82F6'), // cobalt
  category('Cook', 'ChefHat', '#D97706'), // ochre
  category('Collect', 'Layers', '#65A30D'), // olive
  category('Call', 'Phone', '#2563EB'), // blue
  category('Give', 'Gift', '#E11D48'), // rose
  category('Buy', 'ShoppingBag', '#059669'), // forest emerald
  category('Pay', 'Receipt', '#0D9488'), // sea green
  category('Do', 'ListChecks', '#57534E'), // stone
  category('Remember', 'Feather', '#7C3AED'), // violet ink
];

export const CATEGORY_VERB_ICONS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((cat) => [cat.verb, cat.icon])
);

// Verbs retired from older builds, and the verb their wishes moved to
export const MERGED_VERBS: Record<string, string> = {
  Explore: 'Go', Grow: 'Go', Visit: 'Go', See: 'Go',
  Practice: 'Learn', Make: 'Learn', Build: 'Learn', Write: 'Learn', Research: 'Learn',
  Taste: 'Try', Play: 'Try',
  Send: 'Give',
  Fix: 'Do',
};

// The plan form's fields after Category and Title. form-fields.md describes these; keep the two in sync
export type FormField = 'when' | 'media' | 'notes' | 'link' | 'where' | 'prep' | 'steps' | 'reminder' | 'budget';

// The full order, used for categories without their own shape (custom-* ones from older builds)
export const ALL_FORM_FIELDS: FormField[] = ['when', 'media', 'notes', 'link', 'where', 'prep', 'steps', 'reminder', 'budget'];

// The few form layouts the verbs share; Notes always comes last
export type FieldShape = 'place' | 'media' | 'project' | 'errand' | 'date';

export const FIELD_SHAPES: Record<FieldShape, FormField[]> = {
  place: ['where', 'when', 'prep', 'steps', 'budget', 'reminder', 'link', 'notes'],
  media: ['when', 'media', 'link', 'notes'],
  project: ['when', 'prep', 'steps', 'budget', 'reminder', 'link', 'notes'],
  errand: ['when', 'reminder', 'budget', 'link', 'notes'],
  date: ['reminder', 'budget', 'link', 'notes'],
};

// Which shape each verb's form uses; fields outside it stay hidden unless they already hold a value
export const VERB_SHAPE: Record<string, FieldShape> = {
  go: 'place', try: 'place',
  read: 'media', watch: 'media', listen: 'media',
  learn: 'project', workout: 'project', cook: 'project', collect: 'project', do: 'project',
  buy: 'errand', call: 'errand', give: 'errand',
  pay: 'date', remember: 'date',
};

export const formFieldsFor = (categoryId: string): FormField[] => {
  const shape = VERB_SHAPE[categoryId];
  return shape ? FIELD_SHAPES[shape] : ALL_FORM_FIELDS;
};

// Verbs whose new plans start with the reminder on, repeating like this
export const REMINDER_DEFAULTS: Record<string, Exclude<RecurrenceType, 'none'>> = {
  pay: 'monthly',
  remember: 'yearly',
};
