/**
 * Expenses Repository
 * Handles expense CRUD operations
 */

import { BaseRepository } from './BaseRepository';
import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  ExpenseWithCategory,
  PaginatedResponse,
  PaginationParams,
} from '@casha/shared';

class ExpensesRepositoryClass extends BaseRepository {
  /**
   * Get all expenses with optional filters
   */
  async getExpenses(
    filters?: ExpenseFilters & PaginationParams
  ): Promise<PaginatedResponse<ExpenseWithCategory>> {
    const query = this.buildQueryString((filters || {}) as Record<string, unknown>);
    return this.get<PaginatedResponse<ExpenseWithCategory>>(`/api/expenses${query}`);
  }

  /**
   * Get a single expense by ID
   */
  async getExpense(id: number): Promise<ExpenseWithCategory> {
    return this.get<ExpenseWithCategory>(`/api/expenses/${id}`);
  }

  /**
   * Create a new expense
   */
  async createExpense(data: CreateExpenseRequest): Promise<Expense> {
    return this.post<Expense>('/api/expenses', data);
  }

  /**
   * Update an existing expense
   */
  async updateExpense(id: number, data: UpdateExpenseRequest): Promise<Expense> {
    return this.put<Expense>(`/api/expenses/${id}`, data);
  }

  /**
   * Delete an expense
   */
  async deleteExpense(id: number): Promise<void> {
    return this.delete(`/api/expenses/${id}`);
  }

  /**
   * Get recent expenses (last N)
   */
  async getRecentExpenses(limit: number = 5): Promise<ExpenseWithCategory[]> {
    const response = await this.getExpenses({
      page: 1,
      pageSize: limit,
      sortBy: 'date',
      sortOrder: 'desc',
    });
    return response.data;
  }
}

// Export singleton instance
export const expensesRepository = new ExpensesRepositoryClass();
