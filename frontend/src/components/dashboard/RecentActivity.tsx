/**
 * Recent Activity Component using Analytics API
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  ShoppingCart, 
  Sprout, 
  Camera,
  Clock,
  ExternalLink,
  Activity,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '@/api/hooks/useAnalytics';

export const RecentActivity: React.FC = () => {
  const { data: dashboardData, isLoading } = useDashboard();

  const recentActivity = dashboardData?.recent_activity || [];

  // Map activity types to icons and colors
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'farm':
        return { icon: Sprout, color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'product':
      case 'order':
        return { icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'conversation':
      case 'message':
        return { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-50' };
      case 'scan':
      case 'detection':
        return { icon: Camera, color: 'text-orange-600', bgColor: 'bg-orange-50' };
      case 'alert':
        return { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' };
      default:
        return { icon: Activity, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Your latest updates and interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="animate-pulse bg-gray-200 h-10 w-10 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-3 w-1/2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Start by creating a farm or listing a product</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const { icon: Icon, color, bgColor } = getActivityIcon(activity.type);
              
              return (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${bgColor}`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground capitalize">{activity.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {recentActivity.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/notifications">
                View All Activity
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
