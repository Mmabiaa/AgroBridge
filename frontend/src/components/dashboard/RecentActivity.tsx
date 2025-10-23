/**
 * Recent Activity Component using API hooks
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
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConversations } from '@/api/hooks/useAI';
import { useProducts } from '@/api/hooks/useMarketplace';
import { useFarms } from '@/api/hooks/useFarms';

export const RecentActivity: React.FC = () => {
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations({ page: 1, page_size: 3 });
  const { data: productsData, isLoading: productsLoading } = useProducts({ page: 1, page_size: 3 });
  const { data: farmsData, isLoading: farmsLoading } = useFarms({ page: 1, page_size: 3 });

  const conversations = conversationsData?.results || [];
  const products = productsData?.results || [];
  const farms = farmsData?.results || [];

  // Combine and sort activities by date
  const activities = [
    ...conversations.map(conv => ({
      id: conv.id,
      type: 'conversation',
      title: conv.title,
      description: `${conv.message_count} messages`,
      timestamp: conv.last_activity,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: `/agrigpt?conversation=${conv.id}`,
    })),
    ...products.map(product => ({
      id: product.id,
      type: 'product',
      title: product.name,
      description: `$${product.price} per ${product.unit}`,
      timestamp: product.updated_at,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: `/marketplace?product=${product.id}`,
    })),
    ...farms.map(farm => ({
      id: farm.id,
      type: 'farm',
      title: farm.name,
      description: `${farm.size_hectares} hectares`,
      timestamp: farm.updated_at,
      icon: Sprout,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: `/monitoring?farm=${farm.id}`,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

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

  const isLoading = conversationsLoading || productsLoading || farmsLoading;

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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="animate-pulse bg-gray-200 h-10 w-10 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-3 w-1/2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Start by creating a farm or listing a product</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${activity.bgColor}`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={activity.link}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activities.length > 0 && (
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