/**
 * Dashboard Statistics Component using API hooks
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
  DollarSign
} from 'lucide-react';
import { useFarms } from '@/api/hooks/useFarms';
import { useProducts } from '@/api/hooks/useMarketplace';
import { useConversations } from '@/api/hooks/useAI';
import { useAuth } from '@/contexts/AuthContext';

export const DashboardStats: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch data using API hooks
  const { data: farmsData, isLoading: farmsLoading } = useFarms();
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations();

  const farms = farmsData?.results || [];
  const products = productsData?.results || [];
  const conversations = conversationsData?.results || [];

  // Calculate statistics
  const totalFarms = farms.length;
  const activeFarms = farms.filter(farm => farm.is_active).length;
  const totalProducts = products.length;
  const activeProducts = products.filter(product => product.is_active).length;
  const totalConversations = conversations.length;
  const recentConversations = conversations.filter(conv => {
    const lastActivity = new Date(conv.last_activity);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return lastActivity > dayAgo;
  }).length;

  const statsCards = [
    {
      title: 'My Farms',
      value: totalFarms,
      description: `${activeFarms} active farms`,
      icon: Sprout,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      progress: totalFarms > 0 ? (activeFarms / totalFarms) * 100 : 0,
      loading: farmsLoading,
    },
    {
      title: 'Products Listed',
      value: totalProducts,
      description: `${activeProducts} available`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      progress: totalProducts > 0 ? (activeProducts / totalProducts) * 100 : 0,
      loading: productsLoading,
    },
    {
      title: 'AI Conversations',
      value: totalConversations,
      description: `${recentConversations} in last 24h`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      progress: totalConversations > 0 ? (recentConversations / totalConversations) * 100 : 0,
      loading: conversationsLoading,
    },
    {
      title: 'Revenue This Month',
      value: '$2,450',
      description: '+12% from last month',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      progress: 75,
      loading: false,
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