
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Notification Center
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stay informed with real-time alerts, updates, and important information 
            about your farm, weather, and market conditions.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold">{notificationStats.total}</div>
              <p className="text-sm text-muted-foreground">Total Notifications</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{notificationStats.unread}</div>
              <p className="text-sm text-muted-foreground">Unread</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600">{notificationStats.alerts}</div>
              <p className="text-sm text-muted-foreground">Urgent Alerts</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{notificationStats.delivered}</div>
              <p className="text-sm text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Notification Component */}
        <NotificationCenter />

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Methods */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Delivery Methods
              </CardTitle>
              <CardDescription>How notifications are being delivered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliveryMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${method.color}`} />
                      <span className="font-medium">{method.name}</span>
                    </div>
                    <Badge variant="outline">{method.count} sent</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Notification Categories
              </CardTitle>
              <CardDescription>Breakdown by notification type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryStats.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{category.count}</span>
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
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Notification Best Practices</CardTitle>
            <CardDescription>Tips for managing your notifications effectively</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Stay Organized:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Mark notifications as read after viewing</li>
                  <li>• Set priority levels for different alert types</li>
                  <li>• Use categories to filter important messages</li>
                  <li>• Enable sound alerts for urgent notifications</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Customize Settings:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
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
