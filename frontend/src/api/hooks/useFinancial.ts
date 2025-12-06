/**
 * React Query hooks for all remaining services
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import financialService from '../services/financial.service';
import learningService from '../services/learning.service';
import communityService from '../services/community.service';
import schedulingService from '../services/scheduling.service';
import analyticsService from '../services/analytics.service';
import paymentService from '../services/payment.service';
import blockchainService from '../services/blockchain.service';
import exportDocsService from '../services/exportDocs.service';
import emergencyService from '../services/emergency.service';
import adminService from '../services/admin.service';

// Financial hooks
export const useRecords = (params?: any) => {
  return useQuery({
    queryKey: ['financial', 'records', params],
    queryFn: () => financialService.getRecords(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useBudgets = () => {
  return useQuery({
    queryKey: ['financial', 'budgets'],
    queryFn: financialService.getBudgets,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financialService.createRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
  });
};

export const useProfitLossReport = (params?: any) => {
  return useQuery({
    queryKey: ['financial', 'reports', 'profit-loss', params],
    queryFn: () => financialService.getProfitLossReport(params),
    staleTime: 10 * 60 * 1000,
  });
};

export const useCashFlowReport = (params?: any) => {
  return useQuery({
    queryKey: ['financial', 'reports', 'cash-flow', params],
    queryFn: () => financialService.getCashFlowReport(params),
    staleTime: 10 * 60 * 1000,
  });
};

export const useExpenseBreakdown = (params?: any) => {
  return useQuery({
    queryKey: ['financial', 'reports', 'expense-breakdown', params],
    queryFn: () => financialService.getExpenseBreakdown(params),
    staleTime: 10 * 60 * 1000,
  });
};

// Learning hooks
export const useCourses = (params?: any) => {
  return useQuery({
    queryKey: ['learning', 'courses', params],
    queryFn: () => learningService.getCourses(params),
    staleTime: 10 * 60 * 1000,
  });
};

export const useEnrollments = () => {
  return useQuery({
    queryKey: ['learning', 'enrollments'],
    queryFn: learningService.getEnrollments,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLessons = (courseId: string) => {
  return useQuery({
    queryKey: ['learning', 'lessons', courseId],
    queryFn: () => learningService.getLessons(courseId),
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000,
  });
};

export const useEnrollInCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => learningService.enrollInCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning', 'enrollments'] });
    },
  });
};

// Community hooks
export const usePosts = (params?: any) => {
  return useQuery({
    queryKey: ['community', 'posts', params],
    queryFn: () => communityService.getPosts(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useFeed = (params?: any) => {
  return useQuery({
    queryKey: ['community', 'feed', params],
    queryFn: () => communityService.getFeed(params),
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: communityService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] });
    },
  });
};

// Scheduling hooks
export const useTasks = (params?: any) => {
  return useQuery({
    queryKey: ['scheduling', 'tasks', params],
    queryFn: () => schedulingService.getTasks(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schedulingService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling', 'tasks'] });
    },
  });
};

export const useCalendar = (params?: any) => {
  return useQuery({
    queryKey: ['scheduling', 'calendar', params],
    queryFn: () => schedulingService.getCalendar(params),
    staleTime: 5 * 60 * 1000,
  });
};

// Analytics hooks
export const useDashboard = () => {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analyticsService.getDashboard,
    staleTime: 2 * 60 * 1000,
  });
};

export const useFarmPerformance = (params?: any) => {
  return useQuery({
    queryKey: ['analytics', 'farm-performance', params],
    queryFn: () => analyticsService.getFarmPerformance(params),
    staleTime: 10 * 60 * 1000,
  });
};

// Payment hooks
export const useTransactions = (params?: any) => {
  return useQuery({
    queryKey: ['payment', 'transactions', params],
    queryFn: () => paymentService.getTransactions(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment', 'methods'],
    queryFn: paymentService.getPaymentMethods,
    staleTime: 10 * 60 * 1000,
  });
};

export const useInitializePayment = () => {
  return useMutation({
    mutationFn: paymentService.initializePayment,
  });
};

// Blockchain hooks
export const useCertificates = (params?: any) => {
  return useQuery({
    queryKey: ['blockchain', 'certificates', params],
    queryFn: () => blockchainService.getCertificates(params),
    staleTime: 10 * 60 * 1000,
  });
};

export const useSupplyChain = (productId: string) => {
  return useQuery({
    queryKey: ['blockchain', 'supply-chain', productId],
    queryFn: () => blockchainService.getSupplyChain(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useIssueCertificate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blockchainService.issueCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockchain', 'certificates'] });
    },
  });
};

// Export Docs hooks
export const useDocuments = (params?: any) => {
  return useQuery({
    queryKey: ['export-docs', 'documents', params],
    queryFn: () => exportDocsService.getDocuments(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenerateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exportDocsService.generateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-docs', 'documents'] });
    },
  });
};

// Emergency hooks
export const useAlerts = (params?: any) => {
  return useQuery({
    queryKey: ['emergency', 'alerts', params],
    queryFn: () => emergencyService.getAlerts(params),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};

export const useIncidents = (params?: any) => {
  return useQuery({
    queryKey: ['emergency', 'incidents', params],
    queryFn: () => emergencyService.getIncidents(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emergencyService.createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency', 'alerts'] });
    },
  });
};

// Admin hooks
export const useAdminUsers = (params?: any) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getUsers(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: adminService.getSystemHealth,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};

export const useSystemMetrics = (params?: any) => {
  return useQuery({
    queryKey: ['admin', 'system', 'metrics', params],
    queryFn: () => adminService.getSystemMetrics(params),
    staleTime: 5 * 60 * 1000,
  });
};
