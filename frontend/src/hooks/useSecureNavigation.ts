/**
 * Secure navigation hook with permission checking
 */
import { useNavigate } from 'react-router-dom';
import { usePermissions } from './usePermissions';
import { UserRole } from '@/contexts/AuthContext';

interface NavigationOptions {
  checkPermission?: string;
  checkRole?: UserRole | UserRole[];
  checkRoute?: string;
  fallbackPath?: string;
  replace?: boolean;
}

export const useSecureNavigation = () => {
  const navigate = useNavigate();
  const { checkPermission, checkRole, checkRoute } = usePermissions();

  const secureNavigate = (path: string, options: NavigationOptions = {}) => {
    const {
      checkPermission: requiredPermission,
      checkRole: requiredRole,
      checkRoute: requiredRoute,
      fallbackPath = '/dashboard',
      replace = false,
    } = options;

    // Check permission if required
    if (requiredPermission && !checkPermission(requiredPermission)) {
      console.warn(`Navigation blocked: Missing permission '${requiredPermission}'`);
      navigate(fallbackPath, { replace });
      return false;
    }

    // Check role if required
    if (requiredRole && !checkRole(requiredRole)) {
      console.warn(`Navigation blocked: Role access denied for '${path}'`);
      navigate(fallbackPath, { replace });
      return false;
    }

    // Check route access if required
    if (requiredRoute && !checkRoute(requiredRoute)) {
      console.warn(`Navigation blocked: Route access denied for '${path}'`);
      navigate(fallbackPath, { replace });
      return false;
    }

    // Navigation allowed
    navigate(path, { replace });
    return true;
  };

  const navigateWithPermission = (path: string, permission: string, fallbackPath = '/dashboard') => {
    return secureNavigate(path, { checkPermission: permission, fallbackPath });
  };

  const navigateWithRole = (path: string, role: UserRole | UserRole[], fallbackPath = '/dashboard') => {
    return secureNavigate(path, { checkRole: role, fallbackPath });
  };

  const navigateWithRoute = (path: string, route: string, fallbackPath = '/dashboard') => {
    return secureNavigate(path, { checkRoute: route, fallbackPath });
  };

  // Convenience methods for common navigation patterns
  const goToDashboard = () => navigate('/dashboard');
  const goToLogin = () => navigate('/login');
  const goToProfile = () => navigate('/settings');
  
  const goToMarketplace = () => {
    return navigateWithPermission('/marketplace', 'view_marketplace');
  };

  const goToAnalytics = () => {
    return navigateWithPermission('/analytics', 'view_analytics');
  };

  const goToMonitoring = () => {
    return navigateWithPermission('/monitoring', 'view_monitoring');
  };

  const goToAgriGPT = () => {
    return navigateWithPermission('/agrigpt', 'use_agrigpt');
  };

  const goToCropDetection = () => {
    return navigateWithPermission('/crop-disease-detection', 'use_crop_detection');
  };

  const goToAdmin = () => {
    return navigateWithRole('/admin', 'admin');
  };

  return {
    secureNavigate,
    navigateWithPermission,
    navigateWithRole,
    navigateWithRoute,
    goToDashboard,
    goToLogin,
    goToProfile,
    goToMarketplace,
    goToAnalytics,
    goToMonitoring,
    goToAgriGPT,
    goToCropDetection,
    goToAdmin,
  };
};

export default useSecureNavigation;