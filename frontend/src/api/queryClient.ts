/**
 * React Query client configuration for API caching and optimization
 */
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { defaultErrorHandler } from './errorHandler';
import { notificationService } from './notificationService';
import { setupCachePersistence, getCacheConfig } from './cachePersistence';

// Create query cache with error handling
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Handle query errors globally
    console.error('Query error:', error, 'Query key:', query.queryKey);
    
    // Don't show notifications for background refetches
    if (query.state.fetchStatus !== 'fetching' || query.state.dataUpdatedAt === 0) {
      // Only handle if it's an AxiosError
      if (error && typeof error === 'object' && 'isAxiosError' in error) {
        defaultErrorHandler.handleError(error as any);
      }
    }
  },
});

// Create mutation cache with error handling
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, _mutation) => {
    console.error('Mutation error:', error, 'Variables:', _variables);
    // Only handle if it's an AxiosError
    if (error && typeof error === 'object' && 'isAxiosError' in error) {
      defaultErrorHandler.handleError(error as any);
    }
  },
  onSuccess: (_data, _variables, _context, mutation) => {
    // Show success notifications for mutations
    const mutationKey = mutation.options.mutationKey?.[0];
    
    if (mutationKey && typeof mutationKey === 'string') {
      const action = mutationKey.split('_')[0]; // e.g., 'create', 'update', 'delete'
      const resource = mutationKey.split('_')[1]; // e.g., 'farm', 'product'
      
      if (action && resource) {
        const messages = {
          create: `${resource.charAt(0).toUpperCase() + resource.slice(1)} created successfully`,
          update: `${resource.charAt(0).toUpperCase() + resource.slice(1)} updated successfully`,
          delete: `${resource.charAt(0).toUpperCase() + resource.slice(1)} deleted successfully`,
        };
        
        const message = messages[action as keyof typeof messages];
        if (message) {
          notificationService.success('Success', message);
        }
      }
    }
  },
});

// Create and configure the query client with intelligent caching
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Default cache configuration (can be overridden per query)
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 30 * 60 * 1000, // 30 minutes default
      // Intelligent retry logic
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors) except for specific cases
        if (error?.status >= 400 && error?.status < 500) {
          // Retry on 408 (timeout) and 429 (rate limit)
          return error?.status === 408 || error?.status === 429;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch configuration
      refetchOnWindowFocus: (query) => {
        const config = getCacheConfig([...query.queryKey]);
        // Only refetch critical data on window focus
        return config === getCacheConfig(['auth']) || config === getCacheConfig(['farms.detail']);
      },
      refetchOnReconnect: true,
      refetchOnMount: true,
      // Network mode for offline support
      networkMode: 'online',
    },
    mutations: {
      // Retry failed mutations with intelligent logic
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except timeout and rate limit
        if (error?.status >= 400 && error?.status < 500) {
          return error?.status === 408 || error?.status === 429;
        }
        // Retry once for other errors
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'online',
    },
  },
});

// Setup cache persistence
setupCachePersistence(queryClient);

