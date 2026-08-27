import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EggInventoryStock } from '../types';

export function useInventoryStock(date?: string) {
  return useQuery({
    queryKey: ['inventory', 'stock', date],
    queryFn: async (): Promise<EggInventoryStock> => {
      const res = await api.get<{ data: EggInventoryStock }>('/inventory/stock', {
        params: { date },
      });
      return res.data.data;
    },
  });
}

export function useInventoryHistory(from?: string, to?: string) {
  return useQuery({
    queryKey: ['inventory', 'history', { from, to }],
    queryFn: async (): Promise<EggInventoryStock[]> => {
      const res = await api.get<{ data: EggInventoryStock[] }>('/inventory/history', {
        params: { from, to },
      });
      return res.data.data;
    },
  });
}
