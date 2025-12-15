/**
 * Budgets Firestore Service
 * CRUD operations and real-time listeners for budgets
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config';
import type {
  Budget,
  BudgetWithProgress,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  Category,
  Expense,
} from '@casha/shared';

// Get user's budgets collection reference
function getBudgetsRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return collection(db, 'users', uid, 'budgets');
}

// Convert Firestore document to Budget type
function toBudget(id: string, data: Record<string, unknown>): Budget {
  const createdAtTimestamp = data.createdAt as Timestamp;

  return {
    id,
    userId: auth.currentUser?.uid || '',
    categoryId: (data.categoryId as string) || null,
    amount: data.amount as number,
    period: data.period as 'weekly' | 'monthly',
    createdAt: createdAtTimestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

// Get period date range
function getPeriodDates(period: 'weekly' | 'monthly'): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === 'weekly') {
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

// Calculate budget progress
function calculateProgress(
  budget: Budget,
  expenses: Expense[],
  categories?: Category[]
): BudgetWithProgress {
  const { start, end } = getPeriodDates(budget.period);

  // Filter expenses for this budget's period
  let relevantExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= start && expenseDate <= end;
  });

  // If budget has a category, filter by that category
  if (budget.categoryId) {
    relevantExpenses = relevantExpenses.filter(
      (expense) => expense.categoryId === budget.categoryId
    );
  }

  // Calculate spent amount
  const spent = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = Math.max(budget.amount - spent, 0);
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

  // Determine status
  let status: 'safe' | 'warning' | 'danger' | 'exceeded';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= 90) {
    status = 'danger';
  } else if (percentage >= 75) {
    status = 'warning';
  } else {
    status = 'safe';
  }

  // Attach category if exists
  const category = budget.categoryId
    ? categories?.find((c) => c.id === budget.categoryId)
    : null;

  return {
    ...budget,
    category,
    spent,
    remaining,
    percentage,
    status,
  };
}

// Fetch all budgets with progress
export async function getBudgets(
  expenses: Expense[],
  categories?: Category[]
): Promise<BudgetWithProgress[]> {
  const q = query(getBudgetsRef(), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const budgets = snapshot.docs.map((doc) => toBudget(doc.id, doc.data()));

  return budgets.map((budget) => calculateProgress(budget, expenses, categories));
}

// Real-time budgets listener
export function subscribeToBudgets(
  callback: (budgets: Budget[]) => void
): Unsubscribe {
  const q = query(getBudgetsRef(), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const budgets = snapshot.docs.map((doc) => toBudget(doc.id, doc.data()));
    callback(budgets);
  });
}

// Get single budget
export async function getBudget(id: string): Promise<Budget | null> {
  const docRef = doc(getBudgetsRef(), id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return toBudget(docSnap.id, docSnap.data());
}

// Get overall budget (categoryId is null)
export async function getOverallBudget(): Promise<Budget | null> {
  const q = query(getBudgetsRef(), where('categoryId', '==', null));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return toBudget(doc.id, doc.data());
}

// Create budget
export async function createBudget(data: CreateBudgetRequest): Promise<Budget> {
  const budgetData = {
    categoryId: data.categoryId || null,
    amount: data.amount,
    period: data.period,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(getBudgetsRef(), budgetData);
  return {
    id: docRef.id,
    userId: auth.currentUser?.uid || '',
    categoryId: data.categoryId || null,
    amount: data.amount,
    period: data.period,
    createdAt: new Date().toISOString(),
  };
}

// Update budget
export async function updateBudget(
  id: string,
  data: UpdateBudgetRequest
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: { [key: string]: any } = {};

  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.period !== undefined) updateData.period = data.period;

  const docRef = doc(getBudgetsRef(), id);
  await updateDoc(docRef, updateData);
}

// Delete budget
export async function deleteBudget(id: string): Promise<void> {
  const docRef = doc(getBudgetsRef(), id);
  await deleteDoc(docRef);
}

// Calculate progress for budgets with provided expenses
export function calculateBudgetsProgress(
  budgets: Budget[],
  expenses: Expense[],
  categories?: Category[]
): BudgetWithProgress[] {
  return budgets.map((budget) => calculateProgress(budget, expenses, categories));
}
