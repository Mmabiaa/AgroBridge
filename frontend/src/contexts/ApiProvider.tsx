/**
 * API Provider Context for React Query and API integration
 */
import React, { createContext, useContext, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../api/queryClient';
import { realTimeSync } from '../api/realTimeSync';
import { notificationService } from '../api/notificationService';

interface ApiContextType {
  queryClient: QueryClient;
  isOnline: boolean;
  reconnect: () => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

interface ApiProviderProps {
  children: React.ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notificationService.success('Connection Restored', 'You are back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      notificationService.warning('Connection Lost', 'You are now offline. Some features may be limited.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const reconnect = () => {
    if (realTimeSync && typeof realTimeSync.reconnect === 'function') {
      realTimeSync.reconnect();
    }
  };

  const contextValue: ApiContextType = {
    queryClient,
    isOnline,
    reconnect,
  };

  return (
    <ApiContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        {children}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ApiContext.Provider>
  );
};

export default ApiProvider;