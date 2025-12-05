/**
 * Notifications Page
 * Displays all user notifications with filtering and actions
 */
import React, { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const handleNotificationClick = async (notificationId: number, isRead: boolean, orderNumber: string | null) => {
        if (!isRead) {
            await markAsRead(notificationId);
        }
        
        if (orderNumber) {
            navigate('/orders');
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'order_created':
                return '🛒';
            case 'order_approved':
                return '✅';
            case 'order_rejected':
                return '❌';
            case 'order_cancelled':
                return '🚫';
            default:
                return '📢';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'order_created':
                return 'bg-blue-50 border-blue-200';
            case 'order_approved':
                return 'bg-green-50 border-green-200';
            case 'order_rejected':
                return 'bg-red-50 border-red-200';
            case 'order_cancelled':
                return 'bg-gray-50 border-gray-200';
            default:
                return 'bg-white border-gray-200';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bell className="h-6 w-6" />
                            <CardTitle>Notifications</CardTitle>
                            {unreadCount > 0 && (
                                <Badge variant="destructive">{unreadCount} unread</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm">
                                {isConnected ? (
                                    <>
                                        <Wifi className="h-4 w-4 text-green-500" />
                                        <span className="text-green-600">Live</span>
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="h-4 w-4 text-yellow-500" />
                                        <span className="text-yellow-600">Offline</span>
                                    </>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchNotifications}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={markAllAsRead}
                                >
                                    <CheckCheck className="h-4 w-4 mr-1" />
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="all">
                                All ({notifications.length})
                            </TabsTrigger>
                            <TabsTrigger value="unread">
                                Unread ({unreadCount})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={filter} className="space-y-3">
                            {isLoading && notifications.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    Loading notifications...
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No {filter === 'unread' ? 'unread ' : ''}notifications</p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <Card
                                        key={notification.id}
                                        className={`cursor-pointer transition-all hover:shadow-md ${
                                            !notification.is_read
                                                ? getNotificationColor(notification.type)
                                                : 'bg-white border-gray-200'
                                        }`}
                                        onClick={() =>
                                            handleNotificationClick(
                                                notification.id,
                                                notification.is_read,
                                                notification.order_number
                                            )
                                        }
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-2xl">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(
                                                                new Date(notification.timestamp),
                                                                { addSuffix: true }
                                                            )}
                                                        </span>
                                                        {notification.order_number && (
                                                            <Badge variant="outline" className="text-xs">
                                                                #{notification.order_number}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {!notification.is_read && (
                                                    <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default Notifications;
