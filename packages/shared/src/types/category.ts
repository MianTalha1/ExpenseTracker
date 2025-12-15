/**
 * Category Types
 * Expense category type definitions
 */

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
  icon?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
}

export type DefaultCategoryName =
  | 'Food'
  | 'Transport'
  | 'Bills'
  | 'Entertainment'
  | 'Shopping'
  | 'Health'
  | 'Other';
