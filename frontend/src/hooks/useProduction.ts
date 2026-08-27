import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EggProduction } from '../types';

export function useProduction(from?: string, to?: string) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['production', { from, to }],
    queryFn: async (): Promise<EggProduction[]> => {
      const res = await api.get<{ data: EggProduction[] }>('/production', {
        params: { from, to },
      });
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { date: string; eggsProduced: number; brokenEggs?: number; notes?: string }) => {
      const res = await api.post<{ data: EggProduction }>('/production', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { eggsProduced?: number; brokenEggs?: number; notes?: string } }) => {
      const res = await api.patch<{ data: EggProduction }>(`/production/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    productions: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createProduction: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProduction: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

export function useProductionDate(date: string) {
  return useQuery({
    queryKey: ['production', date],
    queryFn: async (): Promise<EggProduction | null> => {
      try {
        const res = await api.get<{ data: EggProduction }>(`/production/${date}`);
        return res.data.data;
      } catch (err: any) {
        if (err?.code === 'NOT_FOUND') return null;
        throw err;
      }
    },
    enabled: Boolean(date),
  });
}

export function useProductionEntry(idOrDate?: string) {
  return useQuery({
    queryKey: ['production', idOrDate],
    queryFn: async (): Promise<EggProduction | null> => {
      if (!idOrDate) return null;
      try {
        const res = await api.get<{ data: EggProduction }>(`/production/${idOrDate}`);
        return res.data.data;
      } catch (err: any) {
        if (err?.code === 'NOT_FOUND') return null;
        throw err;
      }
    },
    enabled: Boolean(idOrDate),
  });
}
