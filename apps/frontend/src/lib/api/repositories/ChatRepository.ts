/**
 * Chat Repository (Firebase Version)
 * SSE streaming chat - conversation history managed via Firestore
 */

import { getApiUrl, ApiError } from '../client';
import { auth } from '@/lib/firebase/config';

interface StreamCallbacks {
  onMessage?: (content: string) => void;
  onDone?: (fullResponse: string) => void;
  onError?: (error: string) => void;
}

interface UserContext {
  totalSpent?: number;
  totalBudget?: number;
  remaining?: number;
  topCategories?: Array<{ name: string; amount: number; percentage: number }>;
  recentExpenses?: Array<{ description: string; amount: number; category: string; date: string }>;
  spendingTrend?: 'up' | 'down' | 'stable';
}

interface SendMessageRequest {
  message: string;
  conversationId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: UserContext;
}

class ChatRepositoryClass {
  /**
   * Send message and stream response via SSE
   * Client sends conversation history, server streams AI response
   */
  async sendMessageStream(
    request: SendMessageRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
      callbacks.onError?.('Not authenticated');
      return;
    }

    const response = await fetch(`${getApiUrl()}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError('Session expired', 401, 'Please log in again');
      }
      throw new ApiError('Failed to send message', response.status);
    }

    if (!response.body) {
      throw new ApiError('No response body', 0);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let currentEvent = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('event: ')) {
          currentEvent = trimmedLine.slice(7).trim();
        } else if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6);

          try {
            const data = JSON.parse(dataStr);

            if (currentEvent === 'message' || (!currentEvent && data.content)) {
              fullResponse += data.content || '';
              callbacks.onMessage?.(data.content);
            } else if (currentEvent === 'done') {
              callbacks.onDone?.(data.fullResponse || fullResponse);
            } else if (currentEvent === 'error') {
              callbacks.onError?.(data.message || 'Unknown error');
            }
          } catch {
            // Skip malformed JSON
          }

          // Reset event after processing data
          currentEvent = '';
        }
      }
    }
  }
}

// Export singleton instance
export const chatRepository = new ChatRepositoryClass();
