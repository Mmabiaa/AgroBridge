
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Thermometer, 
  Droplets, 
  Zap, 
  Wifi, 
  Battery, 
  AlertTriangle,
  CheckCircle,
  Radio,
  Settings,
  Plus,
  Activity,
  MapPin
} from 'lucide-react';

const sensors = [
  {
    id: 'SOIL-001',
    name: 'Field A - Soil Monitor',
    type: 'Soil Moisture & pH',
    location: 'North Field Section 1',
    status: 'online',
    battery: 87,
    signal: 'strong',
    lastUpdate: '2 min ago',
    readings: {
      moisture: 68,
      temperature: 24.5,
      ph: 6.8,
      nitrogen: 45
    }
  },
  {
    id: 'TEMP-002',
    name: 'Greenhouse Temperature',
    type: 'Climate Monitor',
    location: 'Greenhouse A',
    status: 'online',
    battery: 92,
    signal: 'excellent',
    lastUpdate: '1 min ago',
    readings: {
      temperature: 28.2,
      humidity: 75,
      co2: 420,
      light: 65000
    }
  },
  {
    id: 'WATER-003',
    name: 'Irrigation Flow Sensor',
    type: 'Water Management',
    location: 'Main Water Line',
    status: 'warning',
    battery: 34,
    signal: 'weak',
    lastUpdate: '15 min ago',
    readings: {
      flow: 12.5,
      pressure: 2.3,
      totalVolume: 1247,
      efficiency: 89
    }
  },
  {
    id: 'PEST-004',
    name: 'Pest Detection Camera',
    type: 'AI Vision Sensor',
    location: 'South Field Perimeter',
    status: 'offline',
    battery: 0,
    signal: 'none',
    lastUpdate: '2 hours ago',
    readings: {
      detections: 3,
      confidence: 92,
      alerts: 1,
      images: 47
    }
  }
];

const networkStats = [
  { label: 'Active Sensors', value: 3, total: 4, unit: 'devices' },
  { label: 'Data Points Today', value: 2847, total: 3000, unit: 'readings' },
  { label: 'Network Uptime', value: 98.7, total: 100, unit: '%' },
  { label: 'Battery Average', value: 68, total: 100, unit: '%' }
];

const recentAlerts = [
  { time: '10 min ago', sensor: 'WATER-003', message: 'Low battery warning', priority: 'medium' },
  { time: '2 hours ago', sensor: 'PEST-004', message: 'Sensor offline', priority: 'high' },
  { time: '4 hours ago', sensor: 'SOIL-001', message: 'Soil moisture below threshold', priority: 'low' },
  { time: '1 day ago', sensor: 'TEMP-002', message: 'Temperature spike detected', priority: 'medium' }
];

export default function IoTSensorNetwork() {
  const [selectedSensor, setSelectedSensor] = useState(sensors[0]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'offline': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <Radio className="h-4 w-4" />;
      default: return <Radio className="h-4 w-4" />;
    }
  };

  const getSignalIcon = (signal: string) => {
    const strength = signal === 'excellent' ? 4 : signal === 'strong' ? 3 : signal === 'weak' ? 2 : 1;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded ${
              bar <= strength ? 'bg-green-500 h-3' : 'bg-gray-300 h-2'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Radio className="h-8 w-8 text-primary" />
            IoT Sensor Network
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time monitoring with smart sensors for precision agriculture
          </p>
        </div>

        {/* Network Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {networkStats.map((stat, idx) => (
            <Card key={idx} className="shadow-soft">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold mb-2">{stat.value}{stat.unit === '%' ? '%' : ''}</div>
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <Progress value={(stat.value / stat.total) * 100} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sensor List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sensor Network Status</CardTitle>
                    <CardDescription>Real-time monitoring devices across your farm</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sensor
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sensors.map((sensor) => (
                  <div 
                    key={sensor.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedSensor.id === sensor.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedSensor(sensor)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm md:text-base">{sensor.name}</h3>
                        <p className="text-xs text-muted-foreground">{sensor.type} • {sensor.location}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(sensor.status)}`}>
                        {getStatusIcon(sensor.status)}
                        <span className="capitalize">{sensor.status}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-3">
                      <div className="flex items-center gap-2">
                        <Battery className="h-3 w-3" />
                        <span>{sensor.battery}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="h-3 w-3" />
                        {getSignalIcon(sensor.signal)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        <span>{sensor.lastUpdate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>ID: {sensor.id}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(sensor.readings).slice(0, 4).map(([key, value], idx) => (
                        <div key={idx} className="text-center p-2 bg-muted/30 rounded">
                          <p className="text-xs text-muted-foreground capitalize">{key}</p>
                          <p className="text-sm font-bold">{value}{key === 'temperature' ? '°C' : key === 'ph' ? '' : key === 'moisture' ? '%' : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Real-time Data Visualization */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Sensor Data
                </CardTitle>
                <CardDescription>Live readings from {selectedSensor.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedSensor.readings).map(([key, value], idx) => (
                    <div key={idx} className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        {key === 'temperature' && <Thermometer className="h-6 w-6 text-red-500" />}
                        {key === 'moisture' && <Droplets className="h-6 w-6 text-blue-500" />}
                        {key === 'flow' && <Activity className="h-6 w-6 text-green-500" />}
                        {!['temperature', 'moisture', 'flow'].includes(key) && <Zap className="h-6 w-6 text-primary" />}
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {value}{key === 'temperature' ? '°C' : key === 'ph' ? '' : key.includes('moisture') || key.includes('humidity') ? '%' : ''}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Controls */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAlerts.map((alert, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      alert.priority === 'high' ? 'bg-red-500' : 
                      alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.sensor} • {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Sensor Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Alerts
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Calibrate Sensors
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Battery className="h-4 w-4 mr-2" />
                  Battery Status
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Wifi className="h-4 w-4 mr-2" />
                  Network Health
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Network Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                  <p className="text-sm text-muted-foreground">Continuous Monitoring</p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Data Collection Rate</span>
                    <span>Every 5 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Used</span>
                    <span>1.2 GB / 10 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Response</span>
                    <span>0.8 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maintenance Due</span>
                    <span>12 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
