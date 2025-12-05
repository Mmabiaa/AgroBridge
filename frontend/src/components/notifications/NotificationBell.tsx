/**
 * Notification Bell Component
 * Displays notification icon with unread count badge
 */
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
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
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    // Get recent notifications (max 5)
    const recentNotifications = notifications.slice(0, 5);

    const handleNotificationClick = async (notificationId: number, orderNumber: string | null) => {
        await markAsRead(notificationId);
        setIsOpen(false);
        
        if (orderNumber) {
            navigate('/orders');
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
                        <span className="absolute bottom-0 right-0 h-2 w-2 bg-yellow-500 rounded-full" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="text-xs"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                
                {recentNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No notifications yet
                    </div>
                ) : (
                    <>
                        {recentNotifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`px-4 py-3 cursor-pointer ${
                                    !notification.is_read ? 'bg-blue-50' : ''
                                }`}
                                onClick={() =>
                                    handleNotificationClick(notification.id, notification.order_number)
                                }
                            >
                                <div className="flex flex-col gap-1 w-full">
                                    <p className="text-sm">{notification.message}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.timestamp), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                        {!notification.is_read && (
                                            <span className="h-2 w-2 bg-blue-500 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="px-4 py-2 text-center cursor-pointer"
                            onClick={handleViewAll}
                        >
                            <span className="text-sm font-medium text-primary">View all notifications</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
