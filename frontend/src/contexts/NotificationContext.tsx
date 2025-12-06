/**
 * Notification Context
 * Manages real-time notifications and WebSocket connection
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import notificationsService, { type Notification } from '@/api/services/notifications.service';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Handle new notifications from WebSocket
    const handleNewNotification = useCallback((notification: any) => {
        console.log('New notification received:', notification);
        
        // Transform WebSocket notification to match Notification interface
        const transformedNotification: Notification = {
            id: notification.id?.toString() || Date.now().toString(),
            user: notification.user || user?.id || '',
            type: notification.type || 'info',
            category: notification.category || 'system',
            title: notification.title || 'Notification',
            message: notification.message,
            is_read: notification.is_read || false,
            action_url: notification.action_url,
            action_text: notification.action_text,
            metadata: notification.metadata,
            created_at: notification.timestamp || notification.created_at || new Date().toISOString(),
            read_at: notification.read_at,
        };
        
        // Add to notifications list
        setNotifications(prev => [transformedNotification, ...prev]);
        
        // Update unread count if notification is unread
        if (!transformedNotification.is_read) {
            setUnreadCount(prev => prev + 1);
        }

        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(transformedNotification.title || 'AgroBridge Notification', {
                body: transformedNotification.message,
                icon: '/logo.png',
                tag: `notification-${transformedNotification.id}`,
            });
        }
    }, [user]);

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
            const response = await notificationsService.getNotifications({ page_size: 50 });
            setNotifications(response.results);
            
            // Calculate unread count from results
            const unread = response.results.filter(n => !n.is_read).length;
            setUnreadCount(unread);
            
            // Also fetch unread count from API for accuracy
            try {
                const countResponse = await notificationsService.getUnreadCount();
                setUnreadCount(countResponse.count);
            } catch (countError) {
                console.error('Error fetching unread count:', countError);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            // Update via API
            await notificationsService.markAsRead(notificationId);
            
            // Update local state
            setNotifications(prev =>
                prev.map(n => (n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
            );
            
            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            // Send via WebSocket for real-time sync
            wsMarkAsRead(parseInt(notificationId));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, [wsMarkAsRead]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            // Update via API
            await notificationsService.markAllAsRead();
            
            // Update local state
            const now = new Date().toISOString();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: now })));
            setUnreadCount(0);
            
            // Send via WebSocket for real-time sync
            wsMarkAllAsRead();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, [wsMarkAllAsRead]);

    // Refresh unread count
    const refreshUnreadCount = useCallback(async () => {
        try {
            const response = await notificationsService.getUnreadCount();
            setUnreadCount(response.count);
            // Also send via WebSocket
            getUnreadCount();
        } catch (error) {
            console.error('Error refreshing unread count:', error);
        }
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
