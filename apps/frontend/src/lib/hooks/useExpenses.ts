/**
 * useExpenses Hook
 * Real-time expense management with Firestore listeners
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  subscribeToExpenses,
  createExpense as createExpenseService,
  updateExpense as updateExpenseService,
  deleteExpense as deleteExpenseService,
} from '@/lib/firebase/services';
import { useAuth } from '@/lib/context/AuthContext';
import { useCategories } from './useCategories';
import type {
  Expense,
  ExpenseWithCategory,
  ExpenseFilters,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from '@casha/shared';

interface UseExpensesOptions extends ExpenseFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseExpensesReturn {
  expenses: ExpenseWithCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createExpense: (data: CreateExpenseRequest) => Promise<void>;
  updateExpense: (id: string, data: UpdateExpenseRequest) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: ExpenseFilters) => void;
}

export function useExpenses(options: UseExpensesOptions = {}): UseExpensesReturn {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState(options.page || 1);
  const [pageSize] = useState(options.pageSize || 10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>({
    startDate: options.startDate,
    endDate: options.endDate,
    categoryId: options.categoryId,
    minAmount: options.minAmount,
    maxAmount: options.maxAmount,
    search: options.search,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) {
      setAllExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToExpenses(
        (expenses) => {
          setAllExpenses(expenses);
          setIsLoading(false);
        },
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
          categoryId: filters.categoryId,
        }
      );

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to subscribe to expenses'));
      setIsLoading(false);
    }
  }, [user, filters.startDate, filters.endDate, filters.categoryId, refreshKey]);

  // Filter expenses client-side for search, minAmount, maxAmount
  const filteredExpenses = useMemo(() => {
    let result = [...allExpenses];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((e) =>
        e.description?.toLowerCase().includes(searchLower)
      );
    }
    if (filters.minAmount !== undefined) {
      result = result.filter((e) => e.amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      result = result.filter((e) => e.amount <= filters.maxAmount!);
    }

    return result;
  }, [allExpenses, filters.search, filters.minAmount, filters.maxAmount]);

  // Add category data and paginate
  const expenses: ExpenseWithCategory[] = useMemo(() => {
    const categoriesMap = new Map(categories.map((c) => [c.id, c]));
    const withCategory = filteredExpenses.map((expense) => ({
      ...expense,
      category: categoriesMap.get(expense.categoryId) || {
        id: expense.categoryId,
        userId: expense.userId,
        name: 'Unknown',
        color: '#6B7280',
        icon: null,
        type: 'expense' as const,
        budgetLimit: null,
      },
    }));

    // Paginate
    const start = (page - 1) * pageSize;
    return withCategory.slice(start, start + pageSize);
  }, [filteredExpenses, categories, page, pageSize]);

  const total = filteredExpenses.length;
  const totalPages = Math.ceil(total / pageSize);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const createExpense = useCallback(async (data: CreateExpenseRequest) => {
    await createExpenseService(data);
    // Real-time listener handles the update
  }, []);

  const updateExpense = useCallback(
    async (id: string, data: UpdateExpenseRequest) => {
      await updateExpenseService(id, data);
      // Real-time listener handles the update
    },
    []
  );

  const deleteExpense = useCallback(async (id: string) => {
    await deleteExpenseService(id);
    // Real-time listener handles the update
  }, []);

  return {
    expenses,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    refetch,
    createExpense,
    updateExpense,
    deleteExpense,
    setPage,
    setFilters,
  };
}

/**
 * useRecentExpenses Hook
 * Fetch only the most recent expenses with real-time updates
 */
export function useRecentExpenses(limit: number = 5) {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToExpenses((allExpenses) => {
        // Take only the first `limit` expenses
        setExpenses(allExpenses.slice(0, limit));
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch recent expenses')
      );
      setIsLoading(false);
    }
  }, [user, limit]);

  // Add category data
  const expensesWithCategory: ExpenseWithCategory[] = useMemo(() => {
    const categoriesMap = new Map(categories.map((c) => [c.id, c]));
    return expenses.map((expense) => ({
      ...expense,
      category: categoriesMap.get(expense.categoryId) || {
        id: expense.categoryId,
        userId: expense.userId,
        name: 'Unknown',
        color: '#6B7280',
        icon: null,
        type: 'expense' as const,
        budgetLimit: null,
      },
    }));
  }, [expenses, categories]);

  return {
    expenses: expensesWithCategory,
    isLoading,
    error,
    refetch: () => {}, // Real-time, no manual refetch needed
  };
}
