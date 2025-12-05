import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Home, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAllPermissions?: boolean;
  requiredRoute?: string;
  fallbackPath?: string;
  showAccessDenied?: boolean;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requiredPermission,
  requiredPermissions,
  requireAllPermissions = true,
  requiredRoute,
  fallbackPath = '/dashboard',
  showAccessDenied = true,
  adminOnly = false,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { checkRole, checkPermission, checkMultiplePermissions, checkRoute, isAdmin } = usePermissions();
  const location = useLocation();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin-only access
  if (adminOnly && !isAdmin()) {
    if (showAccessDenied) {
      return <AccessDeniedPage reason="admin" fallbackPath={fallbackPath} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check role-based access 
  if (requiredRole && !checkRole(requiredRole)) {
    if (showAccessDenied) {
      return <AccessDeniedPage reason="role" fallbackPath={fallbackPath} requiredRole={requiredRole} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check single permission
  if (requiredPermission && !checkPermission(requiredPermission)) {
    if (showAccessDenied) {
      return <AccessDeniedPage reason="permission" fallbackPath={fallbackPath} requiredPermission={requiredPermission} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check multiple permissions
  if (requiredPermissions && !checkMultiplePermissions(requiredPermissions, requireAllPermissions)) {
    if (showAccessDenied) {
      return <AccessDeniedPage reason="permissions" fallbackPath={fallbackPath} requiredPermissions={requiredPermissions} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check route-based access
  if (requiredRoute && !checkRoute(requiredRoute)) {
    if (showAccessDenied) {
      return <AccessDeniedPage reason="route" fallbackPath={fallbackPath} />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

// Access Denied Component
interface AccessDeniedPageProps {
  reason: 'role' | 'permission' | 'permissions' | 'route' | 'admin';
  fallbackPath: string;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string;
  requiredPermissions?: string[];
}

const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ 
  reason, 
  fallbackPath,
  requiredRole,
  requiredPermission,
  requiredPermissions,
}) => {
  const { user } = useAuth();

  const getReasonMessage = () => {
    switch (reason) {
      case 'admin':
        return "This page is only accessible to administrators.";
      case 'role':
        const roleText = Array.isArray(requiredRole) 
          ? requiredRole.map(r => r.replace('_', ' ')).join(', ')
          : requiredRole?.replace('_', ' ');
        return `This page requires ${roleText} role. Your current role is ${user?.role?.replace('_', ' ')}.`;
      case 'permission':
        return `You don't have the required permission (${requiredPermission}) to access this page.`;
      case 'permissions':
        return `You don't have the required permissions (${requiredPermissions?.join(', ')}) to access this page.`;
      case 'route':
        return "This page is not available for your account type.";
      default:
        return "You don't have access to this page.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
            {reason === 'admin' ? (
              <Shield className="h-8 w-8 text-destructive" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <CardTitle className="text-xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {getReasonMessage()}
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={() => window.history.back()} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Button 
              onClick={() => window.location.href = fallbackPath} 
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          {user?.role && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Current role: <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};