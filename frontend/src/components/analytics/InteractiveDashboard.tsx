
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  Droplets, 
  Thermometer,
  DollarSign,
  Sprout,
  Target
} from 'lucide-react';

const yieldData = [
  { month: 'Jan', tomatoes: 2400, onions: 1800, maize: 3200 },
  { month: 'Feb', tomatoes: 2100, onions: 2000, maize: 2800 },
  { month: 'Mar', tomatoes: 2800, onions: 2200, maize: 3500 },
  { month: 'Apr', tomatoes: 3200, onions: 2400, maize: 3800 },
  { month: 'May', tomatoes: 2900, onions: 2100, maize: 3600 },
  { month: 'Jun', tomatoes: 3400, onions: 2600, maize: 4000 }
];

const weatherData = [
  { day: 'Mon', temperature: 28, humidity: 65, rainfall: 2 },
  { day: 'Tue', temperature: 30, humidity: 70, rainfall: 0 },
  { day: 'Wed', temperature: 29, humidity: 68, rainfall: 5 },
  { day: 'Thu', temperature: 27, humidity: 72, rainfall: 8 },
  { day: 'Fri', temperature: 31, humidity: 60, rainfall: 0 },
  { day: 'Sat', temperature: 32, humidity: 55, rainfall: 0 },
  { day: 'Sun', temperature: 30, humidity: 62, rainfall: 3 }
];

const revenueData = [
  { month: 'Jan', revenue: 45000, expenses: 25000, profit: 20000 },
  { month: 'Feb', revenue: 52000, expenses: 28000, profit: 24000 },
  { month: 'Mar', revenue: 48000, expenses: 26000, profit: 22000 },
  { month: 'Apr', revenue: 61000, expenses: 32000, profit: 29000 },
  { month: 'May', revenue: 58000, expenses: 30000, profit: 28000 },
  { month: 'Jun', revenue: 67000, expenses: 35000, profit: 32000 }
];

const cropDistribution = [
  { name: 'Tomatoes', value: 35, color: '#ef4444' },
  { name: 'Maize', value: 30, color: '#f59e0b' },
  { name: 'Onions', value: 20, color: '#8b5cf6' },
  { name: 'Others', value: 15, color: '#10b981' }
];

const soilHealthData = [
  { parameter: 'pH Level', value: 6.8, optimal: 6.5, status: 'Good' },
  { parameter: 'Nitrogen', value: 85, optimal: 80, status: 'Excellent' },
  { parameter: 'Phosphorus', value: 72, optimal: 75, status: 'Good' },
  { parameter: 'Potassium', value: 65, optimal: 70, status: 'Fair' },
  { parameter: 'Organic Matter', value: 78, optimal: 75, status: 'Excellent' }
];

export function InteractiveDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [selectedField, setSelectedField] = useState('all');

  const exportData = (type: string) => {
    console.log(`Exporting ${type} data...`);
    // Implement export functionality
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Controls */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 gap-4">
            <CardTitle className="text-lg md:text-xl">Farm Analytics Dashboard</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-28 md:w-32 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 Month</SelectItem>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="w-28 md:w-32 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="field1">Field A</SelectItem>
                  <SelectItem value="field2">Field B</SelectItem>
                  <SelectItem value="field3">Field C</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => exportData('dashboard')} size="sm" className="text-xs">
                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="shadow-soft">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-lg md:text-2xl font-bold text-primary">₦341,000</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Yield</p>
                <p className="text-lg md:text-2xl font-bold text-primary">18.2 tons</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.3% from last month
                </p>
              </div>
              <Sprout className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Avg Temperature</p>
                <p className="text-lg md:text-2xl font-bold text-primary">29.2°C</p>
                <p className="text-xs text-muted-foreground">Optimal range</p>
              </div>
              <Thermometer className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Soil Moisture</p>
                <p className="text-lg md:text-2xl font-bold text-primary">68%</p>
                <Badge variant="secondary" className="text-xs">Good</Badge>
              </div>
              <Droplets className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="yield" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="yield" className="text-xs md:text-sm p-2 md:p-3">Yield Analysis</TabsTrigger>
          <TabsTrigger value="weather" className="text-xs md:text-sm p-2 md:p-3">Weather Patterns</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs md:text-sm p-2 md:p-3">Financial Overview</TabsTrigger>
          <TabsTrigger value="soil" className="text-xs md:text-sm p-2 md:p-3">Soil Health</TabsTrigger>
        </TabsList>

        <TabsContent value="yield" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="lg:col-span-2 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Monthly Yield Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] md:h-[300px] w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                    <BarChart data={yieldData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tomatoes" fill="#ef4444" name="Tomatoes (kg)" />
                      <Bar dataKey="onions" fill="#8b5cf6" name="Onions (kg)" />
                      <Bar dataKey="maize" fill="#f59e0b" name="Maize (kg)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Crop Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cropDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {cropDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weather" className="space-y-4 md:space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Weather Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] md:h-[400px] w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height="100%" minWidth={400}>
                  <LineChart data={weatherData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#ef4444" 
                      name="Temperature (°C)" 
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="#3b82f6" 
                      name="Humidity (%)" 
                      strokeWidth={2}
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="rainfall" 
                      fill="#10b981" 
                      name="Rainfall (mm)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4 md:space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Financial Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] md:h-[400px] w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height="100%" minWidth={400}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₦${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stackId="1" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      name="Revenue"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stackId="2" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      name="Expenses"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stackId="3" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="soil" className="space-y-4 md:space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Soil Health Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {soilHealthData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm md:text-base">{item.parameter}</span>
                        <Badge variant={
                          item.status === 'Excellent' ? 'default' : 
                          item.status === 'Good' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(item.value / 100) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs md:text-sm font-medium">
                          {item.parameter === 'pH Level' ? item.value : `${item.value}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
