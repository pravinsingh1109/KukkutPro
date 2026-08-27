import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Customer } from '../types';

export function useCustomers(options?: { hasDues?: boolean; search?: string }) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['customers', options],
    queryFn: async (): Promise<Customer[]> => {
      const res = await api.get<{ data: Customer[] }>('/customers', {
        params: options,
      });
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string; address?: string; notes?: string }) => {
      const res = await api.post<{ data: Customer }>('/customers', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    customers: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createCustomer: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useCustomerDetail(id: string) {
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ['customers', id],
    queryFn: async (): Promise<Customer> => {
      const res = await api.get<{ data: Customer }>(`/customers/${id}`);
      return res.data.data;
    },
    enabled: Boolean(id),
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: { date: string; amount: string | number; isAdvance?: boolean; notes?: string }) => {
      const res = await api.post(`/customers/${id}/payments`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    customer: detailQuery.data,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
    recordPayment: paymentMutation.mutateAsync,
    isRecordingPayment: paymentMutation.isPending,
  };
}
