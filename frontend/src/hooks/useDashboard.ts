import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { DashboardResponse } from '../types';

export function useDashboard(date?: string) {
  return useQuery({
    queryKey: ['dashboard', date],
    queryFn: async (): Promise<DashboardResponse> => {
      const res = await api.get<{ data: DashboardResponse }>('/dashboard/today', {
        params: { date },
      });
      return res.data.data;
    },
    refetchInterval: 30000, // Background refresh every 30 seconds
  });
}
