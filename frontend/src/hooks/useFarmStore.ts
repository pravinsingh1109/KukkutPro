import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useDemoStore } from '../lib/demoStore';

export interface FarmSummary {
  id: string;
  name: string;
  petiSize: number;
  openingEggStock: number;
  openingCash: string;
  isSetupComplete: boolean;
  isDemo: boolean;
  createdAt: string;
  productionCount: number;
  saleCount: number;
  customerCount: number;
}

const ACTIVE_FARM_KEY = 'kukkutpro_active_farm_id';

export function useFarmStore() {
  const queryClient = useQueryClient();
  const { isDemoMode, setDemoMode } = useDemoStore();

  const [activeFarmId, setActiveFarmIdState] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_FARM_KEY);
  });

  // Query all farms
  const {
    data: farms = [],
    isLoading: isFarmsLoading,
    refetch: refetchFarms,
  } = useQuery<FarmSummary[]>({
    queryKey: ['farms'],
    queryFn: async () => {
      const res = await api.get('/settings/farms');
      return res.data.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Active farm object
  const activeFarm = farms.find((f) => {
    if (isDemoMode) return f.isDemo;
    if (activeFarmId) return f.id === activeFarmId;
    return !f.isDemo;
  }) || farms[0];

  // Switch farm function
  const switchFarm = useCallback(
    async (farm: FarmSummary) => {
      if (farm.isDemo) {
        setDemoMode(true);
      } else {
        setDemoMode(false);
        setActiveFarmIdState(farm.id);
        localStorage.setItem(ACTIVE_FARM_KEY, farm.id);
      }

      // Invalidate all queries to re-fetch data for the new farm
      await queryClient.invalidateQueries();
    },
    [setDemoMode, queryClient]
  );

  // Create farm mutation
  const createFarmMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      petiSize?: number;
      openingEggStock?: number;
      openingCash?: string | number;
    }) => {
      const res = await api.post('/settings/farms', payload);
      return res.data.data;
    },
    onSuccess: async (newFarm) => {
      // Automatically switch to the newly created farm
      setDemoMode(false);
      setActiveFarmIdState(newFarm.id);
      localStorage.setItem(ACTIVE_FARM_KEY, newFarm.id);

      await queryClient.invalidateQueries();
    },
  });

  return {
    farms,
    activeFarm,
    activeFarmId,
    isFarmsLoading,
    refetchFarms,
    switchFarm,
    createFarm: createFarmMutation.mutateAsync,
    isCreatingFarm: createFarmMutation.isPending,
  };
}
