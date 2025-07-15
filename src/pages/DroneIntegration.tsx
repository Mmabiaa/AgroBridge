
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plane, 
  Camera, 
  Battery, 
  MapPin, 
  Calendar, 
  Eye,
  Download,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Zap,
  Wind,
  Thermometer,
  CloudRain
} from 'lucide-react';

const drones = [
  {
    id: 'AGRI-DRONE-001',
    name: 'AgriScout Pro',
    model: 'DJI Agras T40',
    status: 'ready',
    battery: 87,
    flightTime: '22 min',
    lastMission: '2 hours ago',
    totalFlights: 156,
    capabilities: ['Crop Monitoring', 'Spraying', 'Mapping'],
    location: 'Base Station A'
  },
  {
    id: 'AGRI-DRONE-002',
    name: 'FieldMapper X1',
    model: 'Parrot Bluegrass',
    status: 'flying',
    battery: 65,
    flightTime: '18 min',
    lastMission: 'Active',
    totalFlights: 89,
    capabilities: ['Photography', 'Thermal Imaging', 'NDVI Analysis'],
    location: 'North Field'
  },
  {
    id: 'AGRI-DRONE-003',
    name: 'SprayMaster V2',
    model: 'XAG P100',
    status: 'maintenance',
    battery: 12,
    flightTime: '0 min',
    lastMission: '5 days ago',
    totalFlights: 234,
    capabilities: ['Precision Spraying', 'Seeding', 'Monitoring'],
    location: 'Maintenance Bay'
  }
];

const flightMissions = [
  {
    id: 'MISSION-001',
    title: 'Daily Crop Health Survey',
    area: 'Field A & B',
    type: 'monitoring',
    duration: '45 min',
    status: 'completed',
    date: '2024-07-15',
    drone: 'AgriScout Pro',
    results: { images: 247, anomalies: 3, coverage: '12.5 ha' }
  },
  {
    id: 'MISSION-002',
    title: 'Pesticide Application',
    area: 'South Field',
    type: 'spraying',
    duration: '32 min',
    status: 'active',
    date: '2024-07-15',
    drone: 'FieldMapper X1',
    results: { coverage: '8.2 ha', chemicals: '15L', efficiency: '94%' }
  },
  {
    id: 'MISSION-003',
    title: 'Thermal Analysis',
    area: 'Greenhouse Complex',
    type: 'analysis',
    duration: '28 min',
    status: 'scheduled',
    date: '2024-07-16',
    drone: 'AgriScout Pro',
    results: { planned: true }
  }
];

const analysisResults = [
  { metric: 'NDVI Average', value: '0.78', change: '+0.05', status: 'good' },
  { metric: 'Crop Stress Areas', value: '2.3%', change: '-0.8%', status: 'excellent' },
  { metric: 'Irrigation Efficiency', value: '91%', change: '+3%', status: 'good' },
  { metric: 'Pest Detection', value: '3 spots', change: '+1', status: 'attention' }
];

const weatherConditions = {
  windSpeed: 8,
  temperature: 24,
  humidity: 65,
  visibility: 'Good',
  flightSafety: 'Optimal'
};

