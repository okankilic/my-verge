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
} from 'lucide-react';

export interface CategoryIconOption {
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AVAILABLE_CATEGORY_ICONS: CategoryIconOption[] = [
  { name: 'Compass', label: 'Explore', icon: Compass },
  { name: 'Sparkles', label: 'Experience', icon: Sparkles },
  { name: 'ShoppingBag', label: 'Acquire', icon: ShoppingBag },
  { name: 'Feather', label: 'Remember', icon: Feather },
  { name: 'BookOpen', label: 'Read', icon: BookOpen },
  { name: 'Film', label: 'Cinema', icon: Film },
  { name: 'Heart', label: 'Wellness', icon: Heart },
  { name: 'Music', label: 'Music', icon: Music },
  { name: 'Camera', label: 'Photo', icon: Camera },
  { name: 'Palette', label: 'Art & Craft', icon: Palette },
  { name: 'Globe', label: 'World', icon: Globe },
  { name: 'Mountain', label: 'Adventures', icon: Mountain },
  { name: 'Utensils', label: 'Culinary', icon: Utensils },
  { name: 'Lightbulb', label: 'Curiosities', icon: Lightbulb },
  { name: 'Coffee', label: 'Rituals', icon: Coffee },
  { name: 'Plane', label: 'Voyages', icon: Plane },
  { name: 'TreePine', label: 'Nature', icon: TreePine },
  { name: 'Dumbbell', label: 'Fitness', icon: Dumbbell },
  { name: 'Target', label: 'Goals', icon: Target },
  { name: 'Star', label: 'Milestones', icon: Star },
];

export function renderCategoryIcon(iconName: string, className = 'w-3.5 h-3.5'): React.ReactElement {
  const found = AVAILABLE_CATEGORY_ICONS.find(
    (item) => item.name.toLowerCase() === (iconName || '').toLowerCase()
  );
  if (found) {
    const IconComponent = found.icon;
    return <IconComponent className={className} />;
  }
  return <Sparkles className={className} />;
}
