/**
 * Categories Repository
 * Handles expense category operations
 */

import { BaseRepository } from './BaseRepository';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@casha/shared';

class CategoriesRepositoryClass extends BaseRepository {
  /**
   * Get all categories for current user
   */
  async getCategories(): Promise<Category[]> {
    return this.get<Category[]>('/api/categories');
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: number): Promise<Category> {
    return this.get<Category>(`/api/categories/${id}`);
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    return this.post<Category>('/api/categories', data);
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<Category> {
    return this.put<Category>(`/api/categories/${id}`, data);
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: number): Promise<void> {
    return this.delete(`/api/categories/${id}`);
  }
}

// Export singleton instance
export const categoriesRepository = new CategoriesRepositoryClass();
