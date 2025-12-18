/**
 * Expenses Firestore Service
 * CRUD operations and real-time listeners for expenses
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
  limit as firestoreLimit,
  onSnapshot,
  Timestamp,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config';
import type {
  Expense,
  ExpenseWithCategory,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  Category,
} from '@casha/shared';

// Get user's expenses collection reference
function getExpensesRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return collection(db, 'users', uid, 'expenses');
}

// Convert Firestore document to Expense type
function toExpense(id: string, data: Record<string, unknown>): Expense {
  const timestamp = data.date as Timestamp;
  const createdAtTimestamp = data.createdAt as Timestamp;
  const lastReviewedAtTimestamp = data.lastReviewedAt as Timestamp | undefined;

  return {
    id,
    userId: auth.currentUser?.uid || '',
    categoryId: data.categoryId as string,
    amount: data.amount as number,
    description: (data.description as string) || null,
    date: timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
    isRecurring: (data.isRecurring as boolean) || false,
    recurringInterval: (data.recurringInterval as 'weekly' | 'monthly') || null,
    // Bill reminder fields
    isBill: (data.isBill as boolean) || false,
    dueDay: (data.dueDay as number) || undefined,
    reminderDays: (data.reminderDays as number) || undefined,
    lastReviewedAt: lastReviewedAtTimestamp?.toDate?.()?.toISOString(),
    createdAt: createdAtTimestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

// Fetch expenses with optional filters
export async function getExpenses(
  filters?: ExpenseFilters,
  categories?: Category[]
): Promise<ExpenseWithCategory[]> {
  const constraints: QueryConstraint[] = [orderBy('date', 'desc')];

  if (filters?.startDate) {
    constraints.push(where('date', '>=', Timestamp.fromDate(new Date(filters.startDate))));
  }
  if (filters?.endDate) {
    constraints.push(where('date', '<=', Timestamp.fromDate(new Date(filters.endDate))));
  }
  if (filters?.categoryId) {
    constraints.push(where('categoryId', '==', filters.categoryId));
  }

  const q = query(getExpensesRef(), ...constraints);
  const snapshot = await getDocs(q);

  let expenses = snapshot.docs.map((doc) => toExpense(doc.id, doc.data()));

  // Client-side filtering for search, minAmount, maxAmount
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    expenses = expenses.filter(
      (e) => e.description?.toLowerCase().includes(searchLower)
    );
  }
  if (filters?.minAmount !== undefined) {
    expenses = expenses.filter((e) => e.amount >= filters.minAmount!);
  }
  if (filters?.maxAmount !== undefined) {
    expenses = expenses.filter((e) => e.amount <= filters.maxAmount!);
  }

  // Attach category data
  const categoriesMap = new Map(categories?.map((c) => [c.id, c]));
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
}

// Real-time expenses listener
export function subscribeToExpenses(
  callback: (expenses: Expense[]) => void,
  filters?: Pick<ExpenseFilters, 'startDate' | 'endDate' | 'categoryId'>
): Unsubscribe {
  const constraints: QueryConstraint[] = [orderBy('date', 'desc')];

  if (filters?.startDate) {
    constraints.push(where('date', '>=', Timestamp.fromDate(new Date(filters.startDate))));
  }
  if (filters?.endDate) {
    constraints.push(where('date', '<=', Timestamp.fromDate(new Date(filters.endDate))));
  }
  if (filters?.categoryId) {
    constraints.push(where('categoryId', '==', filters.categoryId));
  }

  const q = query(getExpensesRef(), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map((doc) => toExpense(doc.id, doc.data()));
    callback(expenses);
  });
}

// Get single expense
export async function getExpense(id: string): Promise<Expense | null> {
  const docRef = doc(getExpensesRef(), id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return toExpense(docSnap.id, docSnap.data());
}

// Create expense
export async function createExpense(data: CreateExpenseRequest): Promise<Expense> {
  const expenseData = {
    categoryId: data.categoryId,
    amount: data.amount,
    description: data.description || null,
    date: Timestamp.fromDate(new Date(data.date)),
    isRecurring: data.isRecurring || false,
    recurringInterval: data.recurringInterval || null,
    // Bill reminder fields
    isBill: data.isBill || false,
    dueDay: data.dueDay || null,
    reminderDays: data.reminderDays || null,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(getExpensesRef(), expenseData);
  return toExpense(docRef.id, expenseData);
}

// Update expense
export async function updateExpense(
  id: string,
  data: UpdateExpenseRequest
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: { [key: string]: any } = {};

  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = Timestamp.fromDate(new Date(data.date));
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
  if (data.recurringInterval !== undefined) updateData.recurringInterval = data.recurringInterval;
  // Bill reminder fields
  if (data.isBill !== undefined) updateData.isBill = data.isBill;
  if (data.dueDay !== undefined) updateData.dueDay = data.dueDay;
  if (data.reminderDays !== undefined) updateData.reminderDays = data.reminderDays;

  const docRef = doc(getExpensesRef(), id);
  await updateDoc(docRef, updateData);
}

// Delete expense
export async function deleteExpense(id: string): Promise<void> {
  const docRef = doc(getExpensesRef(), id);
  await deleteDoc(docRef);
}

// Get recent expenses
export async function getRecentExpenses(
  count: number,
  categories?: Category[]
): Promise<ExpenseWithCategory[]> {
  const q = query(getExpensesRef(), orderBy('date', 'desc'), firestoreLimit(count));
  const snapshot = await getDocs(q);

  const expenses = snapshot.docs.map((doc) => toExpense(doc.id, doc.data()));

  // Attach category data
  const categoriesMap = new Map(categories?.map((c) => [c.id, c]));
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
}
