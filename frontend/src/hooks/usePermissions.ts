/**
 * Permission management hooks and utilities
 */
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/contexts/AuthContext';

// Permission constants
export const PERMISSIONS = {
  // Dashboard and Core
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_MONITORING: 'view_monitoring',
  
  // AI and Smart Tools
  USE_AGRIGPT: 'use_agrigpt',
  USE_CROP_DETECTION: 'use_crop_detection',
  USE_VOICE_COMMANDS: 'use_voice_commands',
  
  // Marketplace
  VIEW_MARKETPLACE: 'view_marketplace',
  CREATE_PRODUCT: 'create_product',
  EDIT_PRODUCT: 'edit_product',
  DELETE_PRODUCT: 'delete_product',
  PLACE_ORDERS: 'place_orders',
  VIEW_ORDERS: 'view_orders',
  
  // Learning and Community
  VIEW_LEARNING: 'view_learning',
  VIEW_COMMUNITY: 'view_community',
  CREATE_CONTENT: 'create_content',
  EDIT_CONTENT: 'edit_content',
  DELETE_CONTENT: 'delete_content',
  MODERATE_COMMUNITY: 'moderate_community',
  
  // Advanced Technologies
  USE_SATELLITE_INTEGRATION: 'use_satellite_integration',
  USE_IOT_SENSORS: 'use_iot_sensors',
  USE_DRONE_INTEGRATION: 'use_drone_integration',
  USE_AR_VISUALIZATION: 'use_ar_visualization',
  USE_BLOCKCHAIN: 'use_blockchain',
  
  // Planning and Management
  VIEW_FINANCIAL_PLANNING: 'view_financial_planning',
  CREATE_PLANS: 'create_plans',
  VIEW_SMART_SCHEDULING: 'view_smart_scheduling',
  
  // Admin
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  MANAGE_USERS: 'manage_users',
  MANAGE_SYSTEM: 'manage_system',
  MANAGE_CONTENT: 'manage_content',
  VIEW_LOGS: 'view_logs',
} as const;

// Route constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  AGRIGPT: '/agrigpt',
  MONITORING: '/monitoring',
  ANALYTICS: '/analytics',
  MARKETPLACE: '/marketplace',
  CROP_DISEASE_DETECTION: '/crop-disease-detection',
  VOICE_COMMANDS: '/voice-commands',
  LEARNING: '/learning',
  COMMUNITY: '/community',
  FINANCIAL_PLANNING: '/financial-planning',
  SMART_SCHEDULING: '/smart-scheduling',
  ADMIN: '/admin',
} as const;

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  farmer: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_MONITORING,
    PERMISSIONS.USE_AGRIGPT,
    PERMISSIONS.USE_CROP_DETECTION,
    PERMISSIONS.USE_VOICE_COMMANDS,
    PERMISSIONS.VIEW_MARKETPLACE,
    PERMISSIONS.PLACE_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_LEARNING,
    PERMISSIONS.VIEW_COMMUNITY,
    PERMISSIONS.USE_SATELLITE_INTEGRATION,
    PERMISSIONS.USE_IOT_SENSORS,
    PERMISSIONS.USE_DRONE_INTEGRATION,
    PERMISSIONS.USE_AR_VISUALIZATION,
    PERMISSIONS.VIEW_FINANCIAL_PLANNING,
    PERMISSIONS.CREATE_PLANS,
    PERMISSIONS.VIEW_SMART_SCHEDULING,
  ],
  poultry_keeper: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_MONITORING,
    PERMISSIONS.USE_AGRIGPT,
    PERMISSIONS.USE_CROP_DETECTION,
    PERMISSIONS.USE_VOICE_COMMANDS,
    PERMISSIONS.VIEW_MARKETPLACE,
    PERMISSIONS.PLACE_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_LEARNING,
    PERMISSIONS.VIEW_COMMUNITY,
    PERMISSIONS.USE_IOT_SENSORS,
    PERMISSIONS.VIEW_FINANCIAL_PLANNING,
    PERMISSIONS.CREATE_PLANS,
    PERMISSIONS.VIEW_SMART_SCHEDULING,
  ],
  buyer: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MARKETPLACE,
    PERMISSIONS.PLACE_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_LEARNING,
    PERMISSIONS.VIEW_COMMUNITY,
    PERMISSIONS.VIEW_FINANCIAL_PLANNING,
    PERMISSIONS.USE_VOICE_COMMANDS,
  ],
  ngo: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_MONITORING,
    PERMISSIONS.USE_AGRIGPT,
    PERMISSIONS.VIEW_MARKETPLACE,
    PERMISSIONS.VIEW_LEARNING,
    PERMISSIONS.VIEW_COMMUNITY,
    PERMISSIONS.MODERATE_COMMUNITY,
    PERMISSIONS.CREATE_CONTENT,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.USE_SATELLITE_INTEGRATION,
    PERMISSIONS.USE_IOT_SENSORS,
    PERMISSIONS.VIEW_FINANCIAL_PLANNING,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.USE_VOICE_COMMANDS,
  ],
  admin: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
};

