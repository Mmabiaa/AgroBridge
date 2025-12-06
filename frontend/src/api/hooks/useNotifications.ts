/**
 * React Query hooks for notifications service
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import notificationsService from '../services/notifications.service';
import type { NotificationListParams, NotificationPreferences, PushSubscription } from '../services/notifications.service';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params?: NotificationListParams) => [...notificationKeys.lists(), params] as const,
  detail: (id: string) => [...notificationKeys.all, 'detail', id] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

/**
 * Get list of notifications
 */
export const useNotifications = (params?: NotificationListParams) => {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsService.getNotifications(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Get notification by ID
 */
export const useNotification = (notificationId: string) => {
  return useQuery({
    queryKey: notificationKeys.detail(notificationId),
    queryFn: () => notificationsService.getNotification(notificationId),
    enabled: !!notificationId,
  });
};

/**
 * Get unread count
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

/**
 * Mark notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Delete notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

/**
 * Delete all read notifications
 */
export const useDeleteAllRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.deleteAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};

/**
 * Get notification preferences
 */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationsService.getPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Update notification preferences
 */
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) =>
      notificationsService.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
};

/**
 * Register device for push notifications
 */
export const useRegisterDevice = () => {
  return useMutation({
    mutationFn: (subscription: PushSubscription) => notificationsService.registerDevice(subscription),
  });
};

/**
 * Unregister device from push notifications
 */
export const useUnregisterDevice = () => {
  return useMutation({
    mutationFn: (deviceId: string) => notificationsService.unregisterDevice(deviceId),
  });
};

/**
 * Send test notification
 */
export const useSendTestNotification = () => {
  return useMutation({
    mutationFn: () => notificationsService.sendTestNotification(),
  });
};
