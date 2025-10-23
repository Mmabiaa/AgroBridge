/**
 * Demo component showing permission system usage
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions, useRoleAccess } from '@/hooks/usePermissions';
import { PermissionGate } from './PermissionGate';
import { useSecureNavigation } from '@/hooks/useSecureNavigation';
import { 
  Shield, 
  User, 
  Settings, 
  ShoppingCart, 
  BarChart3, 
  Bot,
  Eye,
  EyeOff
} from 'lucide-react';

export const PermissionDemo = () => {
  const {
    user,
    checkPermission,
    checkMultiplePermissions,
    checkRole,
    getUserPermissions,
    isAdmin,
    isFarmer,
    isBuyer,
    canViewDashboard,
    canViewAnalytics,
    canViewMarketplace,
    canUseAgriGPT,
  } = usePermissions();

  const {
    showForRoles,
    showForFarmers,
    showForBuyers,
    showForAdmins,
  } = useRoleAccess();

  const {
    goToMarketplace,
    goToAnalytics,
    goToAgriGPT,
    goToAdmin,
  } = useSecureNavigation();

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to see permission demo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission System Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* User Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Current User
            </h3>
            <div className="space-y-2">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> <Badge variant="outline" className="capitalize">{user.role}</Badge></p>
              <p><strong>Is Admin:</strong> {isAdmin() ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Is Farmer:</strong> {isFarmer() ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Is Buyer:</strong> {isBuyer() ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>

          {/* Permission Checks */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Individual Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">View Dashboard</span>
                  {canViewDashboard() ? <Badge variant="default">✅ Allowed</Badge> : <Badge variant="destructive">❌ Denied</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">View Analytics</span>
                  {canViewAnalytics() ? <Badge variant="default">✅ Allowed</Badge> : <Badge variant="destructive">❌ Denied</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">View Marketplace</span>
                  {canViewMarketplace() ? <Badge variant="default">✅ Allowed</Badge> : <Badge variant="destructive">❌ Denied</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Use AgriGPT</span>
                  {canUseAgriGPT() ? <Badge variant="default">✅ Allowed</Badge> : <Badge variant="destructive">❌ Denied</Badge>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Multiple Permission Checks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Analytics + Monitoring (All)</span>
                  {checkMultiplePermissions(['view_analytics', 'view_monitoring'], true) ? 
                    <Badge variant="default">✅ Allowed</Badge> : 
                    <Badge variant="destructive">❌ Denied</Badge>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Analytics OR Monitoring (Any)</span>
                  {checkMultiplePermissions(['view_analytics', 'view_monitoring'], false) ? 
                    <Badge variant="default">✅ Allowed</Badge> : 
                    <Badge variant="destructive">❌ Denied</Badge>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Admin Permissions</span>
                  {checkMultiplePermissions(['manage_users', 'view_admin_dashboard'], true) ? 
                    <Badge variant="default">✅ Allowed</Badge> : 
                    <Badge variant="destructive">❌ Denied</Badge>
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role-based Conditional Rendering */}
          <div className="space-y-4">
            <h3 className="font-semibold">Role-based Conditional Rendering</h3>
            
            {showForFarmers(
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <p className="text-green-800">🌾 This content is only visible to farmers!</p>
                </CardContent>
              </Card>
            )}

            {showForBuyers(
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <p className="text-blue-800">🛒 This content is only visible to buyers!</p>
                </CardContent>
              </Card>
            )}

            {showForAdmins(
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-red-800">👑 This content is only visible to admins!</p>
                </CardContent>
              </Card>
            )}

            {showForRoles(['ngo'], 
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <p className="text-purple-800">🏢 This content is only visible to NGOs!</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Permission Gate Examples */}
          <div className="space-y-4">
            <h3 className="font-semibold">Permission Gate Examples</h3>
            
            <PermissionGate 
              permission="view_analytics"
              fallback={
                <Card className="border-gray-200 bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <EyeOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Analytics content hidden - no permission</p>
                  </CardContent>
                </Card>
              }
            >
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-green-800">Analytics content visible!</p>
                </CardContent>
              </Card>
            </PermissionGate>

            <PermissionGate 
              role="admin"
              fallback={
                <Card className="border-gray-200 bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <EyeOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Admin content hidden - not admin</p>
                  </CardContent>
                </Card>
              }
            >
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <p className="text-red-800">Admin content visible!</p>
                </CardContent>
              </Card>
            </PermissionGate>
          </div>

          {/* Secure Navigation Examples */}
          <div className="space-y-4">
            <h3 className="font-semibold">Secure Navigation Examples</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                onClick={goToMarketplace}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Marketplace
              </Button>
              
              <Button 
                onClick={goToAnalytics}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              
              <Button 
                onClick={goToAgriGPT}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bot className="h-4 w-4" />
                AgriGPT
              </Button>
              
              <Button 
                onClick={goToAdmin}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              These buttons will navigate only if you have the required permissions, otherwise redirect to dashboard.
            </p>
          </div>

          {/* User Permissions List */}
          <div className="space-y-2">
            <h3 className="font-semibold">All User Permissions</h3>
            <div className="flex flex-wrap gap-1">
              {getUserPermissions().map((permission) => (
                <Badge key={permission} variant="secondary" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionDemo;