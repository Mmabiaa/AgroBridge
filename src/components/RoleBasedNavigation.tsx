import { useAuth } from '@/contexts/AuthContext';
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
  Wheat,
  Globe,
  Bell,
  Search,
  Camera,
  Mic,
  Calendar,
  User,
  Database,
  Cog,
  FileText,
  MapPin,
  Satellite,
  Wifi,
  Plane,
  Eye,
  Award,
  Calculator,
  Clock,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

interface NavigationItem {
  href: string;
  label: string;
  icon: any;
  permission?: string;
  role?: string[];
  description?: string;
}

export const useRoleBasedNavigation = () => {
  const { user, hasPermission } = useAuth();

  const allNavigationItems: NavigationItem[] = [
    // Core Dashboard
    { 
      href: '/dashboard', 
      label: 'Dashboard', 
      icon: BarChart3, 
      permission: 'view_dashboard',
      description: 'Overview of your farm operations'
    },
    
    // AI and Smart Tools
    { 
      href: '/agrigpt', 
      label: 'AgriGPT', 
      icon: Bot, 
      permission: 'use_agrigpt',
      description: 'AI-powered farming assistant'
    },
    { 
      href: '/crop-disease-detection', 
      label: 'Crop Detection', 
      icon: Camera, 
      permission: 'use_crop_detection',
      description: 'Detect crop diseases using AI'
    },
    { 
      href: '/voice-commands', 
      label: 'Voice Commands', 
      icon: Mic, 
      permission: 'use_voice_commands',
      description: 'Control system with voice'
    },
    
    // Monitoring and Analytics
    { 
      href: '/monitoring', 
      label: 'Farm Monitor', 
      icon: Monitor, 
      permission: 'view_monitoring',
      description: 'Real-time farm monitoring'
    },
    { 
      href: '/analytics', 
      label: 'Analytics', 
      icon: TrendingUp, 
      permission: 'view_analytics',
      description: 'Predictive analytics and insights'
    },
    
    // Marketplace and Commerce
    { 
      href: '/marketplace', 
      label: 'Marketplace', 
      icon: ShoppingCart, 
      permission: 'view_marketplace',
      description: 'Buy and sell agricultural products'
    },
    
    // Planning and Management
    { 
      href: '/crop-calendar', 
      label: 'Crop Calendar', 
      icon: Calendar, 
      permission: 'view_smart_scheduling',
      description: 'Plan your crop cycles'
    },
    { 
      href: '/smart-scheduling', 
      label: 'Smart Scheduling', 
      icon: Clock, 
      permission: 'view_smart_scheduling',
      description: 'Automated task scheduling'
    },
    { 
      href: '/financial-planning', 
      label: 'Financial Planning', 
      icon: Calculator, 
      permission: 'view_financial_planning',
      description: 'Manage farm finances'
    },
    
    // Learning and Community
    { 
      href: '/learning', 
      label: 'Learning Center', 
      icon: GraduationCap, 
      permission: 'view_learning',
      description: 'Educational resources and courses'
    },
    { 
      href: '/community', 
      label: 'Community', 
      icon: Users, 
      permission: 'view_community',
      description: 'Connect with other farmers'
    },
    { 
      href: '/farmer-stories', 
      label: 'Farmer Stories', 
      icon: FileText, 
      permission: 'view_community',
      description: 'Success stories and experiences'
    },
    
    // Advanced Technologies
    { 
      href: '/satellite-integration', 
      label: 'Satellite Data', 
      icon: Satellite, 
      permission: 'use_satellite_integration',
      description: 'Satellite imagery and data'
    },
    { 
      href: '/iot-sensor-network', 
      label: 'IoT Sensors', 
      icon: Wifi, 
      permission: 'use_iot_sensors',
      description: 'Smart sensor network'
    },
    { 
      href: '/drone-integration', 
      label: 'Drone Control', 
      icon: Plane, 
      permission: 'use_drone_integration',
      description: 'Drone monitoring and control'
    },
    { 
      href: '/ar-visualization', 
      label: 'AR Visualization', 
      icon: Eye, 
      permission: 'use_ar_visualization',
      description: 'Augmented reality farm view'
    },
    { 
      href: '/blockchain-certificates', 
      label: 'Blockchain', 
      icon: Award, 
      permission: 'use_blockchain',
      description: 'Digital certificates and traceability'
    },
    
    // System and Settings (kept universal for usability)
    { 
      href: '/settings', 
      label: 'Settings', 
      icon: Settings, 
      description: 'Account and system settings'
    },
    { 
      href: '/notifications', 
      label: 'Notifications', 
      icon: Bell, 
      description: 'System notifications and alerts'
    },
    { 
      href: '/support', 
      label: 'Support', 
      icon: HelpCircle, 
      description: 'Help and support resources'
    },
    
    // Admin Features
    { 
      href: '/admin', 
      label: 'Admin Panel', 
      icon: Shield, 
      permission: 'view_admin_dashboard',
      role: ['admin'],
      description: 'System administration'
    },
  ];

  // Filter navigation items based on user permissions and role
  const getFilteredNavigation = (): NavigationItem[] => {
    if (!user) return [];

    return allNavigationItems.filter(item => {
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }
      if (item.role && !item.role.includes(user.role)) {
        return false;
      }
      return true;
    });
  };

  // STRICT role-based navigation using user's accessibleRoutes whitelist
  const getRoleNavigation = (): NavigationItem[] => {
    if (!user) return [];
    const filtered = getFilteredNavigation();
    const accessible = new Set(user.accessibleRoutes || []);

    // Special case: Admins should only see admin-related items in the navbar
    if (user.role === 'admin') {
      const adminOnly = new Set(['/admin', '/settings', '/notifications', '/support' ]);
      return filtered.filter(item => adminOnly.has(item.href));
    }

    // Keep some universal items regardless of accessibleRoutes for UX
    const universalHrefs = new Set(['/settings', '/notifications', '/support','/voice-commands']);

    return filtered.filter(item => {
      if (universalHrefs.has(item.href)) return true;
      return accessible.has(item.href);
    });
  };

  // Group navigation items by category
  const getGroupedNavigation = () => {
    const filteredItems = getRoleNavigation();
    
    const groups = {
      core: filteredItems.filter(item => 
        ['/dashboard', '/agrigpt', '/monitoring', '/analytics'].includes(item.href)
      ),
      tools: filteredItems.filter(item => 
        ['/crop-disease-detection', '/voice-commands', '/crop-calendar', '/smart-scheduling'].includes(item.href)
      ),
      commerce: filteredItems.filter(item => 
        ['/marketplace', '/financial-planning'].includes(item.href)
      ),
      learning: filteredItems.filter(item => 
        ['/learning', '/community', '/farmer-stories'].includes(item.href)
      ),
      advanced: filteredItems.filter(item => 
        ['/satellite-integration', '/iot-sensor-network', '/drone-integration', '/ar-visualization', '/blockchain-certificates'].includes(item.href)
      ),
      system: filteredItems.filter(item => 
        ['/settings', '/notifications', '/support'].includes(item.href)
      ),
      admin: filteredItems.filter(item => 
        item.href === '/admin'
      )
    };

    return groups;
  };

  return {
    allNavigationItems,
    getFilteredNavigation,
    getRoleNavigation,
    getGroupedNavigation,
    user
  };
}; 