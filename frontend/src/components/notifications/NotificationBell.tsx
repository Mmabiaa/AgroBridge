/**
 * Notification Bell Component
 * Displays notification icon with unread count badge
 */
import React, { useState } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/api/services/notifications.service';

// Icon mapping for notification types
const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'success':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'warning':
            return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        case 'error':
            return <XCircle className="h-4 w-4 text-red-500" />;
        case 'info':
        default:
            return <Info className="h-4 w-4 text-blue-500" />;
    }
};

// Background color for notification types
const getNotificationBg = (type: Notification['type'], isRead: boolean) => {
    if (isRead) return '';
    
    switch (type) {
        case 'success':
            return 'bg-green-50 dark:bg-green-950/20';
        case 'warning':
            return 'bg-yellow-50 dark:bg-yellow-950/20';
        case 'error':
            return 'bg-red-50 dark:bg-red-950/20';
        case 'info':
        default:
            return 'bg-blue-50 dark:bg-blue-950/20';
    }
};

export const NotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    // Get recent notifications (max 5)
    const recentNotifications = notifications.slice(0, 5);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        await markAsRead(notification.id);
        setIsOpen(false);
        
        // Navigate to action URL if provided
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const handleViewAll = () => {
        setIsOpen(false);
        navigate('/notifications');
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                    {!isConnected && (
                        <span 
                            className="absolute bottom-0 right-0 h-2 w-2 bg-yellow-500 rounded-full"
                            title="Reconnecting..."
                        />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="text-xs h-7"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                
                {/* Notifications List */}
                <ScrollArea className="h-[400px]">
                    {recentNotifications.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                We'll notify you when something important happens
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recentNotifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={`px-4 py-3 cursor-pointer focus:bg-accent ${
                                        getNotificationBg(notification.type, notification.is_read)
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex gap-3 w-full">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {notification.title && (
                                                <p className="text-sm font-medium mb-1 truncate">
                                                    {notification.title}
                                                </p>
                                            )}
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.created_at), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                                {notification.action_text && (
                                                    <span className="text-xs font-medium text-primary">
                                                        {notification.action_text}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Unread indicator */}
                                        {!notification.is_read && (
                                            <div className="flex-shrink-0">
                                                <span className="h-2 w-2 bg-blue-500 rounded-full block" />
                                            </div>
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                
                {/* Footer */}
                {recentNotifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-center text-sm font-medium text-primary hover:text-primary"
                                onClick={handleViewAll}
                            >
                                View all notifications
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
