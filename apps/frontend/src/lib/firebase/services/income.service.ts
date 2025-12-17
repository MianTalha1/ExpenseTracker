/**
 * Income Firestore Service
 * CRUD operations and real-time listeners for income sources
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
import type {
  IncomeSource,
  CreateIncomeSourceRequest,
  UpdateIncomeSourceRequest,
  IncomeFrequency,
} from '@casha/shared';

// Get user's income sources collection reference
function getIncomeSourcesRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return collection(db, 'users', uid, 'incomeSources');
}

// Convert Firestore document to IncomeSource type
function toIncomeSource(id: string, data: Record<string, unknown>): IncomeSource {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    id,
    userId: auth.currentUser?.uid || '',
    name: data.name as string,
    amount: data.amount as number,
    frequency: (data.frequency as IncomeFrequency) || 'monthly',
    createdAt: createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

// Calculate monthly equivalent amount
function getMonthlyAmount(source: IncomeSource): number {
  switch (source.frequency) {
    case 'monthly':
      return source.amount;
    case 'yearly':
      return source.amount / 12;
    case 'one-time':
      return 0; // One-time income doesn't contribute to monthly
    default:
      return source.amount;
  }
}

// Fetch all income sources
export async function getIncomeSources(): Promise<IncomeSource[]> {
  const q = query(getIncomeSourcesRef(), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => toIncomeSource(doc.id, doc.data()));
}

// Real-time income sources listener
export function subscribeToIncomeSources(
  callback: (sources: IncomeSource[]) => void
): Unsubscribe {
  const q = query(getIncomeSourcesRef(), orderBy('name', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const sources = snapshot.docs.map((doc) => toIncomeSource(doc.id, doc.data()));
    callback(sources);
  });
}

// Get single income source
export async function getIncomeSource(id: string): Promise<IncomeSource | null> {
  const docRef = doc(getIncomeSourcesRef(), id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return toIncomeSource(docSnap.id, docSnap.data());
}

// Create income source
export async function createIncomeSource(
  data: CreateIncomeSourceRequest
): Promise<IncomeSource> {
  const incomeData = {
    name: data.name,
    amount: data.amount,
    frequency: data.frequency,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(getIncomeSourcesRef(), incomeData);
  return {
    id: docRef.id,
    userId: auth.currentUser?.uid || '',
    name: data.name,
    amount: data.amount,
    frequency: data.frequency,
    createdAt: new Date().toISOString(),
  };
}

// Update income source
export async function updateIncomeSource(
  id: string,
  data: UpdateIncomeSourceRequest
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: { [key: string]: any } = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;

  const docRef = doc(getIncomeSourcesRef(), id);
  await updateDoc(docRef, updateData);
}

// Delete income source
export async function deleteIncomeSource(id: string): Promise<void> {
  const docRef = doc(getIncomeSourcesRef(), id);
  await deleteDoc(docRef);
}

// Calculate total monthly income from all sources
export async function getTotalMonthlyIncome(): Promise<number> {
  const sources = await getIncomeSources();
  return sources.reduce((total, source) => total + getMonthlyAmount(source), 0);
}

// Export helper for hook
export { getMonthlyAmount };