// Query key factories for consistent cache management
export const queryKeys = {
  // Authentication
  auth: {
    user: () => ['auth', 'user'] as const,
    profile: () => ['auth', 'profile'] as const,
  },
  
  // Users
  users: {
    all: () => ['users'] as const,
    list: (params?: any) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    profile: () => ['users', 'profile'] as const,
    preferences: () => ['users', 'preferences'] as const,
  },
  
  // Farms
  farms: {
    all: () => ['farms'] as const,
    lists: () => ['farms', 'list'] as const,
    list: (params?: any) => ['farms', 'list', params] as const,
    details: () => ['farms', 'detail'] as const,
    detail: (id: string) => ['farms', 'detail', id] as const,
    analytics: (id: string) => ['farms', 'analytics', id] as const,
    userFarms: (params?: any) => ['farms', 'user', params] as const,
  },
  
  // Marketplace
  marketplace: {
    all: () => ['marketplace'] as const,
    products: {
      all: () => ['marketplace', 'products'] as const,
      lists: () => ['marketplace', 'products', 'list'] as const,
      list: (params?: any) => ['marketplace', 'products', 'list', params] as const,
      details: () => ['marketplace', 'products', 'detail'] as const,
      detail: (id: string) => ['marketplace', 'products', 'detail', id] as const,
      userProducts: (params?: any) => ['marketplace', 'products', 'user', params] as const,
    },
    orders: {
      all: () => ['marketplace', 'orders'] as const,
      lists: () => ['marketplace', 'orders', 'list'] as const,
      list: (params?: any) => ['marketplace', 'orders', 'list', params] as const,
      details: () => ['marketplace', 'orders', 'detail'] as const,
      detail: (id: string) => ['marketplace', 'orders', 'detail', id] as const,
      userOrders: (params?: any) => ['marketplace', 'orders', 'user', params] as const,
    },
  },
  
  // AI Assistant
  ai: {
    all: () => ['ai'] as const,
    conversations: {
      all: () => ['ai', 'conversations'] as const,
      lists: () => ['ai', 'conversations', 'list'] as const,
      list: (params?: any) => ['ai', 'conversations', 'list', params] as const,
      details: () => ['ai', 'conversations', 'detail'] as const,
      detail: (id: string) => ['ai', 'conversations', 'detail', id] as const,
      messages: (conversationId: string) => ['ai', 'conversations', conversationId, 'messages'] as const,
    },
    recommendations: {
      all: () => ['ai', 'recommendations'] as const,
      active: () => ['ai', 'recommendations', 'active'] as const,
    },
  },
  
  // Crop Detection
  cropDetection: {
    all: () => ['crop-detection'] as const,
    diseases: {
      all: () => ['crop-detection', 'diseases'] as const,
      lists: () => ['crop-detection', 'diseases', 'list'] as const,
      list: (params?: any) => ['crop-detection', 'diseases', 'list', params] as const,
      details: () => ['crop-detection', 'diseases', 'detail'] as const,
      detail: (id: string) => ['crop-detection', 'diseases', 'detail', id] as const,
    },
    scans: {
      all: () => ['crop-detection', 'scans'] as const,
      lists: () => ['crop-detection', 'scans', 'list'] as const,
      list: (params?: any) => ['crop-detection', 'scans', 'list', params] as const,
      details: () => ['crop-detection', 'scans', 'detail'] as const,
      detail: (id: string) => ['crop-detection', 'scans', 'detail', id] as const,
    },
  },
  
  // IoT
  iot: {
    all: () => ['iot'] as const,
    devices: (params?: any) => ['iot', 'devices', params] as const,
    device: (id: string) => ['iot', 'device', id] as const,
    sensorData: (id: string, params?: any) => ['iot', 'sensor-data', id, params] as const,
  },
  
  // Notifications
  notifications: {
    all: () => ['notifications'] as const,
    list: (params?: any) => ['notifications', 'list', params] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
    preferences: () => ['notifications', 'preferences'] as const,
  },
  
  // Financial
  financial: {
    all: () => ['financial'] as const,
    records: (params?: any) => ['financial', 'records', params] as const,
    budgets: () => ['financial', 'budgets'] as const,
    reports: (type: string, params?: any) => ['financial', 'reports', type, params] as const,
  },
  
  // Learning
  learning: {
    all: () => ['learning'] as const,
    courses: (params?: any) => ['learning', 'courses', params] as const,
    enrollments: () => ['learning', 'enrollments'] as const,
    lessons: (courseId: string) => ['learning', 'lessons', courseId] as const,
    certificates: () => ['learning', 'certificates'] as const,
  },
  
  // Community
  community: {
    all: () => ['community'] as const,
    feed: (params?: any) => ['community', 'feed', params] as const,
    posts: (params?: any) => ['community', 'posts', params] as const,
    post: (id: string) => ['community', 'post', id] as const,
    messages: () => ['community', 'messages'] as const,
  },
  
  // Scheduling
  scheduling: {
    all: () => ['scheduling'] as const,
    tasks: (params?: any) => ['scheduling', 'tasks', params] as const,
    calendar: (params?: any) => ['scheduling', 'calendar', params] as const,
    suggestions: () => ['scheduling', 'suggestions'] as const,
  },
  
  // Analytics
  analytics: {
    all: () => ['analytics'] as const,
    dashboard: () => ['analytics', 'dashboard'] as const,
    farmPerformance: (params?: any) => ['analytics', 'farm-performance', params] as const,
    yieldPredictions: (params?: any) => ['analytics', 'yield-predictions', params] as const,
    weather: (params?: any) => ['analytics', 'weather', params] as const,
  },
  
  // Payment
  payment: {
    all: () => ['payment'] as const,
    transactions: (params?: any) => ['payment', 'transactions', params] as const,
    methods: () => ['payment', 'methods'] as const,
    balance: () => ['payment', 'balance'] as const,
  },
  
  // Blockchain
  blockchain: {
    all: () => ['blockchain'] as const,
    certificates: (params?: any) => ['blockchain', 'certificates', params] as const,
    supplyChain: (productId: string) => ['blockchain', 'supply-chain', productId] as const,
    transactions: (params?: any) => ['blockchain', 'transactions', params] as const,
  },
  
  // Export Docs
  exportDocs: {
    all: () => ['export-docs'] as const,
    documents: (params?: any) => ['export-docs', 'documents', params] as const,
    templates: () => ['export-docs', 'templates'] as const,
  },
  
  // Emergency
  emergency: {
    all: () => ['emergency'] as const,
    alerts: (params?: any) => ['emergency', 'alerts', params] as const,
    incidents: (params?: any) => ['emergency', 'incidents', params] as const,
    resources: (params?: any) => ['emergency', 'resources', params] as const,
  },
  
  // Admin
  admin: {
    all: () => ['admin'] as const,
    users: (params?: any) => ['admin', 'users', params] as const,
    systemHealth: () => ['admin', 'system', 'health'] as const,
    systemMetrics: (params?: any) => ['admin', 'system', 'metrics', params] as const,
    auditTrail: (params?: any) => ['admin', 'audit-trail', params] as const,
  },
};

