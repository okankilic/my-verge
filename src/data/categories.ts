import { CategoryDefinition } from '../types';

// Every verb is a built-in category, each with its fixed Lucide icon
export const CATEGORY_VERB_ICONS: Record<string, string> = {
  Go: 'Compass', Do: 'Sparkles', Buy: 'ShoppingBag', Remember: 'Feather', Read: 'BookOpen', Watch: 'Film',
  Cook: 'ChefHat', Learn: 'GraduationCap', Listen: 'Headphones', Play: 'Gamepad2', Make: 'Palette', Try: 'FlaskConical',
  Taste: 'Utensils', Visit: 'MapPin', Write: 'PenLine', Practice: 'Dumbbell', Build: 'Hammer', Grow: 'Sprout',
  Collect: 'Gem', Give: 'Gift', Call: 'Phone', See: 'Eye', Explore: 'Mountain', Fix: 'Wrench',
};

const category = (verb: string, tagline: string, accentColor: string): CategoryDefinition => ({
  id: verb.toLowerCase(),
  verb,
  icon: CATEGORY_VERB_ICONS[verb],
  tagline,
  accentColor,
});

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  category('Go', 'Places, journeys & architectural wonders', '#B45309'), // amber/terracotta
  category('Do', 'Adventures, craft skills & life experiments', '#3B82F6'), // cobalt
  category('Buy', 'Timeless objects, craft & deliberate pieces', '#059669'), // forest emerald
  category('Remember', 'Mantras, lessons, gratitude & life anniversaries', '#7C3AED'), // violet ink
  category('Read', 'Books, essays, philosophy & classic literature', '#C05621'), // rust
  category('Watch', 'Auteur cinema, documentaries & stage arts', '#BE185D'), // rose / burgundy
  category('Cook', 'Recipes, kitchen rituals & shared tables', '#D97706'), // ochre
  category('Learn', 'Languages, courses & new disciplines', '#4338CA'), // indigo
  category('Listen', 'Albums, podcasts & live music', '#0891B2'), // teal
  category('Play', 'Games, sports & playful pursuits', '#DB2777'), // pink
  category('Make', 'Art, handcraft & creative projects', '#9333EA'), // purple
  category('Try', 'Firsts, experiments & leaps of curiosity', '#0D9488'), // sea green
  category('Taste', 'Dishes, wines & flavors worth seeking', '#DC2626'), // red
  category('Visit', 'Friends, family & places close to home', '#EA580C'), // orange
  category('Write', 'Letters, journals & stories to tell', '#475569'), // slate
  category('Practice', 'Habits, training & steady routines', '#65A30D'), // lime
  category('Build', 'Things to construct, fix up & finish', '#92400E'), // walnut
  category('Grow', 'Gardens, plants & personal growth', '#4D7C0F'), // sage
  category('Collect', 'Treasures, keepsakes & curated sets', '#0284C7'), // sky
  category('Give', 'Gifts, kindness & ways to give back', '#E11D48'), // rose
  category('Call', 'People to reach out to & catch up with', '#2563EB'), // blue
  category('See', 'Sights, exhibitions & performances', '#7E22CE'), // plum
  category('Explore', 'Trails, wilderness & uncharted corners', '#15803D'), // green
  category('Fix', 'Repairs, chores & loose ends', '#57534E'), // stone
];