export default function DroneIntegration() {
  const [selectedDrone, setSelectedDrone] = useState(drones[0]);
  const [activeTab, setActiveTab] = useState('fleet');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-50';
      case 'flying': return 'text-blue-600 bg-blue-50';
      case 'maintenance': return 'text-red-600 bg-red-50';
      case 'charging': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMissionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'scheduled': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getResultStatus = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'attention': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Plane className="h-8 w-8 text-primary" />
            Drone Integration System
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Advanced drone operations for precision agriculture and automated farm monitoring
          </p>
        </div>

        {/* Weather Conditions */}
        <Card className="shadow-soft border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              Flight Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <Wind className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="font-bold">{weatherConditions.windSpeed} km/h</div>
                <div className="text-xs text-muted-foreground">Wind Speed</div>
              </div>
              <div className="text-center">
                <Thermometer className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <div className="font-bold">{weatherConditions.temperature}°C</div>
                <div className="text-xs text-muted-foreground">Temperature</div>
              </div>
              <div className="text-center">
                <CloudRain className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
                <div className="font-bold">{weatherConditions.humidity}%</div>
                <div className="text-xs text-muted-foreground">Humidity</div>
              </div>
              <div className="text-center">
                <Eye className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                <div className="font-bold">{weatherConditions.visibility}</div>
                <div className="text-xs text-muted-foreground">Visibility</div>
              </div>
              <div className="text-center">
                <div className="w-6 h-6 mx-auto mb-2 bg-green-500 rounded-full"></div>
                <div className="font-bold text-green-600">{weatherConditions.flightSafety}</div>
                <div className="text-xs text-muted-foreground">Flight Safety</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b">
          {['fleet', 'missions', 'analysis', 'settings'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Drone Fleet Management */}
        {activeTab === 'fleet' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {drones.map((drone) => (
                <Card 
                  key={drone.id} 
                  className={`shadow-soft cursor-pointer transition-colors ${
                    selectedDrone.id === drone.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedDrone(drone)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{drone.name}</CardTitle>
                        <CardDescription>{drone.model}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(drone.status)}>
                        {drone.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Battery Level</span>
                        <span>{drone.battery}%</span>
                      </div>
                      <Progress value={drone.battery} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Flight Time</p>
                        <p className="font-medium">{drone.flightTime}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Flights</p>
                        <p className="font-medium">{drone.totalFlights}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Capabilities</p>
                      <div className="flex flex-wrap gap-1">
                        {drone.capabilities.map((capability, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" disabled={drone.status !== 'ready'}>
                        <Play className="h-3 w-3 mr-1" />
                        Launch
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Mission Control */}
        {activeTab === 'missions' && (
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Flight Missions</CardTitle>
                    <CardDescription>Scheduled and completed drone operations</CardDescription>
                  </div>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Mission
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {flightMissions.map((mission) => (
                  <div key={mission.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{mission.title}</h3>
                        <p className="text-sm text-muted-foreground">{mission.area} • {mission.drone}</p>
                      </div>
                      <Badge className={getMissionStatusColor(mission.status)}>
                        {mission.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{mission.type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{mission.duration}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{mission.date}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Results</p>
                        <p className="font-medium">
                          {mission.results.planned ? 'Planned' : `${Object.keys(mission.results).length} metrics`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      {mission.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download Data
                        </Button>
                      )}
                      {mission.status === 'active' && (
                        <Button size="sm" variant="outline">
                          <Pause className="h-3 w-3 mr-1" />
                          Pause Mission
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analysis Results */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analysisResults.map((result, idx) => (
                <Card key={idx} className="shadow-soft">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold mb-2">{result.value}</div>
                    <p className="text-sm text-muted-foreground mb-2">{result.metric}</p>
                    <div className={`text-sm font-medium ${getResultStatus(result.status)}`}>
                      {result.change} from last week
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Recent Aerial Imagery
                </CardTitle>
                <CardDescription>Latest drone photography and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-6 text-center">
                      <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h4 className="font-semibold mb-2">Field Analysis {idx}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        NDVI mapping and crop health assessment
                      </p>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View Images
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings and Maintenance */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Drone Configuration</CardTitle>
                <CardDescription>System settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Flight Parameters
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Camera className="h-4 w-4 mr-2" />
                    Camera Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Battery className="h-4 w-4 mr-2" />
                    Power Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    GPS Calibration
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription>Upcoming maintenance and service tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Propeller Inspection</span>
                    <Badge variant="outline">Due in 3 days</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">AgriScout Pro</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Battery Calibration</span>
                    <Badge variant="outline">Due in 1 week</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">All Drones</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Software Update</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">FieldMapper X1</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
