import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Sale, SaleStatus } from '../types';

export function useSales(options?: { customerId?: string; from?: string; to?: string; status?: SaleStatus }) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['sales', options],
    queryFn: async (): Promise<Sale[]> => {
      const res = await api.get<{ data: Sale[] }>('/sales', {
        params: options,
      });
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      date: string;
      customerId: string;
      eggsQty: number;
      pricePerEgg: string | number;
      amountReceived?: string | number;
      notes?: string;
    }) => {
      const res = await api.post<{ data: Sale }>('/sales', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const voidMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post<{ data: Sale }>(`/sales/${id}/void`, { reason });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    sales: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createSale: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    voidSale: voidMutation.mutateAsync,
    isVoiding: voidMutation.isPending,
  };
}

export function useSaleDetail(id: string) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: async (): Promise<Sale> => {
      const res = await api.get<{ data: Sale }>(`/sales/${id}`);
      return res.data.data;
    },
    enabled: Boolean(id),
  });
}