// Cache invalidation utilities
export const cacheUtils = {
  // Invalidate all queries for a specific resource
  invalidateAuth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() }),
  invalidateUsers: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
  invalidateFarms: () => queryClient.invalidateQueries({ queryKey: queryKeys.farms.all() }),
  invalidateMarketplace: () => queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all() }),
  invalidateAI: () => queryClient.invalidateQueries({ queryKey: queryKeys.ai.all() }),
  invalidateCropDetection: () => queryClient.invalidateQueries({ queryKey: queryKeys.cropDetection.all() }),
  invalidateIoT: () => queryClient.invalidateQueries({ queryKey: queryKeys.iot.all() }),
  invalidateNotifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
  invalidateFinancial: () => queryClient.invalidateQueries({ queryKey: queryKeys.financial.all() }),
  invalidateLearning: () => queryClient.invalidateQueries({ queryKey: queryKeys.learning.all() }),
  invalidateCommunity: () => queryClient.invalidateQueries({ queryKey: queryKeys.community.all() }),
  invalidateScheduling: () => queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.all() }),
  invalidateAnalytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all() }),
  invalidatePayment: () => queryClient.invalidateQueries({ queryKey: queryKeys.payment.all() }),
  invalidateBlockchain: () => queryClient.invalidateQueries({ queryKey: queryKeys.blockchain.all() }),
  invalidateExportDocs: () => queryClient.invalidateQueries({ queryKey: queryKeys.exportDocs.all() }),
  invalidateEmergency: () => queryClient.invalidateQueries({ queryKey: queryKeys.emergency.all() }),
  invalidateAdmin: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all() }),
  
  // Invalidate specific query
  invalidateQuery: (queryKey: any[]) => {
    return queryClient.invalidateQueries({ queryKey });
  },
  
  // Remove specific query from cache
  removeQuery: (queryKey: any[]) => {
    return queryClient.removeQueries({ queryKey });
  },
  
  // Update query data optimistically
  updateQueryData: <T>(queryKey: any[], updater: (oldData: T | undefined) => T) => {
    return queryClient.setQueryData(queryKey, updater);
  },
  
  // Prefetch query
  prefetchQuery: (queryKey: any[], queryFn: () => Promise<any>) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  },
  
  // Clear all cache
  clearCache: () => {
    return queryClient.clear();
  },
  
  // Get cached data
  getCachedData: <T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData(queryKey);
  },
};

