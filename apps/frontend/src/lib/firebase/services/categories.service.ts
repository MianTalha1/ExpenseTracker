/**
 * Categories Firestore Service
 * CRUD operations and real-time listeners for categories
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
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryType } from '@casha/shared';

// Get user's categories collection reference
function getCategoriesRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return collection(db, 'users', uid, 'categories');
}

// Convert Firestore document to Category type
function toCategory(id: string, data: Record<string, unknown>): Category {
  return {
    id,
    userId: auth.currentUser?.uid || '',
    name: data.name as string,
    color: data.color as string,
    icon: (data.icon as string) || null,
    type: (data.type as CategoryType) || 'expense',
    budgetLimit: (data.budgetLimit as number) ?? null,
  };
}

// Fetch all categories
export async function getCategories(): Promise<Category[]> {
  const q = query(getCategoriesRef(), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => toCategory(doc.id, doc.data()));
}

// Real-time categories listener
export function subscribeToCategories(callback: (categories: Category[]) => void): Unsubscribe {
  const q = query(getCategoriesRef(), orderBy('name', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map((doc) => toCategory(doc.id, doc.data()));
    callback(categories);
  });
}

// Get single category
export async function getCategory(id: string): Promise<Category | null> {
  const docRef = doc(getCategoriesRef(), id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return toCategory(docSnap.id, docSnap.data());
}

// Create category
export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const categoryData = {
    name: data.name,
    color: data.color,
    icon: data.icon || null,
    type: data.type,
    budgetLimit: data.budgetLimit ?? null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(getCategoriesRef(), categoryData);
  return {
    id: docRef.id,
    userId: auth.currentUser?.uid || '',
    name: data.name,
    color: data.color,
    icon: data.icon || null,
    type: data.type,
    budgetLimit: data.budgetLimit ?? null,
  };
}

// Update category
export async function updateCategory(
  id: string,
  data: UpdateCategoryRequest
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: { [key: string]: any } = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.budgetLimit !== undefined) updateData.budgetLimit = data.budgetLimit;

  const docRef = doc(getCategoriesRef(), id);
  await updateDoc(docRef, updateData);
}

// Delete category
export async function deleteCategory(id: string): Promise<void> {
  const docRef = doc(getCategoriesRef(), id);
  await deleteDoc(docRef);
}
