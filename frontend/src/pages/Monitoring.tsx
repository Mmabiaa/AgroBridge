
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Thermometer, 
  Droplets, 
  Sprout, 
  Camera, 
  Plus,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Eye,
  Settings,
  Battery,
  Signal
} from 'lucide-react';

const sensorData = {
  soilMoisture: { value: 65, status: 'good', unit: '%' },
  temperature: { value: 28, status: 'optimal', unit: '°C' },
  humidity: { value: 72, status: 'good', unit: '%' },
  phLevel: { value: 6.5, status: 'optimal', unit: 'pH' },
  nutrients: { n: 45, p: 38, k: 52 }
};

const devices = [
  {
    id: 1,
    name: 'Field A Sensor',
    type: 'Soil Monitor',
    status: 'online',
    battery: 85,
    signal: 95,
    location: 'Maize Field',
    lastUpdate: '2 min ago'
  },
  {
    id: 2,
    name: 'Greenhouse Monitor',
    type: 'Climate Control',
    status: 'online',
    battery: 67,
    signal: 78,
    location: 'Tomato Greenhouse',
    lastUpdate: '5 min ago'
  },
  {
    id: 3,
    name: 'Poultry House 1',
    type: 'Environmental',
    status: 'offline',
    battery: 25,
    signal: 0,
    location: 'Broiler House',
    lastUpdate: '2 hours ago'
  }
];

const alerts = [
  {
    id: 1,
    type: 'warning',
    message: 'Low soil moisture detected in Field B',
    time: '10 min ago',
    severity: 'medium'
  },
  {
    id: 2,
    type: 'error',
    message: 'Poultry House 1 sensor offline',
    time: '2 hours ago',
    severity: 'high'
  },
  {
    id: 3,
    type: 'info',
    message: 'Temperature optimal for tomato growth',
    time: '1 hour ago',
    severity: 'low'
  }
];

