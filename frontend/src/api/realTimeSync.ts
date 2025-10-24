/**
 * Real-time synchronization for cache invalidation
 */
import { queryClient, queryKeys, cacheUtils, optimisticUpdates } from './queryClient';

interface WebSocketMessage {
  type: 'cache_invalidation' | 'data_update' | 'notification';
  resource: string;
  action: 'create' | 'update' | 'delete';
  data?: any;
  id?: string;
}

class RealTimeSync {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private shouldConnect = false;

  constructor() {
    // Don't auto-connect on initialization
    // Connection will be initiated when user authenticates
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Get token for authentication
    const token = localStorage.getItem('access_token');
    
    // Don't connect if no token is available
    if (!token) {
      console.log('WebSocket connection skipped: No authentication token available');
      return;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      if (payload.exp < currentTime) {
        console.log('WebSocket connection skipped: Token is expired');
        return;
      }
    } catch (error) {
      console.log('WebSocket connection skipped: Invalid token format');
      return;
    }

    this.isConnecting = true;
    
    try {
      const baseUrl = import.meta.env.PROD 
        ? 'wss://api.agrobridge.com/ws/'
        : 'ws://localhost:8000/ws/';
      
      // Always add token as query parameter for authenticated connections
      const wsUrl = `${baseUrl}?token=${token}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected for real-time sync');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    // Don't reconnect if we shouldn't be connected
    if (!this.shouldConnect) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('Received WebSocket message:', message);

    switch (message.type) {
      case 'cache_invalidation':
        this.handleCacheInvalidation(message);
        break;
      case 'data_update':
        this.handleDataUpdate(message);
        break;
      case 'notification':
        this.handleNotification(message);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleCacheInvalidation(message: WebSocketMessage) {
    const { resource, action, id } = message;

    switch (resource) {
      case 'farms':
        if (id) {
          // Invalidate specific farm
          queryClient.invalidateQueries({ queryKey: queryKeys.farms.detail(id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.farms.analytics(id) });
        }
        // Always invalidate lists
        queryClient.invalidateQueries({ queryKey: queryKeys.farms.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.farms.userFarms() });
        break;

      case 'products':
        if (id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.products.detail(id) });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.products.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.products.userProducts() });
        break;

      case 'conversations':
        if (id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations.detail(id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations.messages(id) });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations.lists() });
        break;

      case 'diseases':
        if (id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.cropDetection.diseases.detail(id) });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.cropDetection.diseases.lists() });
        break;

      case 'user':
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
        break;

      default:
        console.warn('Unknown resource for cache invalidation:', resource);
    }
  }

  private handleDataUpdate(message: WebSocketMessage) {
    const { resource, action, data, id } = message;

    if (!data || !id) return;

    switch (resource) {
      case 'farms':
        // Update farm detail cache
        queryClient.setQueryData(queryKeys.farms.detail(id), (oldData: any) => {
          if (!oldData) return data;
          return { ...oldData, ...data };
        });

        // Update farm in lists
        const farmListQueries = queryClient.getQueriesData({ queryKey: queryKeys.farms.lists() });
        farmListQueries.forEach(([queryKey, queryData]) => {
          if (queryData) {
            optimisticUpdates.updateList(queryKey as any[], data, action);
          }
        });
        break;

      case 'products':
        // Update product detail cache
        queryClient.setQueryData(queryKeys.marketplace.products.detail(id), (oldData: any) => {
          if (!oldData) return data;
          return { ...oldData, ...data };
        });

        // Update product in lists
        const productListQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.lists() });
        productListQueries.forEach(([queryKey, queryData]) => {
          if (queryData) {
            optimisticUpdates.updateList(queryKey as any[], data, action);
          }
        });
        break;

      case 'conversations':
        // Update conversation detail cache
        queryClient.setQueryData(queryKeys.ai.conversations.detail(id), (oldData: any) => {
          if (!oldData) return data;
          return { ...oldData, ...data };
        });
        break;

      default:
        console.warn('Unknown resource for data update:', resource);
    }
  }

  private handleNotification(message: WebSocketMessage) {
    // Handle real-time notifications
    const { data } = message;
    
    if (data?.message) {
      // Show notification to user
      import('./notificationService').then(({ notificationService }) => {
        switch (data.type) {
          case 'success':
            notificationService.success('Success', data.message);
            break;
          case 'warning':
            notificationService.warning('Warning', data.message);
            break;
          case 'error':
            notificationService.error('Error', data.message);
            break;
          default:
            notificationService.info('Info', data.message);
        }
      });
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  public startConnection() {
    this.shouldConnect = true;
    this.reconnectAttempts = 0;
    this.connect();
  }

  public stopConnection() {
    this.shouldConnect = false;
    this.disconnect();
  }
}

// Create singleton instance
export const realTimeSync = new RealTimeSync();

// Auto-reconnect on page visibility change (only if should be connected)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !realTimeSync.isConnected() && realTimeSync['shouldConnect']) {
      realTimeSync.reconnect();
    }
  });
}

// Auto-reconnect when coming back online (only if should be connected)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (!realTimeSync.isConnected() && realTimeSync['shouldConnect']) {
      realTimeSync.reconnect();
    }
  });
}

export default realTimeSync;