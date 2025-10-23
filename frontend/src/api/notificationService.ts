/**
 * Notification Service for API Error Handling
 */

export interface NotificationData {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  requestId?: string;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface NotificationConfig {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxNotifications: number;
  defaultDuration: number;
  enableSound: boolean;
  enablePersistence: boolean;
}

class NotificationService {
  private config: NotificationConfig;
  private notifications: Map<string, NotificationData & { id: string; timestamp: number }>;
  private listeners: Set<(notifications: Array<NotificationData & { id: string; timestamp: number }>) => void>;

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = {
      position: 'top-right',
      maxNotifications: 5,
      defaultDuration: 4000,
      enableSound: false,
      enablePersistence: false,
      ...config,
    };
    
    this.notifications = new Map();
    this.listeners = new Set();
  }

  /**
   * Show a notification
   */
  show(data: NotificationData): string {
    const id = this.generateId();
    const notification = {
      ...data,
      id,
      timestamp: Date.now(),
      duration: data.duration || this.config.defaultDuration,
    };

    // Add notification
    this.notifications.set(id, notification);

    // Remove oldest notifications if we exceed the limit
    this.enforceMaxNotifications();

    // Auto-remove notification after duration
    if (notification.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }

    // Play sound if enabled
    if (this.config.enableSound) {
      this.playNotificationSound(data.type);
    }

    // Persist notification if enabled
    if (this.config.enablePersistence) {
      this.persistNotification(notification);
    }

    // Notify listeners
    this.notifyListeners();

    return id;
  }

  /**
   * Show success notification
   */
  success(title: string, message: string, duration?: number): string {
    return this.show({
      type: 'success',
      title,
      message,
      duration,
    });
  }

  /**
   * Show error notification
   */
  error(title: string, message: string, duration?: number, requestId?: string): string {
    return this.show({
      type: 'error',
      title,
      message,
      duration: duration || 6000, // Longer duration for errors
      requestId,
      actions: requestId ? [
        {
          label: 'Copy Request ID',
          action: () => this.copyToClipboard(requestId),
        },
      ] : undefined,
    });
  }

  /**
   * Show warning notification
   */
  warning(title: string, message: string, duration?: number): string {
    return this.show({
      type: 'warning',
      title,
      message,
      duration,
    });
  }

  /**
   * Show info notification
   */
  info(title: string, message: string, duration?: number): string {
    return this.show({
      type: 'info',
      title,
      message,
      duration,
    });
  }

  /**
   * Remove a notification
   */
  remove(id: string): boolean {
    const removed = this.notifications.delete(id);
    if (removed) {
      this.notifyListeners();
    }
    return removed;
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notifications.clear();
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  getAll(): Array<NotificationData & { id: string; timestamp: number }> {
    return Array.from(this.notifications.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get notification by ID
   */
  get(id: string): (NotificationData & { id: string; timestamp: number }) | undefined {
    return this.notifications.get(id);
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: Array<NotificationData & { id: string; timestamp: number }>) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Generate unique notification ID
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enforce maximum number of notifications
   */
  private enforceMaxNotifications(): void {
    const notifications = this.getAll();
    if (notifications.length > this.config.maxNotifications) {
      const toRemove = notifications.slice(this.config.maxNotifications);
      toRemove.forEach(notification => {
        this.notifications.delete(notification.id);
      });
    }
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    const notifications = this.getAll();
    this.listeners.forEach(listener => {
      try {
        listener(notifications);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(type: NotificationData['type']): void {
    try {
      // Create audio context if not exists
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Different frequencies for different notification types
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 500,
      };

      const frequency = frequencies[type];
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Ignore audio errors
      console.warn('Could not play notification sound:', error);
    }
  }

  /**
   * Persist notification to localStorage
   */
  private persistNotification(notification: NotificationData & { id: string; timestamp: number }): void {
    try {
      const persistedNotifications = this.getPersistedNotifications();
      persistedNotifications.push(notification);
      
      // Keep only last 50 notifications
      const trimmed = persistedNotifications.slice(-50);
      
      localStorage.setItem('notifications', JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Could not persist notification:', error);
    }
  }

  /**
   * Get persisted notifications
   */
  getPersistedNotifications(): Array<NotificationData & { id: string; timestamp: number }> {
    try {
      const stored = localStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Could not load persisted notifications:', error);
      return [];
    }
  }

  /**
   * Clear persisted notifications
   */
  clearPersistedNotifications(): void {
    try {
      localStorage.removeItem('notifications');
    } catch (error) {
      console.warn('Could not clear persisted notifications:', error);
    }
  }

  /**
   * Copy text to clipboard
   */
  private async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      this.success('Copied', 'Request ID copied to clipboard', 2000);
    } catch (error) {
      console.error('Could not copy to clipboard:', error);
      this.error('Copy Failed', 'Could not copy request ID to clipboard', 3000);
    }
  }
}

// Create default notification service instance
export const notificationService = new NotificationService();

// Export utility functions for common notification patterns
export const showApiError = (message: string, requestId?: string): string => {
  return notificationService.error('API Error', message, 6000, requestId);
};

export const showNetworkError = (): string => {
  return notificationService.error(
    'Network Error',
    'Please check your internet connection and try again.',
    8000
  );
};

export const showServerError = (): string => {
  return notificationService.error(
    'Server Error',
    'The server is experiencing issues. Please try again later.',
    8000
  );
};

export const showValidationError = (message: string): string => {
  return notificationService.warning('Validation Error', message, 5000);
};

export const showAuthError = (): string => {
  return notificationService.error(
    'Authentication Required',
    'Please log in to continue.',
    6000
  );
};

export const showPermissionError = (): string => {
  return notificationService.error(
    'Access Denied',
    'You don\'t have permission to perform this action.',
    6000
  );
};

export const showRateLimitError = (): string => {
  return notificationService.warning(
    'Rate Limited',
    'Too many requests. Please wait a moment before trying again.',
    8000
  );
};

export const showSuccessMessage = (message: string): string => {
  return notificationService.success('Success', message, 4000);
};

export default notificationService;