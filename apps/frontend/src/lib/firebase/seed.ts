/**
 * Firebase Seed Script
 * Populates Firestore with mock data for testing
 */

import {
  collection,
  doc,
  writeBatch,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './config';
import { DEFAULT_CATEGORIES } from '@casha/shared';

/**
 * Clear all existing data for the current user
 */
export async function clearUserData(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const collections = ['categories', 'expenses', 'budgets'];

  for (const collName of collections) {
    const collRef = collection(db, 'users', user.uid, collName);
    const snapshot = await getDocs(collRef);

    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }

  console.log('Cleared all user data');
}

/**
 * Seed mock data for the current logged-in user
 */
export async function seedMockData(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated. Please log in first.');

  console.log(`Seeding mock data for user: ${user.email}`);

  // Clear existing data first
  await clearUserData();

  const batch = writeBatch(db);
  const categoryIds: string[] = [];

  // 1. Create categories
  const categoriesRef = collection(db, 'users', user.uid, 'categories');

  for (const cat of DEFAULT_CATEGORIES) {
    const catDoc = doc(categoriesRef);
    categoryIds.push(catDoc.id);
    batch.set(catDoc, {
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      type: cat.type,
      budgetLimit: cat.budgetLimit,
      createdAt: serverTimestamp(),
    });
  }

  // Commit categories first to get IDs
  await batch.commit();
  console.log(`Created ${DEFAULT_CATEGORIES.length} categories`);

  // 2. Create expenses (new batch)
  const expensesBatch = writeBatch(db);
  const expensesRef = collection(db, 'users', user.uid, 'expenses');

  const mockExpenses = [
    // Food expenses
    { categoryIndex: 0, amount: 125.50, description: 'Weekly grocery shopping', daysAgo: 2 },
    { categoryIndex: 0, amount: 32.00, description: 'Lunch with colleagues', daysAgo: 5 },
    { categoryIndex: 0, amount: 18.50, description: 'Coffee and snacks', daysAgo: 7 },
    { categoryIndex: 0, amount: 65.00, description: 'Dinner at restaurant', daysAgo: 12 },
    { categoryIndex: 0, amount: 45.00, description: 'Takeout food', daysAgo: 15 },

    // Transport expenses
    { categoryIndex: 1, amount: 55.00, description: 'Gas fill-up', daysAgo: 3 },
    { categoryIndex: 1, amount: 25.00, description: 'Uber to airport', daysAgo: 10 },
    { categoryIndex: 1, amount: 12.50, description: 'Parking downtown', daysAgo: 14 },

    // Bills (recurring)
    { categoryIndex: 2, amount: 120.00, description: 'Electric bill', daysAgo: 1, isRecurring: true, recurringInterval: 'monthly' as const },
    { categoryIndex: 2, amount: 79.99, description: 'Internet bill', daysAgo: 5, isRecurring: true, recurringInterval: 'monthly' as const },
    { categoryIndex: 2, amount: 15.99, description: 'Netflix subscription', daysAgo: 8, isRecurring: true, recurringInterval: 'monthly' as const },

    // Entertainment
    { categoryIndex: 3, amount: 24.00, description: 'Movie tickets', daysAgo: 6 },
    { categoryIndex: 3, amount: 59.99, description: 'Video game purchase', daysAgo: 18 },

    // Shopping
    { categoryIndex: 4, amount: 89.00, description: 'New shoes', daysAgo: 9 },
    { categoryIndex: 4, amount: 45.00, description: 'Amazon order', daysAgo: 20 },

    // Health
    { categoryIndex: 5, amount: 50.00, description: 'Gym membership', daysAgo: 1, isRecurring: true, recurringInterval: 'monthly' as const },
    { categoryIndex: 5, amount: 35.00, description: 'Pharmacy', daysAgo: 11 },

    // Other
    { categoryIndex: 6, amount: 50.00, description: 'Birthday gift', daysAgo: 8 },
    { categoryIndex: 6, amount: 25.00, description: 'Charitable donation', daysAgo: 22 },
  ];

  for (const expense of mockExpenses) {
    const expenseDate = new Date();
    expenseDate.setDate(expenseDate.getDate() - expense.daysAgo);

    const expDoc = doc(expensesRef);
    expensesBatch.set(expDoc, {
      categoryId: categoryIds[expense.categoryIndex],
      amount: expense.amount,
      description: expense.description,
      date: Timestamp.fromDate(expenseDate),
      isRecurring: expense.isRecurring || false,
      recurringInterval: expense.recurringInterval || null,
      createdAt: serverTimestamp(),
    });
  }

  await expensesBatch.commit();
  console.log(`Created ${mockExpenses.length} expenses`);

  // 3. Create budgets (new batch)
  const budgetsBatch = writeBatch(db);
  const budgetsRef = collection(db, 'users', user.uid, 'budgets');

  const mockBudgets = [
    { categoryId: null, amount: 2000, period: 'monthly' as const }, // Overall budget
    { categoryId: categoryIds[0], amount: 400, period: 'monthly' as const }, // Food
    { categoryId: categoryIds[1], amount: 200, period: 'monthly' as const }, // Transport
    { categoryId: categoryIds[3], amount: 150, period: 'monthly' as const }, // Entertainment
  ];

  for (const budget of mockBudgets) {
    const budDoc = doc(budgetsRef);
    budgetsBatch.set(budDoc, {
      categoryId: budget.categoryId,
      amount: budget.amount,
      period: budget.period,
      createdAt: serverTimestamp(),
    });
  }

  await budgetsBatch.commit();
  console.log(`Created ${mockBudgets.length} budgets`);

  console.log('Mock data seeding complete!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as unknown as { seedMockData: typeof seedMockData }).seedMockData = seedMockData;
  (window as unknown as { clearUserData: typeof clearUserData }).clearUserData = clearUserData;
}
