import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  Database, 
  Cog, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Mock data for demonstration
const mockUsers = [
  { id: 1, name: 'John Farmer', email: 'john@example.com', role: 'farmer', status: 'active', lastLogin: '2 hours ago' },
  { id: 2, name: 'Sarah Buyer', email: 'sarah@example.com', role: 'buyer', status: 'active', lastLogin: '1 day ago' },
  { id: 3, name: 'Mike NGO', email: 'mike@example.com', role: 'ngo', status: 'active', lastLogin: '3 days ago' },
  { id: 4, name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', lastLogin: '1 hour ago' },
];

const mockSystemStats = {
  totalUsers: 1247,
  activeUsers: 892,
  totalFarms: 567,
  systemUptime: '99.9%',
  activeSessions: 156,
  storageUsed: '2.3 GB',
  storageTotal: '10 GB'
};

const mockSystemLogs = [
  { id: 1, level: 'info', message: 'User login successful', timestamp: '2024-01-15 10:30:00', user: 'john@example.com' },
  { id: 2, level: 'warning', message: 'High memory usage detected', timestamp: '2024-01-15 10:25:00', user: 'system' },
  { id: 3, level: 'error', message: 'Database connection timeout', timestamp: '2024-01-15 10:20:00', user: 'system' },
  { id: 4, level: 'info', message: 'Backup completed successfully', timestamp: '2024-01-15 10:15:00', user: 'system' },
];

const AdminPanel = () => {
  const { user, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Check if user has admin permissions
  if (!user || !hasPermission('view_admin_dashboard')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access the admin panel.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground">
              System administration and management
            </p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {user.role} Role
          </Badge>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{mockSystemStats.totalUsers - mockSystemStats.activeUsers} inactive
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((mockSystemStats.activeUsers / mockSystemStats.totalUsers) * 100)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.systemUptime}</div>
                  <p className="text-xs text-muted-foreground">
                    High availability
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.storageUsed}</div>
                  <p className="text-xs text-muted-foreground">
                    of {mockSystemStats.storageTotal} total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
                <CardDescription>Latest system events and user activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSystemLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getLogLevelColor(log.level)}>
                          {log.level}
                        </Badge>
                        <span className="text-sm">{log.message}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage system users and their roles</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>

                  <div className="border rounded-lg">
                    <div className="grid grid-cols-6 gap-4 p-4 font-medium text-sm border-b bg-muted/50">
                      <div>Name</div>
                      <div>Email</div>
                      <div>Role</div>
                      <div>Status</div>
                      <div>Last Login</div>
                      <div>Actions</div>
                    </div>
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="grid grid-cols-6 gap-4 p-4 border-b items-center">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-muted-foreground">{user.email}</div>
                        <div>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </div>
                        <div>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{user.lastLogin}</div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Current system performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>CPU Usage</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Memory Usage</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Disk Usage</span>
                    <span className="font-medium">23%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Network</span>
                    <span className="font-medium">Normal</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>Real-time system monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockSystemLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <Badge className={getLogLevelColor(log.level)}>
                          {log.level}
                        </Badge>
                        <span className="text-sm flex-1">{log.message}</span>
                        <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Logs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Manage learning materials and community content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Learning Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">24</div>
                      <p className="text-sm text-muted-foreground mb-4">Active courses</p>
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Course
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Community Posts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">156</div>
                      <p className="text-sm text-muted-foreground mb-4">Published posts</p>
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Review Posts
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">8</div>
                      <p className="text-sm text-muted-foreground mb-4">Pending reviews</p>
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Wrap the component with ProtectedRoute
const Admin = () => (
  <ProtectedRoute requiredPermission="view_admin_dashboard">
    <AdminPanel />
  </ProtectedRoute>
);

export default Admin;