import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Expense } from '../types';

export function useExpenses(options?: { from?: string; to?: string; category?: string }) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['expenses', options],
    queryFn: async (): Promise<Expense[]> => {
      const res = await api.get<{ data: Expense[] }>('/expenses', {
        params: options,
      });
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      date: string;
      category: string;
      description: string;
      quantity?: number;
      unitCost?: string | number;
      totalAmount: string | number;
      notes?: string;
    }) => {
      const res = await api.post<{ data: Expense }>('/expenses', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    expenses: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createExpense: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
