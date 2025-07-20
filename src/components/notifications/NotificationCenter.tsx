
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
  CheckCheck,
  Scan,
  ShoppingCart,
  Calendar,
  Users,
  Leaf
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
  source: 'scan' | 'marketplace' | 'calendar' | 'stories' | 'system';
}

// Notification service functions
export const createNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
  const newNotification: Notification = {
    ...notification,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    isRead: false
  };

  // Get existing notifications
  const existingNotifications = localStorage.getItem('agroBridgeNotifications');
  const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
  
  // Add new notification to the beginning
  notifications.unshift(newNotification);
  
  // Keep only the last 100 notifications
  const limitedNotifications = notifications.slice(0, 100);
  
  // Save back to localStorage
  localStorage.setItem('agroBridgeNotifications', JSON.stringify(limitedNotifications));
  
  return newNotification;
};

// Real notification functions based on user interactions
export const notifyScanCompleted = (result: string, confidence: number, severity?: string) => {
  const isHealthy = result.includes('Healthy');
  
  createNotification({
    title: isHealthy ? 'Crop Health Check Complete' : 'Disease Detected',
    message: isHealthy 
      ? `Your crop analysis shows healthy plants with ${confidence}% confidence.`
      : `Disease detected: ${result} with ${confidence}% confidence. ${severity ? `Severity: ${severity}` : ''}`,
    type: isHealthy ? 'success' : 'alert',
    category: 'Crop Analysis',
    priority: isHealthy ? 'low' : 'high',
    source: 'scan'
  });
};

export const notifyMarketplaceActivity = (action: 'purchase' | 'sale' | 'listing', item: string, amount?: number) => {
  const messages = {
    purchase: `Successfully purchased ${item}${amount ? ` for ₵${amount.toLocaleString()}` : ''}`,
    sale: `Successfully sold ${item}${amount ? ` for ₵${amount.toLocaleString()}` : ''}`,
    listing: `New listing: ${item} added to marketplace`
  };

  createNotification({
    title: 'Marketplace Update',
    message: messages[action],
    type: 'success',
    category: 'Marketplace',
    priority: 'medium',
    source: 'marketplace'
  });
};

export const notifyCalendarEvent = (event: string, date: string) => {
  createNotification({
    title: 'Calendar Reminder',
    message: `Upcoming event: ${event} on ${date}`,
    type: 'info',
    category: 'Calendar',
    priority: 'medium',
    source: 'calendar'
  });
};

export const notifyFarmerStory = (farmerName: string, crop: string) => {
  createNotification({
    title: 'New Success Story',
    message: `${farmerName} shared their success story about ${crop} farming.`,
    type: 'info',
    category: 'Community',
    priority: 'low',
    source: 'stories'
  });
};

export const notifySystemUpdate = (message: string, type: 'info' | 'warning' | 'success' = 'info') => {
  createNotification({
    title: 'System Update',
    message,
    type,
    category: 'System',
    priority: 'medium',
    source: 'system'
  });
};

// Test function to demonstrate notifications
const testNotifications = () => {
  // Test scan notification
  notifyScanCompleted('Powdery Mildew (Oidium spp.)', 84, 'medium');
  
  // Test marketplace notification
  setTimeout(() => {
    notifyMarketplaceActivity('purchase', 'Fresh Tomatoes', 22500);
  }, 1000);
  
  // Test calendar notification
  setTimeout(() => {
    notifyCalendarEvent('Harvest Tomatoes', '2024-02-15');
  }, 2000);
  
  // Test farmer story notification
  setTimeout(() => {
    notifyFarmerStory('Kwame Asante', 'Tomatoes');
  }, 3000);
  
  // Test system notification
  setTimeout(() => {
    notifySystemUpdate('New features available in AgroBridge!', 'success');
  }, 4000);
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState({
    scan: true,
    marketplace: true,
    calendar: true,
    stories: true,
    system: true,
    push: true,
    email: true,
    sms: false
  });

  // Load notifications from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('agroBridgeNotifications');
    if (savedNotifications) {
      try {
        const notifications = JSON.parse(savedNotifications).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(notifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      }
    }

    // Load notification settings
    const savedSettings = localStorage.getItem('agroBridgeNotificationSettings');
    if (savedSettings) {
      try {
        setNotificationSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
  }, []);

  // Save notification settings
  const updateNotificationSettings = (newSettings: typeof notificationSettings) => {
    setNotificationSettings(newSettings);
    localStorage.setItem('agroBridgeNotificationSettings', JSON.stringify(newSettings));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string, source: string) => {
    switch (source) {
      case 'scan':
        return Scan;
      case 'marketplace':
        return ShoppingCart;
      case 'calendar':
        return Calendar;
      case 'stories':
        return Users;
      default:
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
    const updatedNotifications = notifications.map(notification => 
      notification.id === id 
        ? { ...notification, isRead: true }
        : notification
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('agroBridgeNotifications', JSON.stringify(updatedNotifications));
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ ...notification, isRead: true }));
    setNotifications(updatedNotifications);
    localStorage.setItem('agroBridgeNotifications', JSON.stringify(updatedNotifications));
  };

  const deleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem('agroBridgeNotifications', JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('agroBridgeNotifications', JSON.stringify([]));
  };

  // Filter notifications based on settings
  const filteredNotifications = notifications.filter(notification => 
    notificationSettings[notification.source as keyof typeof notificationSettings]
  );

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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testNotifications}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                Test Notifications
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-muted-foreground">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type, notification.source);
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
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {notification.category}
                          </Badge>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
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
        <div className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Notification Types</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scan className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Crop Scans</span>
                    </div>
                    <Switch
                      checked={notificationSettings.scan}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({ ...notificationSettings, scan: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Marketplace</span>
                    </div>
                    <Switch
                      checked={notificationSettings.marketplace}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({ ...notificationSettings, marketplace: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Calendar Events</span>
                    </div>
                    <Switch
                      checked={notificationSettings.calendar}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({ ...notificationSettings, calendar: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Farmer Stories</span>
                    </div>
                    <Switch
                      checked={notificationSettings.stories}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({ ...notificationSettings, stories: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">System Updates</span>
                    </div>
                    <Switch
                      checked={notificationSettings.system}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({ ...notificationSettings, system: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Delivery Methods</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Push Notifications</span>
                    <Switch
                      checked={notificationSettings.push}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({ ...notificationSettings, push: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email</span>
                    <Switch
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({ ...notificationSettings, email: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS</span>
                    <Switch
                      checked={notificationSettings.sms}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({ ...notificationSettings, sms: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
