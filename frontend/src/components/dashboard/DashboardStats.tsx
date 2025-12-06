/**
 * Dashboard Statistics Component using Analytics API
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sprout, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Users,
  DollarSign,
  Wifi,
  Bell,
  Calendar
} from 'lucide-react';
import { useDashboard } from '@/api/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';

export const DashboardStats: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch dashboard metrics from analytics API
  const { data: dashboardData, isLoading } = useDashboard();

  const statsCards = [
    {
      title: 'My Farms',
      value: dashboardData?.total_farms || 0,
      description: 'Total farms managed',
      icon: Sprout,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      progress: 85,
      loading: isLoading,
    },
    {
      title: 'Products Listed',
      value: dashboardData?.total_products || 0,
      description: 'Available in marketplace',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      progress: 70,
      loading: isLoading,
    },
    {
      title: 'Total Orders',
      value: dashboardData?.total_orders || 0,
      description: 'Orders processed',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      progress: 90,
      loading: isLoading,
    },
    {
      title: 'Revenue',
      value: dashboardData?.total_revenue 
        ? `$${dashboardData.total_revenue.toLocaleString()}` 
        : '$0',
      description: 'Total revenue earned',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      progress: 75,
      loading: isLoading,
    },
    {
      title: 'IoT Devices',
      value: dashboardData?.active_iot_devices || 0,
      description: 'Active sensors',
      icon: Wifi,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      progress: 95,
      loading: isLoading,
    },
    {
      title: 'Pending Tasks',
      value: dashboardData?.pending_tasks || 0,
      description: 'Tasks to complete',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      progress: 60,
      loading: isLoading,
    },
    {
      title: 'Notifications',
      value: dashboardData?.unread_notifications || 0,
      description: 'Unread messages',
      icon: Bell,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      progress: 40,
      loading: isLoading,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                stat.value
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
            {!stat.loading && (
              <div className="mt-2">
                <Progress value={stat.progress} className="h-1" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;