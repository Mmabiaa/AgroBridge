/**
 * Notification Context
 * Manages real-time notifications and WebSocket connection
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWebSocket, NotificationData } from '@/hooks/useWebSocket';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/api/services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    notifications: NotificationData[];
    unreadCount: number;
    isConnected: boolean;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Handle new notifications from WebSocket
    const handleNewNotification = useCallback((notification: NotificationData) => {
        console.log('New notification received:', notification);
        
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);
        
        // Update unread count if notification is unread
        if (!notification.is_read) {
            setUnreadCount(prev => prev + 1);
        }

        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('AgroBridge Notification', {
                body: notification.message,
                icon: '/logo.png',
                tag: `notification-${notification.id}`,
            });
        }
    }, []);

    // Handle unread count updates from WebSocket
    const handleUnreadCountUpdate = useCallback((count: number) => {
        console.log('Unread count updated:', count);
        setUnreadCount(count);
    }, []);

    // WebSocket connection
    const { isConnected, markAsRead: wsMarkAsRead, markAllAsRead: wsMarkAllAsRead, getUnreadCount } = useWebSocket({
        onNotification: handleNewNotification,
        onUnreadCountUpdate: handleUnreadCountUpdate,
        onConnect: () => {
            console.log('Notification WebSocket connected');
            // Fetch initial notifications on connect
            fetchNotifications();
        },
        onDisconnect: () => {
            console.log('Notification WebSocket disconnected');
        },
        autoReconnect: true,
    });

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const response = await getNotifications({ page_size: 50 });
            setNotifications(response.results);
            setUnreadCount(response.unread_count);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            // Update via API
            await markNotificationAsRead(notificationId);
            
            // Update local state
            setNotifications(prev =>
                prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
            );
            
            // Send via WebSocket for real-time sync
            wsMarkAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, [wsMarkAsRead]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            // Update via API
            await markAllNotificationsAsRead();
            
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            
            // Send via WebSocket for real-time sync
            wsMarkAllAsRead();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, [wsMarkAllAsRead]);

    // Refresh unread count
    const refreshUnreadCount = useCallback(() => {
        getUnreadCount();
    }, [getUnreadCount]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Fetch notifications on mount
    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        refreshUnreadCount,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};
