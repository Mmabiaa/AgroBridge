/**
 * Analytics Dashboard Page
 * Comprehensive analytics interface with farm performance, yield predictions, weather, and reports
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target,
  Cloud,
  FileText,
  BarChart3
} from 'lucide-react';
import { FarmPerformance } from '@/components/analytics/FarmPerformance';
import { YieldPredictions } from '@/components/analytics/YieldPredictions';
import { WeatherWidget } from '@/components/analytics/WeatherWidget';
import { ReportGenerator } from '@/components/analytics/ReportGenerator';
import { useAuth } from '@/contexts/AuthContext';

export default function Analytics() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has permission to view analytics
  if (!user || !hasPermission('view_analytics')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to view analytics. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights and predictive analytics for your farm operations
          </p>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Predictions</span>
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <span className="hidden sm:inline">Weather</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Weather Widget (Compact) */}
              <WeatherWidget compact />
              
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Insights</CardTitle>
                  <CardDescription>Key metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Farm Performance</p>
                        <p className="text-2xl font-bold">85%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Yield Forecast</p>
                        <p className="text-2xl font-bold">+12%</p>
                      </div>
                      <Target className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Farm Performance</CardTitle>
                  <CardDescription>Track yield trends and crop performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View detailed analytics on your farm's productivity, health scores, and resource efficiency.
                  </p>
                  <button
                    onClick={() => setActiveTab('performance')}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View Performance Analytics →
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Yield Predictions</CardTitle>
                  <CardDescription>ML-based forecasts with confidence intervals</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get AI-powered predictions for your crop yields based on historical data and current conditions.
                  </p>
                  <button
                    onClick={() => setActiveTab('predictions')}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View Predictions →
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weather Forecast</CardTitle>
                  <CardDescription>7-day outlook with alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Stay informed about weather conditions that may affect your farming operations.
                  </p>
                  <button
                    onClick={() => setActiveTab('weather')}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View Weather Forecast →
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Reports</CardTitle>
                  <CardDescription>Generate and export analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create custom reports with specific parameters and export them in various formats.
                  </p>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Generate Reports →
                  </button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Farm Performance Tab */}
          <TabsContent value="performance">
            <FarmPerformance />
          </TabsContent>

          {/* Yield Predictions Tab */}
          <TabsContent value="predictions">
            <YieldPredictions />
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather">
            <WeatherWidget />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
