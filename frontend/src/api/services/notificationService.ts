/**
 * Notification Service
 * Handles all notification-related API calls
 */
import apiClient from '../axiosClient';

export interface Notification {
    id: number;
    message: string;
    type: 'order_created' | 'order_approved' | 'order_rejected' | 'order_cancelled';
    is_read: boolean;
    timestamp: string;
    related_order: string;
    order_number: string;
}

export interface NotificationsResponse {
    count: number;
    unread_count: number;
    next: string | null;
    previous: string | null;
    results: Notification[];
}

/**
 * Get user's notifications
 */
export const getNotifications = async (params?: {
    is_read?: boolean;
    page?: number;
    page_size?: number;
}): Promise<NotificationsResponse> => {
    const response = await apiClient.get('/api/v1/marketplace/notifications/', { params });
    return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: number): Promise<Notification> => {
    const response = await apiClient.patch(`/api/v1/marketplace/notifications/${notificationId}/`, {
        is_read: true,
    });
    return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<{ message: string; updated_count: number }> => {
    const response = await apiClient.post('/api/v1/marketplace/notifications/mark_all_read/');
    return response.data;
};
