/**
 * Default Categories
 * Pre-defined expense categories with colors and icons
 */

import type { DefaultCategoryName } from '../types/category';

export interface DefaultCategory {
  name: DefaultCategoryName;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Food',
    color: '#F97316', // Orange
    icon: 'utensils',
  },
  {
    name: 'Transport',
    color: '#3B82F6', // Blue
    icon: 'car',
  },
  {
    name: 'Bills',
    color: '#8B5CF6', // Purple
    icon: 'file-text',
  },
  {
    name: 'Entertainment',
    color: '#EC4899', // Pink
    icon: 'film',
  },
  {
    name: 'Shopping',
    color: '#14B8A6', // Teal
    icon: 'shopping-bag',
  },
  {
    name: 'Health',
    color: '#EF4444', // Red
    icon: 'heart-pulse',
  },
  {
    name: 'Other',
    color: '#6B7280', // Gray
    icon: 'more-horizontal',
  },
];

export const CATEGORY_COLORS: Record<DefaultCategoryName, string> = {
  Food: '#F97316',
  Transport: '#3B82F6',
  Bills: '#8B5CF6',
  Entertainment: '#EC4899',
  Shopping: '#14B8A6',
  Health: '#EF4444',
  Other: '#6B7280',
};

export const CATEGORY_ICONS: Record<DefaultCategoryName, string> = {
  Food: 'utensils',
  Transport: 'car',
  Bills: 'file-text',
  Entertainment: 'film',
  Shopping: 'shopping-bag',
  Health: 'heart-pulse',
  Other: 'more-horizontal',
};