export default function Monitoring() {
  const [selectedTab, setSelectedTab] = useState('sensors');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-6 px-0 sm:px-4">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0 gap-4 w-full max-w-full">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Monitor className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <span className="text-xl md:text-3xl">Smart Farm Monitoring</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">Real-time monitoring of your farm conditions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Add Device
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-full">
          <Card className="shadow-soft">
            <CardContent className="flex items-center p-4 md:p-6">
              <Thermometer className="h-6 w-6 md:h-8 md:w-8 text-warning mr-3 md:mr-4" />
              <div>
                <p className="text-lg md:text-2xl font-bold">{sensorData.temperature.value}{sensorData.temperature.unit}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Temperature</p>
                <Badge variant="secondary" className="mt-1 text-xs">{sensorData.temperature.status}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-4 md:p-6">
              <Droplets className="h-6 w-6 md:h-8 md:w-8 text-sky mr-3 md:mr-4" />
              <div>
                <p className="text-lg md:text-2xl font-bold">{sensorData.soilMoisture.value}{sensorData.soilMoisture.unit}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Soil Moisture</p>
                <Badge variant="secondary" className="mt-1 text-xs">{sensorData.soilMoisture.status}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-4 md:p-6">
              <Sprout className="h-6 w-6 md:h-8 md:w-8 text-primary mr-3 md:mr-4" />
              <div>
                <p className="text-lg md:text-2xl font-bold">{sensorData.humidity.value}{sensorData.humidity.unit}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Humidity</p>
                <Badge variant="secondary" className="mt-1 text-xs">{sensorData.humidity.status}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-4 md:p-6">
              <div className="h-6 w-6 md:h-8 md:w-8 bg-gradient-primary rounded-full flex items-center justify-center mr-3 md:mr-4">
                <span className="text-primary-foreground font-bold text-xs md:text-sm">pH</span>
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold">{sensorData.phLevel.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground">pH Level</p>
                <Badge variant="secondary" className="mt-1 text-xs">{sensorData.phLevel.status}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="sensors" className="text-xs md:text-sm p-2 md:p-3">Sensor Data</TabsTrigger>
            <TabsTrigger value="devices" className="text-xs md:text-sm p-2 md:p-3">Devices</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs md:text-sm p-2 md:p-3">Alerts</TabsTrigger>
            <TabsTrigger value="scanner" className="text-xs md:text-sm p-2 md:p-3">Disease Scanner</TabsTrigger>
          </TabsList>

          {/* Sensor Data Tab */}
          <TabsContent value="sensors" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Soil Health */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Soil Health Metrics</CardTitle>
                  <CardDescription className="text-sm">Current soil conditions in monitored areas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Moisture Level</span>
                        <span className="text-sm">{sensorData.soilMoisture.value}%</span>
                      </div>
                      <Progress value={sensorData.soilMoisture.value} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Temperature</span>
                        <span className="text-sm">{sensorData.temperature.value}°C</span>
                      </div>
                      <Progress value={(sensorData.temperature.value / 40) * 100} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">pH Level</span>
                        <span className="text-sm">{sensorData.phLevel.value}</span>
                      </div>
                      <Progress value={(sensorData.phLevel.value / 14) * 100} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Nutrient Levels */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Nutrient Analysis</CardTitle>
                  <CardDescription className="text-sm">NPK levels in your soil</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm md:text-base">Nitrogen (N)</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Essential for leaf growth</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{sensorData.nutrients.n}%</p>
                        <Badge variant="secondary" className="text-xs">Good</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm md:text-base">Phosphorus (P)</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Important for root development</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{sensorData.nutrients.p}%</p>
                        <Badge variant="outline" className="text-xs">Moderate</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm md:text-base">Potassium (K)</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Enhances disease resistance</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{sensorData.nutrients.k}%</p>
                        <Badge variant="secondary" className="text-xs">Good</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Historical Data Chart */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">24-Hour Trends</CardTitle>
                <CardDescription className="text-sm">Sensor readings over the past day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 md:h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground text-sm">Chart visualization would be here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {devices.map((device) => (
                <Card key={device.id} className="shadow-soft">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base md:text-lg">{device.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {device.status === 'online' ? (
                          <Wifi className="h-4 w-4 text-green-600" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={device.status === 'online' ? 'secondary' : 'destructive'} className="text-xs">
                          {device.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm">{device.type} • {device.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Battery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={device.battery} className="w-12 md:w-16 h-2" />
                        <span className="text-sm">{device.battery}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Signal className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Signal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={device.signal} className="w-12 md:w-16 h-2" />
                        <span className="text-sm">{device.signal}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Update</span>
                      <span>{device.lastUpdate}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                        <Settings className="h-3 w-3 mr-1 md:mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                        <Eye className="h-3 w-3 mr-1 md:mr-2" />
                        View Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Device Card */}
              <Card className="shadow-soft border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 text-center">
                  <Plus className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2 text-sm md:text-base">Add New Device</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4">
                    Connect a new sensor or monitoring device
                  </p>
                  <Button variant="default" size="sm" className="text-xs">
                    <Plus className="h-3 w-3 mr-2" />
                    Add Device
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Recent Alerts</CardTitle>
                <CardDescription className="text-sm">System notifications and warnings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-muted/50 rounded-lg">
                    <div className="mt-1">
                      {alert.type === 'error' && <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />}
                      {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-warning" />}
                      {alert.type === 'info' && <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm md:text-base">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={
                            alert.severity === 'high' ? 'destructive' : 
                            alert.severity === 'medium' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs md:text-sm text-muted-foreground">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disease Scanner Tab */}
          <TabsContent value="scanner" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Disease & Pest Scanner</CardTitle>
                <CardDescription className="text-sm">Upload photos for AI-powered diagnosis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 md:p-12 text-center">
                  <Camera className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2 text-sm md:text-base">Take or Upload Photo</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-6">
                    Capture a clear image of affected crops or poultry for analysis
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="default" size="sm" className="text-xs">
                      <Camera className="h-3 w-3 mr-2" />
                      Take Photo
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Upload from Gallery
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-sm md:text-base">Recent Scans</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-lg"></div>
                        <div>
                          <p className="font-medium text-sm">Tomato Leaf Scan</p>
                          <p className="text-xs text-muted-foreground">Early blight detected - 2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-lg"></div>
                        <div>
                          <p className="font-medium text-sm">Maize Stalk Scan</p>
                          <p className="text-xs text-muted-foreground">Healthy - 1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-sm md:text-base">Tips for Better Results</h4>
                    <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                      <li>• Ensure good lighting when taking photos</li>
                      <li>• Focus on affected areas clearly</li>
                      <li>• Include leaves, stems, or affected parts</li>
                      <li>• Take multiple angles if possible</li>
                      <li>• Clean camera lens for clarity</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
