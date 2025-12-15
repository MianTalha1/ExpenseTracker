/**
 * Insights Firestore Service
 * Client-side analytics computation from Firestore data
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config';
import type {
  SpendingSummary,
  CategorySpending,
  DailySpending,
  PeriodComparison,
  Expense,
  Category,
  Budget,
} from '@casha/shared';

// Get period date range
function getPeriodDates(period: 'week' | 'month'): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === 'week') {
    const dayOfWeek = now.getDay();
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

// Get previous period date range
function getPreviousPeriodDates(period: 'week' | 'month'): { start: Date; end: Date } {
  const { start: currentStart, end: currentEnd } = getPeriodDates(period);
  const start = new Date(currentStart);
  const end = new Date(currentEnd);

  if (period === 'week') {
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() - 7);
  } else {
    start.setMonth(start.getMonth() - 1);
    end.setMonth(end.getMonth() - 1);
  }

  return { start, end };
}

// Calculate spending summary
export function calculateSpendingSummary(
  expenses: Expense[],
  overallBudget: Budget | null,
  period: 'week' | 'month'
): SpendingSummary {
  const { start, end } = getPeriodDates(period);

  // Filter expenses for this period
  const periodExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= start && expenseDate <= end;
  });

  // Calculate total spent
  const totalSpent = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = overallBudget?.amount || 0;
  const remaining = Math.max(totalBudget - totalSpent, 0);
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    totalSpent,
    totalBudget,
    remaining,
    percentageUsed,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
}

// Calculate category spending breakdown
export function calculateCategorySpending(
  expenses: Expense[],
  categories: Category[],
  period: 'week' | 'month'
): CategorySpending[] {
  const { start, end } = getPeriodDates(period);

  // Filter expenses for this period
  const periodExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= start && expenseDate <= end;
  });

  // Group by category
  const categoryMap = new Map<string, { amount: number; count: number }>();
  periodExpenses.forEach((expense) => {
    const existing = categoryMap.get(expense.categoryId) || { amount: 0, count: 0 };
    categoryMap.set(expense.categoryId, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    });
  });

  // Calculate total for percentages
  const totalAmount = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Build result
  const result: CategorySpending[] = [];
  const categoriesMap = new Map(categories.map((c) => [c.id, c]));

  categoryMap.forEach((data, categoryId) => {
    const category = categoriesMap.get(categoryId);
    result.push({
      categoryId,
      categoryName: category?.name || 'Unknown',
      categoryColor: category?.color || '#6B7280',
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      transactionCount: data.count,
    });
  });

  // Sort by amount descending
  return result.sort((a, b) => b.amount - a.amount);
}

// Calculate daily spending for charts
export function calculateDailySpending(
  expenses: Expense[],
  period: 'week' | 'month'
): DailySpending[] {
  const { start, end } = getPeriodDates(period);

  // Create a map for all days in the period
  const dailyMap = new Map<string, number>();
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    dailyMap.set(dateStr, 0);
    current.setDate(current.getDate() + 1);
  }

  // Sum expenses by day
  expenses.forEach((expense) => {
    const expenseDate = new Date(expense.date);
    if (expenseDate >= start && expenseDate <= end) {
      const dateStr = expenseDate.toISOString().split('T')[0];
      const existing = dailyMap.get(dateStr) || 0;
      dailyMap.set(dateStr, existing + expense.amount);
    }
  });

  // Convert to array
  const result: DailySpending[] = [];
  dailyMap.forEach((amount, date) => {
    result.push({ date, amount });
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// Calculate spending trends (current vs previous period)
export function calculateSpendingTrends(
  expenses: Expense[],
  overallBudget: Budget | null,
  period: 'week' | 'month'
): PeriodComparison {
  const { start: currentStart, end: currentEnd } = getPeriodDates(period);
  const { start: prevStart, end: prevEnd } = getPreviousPeriodDates(period);

  // Current period expenses
  const currentExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= currentStart && expenseDate <= currentEnd;
  });

  // Previous period expenses
  const previousExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= prevStart && expenseDate <= prevEnd;
  });

  const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = overallBudget?.amount || 0;

  const changeAmount = currentTotal - previousTotal;
  const changePercentage = previousTotal > 0 ? (changeAmount / previousTotal) * 100 : 0;

  return {
    currentPeriod: {
      totalSpent: currentTotal,
      totalBudget,
      remaining: Math.max(totalBudget - currentTotal, 0),
      percentageUsed: totalBudget > 0 ? (currentTotal / totalBudget) * 100 : 0,
      periodStart: currentStart.toISOString(),
      periodEnd: currentEnd.toISOString(),
    },
    previousPeriod: {
      totalSpent: previousTotal,
      totalBudget,
      remaining: Math.max(totalBudget - previousTotal, 0),
      percentageUsed: totalBudget > 0 ? (previousTotal / totalBudget) * 100 : 0,
      periodStart: prevStart.toISOString(),
      periodEnd: prevEnd.toISOString(),
    },
    changeAmount,
    changePercentage,
    trend: changeAmount > 0 ? 'up' : changeAmount < 0 ? 'down' : 'stable',
  };
}

// Fetch expenses for a specific period directly from Firestore
export async function fetchExpensesForPeriod(
  period: 'week' | 'month'
): Promise<Expense[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const { start, end } = getPeriodDates(period);
  const expensesRef = collection(db, 'users', uid, 'expenses');

  const q = query(
    expensesRef,
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.date as Timestamp;
    const createdAtTimestamp = data.createdAt as Timestamp;

    return {
      id: doc.id,
      userId: uid,
      categoryId: data.categoryId as string,
      amount: data.amount as number,
      description: (data.description as string) || null,
      date: timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      isRecurring: (data.isRecurring as boolean) || false,
      recurringInterval: (data.recurringInterval as 'weekly' | 'monthly') || null,
      createdAt: createdAtTimestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });
}

// Fetch all expenses for trends calculation (current + previous period)
export async function fetchExpensesForTrends(
  period: 'week' | 'month'
): Promise<Expense[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const { start: prevStart } = getPreviousPeriodDates(period);
  const { end: currentEnd } = getPeriodDates(period);

  const expensesRef = collection(db, 'users', uid, 'expenses');

  const q = query(
    expensesRef,
    where('date', '>=', Timestamp.fromDate(prevStart)),
    where('date', '<=', Timestamp.fromDate(currentEnd)),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.date as Timestamp;
    const createdAtTimestamp = data.createdAt as Timestamp;

    return {
      id: doc.id,
      userId: uid,
      categoryId: data.categoryId as string,
      amount: data.amount as number,
      description: (data.description as string) || null,
      date: timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      isRecurring: (data.isRecurring as boolean) || false,
      recurringInterval: (data.recurringInterval as 'weekly' | 'monthly') || null,
      createdAt: createdAtTimestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });
}
