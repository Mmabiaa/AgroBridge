/**
 * Farm Performance Analytics Component
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sprout,
  Droplets,
  Users
} from 'lucide-react';
import { useFarmPerformance } from '@/api/hooks/useAnalytics';
import { useFarms } from '@/api/hooks/useFarms';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FarmPerformanceProps {
  farmId?: string;
}

export const FarmPerformance: React.FC<FarmPerformanceProps> = ({ farmId: initialFarmId }) => {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(initialFarmId || '');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Fetch farms list
  const { data: farmsData } = useFarms();
  const farms = farmsData?.results || [];

  // Calculate date range based on selection
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange();

  // Fetch farm performance data
  const { data: performanceData, isLoading } = useFarmPerformance({
    farm_id: selectedFarmId,
    ...dateRange,
  });

  // Prepare chart data
  const yieldChartData = performanceData?.yield_data?.map((item) => ({
    crop: item.crop,
    yield: item.yield_amount,
    unit: item.unit,
  })) || [];

  const efficiencyData = performanceData?.efficiency_metrics ? [
    { name: 'Water Usage', value: performanceData.efficiency_metrics.water_usage, color: '#3b82f6' },
    { name: 'Fertilizer', value: performanceData.efficiency_metrics.fertilizer_usage, color: '#10b981' },
    { name: 'Labor Hours', value: performanceData.efficiency_metrics.labor_hours, color: '#f59e0b' },
  ] : [];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5" />
                Farm Performance Analytics
              </CardTitle>
              <CardDescription>
                Track yield trends and crop performance over time
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !selectedFarmId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sprout className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Please select a farm to view performance analytics</p>
          </CardContent>
        </Card>
      ) : performanceData ? (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Productivity Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.productivity_score}%</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  {performanceData.comparison.change_percentage > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+{performanceData.comparison.change_percentage}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">{performanceData.comparison.change_percentage}%</span>
                    </>
                  )}
                  <span>vs previous period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Health Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.health_score}%</div>
                <Badge variant="secondary" className="mt-1">
                  {performanceData.health_score >= 80 ? 'Excellent' : performanceData.health_score >= 60 ? 'Good' : 'Needs Attention'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Water Usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  {performanceData.efficiency_metrics.water_usage}L
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per hectare</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Labor Hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  {performanceData.efficiency_metrics.labor_hours}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">This period</p>
              </CardContent>
            </Card>
          </div>

          {/* Yield Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Crop Yield Performance</CardTitle>
              <CardDescription>Yield amounts by crop type</CardDescription>
            </CardHeader>
            <CardContent>
              {yieldChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yieldChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="crop" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="yield" fill="#10b981" name="Yield" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No yield data available for this period</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crop Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Crop Performance Comparison</CardTitle>
              <CardDescription>Individual crop trends and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceData.yield_data.map((crop, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-full">
                        <Sprout className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{crop.crop}</p>
                        <p className="text-sm text-muted-foreground">
                          {crop.yield_amount} {crop.unit}
                        </p>
                      </div>
                    </div>
                    <Badge className={getTrendColor(crop.trend)}>
                      <span className="flex items-center gap-1">
                        {getTrendIcon(crop.trend)}
                        {crop.trend}
                      </span>
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Efficiency Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Efficiency</CardTitle>
              <CardDescription>Water, fertilizer, and labor usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {efficiencyData.map((item, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold" style={{ color: item.color }}>
                      {item.value}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No performance data available for this farm</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FarmPerformance;
