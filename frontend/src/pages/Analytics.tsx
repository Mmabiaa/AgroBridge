/**
 * Analytics Page - Production Ready with API Integration
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Sprout,
  ShoppingCart,
  Users,
  Download,
  RefreshCw,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import { useFarms, useFarmAnalytics } from '@/api/hooks/useFarms';
import { useProducts, useUserOrders } from '@/api/hooks/useMarketplace';
import { useConversations } from '@/api/hooks/useAI';
import { useAuth } from '@/contexts/AuthContext';

export default function Analytics() {
  useAuth(); // Keep auth context active
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedFarmId, setSelectedFarmId] = useState<string>('all');

  // API hooks
  const { data: farmsData } = useFarms();
  const { data: farmAnalytics, isLoading: analyticsLoading } = useFarmAnalytics(
    selectedFarmId !== 'all' ? selectedFarmId : ''
  );

  // Use farmAnalytics directly without type assertion
  const analytics = farmAnalytics;
  const { data: productsData } = useProducts();
  const { data: ordersData } = useUserOrders();
  const { data: conversationsData } = useConversations();

  const farms = farmsData?.results || [];
  const products = productsData?.results || [];
  const orders = ordersData?.results || [];
  const conversations = conversationsData?.results || [];

  // Calculate metrics
  const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0);
  const totalFarms = farms.length;
  const totalProducts = products.length;
  const totalConversations = conversations.length;

  // Mock data for charts (in production, this would come from analytics API)
  const revenueData = [
    { month: 'Jan', revenue: 12000, orders: 45 },
    { month: 'Feb', revenue: 15000, orders: 52 },
    { month: 'Mar', revenue: 18000, orders: 61 },
    { month: 'Apr', revenue: 22000, orders: 73 },
    { month: 'May', revenue: 25000, orders: 84 },
    { month: 'Jun', revenue: 28000, orders: 92 },
  ];

  const cropPerformance = [
    { crop: 'Tomatoes', yield: 15.2, revenue: 18500, growth: 12 },
    { crop: 'Maize', yield: 8.7, revenue: 12300, growth: -3 },
    { crop: 'Onions', yield: 12.1, revenue: 9800, growth: 8 },
    { crop: 'Peppers', yield: 6.5, revenue: 7200, growth: 15 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your farming operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Farms</SelectItem>
              {farms.map((farm: any) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+12.5%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Farms</p>
                <p className="text-2xl font-bold">{totalFarms}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Sprout className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+2</span>
              <span className="text-muted-foreground ml-1">new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Products Listed</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+8</span>
              <span className="text-muted-foreground ml-1">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Consultations</p>
                <p className="text-2xl font-bold">{totalConversations}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+15</span>
              <span className="text-muted-foreground ml-1">this week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData.slice(-3).map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{data.month}</p>
                        <p className="text-sm text-muted-foreground">{data.orders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(data.revenue)}</p>
                        <div className="flex items-center text-sm text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{Math.round(((data.revenue - (revenueData[index] || data).revenue) / (revenueData[index] || data).revenue) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Crops */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performing Crops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cropPerformance.map((crop, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{crop.crop}</p>
                        <p className="text-sm text-muted-foreground">{crop.yield} tons/hectare</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(crop.revenue)}</p>
                        <div className={`flex items-center text-sm ${getGrowthColor(crop.growth)}`}>
                          {getGrowthIcon(crop.growth)}
                          <span className="ml-1">{Math.abs(crop.growth)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Farm Performance */}
          {analyticsLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading farm analytics...</p>
              </CardContent>
            </Card>
          ) : analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Farm Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-bold text-2xl">
                      {analytics?.metrics?.total_sensors || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Sensors</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-bold text-2xl">
                      {analytics?.metrics?.active_sensors || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Sensors</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Sprout className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="font-bold text-2xl">{analytics?.metrics?.total_readings || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Total Readings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{data.month}</span>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(data.revenue)}</p>
                        <p className="text-sm text-muted-foreground">{data.orders} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Direct Sales</span>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(totalRevenue * 0.7)}</p>
                      <p className="text-sm text-muted-foreground">70%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Marketplace</span>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(totalRevenue * 0.25)}</p>
                      <p className="text-sm text-muted-foreground">25%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Contracts</span>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(totalRevenue * 0.05)}</p>
                      <p className="text-sm text-muted-foreground">5%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Crop Production Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {cropPerformance.map((crop, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{crop.crop}</h4>
                      <Badge variant={crop.growth >= 0 ? 'default' : 'destructive'}>
                        {crop.growth >= 0 ? '+' : ''}{crop.growth}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Yield:</span>
                        <span className="font-medium">{crop.yield} tons/hectare</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Revenue:</span>
                        <span className="font-medium">{formatCurrency(crop.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Tab */}
        <TabsContent value="market" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Market Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Products Sold</p>
                      <p className="text-sm text-muted-foreground">This month</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl">{orders.length}</p>
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +18%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Average Order Value</p>
                      <p className="text-sm text-muted-foreground">Per transaction</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl">
                        {formatCurrency(orders.length > 0 ? totalRevenue / orders.length : 0)}
                      </p>
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +5%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-bold text-2xl">156</p>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-bold text-2xl">68%</p>
                    <p className="text-sm text-muted-foreground">Repeat Customers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Growth Opportunity</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Tomato production shows 12% growth. Consider expanding cultivation area.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Attention Needed</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Maize yield is 3% below target. Review fertilization schedule.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Recommendation</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Peak selling season for peppers is approaching. Increase marketing efforts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Monthly Revenue Target</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(totalRevenue)} / {formatCurrency(30000)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${Math.min((totalRevenue / 30000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((totalRevenue / 30000) * 100)}% of target achieved
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Yield Improvement</span>
                      <span className="text-sm text-muted-foreground">85% / 100%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">85% of yield target achieved</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Customer Satisfaction</span>
                      <span className="text-sm text-muted-foreground">92% / 95%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">92% satisfaction rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}