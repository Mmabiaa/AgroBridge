import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, ROUTES } from '@/hooks/usePermissions';

/**
 * Route guard that automatically redirects users based on their role and permissions
 */
export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { checkRoute } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while loading or if not authenticated
    if (isLoading || !isAuthenticated || !user) {
      return;
    }

    const currentPath = location.pathname;

    // Allow access to public routes
    const publicRoutes = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.REGISTER, '/forgot-password', '/reset-password'];
    if (publicRoutes.includes(currentPath)) {
      return;
    }

    // Check if user can access the current route
    if (!checkRoute(currentPath)) {
      // Redirect to appropriate default route based on role
      const defaultRoute = getDefaultRouteForRole(user.role);
      if (currentPath !== defaultRoute) {
        navigate(defaultRoute, { replace: true });
      }
    }
  }, [user, isAuthenticated, isLoading, location.pathname, checkRoute, navigate]);

  return <>{children}</>;
};

/**
 * Get the default route for a user role
 */
function getDefaultRouteForRole(role: string): string {
  switch (role) {
    case 'buyer':
      return ROUTES.MARKETPLACE;
    case 'admin':
      return ROUTES.ADMIN;
    case 'farmer':
    case 'poultry_keeper':
    case 'expert':
    case 'ngo':
    default:
      return ROUTES.DASHBOARD;
  }
}

export default RouteGuard;