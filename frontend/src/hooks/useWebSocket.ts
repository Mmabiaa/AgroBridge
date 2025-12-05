/**
 * WebSocket Hook for Real-Time Notifications
 * Manages WebSocket connection lifecycle and message handling
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

export interface NotificationData {
    id: number;
    message: string;
    type: string;
    is_read: boolean;
    timestamp: string;
    related_order: string | null;
    order_number: string | null;
}

interface UseWebSocketOptions {
    onMessage?: (message: WebSocketMessage) => void;
    onNotification?: (notification: NotificationData) => void;
    onUnreadCountUpdate?: (count: number) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
    autoReconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
    isConnected: boolean;
    isConnecting: boolean;
    sendMessage: (message: WebSocketMessage) => void;
    markAsRead: (notificationId: number) => void;
    markAllAsRead: () => void;
    getUnreadCount: () => void;
    reconnect: () => void;
    disconnect: () => void;
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
    const {
        onMessage,
        onNotification,
        onUnreadCountUpdate,
        onConnect,
        onDisconnect,
        onError,
        autoReconnect = true,
        reconnectInterval = 3000,
        maxReconnectAttempts = 10,
    } = options;

    const { user } = useAuth();
    const getToken = () => localStorage.getItem('access_token');
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const clearReconnectTimeout = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    const clearPingInterval = useCallback(() => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
    }, []);

    const sendMessage = useCallback((message: WebSocketMessage) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected. Message not sent:', message);
        }
    }, []);

    const markAsRead = useCallback((notificationId: number) => {
        sendMessage({
            type: 'mark_read',
            notification_id: notificationId,
        });
    }, [sendMessage]);

    const markAllAsRead = useCallback(() => {
        sendMessage({
            type: 'mark_all_read',
        });
    }, [sendMessage]);

    const getUnreadCount = useCallback(() => {
        sendMessage({
            type: 'get_unread_count',
        });
    }, [sendMessage]);

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            // Call general message handler
            onMessage?.(message);

            // Handle specific message types
            switch (message.type) {
                case 'connection_established':
                    console.log('WebSocket connection established:', message.message);
                    break;

                case 'new_notification':
                    if (message.notification) {
                        onNotification?.(message.notification as NotificationData);
                    }
                    break;

                case 'unread_count':
                    if (typeof message.count === 'number') {
                        onUnreadCountUpdate?.(message.count);
                    }
                    break;

                case 'notification_marked_read':
                    if (typeof message.unread_count === 'number') {
                        onUnreadCountUpdate?.(message.unread_count);
                    }
                    break;

                case 'all_notifications_marked_read':
                    onUnreadCountUpdate?.(0);
                    break;

                case 'pong':
                    // Heartbeat response
                    break;

                case 'error':
                    console.error('WebSocket error message:', message.message);
                    break;

                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }, [onMessage, onNotification, onUnreadCountUpdate]);

    const startPingInterval = useCallback(() => {
        clearPingInterval();
        pingIntervalRef.current = setInterval(() => {
            sendMessage({
                type: 'ping',
                timestamp: new Date().toISOString(),
            });
        }, 30000); // Ping every 30 seconds
    }, [sendMessage, clearPingInterval]);

    const connect = useCallback(() => {
        const token = getToken();
        
        if (!user || !token) {
            console.log('Cannot connect WebSocket: User not authenticated');
            return;
        }

        // Check if token is expired before connecting
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            if (payload.exp < currentTime) {
                console.log('Cannot connect WebSocket: Token is expired');
                localStorage.removeItem('access_token');
                return;
            }
        } catch (error) {
            console.error('Invalid token format:', error);
            localStorage.removeItem('access_token');
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN || 
            wsRef.current?.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket already connected or connecting');
            return;
        }

        setIsConnecting(true);
        clearReconnectTimeout();

        try {
            // Construct WebSocket URL with token
            const wsUrl = `${WS_BASE_URL}/ws/notifications/?token=${token}`;
            console.log('Connecting to WebSocket:', wsUrl.replace(token, '***'));

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                setIsConnecting(false);
                reconnectAttemptsRef.current = 0;
                startPingInterval();
                onConnect?.();
            };

            ws.onmessage = handleMessage;

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                onError?.(error);
            };

            ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);
                clearPingInterval();
                onDisconnect?.();

                // Attempt reconnection if enabled
                if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(
                        reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
                        30000
                    );
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            setIsConnecting(false);
        }
    }, [user, autoReconnect, maxReconnectAttempts, reconnectInterval, handleMessage, onConnect, onDisconnect, onError, clearReconnectTimeout, clearPingInterval, startPingInterval]);

    const disconnect = useCallback(() => {
        clearReconnectTimeout();
        clearPingInterval();
        
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        
        setIsConnected(false);
        setIsConnecting(false);
    }, [clearReconnectTimeout, clearPingInterval]);

    const reconnect = useCallback(() => {
        disconnect();
        reconnectAttemptsRef.current = 0;
        connect();
    }, [disconnect, connect]);

    // Connect on mount if user is authenticated
    useEffect(() => {
        const token = getToken();
        if (user && token) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [user]); // Only reconnect when user changes

    return {
        isConnected,
        isConnecting,
        sendMessage,
        markAsRead,
        markAllAsRead,
        getUnreadCount,
        reconnect,
        disconnect,
    };
};
