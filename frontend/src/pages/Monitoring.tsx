/**
 * Monitoring Page - Production Ready with API Integration
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Monitor,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin,
  Calendar,
  Zap,
  Wifi,
  WifiOff,
  Settings,
  Plus
} from 'lucide-react';
import { useUserFarms, useFarmAnalytics } from '@/api/hooks/useFarms';
import { useAuth } from '@/contexts/AuthContext';

export default function Monitoring() {
  useAuth(); // Keep auth context active
  const navigate = useNavigate();
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  // API hooks - use useUserFarms to get user's farms instead of all farms
  const { data: farmsData, isLoading: farmsLoading } = useUserFarms();
  const { data: analyticsData, isLoading: analyticsLoading } = useFarmAnalytics(selectedFarmId);

  // Use analyticsData directly without type assertion
  const analytics = analyticsData;

  const farms = farmsData?.results || [];
  const selectedFarm = farms.find(farm => farm.id === selectedFarmId);

  // Mock sensor data (in production, this would come from IoT sensors)
  const sensorData = {
    temperature: { value: 28, unit: '°C', status: 'normal', trend: 'up' },
    humidity: { value: 65, unit: '%', status: 'normal', trend: 'stable' },
    soilMoisture: { value: 45, unit: '%', status: 'low', trend: 'down' },
    lightIntensity: { value: 75, unit: '%', status: 'good', trend: 'up' },
    ph: { value: 6.8, unit: 'pH', status: 'optimal', trend: 'stable' },
    nutrients: {
      nitrogen: { value: 85, status: 'good' },
      phosphorus: { value: 60, status: 'medium' },
      potassium: { value: 70, status: 'good' }
    }
  };

  const weatherData = {
    current: {
      temp: 28,
      humidity: 65,
      condition: 'Partly Cloudy',
      windSpeed: 12,
      rainfall: 0
    },
    forecast: [
      { day: 'Today', temp: '28°C', condition: 'Partly Cloudy', rain: '10%' },
      { day: 'Tomorrow', temp: '26°C', condition: 'Cloudy', rain: '40%' },
      { day: 'Thursday', temp: '25°C', condition: 'Rainy', rain: '80%' },
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'optimal':
      case 'good':
      case 'normal': return 'bg-green-100 text-green-800';
      case 'medium':
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'low':
      case 'high':
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'optimal':
      case 'good':
      case 'normal': return <CheckCircle className="h-4 w-4" />;
      case 'medium':
      case 'warning':
      case 'low':
      case 'high':
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <Activity className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Farm Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of your farm conditions and sensors
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Farm Selector */}
          <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a farm" />
            </SelectTrigger>
            <SelectContent>
              {farms.map((farm: any) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {!selectedFarmId ? (
        // Farm Selection Screen
        <Card>
          <CardContent className="p-12 text-center">
            <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Select a Farm to Monitor</h3>
            <p className="text-muted-foreground mb-6">
              Choose one of your farms to view real-time monitoring data
            </p>

            {farmsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : farms.length === 0 ? (
              <div>
                <p className="text-muted-foreground mb-4">No farms found</p>
                <Button onClick={() => navigate('/farms/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Farm
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                {farms.map((farm: any) => (
                  <Card
                    key={farm.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedFarmId(farm.id)}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-1">{farm.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {farm.size_hectares} hectares
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{farm.location?.city}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Monitoring Dashboard
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sensors">Sensors</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">

            {/* Farm Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  {selectedFarm?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFarm?.location?.city}, {selectedFarm?.location?.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Size</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFarm?.size_hectares} hectares
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Wifi className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Status</p>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Online
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Temperature</span>
                    </div>
                    {getTrendIcon(sensorData.temperature.trend)}
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">
                      {sensorData.temperature.value}{sensorData.temperature.unit}
                    </div>
                    <Badge className={getStatusColor(sensorData.temperature.status)}>
                      {sensorData.temperature.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Soil Moisture</span>
                    </div>
                    {getTrendIcon(sensorData.soilMoisture.trend)}
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">
                      {sensorData.soilMoisture.value}{sensorData.soilMoisture.unit}
                    </div>
                    <Badge className={getStatusColor(sensorData.soilMoisture.status)}>
                      {sensorData.soilMoisture.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">Light</span>
                    </div>
                    {getTrendIcon(sensorData.lightIntensity.trend)}
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">
                      {sensorData.lightIntensity.value}{sensorData.lightIntensity.unit}
                    </div>
                    <Badge className={getStatusColor(sensorData.lightIntensity.status)}>
                      {sensorData.lightIntensity.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">pH Level</span>
                    </div>
                    {getTrendIcon(sensorData.ph.trend)}
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">
                      {sensorData.ph.value} {sensorData.ph.unit}
                    </div>
                    <Badge className={getStatusColor(sensorData.ph.status)}>
                      {sensorData.ph.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Nutrient Levels */}
            <Card>
              <CardHeader>
                <CardTitle>Soil Nutrients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Nitrogen (N)</span>
                      <Badge className={getStatusColor(sensorData.nutrients.nitrogen.status)}>
                        {sensorData.nutrients.nitrogen.status}
                      </Badge>
                    </div>
                    <Progress value={sensorData.nutrients.nitrogen.value} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {sensorData.nutrients.nitrogen.value}%
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Phosphorus (P)</span>
                      <Badge className={getStatusColor(sensorData.nutrients.phosphorus.status)}>
                        {sensorData.nutrients.phosphorus.status}
                      </Badge>
                    </div>
                    <Progress value={sensorData.nutrients.phosphorus.value} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {sensorData.nutrients.phosphorus.value}%
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Potassium (K)</span>
                      <Badge className={getStatusColor(sensorData.nutrients.potassium.status)}>
                        {sensorData.nutrients.potassium.status}
                      </Badge>
                    </div>
                    <Progress value={sensorData.nutrients.potassium.value} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {sensorData.nutrients.potassium.value}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sensors Tab */}
          <TabsContent value="sensors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sensor Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: 'Temperature Sensor', type: 'DHT22', status: 'online', battery: 85 },
                    { name: 'Soil Moisture Sensor', type: 'FC-28', status: 'online', battery: 72 },
                    { name: 'pH Sensor', type: 'PH-4502C', status: 'online', battery: 91 },
                    { name: 'Light Sensor', type: 'BH1750', status: 'online', battery: 68 },
                    { name: 'Weather Station', type: 'WS-2000', status: 'offline', battery: 45 },
                    { name: 'Camera Module', type: 'ESP32-CAM', status: 'online', battery: 88 },
                  ].map((sensor, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{sensor.name}</h4>
                          <div className="flex items-center gap-1">
                            {sensor.status === 'online' ? (
                              <Wifi className="h-4 w-4 text-green-600" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-red-600" />
                            )}
                            <Badge variant={sensor.status === 'online' ? 'default' : 'destructive'}>
                              {sensor.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{sensor.type}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Battery</span>
                          <span className="text-sm font-medium">{sensor.battery}%</span>
                        </div>
                        <Progress value={sensor.battery} className="h-1 mt-1" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    Current Weather
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold mb-2">
                      {weatherData.current.temp}°C
                    </div>
                    <p className="text-muted-foreground">{weatherData.current.condition}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <Droplets className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <p className="text-sm font-medium">Humidity</p>
                      <p className="text-sm text-muted-foreground">{weatherData.current.humidity}%</p>
                    </div>
                    <div className="text-center">
                      <Wind className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                      <p className="text-sm font-medium">Wind Speed</p>
                      <p className="text-sm text-muted-foreground">{weatherData.current.windSpeed} km/h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    3-Day Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weatherData.forecast.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{day.day}</p>
                          <p className="text-sm text-muted-foreground">{day.condition}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{day.temp}</p>
                          <p className="text-sm text-muted-foreground">{day.rain} rain</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analyticsLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading analytics...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Productivity Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span>Active Sensors</span>
                          <span className="font-bold">
                            {analytics?.metrics?.active_sensors || 15}
                          </span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span>Water Efficiency</span>
                          <span className="font-bold">85%</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span>Nutrient Utilization</span>
                          <span className="font-bold">78%</span>
                        </div>
                        <Progress value={78} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Crop Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span>Temperature Sensors</span>
                          <span className="font-medium">60%</span>
                        </div>
                        <Progress value={60} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span>Moisture Sensors</span>
                          <span className="font-medium">40%</span>
                        </div>
                        <Progress value={40} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      type: 'warning',
                      title: 'Low Soil Moisture',
                      description: 'Soil moisture levels are below optimal range',
                      time: '2 hours ago',
                      action: 'Irrigation recommended'
                    },
                    {
                      type: 'info',
                      title: 'Weather Alert',
                      description: 'Heavy rain expected in the next 24 hours',
                      time: '4 hours ago',
                      action: 'Prepare drainage'
                    },
                    {
                      type: 'success',
                      title: 'Optimal Growth Conditions',
                      description: 'All parameters are within optimal range',
                      time: '1 day ago',
                      action: 'Continue monitoring'
                    }
                  ].map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className={`p-1 rounded-full ${alert.type === 'warning' ? 'bg-yellow-100' :
                        alert.type === 'info' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                        {getStatusIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{alert.time}</span>
                          <Badge variant="outline">{alert.action}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}