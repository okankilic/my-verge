import React from 'react';
import { CategoryDefinition } from '../types';
import { hasKey, t } from '../i18n';
import {
  Compass,
  Sparkles,
  ShoppingBag,
  Feather,
  BookOpen,
  Film,
  Heart,
  Music,
  Camera,
  Palette,
  Globe,
  Target,
  Mountain,
  Utensils,
  Lightbulb,
  Coffee,
  Plane,
  TreePine,
  Dumbbell,
  Star,
  ChefHat,
  GraduationCap,
  Headphones,
  Gamepad2,
  FlaskConical,
  MapPin,
  PenLine,
  Hammer,
  Sprout,
  Gem,
  Gift,
  Phone,
  Eye,
  Wrench,
  Receipt,
  Microscope,
  Send,
  Layers,
  ListChecks,
} from 'lucide-react';

type IconComponent = React.ComponentType<{ className?: string }>;

// Icon names a category can store; the verb icons in DEFAULT_CATEGORIES plus those of retired verbs
// and older picker choices, which categories created by older builds may still store
const CATEGORY_ICONS: Record<string, IconComponent> = {
  Compass, Sparkles, ShoppingBag, Feather, BookOpen, Film,
  Heart, Music, Camera, Palette, Globe, Target, Mountain, Utensils,
  Lightbulb, Coffee, Plane, TreePine, Dumbbell, Star,
  ChefHat, GraduationCap, Headphones, Gamepad2, FlaskConical, MapPin,
  PenLine, Hammer, Sprout, Gem, Gift, Phone, Eye, Wrench, Receipt, Microscope, Send,
  Layers, ListChecks,
};

const ICONS_BY_LOWER_NAME = new Map(
  Object.entries(CATEGORY_ICONS).map(([name, icon]) => [name.toLowerCase(), icon])
);

export function renderCategoryIcon(iconName: string, className = 'w-3.5 h-3.5'): React.ReactElement {
  const IconComponent = ICONS_BY_LOWER_NAME.get((iconName || '').toLowerCase()) ?? Sparkles;
  return <IconComponent className={className} />;
}

// A category's color for the current theme: as stored in light mode, blended
// toward ink in dark mode (--category-lift) so it stays readable on Forest.
export const categoryColor = (hex?: string): string =>
  hex ? `color-mix(in oklab, ${hex}, var(--color-ink) var(--category-lift))` : 'var(--color-ink)';

// A category's label in the app's language. Built-in categories are looked up by id;
// categories created by older builds (custom-*) show what they stored. The stored verb stays English.
export function categoryLabel(cat: CategoryDefinition | undefined, fallbackId = ''): string {
  if (!cat) return fallbackId;
  const key = `category.${cat.id}.verb`;
  return hasKey(key) ? t(key) : cat.verb;
}

// The title placeholder in the form, which follows the category
export function categoryPlaceholder(cat: CategoryDefinition | undefined): string {
  const key = `category.${cat?.id}.placeholder`;
  return hasKey(key) ? t(key) : t('form.titlePlaceholder');
}

// A short, friendly line about what the category is for; nothing for categories from older builds (custom-*)
export function categoryHint(cat: CategoryDefinition | undefined): string | undefined {
  const key = `category.${cat?.id}.hint`;
  return hasKey(key) ? t(key) : undefined;
}
