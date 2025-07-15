
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Clock,
  Settings,
  Trash2,
  CheckCheck
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  timestamp: Date;
  isRead: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Pest Alert: Fall Armyworm Detected',
    message: 'High risk detected in your maize field. Immediate action recommended.',
    type: 'alert',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    category: 'Pest Management',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Weather Update',
    message: 'Heavy rainfall expected in the next 48 hours. Prepare drainage systems.',
    type: 'warning',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    isRead: false,
    category: 'Weather',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Market Price Increase',
    message: 'Tomato prices increased by 15% this week. Good time to sell!',
    type: 'success',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    category: 'Market',
    priority: 'medium'
  },
  {
    id: '4',
    title: 'Irrigation System Scheduled',
    message: 'Your automated irrigation will start tomorrow at 6:00 AM.',
    type: 'info',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
    category: 'Farm Management',
    priority: 'low'
  }
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [notificationSettings, setNotificationSettings] = useState({
    push: true,
    email: true,
    sms: false,
    weather: true,
    pests: true,
    market: true,
    irrigation: true
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return AlertTriangle;
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      case 'info':
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Simulate new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every 10 seconds
        const newNotification: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          title: 'New Market Update',
          message: 'Price changes detected in your area.',
          type: 'info',
          timestamp: new Date(),
          isRead: false,
          category: 'Market',
          priority: 'low'
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Notification Header */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={clearAllNotifications}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          {notifications.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-muted-foreground">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);
              
              return (
                <Card 
                  key={notification.id} 
                  className={`shadow-soft cursor-pointer transition-all duration-300 hover:shadow-strong ${
                    !notification.isRead ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              notification.priority === 'high' ? 'destructive' :
                              notification.priority === 'medium' ? 'default' : 'secondary'
                            } className="text-xs">
                              {notification.priority}
                            </Badge>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {notification.category}
                            </Badge>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Notification Settings */}
        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Methods */}
              <div className="space-y-4">
                <h4 className="font-semibold">Delivery Methods</h4>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Push Notifications</span>
                  <Switch
                    checked={notificationSettings.push}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, push: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Notifications</span>
                  <Switch
                    checked={notificationSettings.email}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">SMS Notifications</span>
                  <Switch
                    checked={notificationSettings.sms}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, sms: checked }))
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Categories */}
              <div className="space-y-4">
                <h4 className="font-semibold">Categories</h4>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Weather Alerts</span>
                  <Switch
                    checked={notificationSettings.weather}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, weather: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pest Alerts</span>
                  <Switch
                    checked={notificationSettings.pests}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, pests: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Market Updates</span>
                  <Switch
                    checked={notificationSettings.market}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, market: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Irrigation Reminders</span>
                  <Switch
                    checked={notificationSettings.irrigation}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, irrigation: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Notifications</span>
                <span className="font-semibold">{notifications.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Unread</span>
                <span className="font-semibold text-primary">{unreadCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">High Priority</span>
                <span className="font-semibold text-red-500">
                  {notifications.filter(n => n.priority === 'high').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
