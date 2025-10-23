/**
 * React Query hooks for farms with caching and optimization
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import farmsService, { FarmAnalytics } from '../services/farmsService';
import { queryKeys, optimisticUpdates } from '../queryClient';
import type { Farm, FarmCreateData, FarmUpdateData, PaginatedResponse, FarmListParams } from '../basicTypes';

// Query hooks
export const useFarms = (params?: FarmListParams) => {
  return useQuery({
    queryKey: queryKeys.farms.list(params),
    queryFn: () => farmsService.getFarms(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
};

export const useInfiniteFarms = (params?: Omit<FarmListParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: queryKeys.farms.list({ ...params, infinite: true }),
    queryFn: ({ pageParam = 1 }) => farmsService.getFarms({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<Farm>) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next, window.location.origin);
        const page = url.searchParams.get('page');
        return page ? parseInt(page, 10) : undefined;
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useFarm = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.farms.detail(id),
    queryFn: () => farmsService.getFarm(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes for individual farms
  });
};

export const useUserFarms = (params?: FarmListParams) => {
  return useQuery({
    queryKey: queryKeys.farms.userFarms(params),
    queryFn: () => farmsService.getUserFarms(params),
    staleTime: 1 * 60 * 1000, // 1 minute for user's own farms
  });
};

export const useFarmAnalytics = (id: string, enabled = true) => {
  return useQuery<FarmAnalytics>({
    queryKey: queryKeys.farms.analytics(id),
    queryFn: () => farmsService.getFarmAnalytics(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for analytics
  });
};

// Mutation hooks
export const useCreateFarm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['create_farm'],
    mutationFn: (farmData: FarmCreateData) => farmsService.createFarm(farmData),
    onSuccess: (newFarm: Farm) => {
      // Invalidate farms lists
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.userFarms() });
      
      // Add to cache
      queryClient.setQueryData(queryKeys.farms.detail(newFarm.id), newFarm);
      
      // Optimistically update lists
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.farms.lists() });
      listQueries.forEach(([queryKey]) => {
        optimisticUpdates.updateList([...queryKey], newFarm, 'create');
      });
    },
  });
};

export const useUpdateFarm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['update_farm'],
    mutationFn: ({ id, data }: { id: string; data: FarmUpdateData }) => 
      farmsService.updateFarm(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.farms.detail(id) });
      
      // Snapshot previous value
      const previousFarm = queryClient.getQueryData(queryKeys.farms.detail(id));
      
      // Optimistically update detail
      optimisticUpdates.updateDetail([...queryKeys.farms.detail(id)], data);
      
      // Optimistically update lists
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.farms.lists() });
      listQueries.forEach(([queryKey]) => {
        optimisticUpdates.updateList([...queryKey], { id, ...data } as any, 'update');
      });
      
      return { previousFarm, id };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousFarm && context?.id) {
        queryClient.setQueryData(queryKeys.farms.detail(context.id), context.previousFarm);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.lists() });
    },
  });
};

export const useDeleteFarm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['delete_farm'],
    mutationFn: (id: string) => farmsService.deleteFarm(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.farms.detail(id) });
      
      // Snapshot previous value
      const previousFarm = queryClient.getQueryData(queryKeys.farms.detail(id));
      
      // Optimistically remove from lists
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.farms.lists() });
      listQueries.forEach(([queryKey]) => {
        optimisticUpdates.updateList([...queryKey], { id } as any, 'delete');
      });
      
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: queryKeys.farms.detail(id) });
      
      return { previousFarm, id };
    },
    onError: (_error, id, context) => {
      // Rollback on error
      if (context?.previousFarm) {
        queryClient.setQueryData(queryKeys.farms.detail(id), context.previousFarm);
      }
    },
    onSettled: () => {
      // Refetch lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.userFarms() });
    },
  });
};

// Prefetch utilities
export const useFarmsPrefetch = () => {
  const queryClient = useQueryClient();
  
  const prefetchFarm = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.farms.detail(id),
      queryFn: () => farmsService.getFarm(id),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const prefetchFarmAnalytics = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.farms.analytics(id),
      queryFn: () => farmsService.getFarmAnalytics(id),
      staleTime: 10 * 60 * 1000,
    });
  };
  
  const prefetchUserFarms = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.farms.userFarms(),
      queryFn: () => farmsService.getUserFarms(),
      staleTime: 1 * 60 * 1000,
    });
  };
  
  return {
    prefetchFarm,
    prefetchFarmAnalytics,
    prefetchUserFarms,
  };
};

// Utility hooks
export const useFarmSearch = (searchTerm: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.farms.list({ search: searchTerm }),
    queryFn: () => farmsService.getFarms({ search: searchTerm }),
    enabled: enabled && searchTerm.length > 2,
    staleTime: 30 * 1000, // 30 seconds for search results
  });
};

export const useFarmsByType = (farmType: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.farms.list({ farm_type: farmType }),
    queryFn: () => farmsService.getFarms({ farm_type: farmType }),
    enabled: enabled && !!farmType,
    staleTime: 5 * 60 * 1000,
  });
};