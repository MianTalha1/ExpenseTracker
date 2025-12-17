/**
 * useIncome Hook
 * Real-time income sources management with Firestore listeners
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  subscribeToIncomeSources,
  createIncomeSource as createIncomeSourceService,
  updateIncomeSource as updateIncomeSourceService,
  deleteIncomeSource as deleteIncomeSourceService,
  getMonthlyAmount,
} from '@/lib/firebase/services';
import { useAuth } from '@/lib/context/AuthContext';
import type {
  IncomeSource,
  CreateIncomeSourceRequest,
  UpdateIncomeSourceRequest,
} from '@casha/shared';

interface UseIncomeReturn {
  incomeSources: IncomeSource[];
  totalMonthlyIncome: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createIncomeSource: (data: CreateIncomeSourceRequest) => Promise<void>;
  updateIncomeSource: (id: string, data: UpdateIncomeSourceRequest) => Promise<void>;
  deleteIncomeSource: (id: string) => Promise<void>;
}

export function useIncome(): UseIncomeReturn {
  const { user } = useAuth();
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) {
      setIncomeSources([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToIncomeSources((data) => {
        setIncomeSources(data);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch income sources'));
      setIsLoading(false);
    }
  }, [user, refreshKey]);

  // Calculate total monthly income
  const totalMonthlyIncome = useMemo(() => {
    return incomeSources.reduce((total, source) => total + getMonthlyAmount(source), 0);
  }, [incomeSources]);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const createIncomeSource = useCallback(async (data: CreateIncomeSourceRequest) => {
    await createIncomeSourceService(data);
    // Real-time listener handles the update
  }, []);

  const updateIncomeSource = useCallback(
    async (id: string, data: UpdateIncomeSourceRequest) => {
      await updateIncomeSourceService(id, data);
      // Real-time listener handles the update
    },
    []
  );

  const deleteIncomeSource = useCallback(async (id: string) => {
    await deleteIncomeSourceService(id);
    // Real-time listener handles the update
  }, []);

  return {
    incomeSources,
    totalMonthlyIncome,
    isLoading,
    error,
    refetch,
    createIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
  };
}
