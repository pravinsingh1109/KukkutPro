import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface MarketPriceData {
  id: string;
  date: string;
  zone: string;
  pricePer100: number;
  pricePerEgg: number;
  pricePerTray: number;
  pricePerPeti: number;
  source: string;
  rawText?: string;
  updatedAt: string;
}

export function useMarketPrice(zone = 'Luknow (CC)') {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<{ data: MarketPriceData }>({
    queryKey: ['market-price', 'today', zone],
    queryFn: async () => {
      const res = await api.get(`/market-price/today?zone=${encodeURIComponent(zone)}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/market-price/sync');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-price'] });
    },
  });

  return {
    marketPrice: data?.data,
    isLoading,
    error,
    refetch,
    syncPrices: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
  };
}
