/**
 * useBudgets Hook
 * Real-time budget management with progress tracking
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  subscribeToBudgets,
  createBudget as createBudgetService,
  updateBudget as updateBudgetService,
  deleteBudget as deleteBudgetService,
  calculateBudgetsProgress,
} from '@/lib/firebase/services';
import { subscribeToExpenses } from '@/lib/firebase/services';
import { useAuth } from '@/lib/context/AuthContext';
import { useCategories } from './useCategories';
import type {
  Budget,
  BudgetWithProgress,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  Expense,
} from '@casha/shared';

interface UseBudgetsReturn {
  budgets: BudgetWithProgress[];
  overallBudget: BudgetWithProgress | null;
  categoryBudgets: BudgetWithProgress[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createBudget: (data: CreateBudgetRequest) => Promise<void>;
  updateBudget: (id: string, data: UpdateBudgetRequest) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export function useBudgets(): UseBudgetsReturn {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [rawBudgets, setRawBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to budgets
  useEffect(() => {
    if (!user) {
      setRawBudgets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToBudgets((data) => {
        setRawBudgets(data);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch budgets'));
      setIsLoading(false);
    }
  }, [user, refreshKey]);

  // Subscribe to expenses for progress calculation
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      return;
    }

    try {
      const unsubscribe = subscribeToExpenses((data) => {
        setExpenses(data);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to subscribe to expenses for budget progress:', err);
    }
  }, [user]);

  // Calculate budgets with progress
  const budgets = useMemo(() => {
    return calculateBudgetsProgress(rawBudgets, expenses, categories);
  }, [rawBudgets, expenses, categories]);

  // Derived data - memoized for performance
  const overallBudget = useMemo(
    () => budgets.find((b) => b.categoryId === null) || null,
    [budgets]
  );

  const categoryBudgets = useMemo(
    () => budgets.filter((b) => b.categoryId !== null),
    [budgets]
  );

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const createBudget = useCallback(async (data: CreateBudgetRequest) => {
    await createBudgetService(data);
    // Real-time listener handles the update
  }, []);

  const updateBudget = useCallback(
    async (id: string, data: UpdateBudgetRequest) => {
      await updateBudgetService(id, data);
      // Real-time listener handles the update
    },
    []
  );

  const deleteBudget = useCallback(async (id: string) => {
    await deleteBudgetService(id);
    // Real-time listener handles the update
  }, []);

  return {
    budgets,
    overallBudget,
    categoryBudgets,
    isLoading,
    error,
    refetch,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
