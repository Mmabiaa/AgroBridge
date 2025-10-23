/**
 * Cache persistence utilities for offline support and performance
 */
import { QueryClient } from '@tanstack/react-query';
// Note: Persistence packages need to be installed separately
// import { persistQueryClient } from '@tanstack/react-query-persist-client';
// import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Storage keys
const CACHE_KEY = 'agrobridge-query-cache';
const CACHE_VERSION = 'v1';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Create storage persister (requires @tanstack/query-sync-storage-persister)
// const persister = createSyncStoragePersister({
//   storage: typeof window !== 'undefined' ? window.localStorage : undefined,
//   key: CACHE_KEY,
//   serialize: JSON.stringify,
//   deserialize: JSON.parse,
// });

// Cache configuration for different query types
const cacheConfig = {
  // Critical data that should be cached longer
  critical: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    persist: true,
  },
  
  // Standard data caching
  standard: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    persist: true,
  },
  
  // Frequently changing data
  dynamic: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    persist: false,
  },
  
  // Real-time data that shouldn't be cached long
  realtime: {
    staleTime: 0, // Always stale
    gcTime: 5 * 60 * 1000, // 5 minutes
    persist: false,
  },
};

// Query key patterns and their cache configurations
const queryCacheMap = {
  // Critical data
  'auth.user': cacheConfig.critical,
  'auth.profile': cacheConfig.critical,
  'farms.detail': cacheConfig.standard,
  'marketplace.products.detail': cacheConfig.standard,
  'crop-detection.diseases.detail': cacheConfig.critical,
  
  // Standard data
  'farms.list': cacheConfig.standard,
  'marketplace.products.list': cacheConfig.standard,
  'ai.conversations.list': cacheConfig.standard,
  'crop-detection.diseases.list': cacheConfig.standard,
  
  // Dynamic data
  'farms.analytics': cacheConfig.dynamic,
  'marketplace.orders': cacheConfig.dynamic,
  'ai.conversations.messages': cacheConfig.dynamic,
  
  // Real-time data
  'notifications': cacheConfig.realtime,
  'websocket': cacheConfig.realtime,
};

// Get cache configuration for a query key
export const getCacheConfig = (queryKey: any[]): typeof cacheConfig.standard => {
  const keyString = queryKey.join('.');
  
  // Find matching pattern
  for (const [pattern, config] of Object.entries(queryCacheMap)) {
    if (keyString.includes(pattern)) {
      return config;
    }
  }
  
  // Default to standard caching
  return cacheConfig.standard;
};

// Setup cache persistence (requires persistence packages)
export const setupCachePersistence = (queryClient: QueryClient) => {
  if (typeof window === 'undefined') {
    return; // Skip on server-side
  }

  // TODO: Implement when persistence packages are installed
  console.log('Cache persistence setup skipped - install @tanstack/react-query-persist-client and @tanstack/query-sync-storage-persister');
  
  // try {
  //   persistQueryClient({
  //     queryClient,
  //     persister,
  //     maxAge: CACHE_MAX_AGE,
  //     hydrateOptions: {
  //       defaultOptions: {
  //         queries: {
  //           staleTime: 5 * 60 * 1000,
  //         },
  //       },
  //     },
  //     dehydrateOptions: {
  //       shouldDehydrateQuery: (query) => {
  //         const config = getCacheConfig(query.queryKey);
  //         return config.persist && query.state.status === 'success';
  //       },
  //     },
  //   });
  //   console.log('Cache persistence initialized');
  // } catch (error) {
  //   console.error('Failed to initialize cache persistence:', error);
  // }
};

