import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CashBookResponse, CashEntryType } from '../types';

export function useCashbook(from?: string, to?: string) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['cashbook', { from, to }],
    queryFn: async (): Promise<CashBookResponse> => {
      const res = await api.get<{ data: CashBookResponse }>('/cashbook', {
        params: { from, to },
      });
      return res.data.data;
    },
  });

  const manualEntryMutation = useMutation({
    mutationFn: async (data: { date: string; type: CashEntryType; amount: string | number; notes: string }) => {
      const res = await api.post('/cashbook/manual', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    cashbook: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    addManualEntry: manualEntryMutation.mutateAsync,
    isAddingManual: manualEntryMutation.isPending,
  };
}

export function useCashBalance(date?: string) {
  return useQuery({
    queryKey: ['cashbook', 'balance', date],
    queryFn: async (): Promise<string> => {
      const res = await api.get<{ data: { closingBalance: string } }>('/cashbook/balance', {
        params: { date },
      });
      return res.data.data.closingBalance;
    },
  });
}
