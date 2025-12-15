/**
 * Insights Routes (Firebase Version)
 * AI-powered recommendations only - other insights computed client-side
 */

import { Router } from 'express';
import { firebaseAuthMiddleware, type FirebaseAuthRequest } from '../middleware/firebase-auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { aiRateLimit } from '../middleware/rateLimit.middleware';
import { aiAdviceSchema } from '../validation/schemas';
import { aiService } from '../services/ai.service';

const router = Router();

// All routes require Firebase authentication
router.use(firebaseAuthMiddleware);

// POST /api/insights/ai-advice - AI-powered recommendations
// Client sends spending data, server generates AI insights
router.post(
  '/ai-advice',
  aiRateLimit,
  validateBody(aiAdviceSchema),
  async (req: FirebaseAuthRequest, res, next) => {
    try {
      const {
        period,
        includeCategories,
        includeTrends,
        spendingData,
      } = req.body as {
        period: 'week' | 'month';
        includeCategories: boolean;
        includeTrends: boolean;
        spendingData?: {
          totalSpent: number;
          totalBudget: number;
          categorySpending: Array<{ name: string; amount: number; percentage: number }>;
          trend: 'up' | 'down' | 'stable';
          changePercentage: number;
        };
      };

      // Use provided spending data or defaults
      const data = spendingData || {
        totalSpent: 0,
        totalBudget: 0,
        categorySpending: [],
        trend: 'stable' as const,
        changePercentage: 0,
      };

      // Generate insights using AI service
      const insights = await aiService.generateInsights(
        data,
        { period, includeCategories, includeTrends }
      );

      res.json({
        insights,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