// Cache management utilities
export const cacheManager = {
  // Clear all cached data
  clearAll: () => {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('All cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },

  // Clear expired cache entries
  clearExpired: () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return;

      const data = JSON.parse(cached);
      const now = Date.now();
      
      // Filter out expired entries
      const filtered = {
        ...data,
        clientState: {
          ...data.clientState,
          queries: data.clientState.queries.filter((query: any) => {
            const age = now - query.state.dataUpdatedAt;
            return age < CACHE_MAX_AGE;
          }),
        },
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
      console.log('Expired cache entries cleared');
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  },

  // Get cache size
  getCacheSize: (): number => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? new Blob([cached]).size : 0;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  },

  // Get cache statistics
  getCacheStats: () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return {
          size: 0,
          queryCount: 0,
          oldestEntry: null,
          newestEntry: null,
        };
      }

      const data = JSON.parse(cached);
      const queries = data.clientState?.queries || [];
      
      const timestamps = queries
        .map((q: any) => q.state.dataUpdatedAt)
        .filter(Boolean)
        .sort((a: number, b: number) => a - b);

      return {
        size: new Blob([cached]).size,
        queryCount: queries.length,
        oldestEntry: timestamps[0] ? new Date(timestamps[0]) : null,
        newestEntry: timestamps[timestamps.length - 1] ? new Date(timestamps[timestamps.length - 1]) : null,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        size: 0,
        queryCount: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  },

  // Export cache data
  exportCache: (): string | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached;
    } catch (error) {
      console.error('Failed to export cache:', error);
      return null;
    }
  },

  // Import cache data
  importCache: (cacheData: string): boolean => {
    try {
      // Validate the data first
      const parsed = JSON.parse(cacheData);
      if (!parsed.clientState) {
        throw new Error('Invalid cache data format');
      }

      localStorage.setItem(CACHE_KEY, cacheData);
      console.log('Cache imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import cache:', error);
      return false;
    }
  },

  // Check if cache is healthy
  isHealthy: (): boolean => {
    try {
      const stats = cacheManager.getCacheStats();
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      return stats.size < maxSize && stats.queryCount < 1000;
    } catch (error) {
      console.error('Failed to check cache health:', error);
      return false;
    }
  },

  // Optimize cache by removing least recently used entries
  optimize: () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return;

      const data = JSON.parse(cached);
      const queries = data.clientState?.queries || [];
      
      // Sort by last access time and keep only the most recent 500 queries
      const sortedQueries = queries
        .sort((a: any, b: any) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
        .slice(0, 500);

      const optimized = {
        ...data,
        clientState: {
          ...data.clientState,
          queries: sortedQueries,
        },
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(optimized));
      console.log('Cache optimized');
    } catch (error) {
      console.error('Failed to optimize cache:', error);
    }
  },
};

// Offline support utilities
export const offlineSupport = {
  // Check if app is offline
  isOffline: (): boolean => {
    return typeof navigator !== 'undefined' && !navigator.onLine;
  },

  // Get offline-available data
  getOfflineData: (queryKey: any[]) => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const queries = data.clientState?.queries || [];
      
      const query = queries.find((q: any) => 
        JSON.stringify(q.queryKey) === JSON.stringify(queryKey)
      );

      return query?.state?.data || null;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  },

  // Queue mutations for when back online
  queueMutation: (mutationKey: string, variables: any) => {
    try {
      const queueKey = 'mutation-queue';
      const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      
      queue.push({
        id: `${Date.now()}-${Math.random()}`,
        mutationKey,
        variables,
        timestamp: Date.now(),
      });

      localStorage.setItem(queueKey, JSON.stringify(queue));
      console.log('Mutation queued for offline sync');
    } catch (error) {
      console.error('Failed to queue mutation:', error);
    }
  },

  // Get queued mutations
  getQueuedMutations: () => {
    try {
      const queueKey = 'mutation-queue';
      return JSON.parse(localStorage.getItem(queueKey) || '[]');
    } catch (error) {
      console.error('Failed to get queued mutations:', error);
      return [];
    }
  },

  // Clear mutation queue
  clearMutationQueue: () => {
    try {
      localStorage.removeItem('mutation-queue');
      console.log('Mutation queue cleared');
    } catch (error) {
      console.error('Failed to clear mutation queue:', error);
    }
  },
};

// Auto-cleanup on app start
if (typeof window !== 'undefined') {
  // Clear expired cache on app start
  setTimeout(() => {
    cacheManager.clearExpired();
    
    // Optimize cache if it's getting too large
    if (!cacheManager.isHealthy()) {
      cacheManager.optimize();
    }
  }, 1000);

  // Set up periodic cleanup
  setInterval(() => {
    cacheManager.clearExpired();
  }, 60 * 60 * 1000); // Every hour
}

export default {
  setupCachePersistence,
  getCacheConfig,
  cacheManager,
  offlineSupport,
};