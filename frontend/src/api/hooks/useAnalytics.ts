/**
 * React Query hooks for Analytics API
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import analyticsService, {
  ReportParams,
} from '../services/analytics.service';

// Query keys for cache management
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
  farmPerformance: (params?: any) => [...analyticsKeys.all, 'farm-performance', params] as const,
  yieldPredictions: (params?: any) => [...analyticsKeys.all, 'yield-predictions', params] as const,
  weatherForecast: (params?: any) => [...analyticsKeys.all, 'weather-forecast', params] as const,
  reports: () => [...analyticsKeys.all, 'reports'] as const,
  report: (id: string) => [...analyticsKeys.reports(), id] as const,
  marketplace: (params?: any) => [...analyticsKeys.all, 'marketplace', params] as const,
  iot: (params?: any) => [...analyticsKeys.all, 'iot', params] as const,
  financial: (params?: any) => [...analyticsKeys.all, 'financial', params] as const,
  userActivity: (params?: any) => [...analyticsKeys.all, 'user-activity', params] as const,
};

/**
 * Hook to fetch dashboard metrics
 */
export function useDashboard() {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: () => analyticsService.getDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to fetch farm performance analytics
 */
export function useFarmPerformance(params?: {
  farm_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: analyticsKeys.farmPerformance(params),
    queryFn: () => analyticsService.getFarmPerformance(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params?.farm_id,
  });
}

/**
 * Hook to fetch yield predictions
 */
export function useYieldPredictions(params?: {
  farm_id?: string;
  crop?: string;
}) {
  return useQuery({
    queryKey: analyticsKeys.yieldPredictions(params),
    queryFn: () => analyticsService.getYieldPredictions(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch weather forecast
 */
export function useWeatherForecast(params?: {
  farm_id?: string;
  latitude?: number;
  longitude?: number;
}) {
  return useQuery({
    queryKey: analyticsKeys.weatherForecast(params),
    queryFn: () => analyticsService.getWeatherForecast(params),
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });
}

/**
 * Hook to generate custom report
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ReportParams) => analyticsService.generateCustomReport(params),
    onSuccess: () => {
      // Invalidate reports list
      queryClient.invalidateQueries({ queryKey: analyticsKeys.reports() });
    },
  });
}

/**
 * Hook to fetch saved reports
 */
export function useReports() {
  return useQuery({
    queryKey: analyticsKeys.reports(),
    queryFn: () => analyticsService.getReports(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a specific report
 */
export function useReport(reportId: string) {
  return useQuery({
    queryKey: analyticsKeys.report(reportId),
    queryFn: () => analyticsService.getReport(reportId),
    enabled: !!reportId,
  });
}

/**
 * Hook to delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => analyticsService.deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.reports() });
    },
  });
}

/**
 * Hook to fetch marketplace analytics
 */
export function useMarketplaceAnalytics(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: analyticsKeys.marketplace(params),
    queryFn: () => analyticsService.getMarketplaceAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch IoT analytics
 */
export function useIoTAnalytics(params?: {
  farm_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: analyticsKeys.iot(params),
    queryFn: () => analyticsService.getIoTAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch financial analytics
 */
export function useFinancialAnalytics(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: analyticsKeys.financial(params),
    queryFn: () => analyticsService.getFinancialAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user activity analytics
 */
export function useUserActivity(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: analyticsKeys.userActivity(params),
    queryFn: () => analyticsService.getUserActivity(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
