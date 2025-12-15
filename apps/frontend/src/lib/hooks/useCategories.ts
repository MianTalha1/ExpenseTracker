/**
 * useCategories Hook
 * Real-time category management with Firestore listeners
 */

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToCategories,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
} from '@/lib/firebase/services';
import { useAuth } from '@/lib/context/AuthContext';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@casha/shared';

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createCategory: (data: CreateCategoryRequest) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToCategories((data) => {
        setCategories(data);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
      setIsLoading(false);
    }
  }, [user, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const createCategory = useCallback(async (data: CreateCategoryRequest) => {
    await createCategoryService(data);
    // Real-time listener handles the update
  }, []);

  const updateCategory = useCallback(
    async (id: string, data: UpdateCategoryRequest) => {
      await updateCategoryService(id, data);
      // Real-time listener handles the update
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    await deleteCategoryService(id);
    // Real-time listener handles the update
  }, []);

  return {
    categories,
    isLoading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