// Role-based route access mapping
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  farmer: [
    ROUTES.DASHBOARD,
    ROUTES.ANALYTICS,
    ROUTES.MONITORING,
    ROUTES.AGRIGPT,
    ROUTES.CROP_DISEASE_DETECTION,
    ROUTES.VOICE_COMMANDS,
    ROUTES.MARKETPLACE,
    ROUTES.LEARNING,
    ROUTES.COMMUNITY,
    ROUTES.FINANCIAL_PLANNING,
    ROUTES.SMART_SCHEDULING,
  ],
  poultry_keeper: [
    ROUTES.DASHBOARD,
    ROUTES.ANALYTICS,
    ROUTES.MONITORING,
    ROUTES.AGRIGPT,
    ROUTES.CROP_DISEASE_DETECTION,
    ROUTES.VOICE_COMMANDS,
    ROUTES.MARKETPLACE,
    ROUTES.LEARNING,
    ROUTES.COMMUNITY,
    ROUTES.FINANCIAL_PLANNING,
    ROUTES.SMART_SCHEDULING,
  ],
  buyer: [
    ROUTES.DASHBOARD,
    ROUTES.MARKETPLACE,
    ROUTES.LEARNING,
    ROUTES.COMMUNITY,
    ROUTES.FINANCIAL_PLANNING,
    ROUTES.VOICE_COMMANDS,
  ],
  ngo: [
    ROUTES.DASHBOARD,
    ROUTES.ANALYTICS,
    ROUTES.MONITORING,
    ROUTES.AGRIGPT,
    ROUTES.MARKETPLACE,
    ROUTES.LEARNING,
    ROUTES.COMMUNITY,
    ROUTES.FINANCIAL_PLANNING,
    ROUTES.VOICE_COMMANDS,
  ],
  admin: [
    // Admin has access to all routes
    ...Object.values(ROUTES),
    ROUTES.ADMIN,
  ],
};

/**
 * Hook for checking permissions
 */
