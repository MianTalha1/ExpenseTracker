/**
 * Chat Routes (Firebase Version)
 * SSE streaming chat - conversation history managed by client via Firestore
 */

import { Router } from 'express';
import { firebaseAuthMiddleware, type FirebaseAuthRequest } from '../middleware/firebase-auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { sendMessageSchema } from '../validation/schemas';
import { chatService, type ChatMessage } from '../services/chat.service';

const router = Router();

// All routes require Firebase authentication
router.use(firebaseAuthMiddleware);

// POST /api/chat/stream - Send message and stream response
// Client sends conversation history, server streams AI response
router.post(
  '/stream',
  validateBody(sendMessageSchema),
  async (req: FirebaseAuthRequest, res) => {
    try {
      const { message, history } = req.body as {
        message: string;
        conversationId?: string;
        history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      };

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Build messages for AI
      const messagesForAI: ChatMessage[] = [
        ...(history || []).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content: message },
      ];

      // Stream AI response
      let fullResponse = '';

      try {
        for await (const chunk of chatService.streamChatCompletion(messagesForAI)) {
          fullResponse += chunk;
          res.write(`event: message\ndata: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      } catch (aiError) {
        console.error('AI streaming error:', aiError);
        fullResponse = "I'm sorry, I encountered an error processing your request. Please try again.";
        res.write(`event: message\ndata: ${JSON.stringify({ content: fullResponse })}\n\n`);
      }

      // Send done event with full response (client saves to Firestore)
      res.write(`event: done\ndata: ${JSON.stringify({ fullResponse })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Chat stream error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'An error occurred' })}\n\n`);
      res.end();
    }
  }
);

export default router;
