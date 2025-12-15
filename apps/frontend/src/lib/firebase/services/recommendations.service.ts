/**
 * Recommendations Firestore Service
 * Store and retrieve daily AI recommendations
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config';
import type { DailyRecommendation, AIInsight } from '@casha/shared';

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get today's recommendations from Firestore
 */
export async function getTodayRecommendations(): Promise<DailyRecommendation | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const today = getTodayDate();
  const docRef = doc(db, 'users', uid, 'dailyRecommendations', today);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: uid,
    date: data.date,
    recommendations: data.recommendations || [],
    context: data.context || {},
    generatedAt: data.generatedAt instanceof Timestamp
      ? data.generatedAt.toDate().toISOString()
      : data.generatedAt,
  } as DailyRecommendation;
}

/**
 * Save daily recommendations to Firestore
 */
export async function saveDailyRecommendations(
  recommendations: AIInsight[],
  context: DailyRecommendation['context']
): Promise<DailyRecommendation> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const today = getTodayDate();
  const docRef = doc(db, 'users', uid, 'dailyRecommendations', today);

  const data = {
    userId: uid,
    date: today,
    recommendations,
    context,
    generatedAt: Timestamp.now(),
  };

  await setDoc(docRef, data);

  return {
    id: today,
    userId: uid,
    date: today,
    recommendations,
    context,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get recent recommendations (last N days)
 */
export async function getRecentRecommendations(days: number = 7): Promise<DailyRecommendation[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const recommendationsRef = collection(db, 'users', uid, 'dailyRecommendations');
  const q = query(recommendationsRef, orderBy('date', 'desc'), limit(days));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: uid,
      date: data.date,
      recommendations: data.recommendations || [],
      context: data.context || {},
      generatedAt: data.generatedAt instanceof Timestamp
        ? data.generatedAt.toDate().toISOString()
        : data.generatedAt,
    } as DailyRecommendation;
  });
}

/**
 * Check if recommendations need to be refreshed
 * Returns true if no recommendations exist for today
 */
export async function needsRefresh(): Promise<boolean> {
  const todayRecs = await getTodayRecommendations();
  return todayRecs === null;
}
