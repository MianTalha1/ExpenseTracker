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

interface SendMessageRequest {
  message: string;
  conversationId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7).trim();
          const dataLineIndex = lines.indexOf(line) + 1;
          const dataLine = lines[dataLineIndex];

          if (dataLine?.startsWith('data: ')) {
            try {
              const data = JSON.parse(dataLine.slice(6));

              switch (eventType) {
                case 'message':
                  callbacks.onMessage?.(data.content);
                  break;
                case 'done':
                  callbacks.onDone?.(data.fullResponse);
                  break;
                case 'error':
                  callbacks.onError?.(data.message);
                  break;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        } else if (line.startsWith('data: ')) {
          // Handle data without explicit event
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              callbacks.onMessage?.(data.content);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }
}

// Export singleton instance
export const chatRepository = new ChatRepositoryClass();
