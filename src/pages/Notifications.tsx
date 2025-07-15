
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Settings,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';

const notificationStats = {
  total: 147,
  unread: 23,
  alerts: 8,
  delivered: 139
};

const deliveryMethods = [
  { name: 'Push Notifications', count: 89, icon: Smartphone, color: 'text-blue-500' },
  { name: 'Email', count: 45, icon: Mail, color: 'text-green-500' },
  { name: 'SMS', count: 13, icon: MessageSquare, color: 'text-purple-500' }
];

const categoryStats = [
  { name: 'Weather Alerts', count: 34, percentage: 23 },
  { name: 'Pest Warnings', count: 28, percentage: 19 },
  { name: 'Market Updates', count: 41, percentage: 28 },
  { name: 'System Alerts', count: 22, percentage: 15 },
  { name: 'Community', count: 22, percentage: 15 }
];

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-0 sm:px-4">
        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4 px-0 sm:px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center justify-center gap-2 md:gap-3">
            <Bell className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Notification Center
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay informed with real-time alerts, updates, and important information 
            about your farm, weather, and market conditions.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-0 sm:px-1 w-full max-w-full">
          <Card className="shadow-soft w-full max-w-full">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Bell className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
              <div className="text-xl md:text-2xl font-bold">{notificationStats.total}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Total Notifications</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft w-full max-w-full">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-yellow-600">{notificationStats.unread}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Unread</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft w-full max-w-full">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-red-600">{notificationStats.alerts}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Urgent Alerts</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft w-full max-w-full">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-green-600">{notificationStats.delivered}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Notification Component */}
        <div className="px-0 sm:px-1 w-full max-w-full">
          <NotificationCenter />
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 px-0 sm:px-1 w-full max-w-full">
          {/* Delivery Methods */}
          <Card className="shadow-soft w-full max-w-full">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Settings className="h-4 w-4 md:h-5 md:w-5" />
                Delivery Methods
              </CardTitle>
              <CardDescription className="text-sm md:text-base">How notifications are being delivered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
              {deliveryMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <Icon className={`h-4 w-4 md:h-5 md:w-5 ${method.color} flex-shrink-0`} />
                      <span className="text-sm md:text-base font-medium truncate">{method.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs md:text-sm flex-shrink-0">{method.count} sent</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="shadow-soft w-full max-w-full">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                Notification Categories
              </CardTitle>
              <CardDescription className="text-sm md:text-base">Breakdown by notification type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
              {categoryStats.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm md:text-base font-medium truncate mr-2">{category.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs md:text-sm text-muted-foreground">{category.count}</span>
                      <Badge variant="outline" className="text-xs">
                        {category.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Notification Preferences */}
        <Card className="shadow-soft mx-1 w-full max-w-full">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Notification Best Practices</CardTitle>
            <CardDescription className="text-sm md:text-base">Tips for managing your notifications effectively</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3">
                <h4 className="text-sm md:text-base font-medium">Stay Organized:</h4>
                <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                  <li>• Mark notifications as read after viewing</li>
                  <li>• Set priority levels for different alert types</li>
                  <li>• Use categories to filter important messages</li>
                  <li>• Enable sound alerts for urgent notifications</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm md:text-base font-medium">Customize Settings:</h4>
                <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                  <li>• Choose your preferred delivery methods</li>
                  <li>• Set quiet hours for non-urgent alerts</li>
                  <li>• Enable location-based weather alerts</li>
                  <li>• Subscribe to relevant market updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
