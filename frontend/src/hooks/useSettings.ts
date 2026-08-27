import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { FarmSettings } from '../types';

export function useSettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<FarmSettings> => {
      const res = await api.get<{ data: FarmSettings }>('/settings');
      return res.data.data;
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: { name: string; openingEggStock: number; openingCash: string | number }) => {
      const res = await api.post('/settings/setup', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { name?: string; petiSize?: number }) => {
      const res = await api.patch('/settings', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return {
    ...settingsQuery,
    settings: settingsQuery.data,
    completeSetup: setupMutation.mutateAsync,
    isSettingUp: setupMutation.isPending,
    updateSettings: updateSettingsMutation.mutateAsync,
  };
}