export const usePermissions = () => {
  const { user, hasPermission, canAccessRoute } = useAuth();

  const checkPermission = (permission: string): boolean => {
    return hasPermission(permission);
  };

  const checkMultiplePermissions = (permissions: string[], requireAll = true): boolean => {
    if (requireAll) {
      return permissions.every(permission => hasPermission(permission));
    } else {
      return permissions.some(permission => hasPermission(permission));
    }
  };

  const checkRoute = (route: string): boolean => {
    return canAccessRoute(route);
  };

  const checkRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const getUserPermissions = (): string[] => {
    return user?.permissions || [];
  };

  const getUserRoutes = (): string[] => {
    return user?.accessibleRoutes || [];
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isFarmer = (): boolean => {
    return user?.role === 'farmer' || user?.role === 'poultry_keeper';
  };

  const isBuyer = (): boolean => {
    return user?.role === 'buyer';
  };

  const isNGO = (): boolean => {
    return user?.role === 'ngo';
  };

  return {
    user,
    checkPermission,
    checkMultiplePermissions,
    checkRoute,
    checkRole,
    getUserPermissions,
    getUserRoutes,
    isAdmin,
    isFarmer,
    isBuyer,
    isNGO,
    // Convenience methods for common permissions
    canViewDashboard: () => checkPermission(PERMISSIONS.VIEW_DASHBOARD),
    canViewAnalytics: () => checkPermission(PERMISSIONS.VIEW_ANALYTICS),
    canViewMonitoring: () => checkPermission(PERMISSIONS.VIEW_MONITORING),
    canUseAgriGPT: () => checkPermission(PERMISSIONS.USE_AGRIGPT),
    canUseCropDetection: () => checkPermission(PERMISSIONS.USE_CROP_DETECTION),
    canViewMarketplace: () => checkPermission(PERMISSIONS.VIEW_MARKETPLACE),
    canCreateProduct: () => checkPermission(PERMISSIONS.CREATE_PRODUCT),
    canPlaceOrders: () => checkPermission(PERMISSIONS.PLACE_ORDERS),
    canViewLearning: () => checkPermission(PERMISSIONS.VIEW_LEARNING),
    canViewCommunity: () => checkPermission(PERMISSIONS.VIEW_COMMUNITY),
    canModerateCommunity: () => checkPermission(PERMISSIONS.MODERATE_COMMUNITY),
    canManageUsers: () => checkPermission(PERMISSIONS.MANAGE_USERS),
    canViewAdminDashboard: () => checkPermission(PERMISSIONS.VIEW_ADMIN_DASHBOARD),
  };
};

/**
 * Hook for role-based conditional rendering
 */
export const useRoleAccess = () => {
  const { user } = useAuth();

  const showForRoles = (roles: UserRole | UserRole[], children: React.ReactNode): React.ReactNode | null => {
    if (!user) return null;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role) ? children : null;
  };

  const hideForRoles = (roles: UserRole | UserRole[], children: React.ReactNode): React.ReactNode | null => {
    if (!user) return null;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return !roleArray.includes(user.role) ? children : null;
  };

  return {
    showForRoles,
    hideForRoles,
    showForFarmers: (children: React.ReactNode) => showForRoles(['farmer', 'poultry_keeper'], children),
    showForBuyers: (children: React.ReactNode) => showForRoles('buyer', children),
    showForNGOs: (children: React.ReactNode) => showForRoles('ngo', children),
    showForAdmins: (children: React.ReactNode) => showForRoles('admin', children),
    hideForFarmers: (children: React.ReactNode) => hideForRoles(['farmer', 'poultry_keeper'], children),
    hideForBuyers: (children: React.ReactNode) => hideForRoles('buyer', children),
    hideForNGOs: (children: React.ReactNode) => hideForRoles('ngo', children),
    hideForAdmins: (children: React.ReactNode) => hideForRoles('admin', children),
  };
};

/**
 * Higher-order component for permission-based rendering
 */
interface WithPermissionProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: UserRole | UserRole[];
  route?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const WithPermission = ({
  permission,
  permissions,
  requireAll = true,
  role,
  route,
  fallback = null,
  children,
}: WithPermissionProps): React.ReactNode => {
  const { checkPermission, checkMultiplePermissions, checkRole, checkRoute } = usePermissions();

  // Check single permission
  if (permission && !checkPermission(permission)) {
    return fallback;
  }

  // Check multiple permissions
  if (permissions && !checkMultiplePermissions(permissions, requireAll)) {
    return fallback;
  }

  // Check role
  if (role && !checkRole(role)) {
    return fallback;
  }

  // Check route access
  if (route && !checkRoute(route)) {
    return fallback;
  }

  return children;
};

export default usePermissions;