// Optimistic update utilities
export const optimisticUpdates = {
  // Generic optimistic update for list operations
  updateList: <T extends { id: string }>(
    listQueryKey: any[],
    item: T,
    operation: 'create' | 'update' | 'delete'
  ) => {
    queryClient.setQueryData(listQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      
      const results = oldData.results || oldData;
      
      switch (operation) {
        case 'create':
          return {
            ...oldData,
            results: [item, ...results],
            count: (oldData.count || results.length) + 1,
          };
        case 'update':
          return {
            ...oldData,
            results: results.map((existing: T) =>
              existing.id === item.id ? { ...existing, ...item } : existing
            ),
          };
        case 'delete':
          return {
            ...oldData,
            results: results.filter((existing: T) => existing.id !== item.id),
            count: Math.max(0, (oldData.count || results.length) - 1),
          };
        default:
          return oldData;
      }
    });
  },
  
  // Update detail query
  updateDetail: <T>(detailQueryKey: any[], item: Partial<T>) => {
    queryClient.setQueryData(detailQueryKey, (oldData: T) => {
      if (!oldData) return oldData;
      return { ...oldData, ...item };
    });
  },
};

// Background sync utilities for offline support
export const backgroundSync = {
  // Queue mutations for when back online
  queueMutation: (mutationKey: string, variables: any) => {
    const queueKey = 'mutation_queue';
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
    queue.push({ mutationKey, variables, timestamp: Date.now() });
    localStorage.setItem(queueKey, JSON.stringify(queue));
  },
  
  // Process queued mutations
  processQueue: async () => {
    const queueKey = 'mutation_queue';
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
    
    if (queue.length === 0) return;
    
    console.log(`Processing ${queue.length} queued mutations`);
    
    for (const { mutationKey, variables } of queue) {
      try {
        // Process mutation based on key
        // This would need to be implemented based on specific mutation types
        console.log('Processing queued mutation:', mutationKey, variables);
      } catch (error) {
        console.error('Failed to process queued mutation:', error);
      }
    }
    
    // Clear queue after processing
    localStorage.removeItem(queueKey);
  },
  
  // Check if online and process queue
  handleOnline: () => {
    if (navigator.onLine) {
      backgroundSync.processQueue();
    }
  },
};

// Prefetch utilities for better UX
export const prefetchUtils = {
  // Prefetch farm details when hovering over farm list item
  prefetchFarm: (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.farms.detail(id),
      queryFn: () => import('./services/farmsService').then(m => m.default.getFarm(id)),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
  
  // Prefetch product details
  prefetchProduct: (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.marketplace.products.detail(id),
      queryFn: () => import('./services/marketplaceService').then(m => m.default.getProduct(id)),
      staleTime: 5 * 60 * 1000,
    });
  },
  
  // Prefetch conversation messages
  prefetchConversationMessages: (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ai.conversations.messages(id),
      queryFn: () => import('./services/aiService').then(m => m.default.getConversationMessages(id)),
      staleTime: 2 * 60 * 1000, // 2 minutes for messages
    });
  },

  // Prefetch user's farms when they log in
  prefetchUserFarms: () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.farms.userFarms(),
      queryFn: () => import('./services/farmsService').then(m => m.default.getUserFarms()),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },

  // Prefetch user's products
  prefetchUserProducts: () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.marketplace.products.userProducts(),
      queryFn: () => import('./services/marketplaceService').then(m => m.default.getUserProducts()),
      staleTime: 10 * 60 * 1000,
    });
  },

  // Prefetch recent conversations
  prefetchRecentConversations: () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ai.conversations.list({ page: 1, page_size: 10 }),
      queryFn: () => import('./services/aiService').then(m => m.default.getConversations({ page: 1, page_size: 10 })),
      staleTime: 5 * 60 * 1000,
    });
  },
};

// Set up online/offline event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', backgroundSync.handleOnline);
  
  // Process queue on app start if online
  if (navigator.onLine) {
    setTimeout(backgroundSync.processQueue, 1000);
  }

  // Initialize real-time sync
  // Temporarily disable WebSocket connection until authentication is working
  // import('./realTimeSync').then(({ realTimeSync }) => {
  //   // Real-time sync is automatically initialized
  //   console.log('Real-time sync initialized');
  // });
}

export default queryClient;