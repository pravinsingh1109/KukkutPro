import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Labourer, PaymentType, SalaryType } from '../types';

export function useLabour() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['labour'],
    queryFn: async (): Promise<Labourer[]> => {
      const res = await api.get<{ data: Labourer[] }>('/labour');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      phone?: string;
      role?: string;
      salaryType: SalaryType;
      salaryAmount: string | number;
      joiningDate: string;
    }) => {
      const res = await api.post<{ data: Labourer }>('/labour', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labour'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    labourers: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createLabourer: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useLabourerDetail(id: string) {
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ['labour', id],
    queryFn: async (): Promise<Labourer> => {
      const res = await api.get<{ data: Labourer }>(`/labour/${id}`);
      return res.data.data;
    },
    enabled: Boolean(id),
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: { date: string; amount: string | number; paymentType: PaymentType; notes?: string }) => {
      const res = await api.post(`/labour/${id}/payments`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labour'] });
      queryClient.invalidateQueries({ queryKey: ['labour', id] });
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    labourer: detailQuery.data,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
    recordPayment: paymentMutation.mutateAsync,
    isRecordingPayment: paymentMutation.isPending,
  };
}
