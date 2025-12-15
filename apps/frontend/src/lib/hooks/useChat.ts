/**
 * useChat Hook
 * Handles chat state with Firestore persistence and streaming responses
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { chatRepository } from '@/lib/api/repositories';
import {
  subscribeToConversations,
  subscribeToMessages,
  createConversation,
  addMessage,
  updateConversationTitle,
  deleteConversation as deleteConversationService,
} from '@/lib/firebase/services';
import { useAuth } from '@/lib/context/AuthContext';
import type { ChatConversation, ChatMessage } from '@casha/shared';

interface UseChatReturn {
  conversations: ChatConversation[];
  messages: ChatMessage[];
  currentConversationId: string | null;
  streamingContent: string;
  isStreaming: boolean;
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
}

export function useChat(): UseChatReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const messagesUnsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to conversations list
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    try {
      const unsubscribe = subscribeToConversations((convs) => {
        setConversations(convs);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load conversations'));
    }
  }, [user]);

  // Load a conversation and subscribe to its messages
  const loadConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Unsubscribe from previous conversation's messages
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
        messagesUnsubscribeRef.current = null;
      }

      setCurrentConversationId(id);

      // Subscribe to messages
      messagesUnsubscribeRef.current = subscribeToMessages(id, (msgs) => {
        setMessages(msgs);
        setIsLoading(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load conversation'));
      setIsLoading(false);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    // Unsubscribe from previous conversation's messages
    if (messagesUnsubscribeRef.current) {
      messagesUnsubscribeRef.current();
      messagesUnsubscribeRef.current = null;
    }

    setCurrentConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setError(null);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (isStreaming) return;

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setError(null);
    setIsStreaming(true);
    setStreamingContent('');

    let conversationId = currentConversationId;

    try {
      // Create a new conversation if needed
      if (!conversationId) {
        conversationId = await createConversation('New Conversation');
        setCurrentConversationId(conversationId);

        // Subscribe to messages for the new conversation
        messagesUnsubscribeRef.current = subscribeToMessages(conversationId, (msgs) => {
          setMessages(msgs);
        });
      }

      // Add user message to Firestore
      await addMessage(conversationId, 'user', trimmedMessage);

      // Build history from current messages
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Add the new user message to history
      history.push({ role: 'user', content: trimmedMessage });

      let fullContent = '';

      // Stream AI response
      await chatRepository.sendMessageStream(
        {
          message: trimmedMessage,
          conversationId,
          history,
        },
        {
          onMessage: (content) => {
            fullContent += content;
            setStreamingContent(fullContent);
          },
          onDone: async (fullResponse) => {
            // Save assistant response to Firestore
            await addMessage(conversationId!, 'assistant', fullResponse);

            // Update conversation title if it's the first message
            if (messages.length === 0) {
              const title = trimmedMessage.slice(0, 50) + (trimmedMessage.length > 50 ? '...' : '');
              await updateConversationTitle(conversationId!, title);
            }

            setStreamingContent('');
            setIsStreaming(false);
          },
          onError: (errorMessage) => {
            setError(new Error(errorMessage));
            setIsStreaming(false);
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      setIsStreaming(false);
    }
  }, [currentConversationId, isStreaming, messages]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await deleteConversationService(id);

      // If deleting current conversation, start new one
      if (currentConversationId === id) {
        startNewConversation();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete conversation'));
    }
  }, [currentConversationId, startNewConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }
    };
  }, []);

  return {
    conversations,
    messages,
    currentConversationId,
    streamingContent,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    loadConversation,
    startNewConversation,
    deleteConversation,
  };
}
