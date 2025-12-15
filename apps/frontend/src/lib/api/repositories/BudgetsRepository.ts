/**
 * Budgets Repository
 * Handles budget operations with progress tracking
 */

import { BaseRepository } from './BaseRepository';
import type {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetWithProgress,
} from '@casha/shared';

class BudgetsRepositoryClass extends BaseRepository {
  /**
   * Get all budgets with progress
   */
  async getBudgets(): Promise<BudgetWithProgress[]> {
    return this.get<BudgetWithProgress[]>('/api/budgets');
  }

  /**
   * Get a single budget by ID
   */
  async getBudget(id: number): Promise<BudgetWithProgress> {
    return this.get<BudgetWithProgress>(`/api/budgets/${id}`);
  }

  /**
   * Create a new budget
   */
  async createBudget(data: CreateBudgetRequest): Promise<Budget> {
    return this.post<Budget>('/api/budgets', data);
  }

  /**
   * Update an existing budget
   */
  async updateBudget(id: number, data: UpdateBudgetRequest): Promise<Budget> {
    return this.put<Budget>(`/api/budgets/${id}`, data);
  }

  /**
   * Delete a budget
   */
  async deleteBudget(id: number): Promise<void> {
    return this.delete(`/api/budgets/${id}`);
  }

  /**
   * Get overall budget (categoryId = null)
   */
  async getOverallBudget(): Promise<BudgetWithProgress | null> {
    const budgets = await this.getBudgets();
    return budgets.find((b) => b.categoryId === null) || null;
  }
}

// Export singleton instance
export const budgetsRepository = new BudgetsRepositoryClass();
