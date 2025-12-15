/**
 * useDailyRecommendations Hook
 * Fetch and manage daily AI-powered recommendations
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getTodayRecommendations,
  saveDailyRecommendations,
  subscribeToExpenses,
  subscribeToBudgets,
  calculateSpendingSummary,
  calculateCategorySpending,
  calculateSpendingTrends,
} from '@/lib/firebase/services';
import { useCategories } from './useCategories';
import type { DailyRecommendation, AIInsight, Expense, Budget } from '@casha/shared';

interface UseDailyRecommendationsReturn {
  recommendations: AIInsight[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
}

export function useDailyRecommendations(): UseDailyRecommendationsReturn {
  const { user, getIdToken } = useAuth();
  const { categories } = useCategories();
  const [dailyRec, setDailyRec] = useState<DailyRecommendation | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to expenses for context building
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      return;
    }

    const unsubscribe = subscribeToExpenses((data) => {
      setExpenses(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to budgets for context building
  useEffect(() => {
    if (!user) {
      setBudgets([]);
      return;
    }

    const unsubscribe = subscribeToBudgets((data) => {
      setBudgets(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Build spending context for API request
  const buildSpendingContext = useCallback(() => {
    const overallBudget = budgets.find((b) => b.categoryId === null) || null;
    const summary = calculateSpendingSummary(expenses, overallBudget, 'month');
    const categorySpending = calculateCategorySpending(expenses, categories, 'month');
    const trends = calculateSpendingTrends(expenses, overallBudget, 'month');

    // Get recent expenses
    const recentExpenses = [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((e) => {
        const category = categories.find((c) => c.id === e.categoryId);
        return {
          description: e.description || 'Expense',
          amount: e.amount,
          category: category?.name || 'Unknown',
          date: new Date(e.date).toLocaleDateString(),
        };
      });

    return {
      totalSpent: summary.totalSpent,
      totalBudget: summary.totalBudget,
      remaining: summary.remaining,
      topCategories: categorySpending.slice(0, 5).map((c) => ({
        name: c.categoryName,
        amount: c.amount,
        percentage: c.percentage,
      })),
      recentExpenses,
      spendingTrend: trends.trend,
      changePercentage: trends.changePercentage,
    };
  }, [expenses, budgets, categories]);

  // Fetch recommendations from API
  const fetchFromAPI = useCallback(async () => {
    const token = await getIdToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const context = buildSpendingContext();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const response = await fetch(`${apiUrl}/api/recommendations/daily`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      throw new Error('Failed to generate recommendations');
    }

    const data = await response.json();
    return data;
  }, [getIdToken, buildSpendingContext]);

  // Check for existing recommendations and fetch if needed
  const loadRecommendations = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First check if we have today's recommendations
      const existing = await getTodayRecommendations();

      if (existing) {
        setDailyRec(existing);
        setIsLoading(false);
        return;
      }

      // No existing recommendations, fetch from API
      // Wait for expenses to load first
      if (expenses.length === 0 && budgets.length === 0) {
        // Data not loaded yet, will retry after data loads
        setIsLoading(false);
        return;
      }

      const newRec = await fetchFromAPI();

      // Save to Firestore
      const saved = await saveDailyRecommendations(
        newRec.recommendations,
        newRec.context
      );

      setDailyRec(saved);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError(err instanceof Error ? err : new Error('Failed to load recommendations'));
    } finally {
      setIsLoading(false);
    }
  }, [user, expenses, budgets, fetchFromAPI]);

  // Load recommendations on mount and when expenses/budgets change
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // Force refresh - regenerate recommendations
  const refresh = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const newRec = await fetchFromAPI();

      // Save to Firestore (overwrites existing)
      const saved = await saveDailyRecommendations(
        newRec.recommendations,
        newRec.context
      );

      setDailyRec(saved);
    } catch (err) {
      console.error('Failed to refresh recommendations:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh recommendations'));
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchFromAPI]);

  return {
    recommendations: dailyRec?.recommendations || [],
    isLoading,
    error,
    lastUpdated: dailyRec?.generatedAt || null,
    refresh,
  };
}
