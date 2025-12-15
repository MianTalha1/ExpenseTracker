/**
 * Chat Service
 * Firestore operations for chat conversations and messages
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
  type Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config';
import type { ChatConversation, ChatMessage } from '@casha/shared';

function getUserId(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
}

function toConversation(id: string, data: Record<string, unknown>): ChatConversation {
  return {
    id,
    userId: data.userId as string,
    title: (data.title as string) || 'New Conversation',
    createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

function toMessage(id: string, conversationId: string, data: Record<string, unknown>): ChatMessage {
  return {
    id,
    conversationId,
    role: data.role as 'user' | 'assistant',
    content: data.content as string,
    createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Subscribe to conversations list with real-time updates
 */
export function subscribeToConversations(
  callback: (conversations: ChatConversation[]) => void
): Unsubscribe {
  const userId = getUserId();
  const conversationsRef = collection(db, 'users', userId, 'chatConversations');
  const q = query(conversationsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map((doc) =>
      toConversation(doc.id, doc.data())
    );
    callback(conversations);
  });
}

/**
 * Get a single conversation with messages
 */
export async function getConversation(conversationId: string): Promise<{
  conversation: ChatConversation;
  messages: ChatMessage[];
}> {
  const userId = getUserId();
  const conversationRef = doc(db, 'users', userId, 'chatConversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);

  if (!conversationSnap.exists()) {
    throw new Error('Conversation not found');
  }

  const conversation = toConversation(conversationSnap.id, conversationSnap.data());

  // Get messages
  const messagesRef = collection(conversationRef, 'messages');
  const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
  const messagesSnap = await getDocs(messagesQuery);

  const messages = messagesSnap.docs.map((doc) =>
    toMessage(doc.id, conversationId, doc.data())
  );

  return { conversation, messages };
}

/**
 * Subscribe to messages in a conversation with real-time updates
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const userId = getUserId();
  const messagesRef = collection(
    db,
    'users',
    userId,
    'chatConversations',
    conversationId,
    'messages'
  );
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) =>
      toMessage(doc.id, conversationId, doc.data())
    );
    callback(messages);
  });
}

/**
 * Create a new conversation
 */
export async function createConversation(title: string = 'New Conversation'): Promise<string> {
  const userId = getUserId();
  const conversationsRef = collection(db, 'users', userId, 'chatConversations');

  const docRef = await addDoc(conversationsRef, {
    userId,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<string> {
  const userId = getUserId();
  const messagesRef = collection(
    db,
    'users',
    userId,
    'chatConversations',
    conversationId,
    'messages'
  );

  const docRef = await addDoc(messagesRef, {
    role,
    content,
    createdAt: serverTimestamp(),
  });

  // Update conversation's updatedAt
  const conversationRef = doc(db, 'users', userId, 'chatConversations', conversationId);
  await updateDoc(conversationRef, {
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  const userId = getUserId();
  const conversationRef = doc(db, 'users', userId, 'chatConversations', conversationId);
  await updateDoc(conversationRef, {
    title,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  const userId = getUserId();
  const conversationRef = doc(db, 'users', userId, 'chatConversations', conversationId);

  // Delete all messages first
  const messagesRef = collection(conversationRef, 'messages');
  const messagesSnap = await getDocs(messagesRef);

  const deletePromises = messagesSnap.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  // Delete the conversation
  await deleteDoc(conversationRef);
}
