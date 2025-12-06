/**
 * Notifications Page
 * Displays all user notifications with filtering and actions
 */
import React, { useState, useMemo } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    Bell, 
    CheckCheck, 
    RefreshCw, 
    Wifi, 
    WifiOff,
    Info,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Filter,
    Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/api/services/notifications.service';

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

    const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Get unique types and categories
    const { types, categories } = useMemo(() => {
        const typesSet = new Set<string>();
        const categoriesSet = new Set<string>();
        
        notifications.forEach(n => {
            typesSet.add(n.type);
            categoriesSet.add(n.category);
        });
        
        return {
            types: Array.from(typesSet),
            categories: Array.from(categoriesSet),
        };
    }, [notifications]);

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            // Read status filter
            if (readFilter === 'unread' && n.is_read) return false;
            if (readFilter === 'read' && !n.is_read) return false;
            
            // Type filter
            if (typeFilter !== 'all' && n.type !== typeFilter) return false;
            
            // Category filter
            if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
            
            return true;
        });
    }, [notifications, readFilter, typeFilter, categoryFilter]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
        
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'info':
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getNotificationColor = (type: Notification['type'], isRead: boolean) => {
        if (isRead) return 'bg-white dark:bg-card border-gray-200 dark:border-gray-800';
        
        switch (type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900';
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900';
            case 'error':
                return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900';
            case 'info':
            default:
                return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900';
        }
    };

    const getCategoryBadgeColor = (category: string) => {
        const colors: Record<string, string> = {
            system: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
            farm: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            marketplace: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            ai: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            iot: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            community: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
            financial: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        };
        return colors[category] || colors.system;
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        {/* Header Row */}
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
                                            <span className="text-green-600 dark:text-green-400">Live</span>
                                        </>
                                    ) : (
                                        <>
                                            <WifiOff className="h-4 w-4 text-yellow-500" />
                                            <span className="text-yellow-600 dark:text-yellow-400">Offline</span>
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/settings?tab=notifications')}
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {types.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {(typeFilter !== 'all' || categoryFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setTypeFilter('all');
                                        setCategoryFilter('all');
                                    }}
                                    className="h-9"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={readFilter} onValueChange={(v) => setReadFilter(v as typeof readFilter)}>
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="all">
                                All ({notifications.length})
                            </TabsTrigger>
                            <TabsTrigger value="unread">
                                Unread ({unreadCount})
                            </TabsTrigger>
                            <TabsTrigger value="read">
                                Read ({notifications.length - unreadCount})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={readFilter} className="space-y-3">
                            {isLoading && notifications.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin" />
                                    <p>Loading notifications...</p>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">No notifications found</p>
                                    <p className="text-sm mt-1">
                                        {readFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all'
                                            ? 'Try adjusting your filters'
                                            : 'We\'ll notify you when something important happens'}
                                    </p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <Card
                                        key={notification.id}
                                        className={`cursor-pointer transition-all hover:shadow-md ${
                                            getNotificationColor(notification.type, notification.is_read)
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        {notification.title && (
                                                            <p className="text-sm font-semibold">
                                                                {notification.title}
                                                            </p>
                                                        )}
                                                        <Badge 
                                                            variant="secondary" 
                                                            className={`text-xs ${getCategoryBadgeColor(notification.category)}`}
                                                        >
                                                            {notification.category}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(
                                                                new Date(notification.created_at),
                                                                { addSuffix: true }
                                                            )}
                                                        </span>
                                                        {notification.action_text && (
                                                            <span className="text-xs font-medium text-primary">
                                                                {notification.action_text} →
                                                            </span>
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
