/**
 * useInsights Hook
 * Real-time analytics with client-side computation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  calculateSpendingSummary,
  calculateCategorySpending,
  calculateDailySpending,
  calculateSpendingTrends,
} from '@/lib/firebase/services';
import { subscribeToExpenses, subscribeToBudgets } from '@/lib/firebase/services';
import { useAuth } from '@/lib/context/AuthContext';
import { useCategories } from './useCategories';
import type {
  SpendingSummary,
  CategorySpending,
  DailySpending,
  PeriodComparison,
  Expense,
  Budget,
  AIInsight,
  AIAdviceRequest,
} from '@casha/shared';

type Period = 'week' | 'month';

interface UseInsightsReturn {
  summary: SpendingSummary | null;
  trends: PeriodComparison | null;
  categorySpending: CategorySpending[];
  dailySpending: DailySpending[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useInsights(period: Period = 'month'): UseInsightsReturn {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to expenses
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToExpenses((data) => {
        setExpenses(data);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch insights'));
      setIsLoading(false);
    }
  }, [user, refreshKey]);

  // Subscribe to budgets
  useEffect(() => {
    if (!user) {
      setBudgets([]);
      return;
    }

    try {
      const unsubscribe = subscribeToBudgets((data) => {
        setBudgets(data);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to subscribe to budgets for insights:', err);
    }
  }, [user]);

  // Get overall budget
  const overallBudget = useMemo(
    () => budgets.find((b) => b.categoryId === null) || null,
    [budgets]
  );

  // Calculate summary
  const summary = useMemo(() => {
    if (expenses.length === 0 && !isLoading) {
      return {
        totalSpent: 0,
        totalBudget: overallBudget?.amount || 0,
        remaining: overallBudget?.amount || 0,
        percentageUsed: 0,
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
      };
    }
    return calculateSpendingSummary(expenses, overallBudget, period);
  }, [expenses, overallBudget, period, isLoading]);

  // Calculate trends
  const trends = useMemo(() => {
    return calculateSpendingTrends(expenses, overallBudget, period);
  }, [expenses, overallBudget, period]);

  // Calculate category spending
  const categorySpending = useMemo(() => {
    return calculateCategorySpending(expenses, categories, period);
  }, [expenses, categories, period]);

  // Calculate daily spending
  const dailySpending = useMemo(() => {
    return calculateDailySpending(expenses, period);
  }, [expenses, period]);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    summary,
    trends,
    categorySpending,
    dailySpending,
    isLoading,
    error,
    refetch,
  };
}

/**
 * useAIInsights Hook
 * Fetch AI-powered advice from the backend
 */
interface UseAIInsightsReturn {
  insights: AIInsight[];
  isLoading: boolean;
  error: Error | null;
  fetchAdvice: () => Promise<void>;
}

export function useAIInsights(period: Period = 'month'): UseAIInsightsReturn {
  const { getIdToken } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAdvice = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/insights/ai-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          period,
          includeCategories: true,
          includeTrends: true,
        } as AIAdviceRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI advice');
      }

      const data = await response.json();
      setInsights(data.insights || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch AI advice'));
    } finally {
      setIsLoading(false);
    }
  }, [period, getIdToken]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  return {
    insights,
    isLoading,
    error,
    fetchAdvice,
  };
}

/**
 * useDashboardData Hook
 * Combined hook for dashboard page data
 */
interface UseDashboardDataReturn {
  summary: SpendingSummary | null;
  trends: PeriodComparison | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const { summary, trends, isLoading, error, refetch } = useInsights('month');

  return {
    summary,
    trends,
    isLoading,
    error,
    refetch,
  };
}
