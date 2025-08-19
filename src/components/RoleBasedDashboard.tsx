import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Bot, 
  Monitor, 
  TrendingUp, 
  ShoppingCart, 
  GraduationCap, 
  Users, 
  Settings,
  Shield,
  Camera,
  Mic,
  Calendar,
  Satellite,
  Wifi,
  Plane,
  Eye,
  Award,
  Calculator,
  Clock,
  AlertTriangle,
  HelpCircle,
  Database,
  Cog
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  permission?: string;
  role?: string[];
  color: string;
}

export const RoleBasedDashboard = () => {
  const { user, hasPermission } = useAuth();

  if (!user) return null;

  const getDashboardWidgets = (): DashboardWidget[] => {
    const baseWidgets: DashboardWidget[] = [
      {
        id: 'dashboard',
        title: 'Overview',
        description: 'Farm operations summary',
        icon: BarChart3,
        href: '/dashboard',
        permission: 'view_dashboard',
        color: 'bg-blue-500'
      }
    ];

    const roleSpecificWidgets: DashboardWidget[] = [];

    // Add widgets based on user role and permissions
    if (user.role === 'farmer' || user.role === 'poultry_keeper') {
      roleSpecificWidgets.push(
        {
          id: 'monitoring',
          title: 'Farm Monitor',
          description: 'Real-time farm monitoring',
          icon: Monitor,
          href: '/monitoring',
          permission: 'view_monitoring',
          color: 'bg-green-500'
        },
        {
          id: 'analytics',
          title: 'Analytics',
          description: 'Predictive insights',
          icon: TrendingUp,
          href: '/analytics',
          permission: 'view_analytics',
          color: 'bg-purple-500'
        },
        {
          id: 'agrigpt',
          title: 'AgriGPT',
          description: 'AI farming assistant',
          icon: Bot,
          href: '/agrigpt',
          permission: 'use_agrigpt',
          color: 'bg-indigo-500'
        },
        {
          id: 'crop-detection',
          title: 'Crop Detection',
          description: 'AI disease detection',
          icon: Camera,
          href: '/crop-disease-detection',
          permission: 'use_crop_detection',
          color: 'bg-orange-500'
        },
        {
          id: 'voice-commands',
          title: 'Voice Control',
          description: 'Voice-activated commands',
          icon: Mic,
          href: '/voice-commands',
          permission: 'use_voice_commands',
          color: 'bg-pink-500'
        },
        {
          id: 'scheduling',
          title: 'Smart Scheduling',
          description: 'Automated task planning',
          icon: Clock,
          href: '/smart-scheduling',
          permission: 'view_smart_scheduling',
          color: 'bg-teal-500'
        },
        {
          id: 'financial',
          title: 'Financial Planning',
          description: 'Farm financial management',
          icon: Calculator,
          href: '/financial-planning',
          permission: 'view_financial_planning',
          color: 'bg-emerald-500'
        }
      );

      // Advanced features for farmers
      if (user.role === 'farmer') {
        roleSpecificWidgets.push(
          {
            id: 'satellite',
            title: 'Satellite Data',
            description: 'Satellite imagery analysis',
            icon: Satellite,
            href: '/satellite-integration',
            permission: 'use_satellite_integration',
            color: 'bg-cyan-500'
          },
          {
            id: 'drone',
            title: 'Drone Control',
            description: 'Drone monitoring system',
            icon: Plane,
            href: '/drone-integration',
            permission: 'use_drone_integration',
            color: 'bg-sky-500'
          },
          {
            id: 'ar',
            title: 'AR Visualization',
            description: 'Augmented reality view',
            icon: Eye,
            href: '/ar-visualization',
            permission: 'use_ar_visualization',
            color: 'bg-violet-500'
          }
        );
      }

      // IoT sensors for both
      roleSpecificWidgets.push({
        id: 'iot',
        title: 'IoT Sensors',
        description: 'Smart sensor network',
        icon: Wifi,
        href: '/iot-sensor-network',
        permission: 'use_iot_sensors',
        color: 'bg-amber-500'
      });
    }

    if (user.role === 'buyer') {
      roleSpecificWidgets.push(
        {
          id: 'marketplace',
          title: 'Marketplace',
          description: 'Buy agricultural products',
          icon: ShoppingCart,
          href: '/marketplace',
          permission: 'view_marketplace',
          color: 'bg-green-500'
        },
        {
          id: 'learning',
          title: 'Learning Center',
          description: 'Educational resources',
          icon: GraduationCap,
          href: '/learning',
          permission: 'view_learning',
          color: 'bg-blue-500'
        },
        {
          id: 'voice-commands',
          title: 'Voice Control',
          description: 'Voice-activated commands',
          icon: Mic,
          href: '/voice-commands',
          permission: 'use_voice_commands',
          color: 'bg-pink-500'
        }
      );
    }

    if (user.role === 'ngo') {
      roleSpecificWidgets.push(
        {
          id: 'monitoring',
          title: 'Farm Monitor',
          description: 'Community farm monitoring',
          icon: Monitor,
          href: '/monitoring',
          permission: 'view_monitoring',
          color: 'bg-green-500'
        },
        {
          id: 'analytics',
          title: 'Analytics',
          description: 'Community insights',
          icon: TrendingUp,
          href: '/analytics',
          permission: 'view_analytics',
          color: 'bg-purple-500'
        },
        {
          id: 'community',
          title: 'Community',
          description: 'Manage community',
          icon: Users,
          href: '/community',
          permission: 'view_community',
          color: 'bg-indigo-500'
        },
        {
          id: 'content',
          title: 'Content Management',
          description: 'Create and edit content',
          icon: Database,
          href: '/learning',
          permission: 'manage_content',
          color: 'bg-orange-500'
        }
      );
    }

    if (user.role === 'admin') {
      roleSpecificWidgets.push(
        {
          id: 'admin-panel',
          title: 'Admin Panel',
          description: 'System administration',
          icon: Shield,
          href: '/admin',
          permission: 'view_admin_dashboard',
          color: 'bg-red-500'
        },
        {
          id: 'user-management',
          title: 'User Management',
          description: 'Manage system users',
          icon: Users,
          href: '/admin',
          permission: 'manage_users',
          color: 'bg-rose-500'
        },
        {
          id: 'system-settings',
          title: 'System Settings',
          description: 'System configuration',
          icon: Cog,
          href: '/admin',
          permission: 'manage_system',
          color: 'bg-slate-500'
        }
      );
    }

    // Filter widgets based on permissions
    return [...baseWidgets, ...roleSpecificWidgets].filter(widget => {
      if (widget.permission && !hasPermission(widget.permission)) {
        return false;
      }
      if (widget.role && !widget.role.includes(user.role)) {
        return false;
      }
      return true;
    });
  };

  const widgets = getDashboardWidgets();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your {user.role === 'farmer' ? 'farm' : user.role === 'buyer' ? 'purchases' : user.role === 'ngo' ? 'community' : 'system'} today.
        </p>
        <Badge variant="secondary" className="capitalize">
          {user.role.replace('_', ' ')} Role
        </Badge>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <Card key={widget.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${widget.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {widget.permission ? 'Protected' : 'Public'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">{widget.title}</CardTitle>
                <CardDescription className="mb-4">
                  {widget.description}
                </CardDescription>
                <Link to={widget.href}>
                  <Button className="w-full" variant="outline">
                    Access {widget.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Role-specific Information */}
      {user.role === 'farmer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Farming Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              As a farmer, you have access to advanced monitoring tools, AI assistance, and comprehensive analytics to optimize your farm operations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">24/7</div>
                <div className="text-sm text-green-600">Monitoring</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">AI</div>
                <div className="text-sm text-blue-600">Assistance</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">Smart</div>
                <div className="text-sm text-purple-600">Planning</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user.role === 'buyer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Buyer Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              As a buyer, you can access quality agricultural products, learn about farming practices, and connect with the farming community.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">Quality</div>
                <div className="text-sm text-green-600">Products</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">Learning</div>
                <div className="text-sm text-blue-600">Resources</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user.role === 'ngo' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              As an NGO representative, you can monitor community farms, create educational content, and manage community initiatives.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">Monitor</div>
                <div className="text-sm text-green-600">Farms</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">Create</div>
                <div className="text-sm text-blue-600">Content</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">Manage</div>
                <div className="text-sm text-purple-600">Community</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Administration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              As an administrator, you have full access to system management, user administration, and system monitoring capabilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">Users</div>
                <div className="text-sm text-red-600">Management</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">System</div>
                <div className="text-sm text-blue-600">Control</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">Monitor</div>
                <div className="text-sm text-purple-600">Logs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 