import { CategoryDefinition } from '../types';

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'go',
    verb: 'Go',
    icon: 'Compass',
    tagline: 'Places, journeys & architectural wonders',
    accentColor: '#B45309', // amber/terracotta
  },
  {
    id: 'do',
    verb: 'Do',
    icon: 'Sparkles',
    tagline: 'Adventures, craft skills & life experiments',
    accentColor: '#3B82F6', // cobalt
  },
  {
    id: 'buy',
    verb: 'Buy',
    icon: 'ShoppingBag',
    tagline: 'Timeless objects, craft & deliberate pieces',
    accentColor: '#059669', // forest emerald
  },
  {
    id: 'remember',
    verb: 'Remember',
    icon: 'Feather',
    tagline: 'Mantras, lessons, gratitude & life anniversaries',
    accentColor: '#7C3AED', // violet ink
  },
  {
    id: 'read',
    verb: 'Read',
    icon: 'BookOpen',
    tagline: 'Books, essays, philosophy & classic literature',
    accentColor: '#C05621', // rust
  },
  {
    id: 'watch',
    verb: 'Watch',
    icon: 'Film',
    tagline: 'Auteur cinema, documentaries & stage arts',
    accentColor: '#BE185D', // rose / burgundy
  },
];

// Verbs a custom category can be created from, each with its fixed Lucide icon
export const CATEGORY_VERB_ICONS: Record<string, string> = {
  Go: 'Compass', Do: 'Sparkles', Buy: 'ShoppingBag', Remember: 'Feather', Read: 'BookOpen', Watch: 'Film',
  Cook: 'ChefHat', Learn: 'GraduationCap', Listen: 'Headphones', Play: 'Gamepad2', Make: 'Palette', Try: 'FlaskConical',
  Taste: 'Utensils', Visit: 'MapPin', Write: 'PenLine', Practice: 'Dumbbell', Build: 'Hammer', Grow: 'Sprout',
  Collect: 'Gem', Give: 'Gift', Call: 'Phone', See: 'Eye', Explore: 'Mountain', Fix: 'Wrench',
};

export const CATEGORY_VERBS: string[] = Object.keys(CATEGORY_VERB_ICONS);

export const verbIcon = (verb: string): string => CATEGORY_VERB_ICONS[verb] ?? 'Sparkles';
