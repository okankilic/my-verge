import React from 'react';
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
} from 'lucide-react';

type IconComponent = React.ComponentType<{ className?: string }>;

// Icon names a category can store; the verb icons in CATEGORY_VERB_ICONS plus older picker choices
const CATEGORY_ICONS: Record<string, IconComponent> = {
  Compass, Sparkles, ShoppingBag, Feather, BookOpen, Film,
  Heart, Music, Camera, Palette, Globe, Target, Mountain, Utensils,
  Lightbulb, Coffee, Plane, TreePine, Dumbbell, Star,
  ChefHat, GraduationCap, Headphones, Gamepad2, FlaskConical, MapPin,
  PenLine, Hammer, Sprout, Gem, Gift, Phone, Eye, Wrench,
};

const ICONS_BY_LOWER_NAME = new Map(
  Object.entries(CATEGORY_ICONS).map(([name, icon]) => [name.toLowerCase(), icon])
);

export function renderCategoryIcon(iconName: string, className = 'w-3.5 h-3.5'): React.ReactElement {
  const IconComponent = ICONS_BY_LOWER_NAME.get((iconName || '').toLowerCase()) ?? Sparkles;
  return <IconComponent className={className} />;
}
