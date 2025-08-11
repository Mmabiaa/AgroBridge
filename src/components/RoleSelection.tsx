import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Shield,
  ShoppingCart,
  Users,
  Bot,
  Monitor,
  TrendingUp,
  Camera,
  Mic,
  Satellite,
  Wifi,
  Plane,
  Eye,
  Award,
  Calculator,
  Clock,
  Database,
  Cog
} from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void;
  selectedRole?: UserRole;
  showDescription?: boolean;
}

interface RoleInfo {
  role: UserRole;
  title: string;
  description: string;
  icon: any;
  features: string[];
  color: string;
  badgeColor: string;
}

const roleInformation: Record<UserRole, RoleInfo> = {
  farmer: {
    role: 'farmer',
    title: 'Farmer',
    description: 'Full access to farming tools, AI assistance, and advanced monitoring',
    icon: User,
    features: [
      'AI-powered farming assistant (AgriGPT)',
      'Crop disease detection',
      'Voice commands',
      'Real-time farm monitoring',
      'Predictive analytics',
      'Smart scheduling',
      'Financial planning',
      'Advanced technologies (Satellite, IoT, Drones, AR)'
    ],
    color: 'bg-green-500',
    badgeColor: 'bg-green-100 text-green-800'
  },
  poultry_keeper: {
    role: 'poultry_keeper',
    title: 'Poultry Keeper',
    description: 'Specialized tools for poultry farming and management',
    icon: User,
    features: [
      'AI-powered farming assistant (AgriGPT)',
      'Crop disease detection',
      'Voice commands',
      'Real-time farm monitoring',
      'Predictive analytics',
      'Smart scheduling',
      'Financial planning',
      'IoT sensor integration'
    ],
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  buyer: {
    role: 'buyer',
    title: 'Buyer',
    description: 'Access to marketplace and learning resources',
    icon: ShoppingCart,
    features: [
      'Browse marketplace',
      'Place orders',
      'View order history',
      'Learning center access',
      'Community participation',
      'Basic financial planning'
    ],
    color: 'bg-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  ngo: {
    role: 'ngo',
    title: 'NGO Representative',
    description: 'Community management and content creation tools',
    icon: Users,
    features: [
      'Community farm monitoring',
      'Content creation and management',
      'Community moderation',
      'Analytics and insights',
      'Satellite and IoT access',
      'Educational resource management'
    ],
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  admin: {
    role: 'admin',
    title: 'Administrator',
    description: 'Full system access and management capabilities',
    icon: Shield,
    features: [
      'User management',
      'System administration',
      'Content management',
      'System monitoring',
      'All platform features',
      'Advanced analytics and logs'
    ],
    color: 'bg-red-500',
    badgeColor: 'bg-red-100 text-red-800'
  }
};

export const RoleSelection = ({ onRoleSelect, selectedRole, showDescription = true }: RoleSelectionProps) => {
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Choose Your Role</h2>
        <p className="text-muted-foreground">
          Select the role that best describes your needs and access level
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(roleInformation).map((roleInfo) => {
          const Icon = roleInfo.icon;
          const isSelected = selectedRole === roleInfo.role;
          const isHovered = hoveredRole === roleInfo.role;

          return (
            <Card
              key={roleInfo.role}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => onRoleSelect(roleInfo.role)}
              onMouseEnter={() => setHoveredRole(roleInfo.role)}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${roleInfo.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge className={roleInfo.badgeColor}>
                    {isSelected ? 'Selected' : 'Available'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">{roleInfo.title}</CardTitle>
                <CardDescription className="mb-4">
                  {roleInfo.description}
                </CardDescription>
                
                {showDescription && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Key Features:</h4>
                    <ul className="space-y-1">
                      {roleInfo.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          {feature}
                        </li>
                      ))}
                      {roleInfo.features.length > 4 && (
                        <li className="text-xs text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          +{roleInfo.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <Button 
                  className={`w-full mt-4 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  variant={isSelected ? 'default' : 'secondary'}
                >
                  {isSelected ? 'Role Selected' : `Select ${roleInfo.title}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedRole && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Role Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You have selected the <strong>{roleInformation[selectedRole].title}</strong> role. 
              This will give you access to all the features and tools appropriate for your needs.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {selectedRole.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Role selected successfully
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 