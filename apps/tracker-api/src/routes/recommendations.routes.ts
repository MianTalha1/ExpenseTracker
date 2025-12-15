/**
 * Recommendations Routes
 * Daily AI-powered personalized recommendations
 */

import { Router } from 'express';
import { firebaseAuthMiddleware, type FirebaseAuthRequest } from '../middleware/firebase-auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { aiRateLimit } from '../middleware/rateLimit.middleware';
import { z } from 'zod';
import { recommendationsService } from '../services/recommendations.service';

const router = Router();

// All routes require Firebase authentication
router.use(firebaseAuthMiddleware);

// Validation schema for spending context
const spendingContextSchema = z.object({
  totalSpent: z.number(),
  totalBudget: z.number(),
  remaining: z.number(),
  topCategories: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })
  ),
  recentExpenses: z.array(
    z.object({
      description: z.string(),
      amount: z.number(),
      category: z.string(),
      date: z.string(),
    })
  ),
  spendingTrend: z.enum(['up', 'down', 'stable']),
  changePercentage: z.number(),
});

// POST /api/recommendations/daily - Generate daily recommendations
router.post(
  '/daily',
  aiRateLimit,
  validateBody(spendingContextSchema),
  async (req: FirebaseAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const context = req.body;

      const recommendations = await recommendationsService.generateDailyRecommendations(
        userId,
        context
      );

      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
