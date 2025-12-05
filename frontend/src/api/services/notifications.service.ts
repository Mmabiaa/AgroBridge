/**
 * Notifications API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface Notification {
  id: string;
  user: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'farm' | 'marketplace' | 'ai' | 'iot' | 'community' | 'financial';
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  action_text?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  notification_categories: {
    system: boolean;
    farm: boolean;
    marketplace: boolean;
    ai: boolean;
    iot: boolean;
    community: boolean;
    financial: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
}

export interface NotificationListParams {
  page?: number;
  page_size?: number;
  is_read?: boolean;
  type?: string;
  category?: string;
  ordering?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationsService {
  private readonly baseUrl = '/notifications';

  /**
   * Get list of notifications
   */
  async getNotifications(params?: NotificationListParams): Promise<PaginatedResponse<Notification>> {
    return apiClient.getPaginated<Notification>(`${this.baseUrl}/`, params);
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<Notification> {
    return apiClient.get<Notification>(`${this.baseUrl}/${notificationId}`);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    return apiClient.put<Notification>(`${this.baseUrl}/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    return apiClient.post<{ message: string; count: number }>(`${this.baseUrl}/mark-all-read`);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${notificationId}`);
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(): Promise<{ message: string; count: number }> {
    return apiClient.post<{ message: string; count: number }>(`${this.baseUrl}/delete-all-read`);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>(`${this.baseUrl}/unread-count`);
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    return apiClient.get<NotificationPreferences>(`${this.baseUrl}/preferences`);
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return apiClient.put<NotificationPreferences>(`${this.baseUrl}/preferences`, preferences);
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(subscription: PushSubscription): Promise<{ message: string; device_id: string }> {
    return apiClient.post<{ message: string; device_id: string }>(
      `${this.baseUrl}/devices/register`,
      subscription
    );
  }

  /**
   * Unregister device from push notifications
   */
  async unregisterDevice(deviceId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.baseUrl}/devices/${deviceId}`);
  }

  /**
   * Test notification
   */
  async sendTestNotification(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/test`);
  }
}

export default new NotificationsService();
