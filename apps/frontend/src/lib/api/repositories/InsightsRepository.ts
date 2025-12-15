/**
 * Insights Repository (Firebase Version)
 * Only AI advice endpoint - other insights computed client-side
 */

import { getApiUrl, ApiError } from '../client';
import { auth } from '@/lib/firebase/config';
import type { AIAdviceResponse } from '@casha/shared';

interface AIAdviceRequestWithData {
  period: 'week' | 'month';
  includeCategories?: boolean;
  includeTrends?: boolean;
  spendingData?: {
    totalSpent: number;
    totalBudget: number;
    categorySpending: Array<{ name: string; amount: number; percentage: number }>;
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
  };
}

class InsightsRepositoryClass {
  /**
   * Get AI-powered advice and recommendations
   */
  async getAIAdvice(request: AIAdviceRequestWithData): Promise<AIAdviceResponse> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
      throw new ApiError('Not authenticated', 401);
    }

    const response = await fetch(`${getApiUrl()}/api/insights/ai-advice`, {
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
      throw new ApiError('Failed to get AI advice', response.status);
    }

    return response.json();
  }
}

// Export singleton instance
export const insightsRepository = new InsightsRepositoryClass();
