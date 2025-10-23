/**
 * Development Dashboard for API Integration Testing
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Code, 
  Database, 
  Zap, 
  Users, 
  ShoppingCart,
  MessageSquare,
  Camera,
  Settings
} from 'lucide-react';
import { ApiConnectionTest } from '@/components/api/ApiConnectionTest';
import { ApiTest } from '@/components/api/ApiTest';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/contexts/ApiProvider';

export default function DevDashboard() {
  const { user } = useAuth();
  const { isOnline, reconnect } = useApi();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Development Dashboard</h1>
          <p className="text-muted-foreground">
            API Integration Testing & Full-Stack Connection Status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          {!isOnline && (
            <Button onClick={reconnect} variant="outline" size="sm">
              Reconnect
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api">API Tests</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="farms">Farms</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Integration Status
                </CardTitle>
                <CardDescription>
                  Full-stack connection overview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-medium">Backend</p>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">Real-time</p>
                    <Badge variant={isOnline ? 'default' : 'secondary'}>
                      {isOnline ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">API Hooks</span>
                    <Badge variant="default">Integrated</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Authentication</span>
                    <Badge variant={user ? 'default' : 'secondary'}>
                      {user ? 'Authenticated' : 'Not Authenticated'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Caching</span>
                    <Badge variant="default">React Query</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Handling</span>
                    <Badge variant="default">Configured</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Information
                </CardTitle>
                <CardDescription>
                  Current user session details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="capitalize">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium mb-1">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.slice(0, 3).map(permission => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission.replace('_', ' ')}
                          </Badge>
                        ))}
                        {user.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{user.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Not authenticated</p>
                    <Button className="mt-2" size="sm">
                      Sign In
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DashboardStats />
          <RecentActivity />
        </TabsContent>

        <TabsContent value="api">
          <div className="grid gap-6 md:grid-cols-2">
            <ApiConnectionTest />
            <ApiTest />
          </div>
        </TabsContent>

        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Testing</CardTitle>
              <CardDescription>
                Test authentication flows and user management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="outline">Test Login</Button>
                  <Button variant="outline">Test Registration</Button>
                  <Button variant="outline">Test Logout</Button>
                  <Button variant="outline">Test Token Refresh</Button>
                </div>
                
                {user && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Current Session</h4>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Marketplace Integration
                </CardTitle>
                <CardDescription>
                  Test marketplace API endpoints and functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Button variant="outline">Test Product Listing</Button>
                  <Button variant="outline">Test Order Creation</Button>
                  <Button variant="outline">Test Search</Button>
                </div>
              </CardContent>
            </Card>
            
            <ProductGrid />
          </div>
        </TabsContent>

        <TabsContent value="farms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Farms Management
              </CardTitle>
              <CardDescription>
                Test farm management API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline">Test Farm Creation</Button>
                <Button variant="outline">Test Farm Updates</Button>
                <Button variant="outline">Test Analytics</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Assistant Integration
              </CardTitle>
              <CardDescription>
                Test AI assistant and conversation management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline">Test Conversation</Button>
                <Button variant="outline">Test Voice Commands</Button>
                <Button variant="outline">Test Recommendations</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}