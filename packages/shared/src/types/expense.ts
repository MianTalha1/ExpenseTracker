/**
 * Expense Types
 * Expense-related type definitions
 */

import type { Category } from './category';

export type RecurringInterval = 'weekly' | 'monthly';

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  category?: Category;
  amount: number;
  description: string | null;
  date: string;
  isRecurring: boolean;
  recurringInterval: RecurringInterval | null;
  createdAt: string;
}

export interface CreateExpenseRequest {
  categoryId: string;
  amount: number;
  description?: string;
  date: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
}

export interface UpdateExpenseRequest {
  categoryId?: string;
  amount?: number;
  description?: string;
  date?: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface ExpenseWithCategory extends Expense {
  category: Category;
}
