/**
 * PermissionGate component for conditional rendering based on permissions
 */
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/contexts/AuthContext';

interface PermissionGateProps {
  /**
   * Single permission required
   */
  permission?: string;
  
  /**
   * Multiple permissions required
   */
  permissions?: string[];
  
  /**
   * Whether all permissions are required (AND) or any permission (OR)
   * @default true
   */
  requireAll?: boolean;
  
  /**
   * Required role(s)
   */
  role?: UserRole | UserRole[];
  
  /**
   * Required route access
   */
  route?: string;
  
  /**
   * Content to render when permission is granted
   */
  children: React.ReactNode;
  
  /**
   * Content to render when permission is denied
   * @default null
   */
  fallback?: React.ReactNode;
  
  /**
   * Whether to render nothing when permission is denied
   * @default true
   */
  hideOnDenied?: boolean;
}

/**
 * PermissionGate component
 * 
 * Conditionally renders children based on user permissions, roles, or route access.
 * 
 * @example
 * // Single permission
 * <PermissionGate permission="create_product">
 *   <Button>Create Product</Button>
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (all required)
 * <PermissionGate permissions={["edit_product", "delete_product"]} requireAll>
 *   <Button>Manage Product</Button>
 * </PermissionGate>
 * 
 * @example
 * // Role-based
 * <PermissionGate role="admin">
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * @example
 * // With fallback
 * <PermissionGate permission="view_analytics" fallback={<UpgradePrompt />}>
 *   <AnalyticsDashboard />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = true,
  role,
  route,
  children,
  fallback = null,
  hideOnDenied = true,
}) => {
  const {
    checkPermission,
    checkMultiplePermissions,
    checkRole,
    checkRoute,
  } = usePermissions();

  // Check single permission
  if (permission && !checkPermission(permission)) {
    return hideOnDenied ? null : <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && !checkMultiplePermissions(permissions, requireAll)) {
    return hideOnDenied ? null : <>{fallback}</>;
  }

  // Check role
  if (role && !checkRole(role)) {
    return hideOnDenied ? null : <>{fallback}</>;
  }

  // Check route access
  if (route && !checkRoute(route)) {
    return hideOnDenied ? null : <>{fallback}</>;
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Convenience components for common use cases
 */

interface RoleGateProps {
  role: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGate - Simplified component for role-based rendering
 */
export const RoleGate: React.FC<RoleGateProps> = ({ role, children, fallback }) => {
  return (
    <PermissionGate role={role} fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

/**
 * AdminOnly - Renders children only for admin users
 */
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => {
  return (
    <RoleGate role="admin" fallback={fallback}>
      {children}
    </RoleGate>
  );
};

/**
 * FarmerOnly - Renders children only for farmer/poultry_keeper users
 */
export const FarmerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => {
  return (
    <RoleGate role={['farmer', 'poultry_keeper']} fallback={fallback}>
      {children}
    </RoleGate>
  );
};

/**
 * BuyerOnly - Renders children only for buyer users
 */
export const BuyerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => {
  return (
    <RoleGate role="buyer" fallback={fallback}>
      {children}
    </RoleGate>
  );
};

export default PermissionGate;
