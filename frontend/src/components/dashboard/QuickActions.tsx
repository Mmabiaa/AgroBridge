/**
 * Quick Actions Component for Dashboard
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Monitor, 
  TrendingUp, 
  ShoppingCart,
  Camera,
  Calendar,
  Sprout,
  Users,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
  roles?: string[];
}

export const QuickActions: React.FC = () => {
  const { user } = useAuth();

  const actions: QuickAction[] = [
    {
      id: 'agrigpt',
      title: 'Chat with AgriGPT',
      description: 'Get AI-powered farming advice',
      icon: Bot,
      href: '/agrigpt',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      roles: ['farmer', 'poultry_keeper', 'buyer', 'ngo'],
    },
    {
      id: 'monitoring',
      title: 'Farm Monitor',
      description: 'View real-time farm data',
      icon: Monitor,
      href: '/monitoring',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      roles: ['farmer', 'poultry_keeper', 'ngo'],
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Analyze farm performance',
      icon: TrendingUp,
      href: '/analytics',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      roles: ['farmer', 'poultry_keeper', 'ngo', 'admin'],
    },
    {
      id: 'marketplace',
      title: 'Browse Marketplace',
      description: 'Buy or sell products',
      icon: ShoppingCart,
      href: '/marketplace',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'crop-detection',
      title: 'Crop Detection',
      description: 'Scan for diseases',
      icon: Camera,
      href: '/crop-disease-detection',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      roles: ['farmer', 'poultry_keeper'],
    },
    {
      id: 'scheduling',
      title: 'Smart Scheduling',
      description: 'Manage farm tasks',
      icon: Calendar,
      href: '/smart-scheduling',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      roles: ['farmer', 'poultry_keeper'],
    },
    {
      id: 'farms',
      title: 'My Farms',
      description: 'Manage your farms',
      icon: Sprout,
      href: '/monitoring',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      roles: ['farmer', 'poultry_keeper'],
    },
    {
      id: 'community',
      title: 'Community',
      description: 'Connect with farmers',
      icon: Users,
      href: '/community',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  // Filter actions based on user role
  const filteredActions = actions.filter(action => {
    if (!action.roles) return true;
    return user && action.roles.includes(user.role);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Access your most used features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredActions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Link key={action.id} to={action.href}>
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center justify-center p-4 hover:shadow-md transition-all"
                >
                  <div className={`p-3 rounded-full ${action.bgColor} mb-2`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium text-center">{action.title}</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    {action.description}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
