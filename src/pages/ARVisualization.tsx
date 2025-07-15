
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Scan, 
  Camera, 
  Eye, 
  Map, 
  Layers, 
  Target,
  Smartphone,
  Maximize,
  Play,
  RotateCcw,
  Settings,
  Download,
  Share2
} from 'lucide-react';

const arFeatures = [
  {
    title: 'Crop Health Visualization',
    description: 'Real-time health indicators overlaid on crops',
    icon: Eye,
    status: 'active',
    accuracy: 94
  },
  {
    title: 'Growth Prediction Models',
    description: '3D growth projections based on current conditions',
    icon: Target,
    status: 'active',
    accuracy: 89
  },
  {
    title: 'Field Mapping & Boundaries',
    description: 'Precise field boundaries and zone mapping',
    icon: Map,
    status: 'calibrating',
    accuracy: 76
  },
  {
    title: 'Pest Detection Overlay',
    description: 'AI-powered pest identification and tracking',
    icon: Scan,
    status: 'inactive',
    accuracy: 0
  }
];

const fieldMappingData = [
  { zone: 'Zone A', area: '2.1 ha', health: 92, predictedYield: '8.5 tons' },
  { zone: 'Zone B', area: '1.8 ha', health: 87, predictedYield: '7.2 tons' },
  { zone: 'Zone C', area: '1.3 ha', health: 94, predictedYield: '6.8 tons' }
];

const arSessions = [
  { date: '2024-07-15', duration: '23 min', field: 'Main Field', insights: 12 },
  { date: '2024-07-14', duration: '18 min', field: 'Greenhouse A', insights: 8 },
  { date: '2024-07-13', duration: '31 min', field: 'North Field', insights: 15 }
];

export default function ARVisualization() {
  const [selectedFeature, setSelectedFeature] = useState(arFeatures[0]);
  const [arActive, setArActive] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'calibrating': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'calibrating': return 'secondary';
      case 'inactive': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Eye className="h-8 w-8 text-primary" />
            AR Crop Visualization
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Augmented reality technology for enhanced crop monitoring and field analysis
          </p>
        </div>

        {/* AR Control Panel */}
        <Card className="shadow-soft border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-6 w-6" />
                  AR Camera Control
                </CardTitle>
                <CardDescription>Launch augmented reality crop analysis</CardDescription>
              </div>
              <div className={`w-3 h-3 rounded-full ${arActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {arActive ? 'AR Session Active' : 'Ready to start AR session'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={() => setArActive(!arActive)}
                      variant={arActive ? "destructive" : "default"}
                      className="flex-1 max-w-32"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {arActive ? 'Stop AR' : 'Start AR'}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Camera Settings</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Maximize className="h-3 w-3 mr-1" />
                      Full Screen
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Calibrate
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Active AR Features</p>
                  <div className="space-y-2">
                    {arFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(feature.status)}`} />
                          <span className="text-sm">{feature.title}</span>
                        </div>
                        <Badge variant={getStatusBadge(feature.status)} className="text-xs">
                          {feature.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AR Features */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>AR Analysis Features</CardTitle>
                <CardDescription>Advanced visualization tools for crop monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {arFeatures.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedFeature.title === feature.title ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedFeature(feature)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Icon className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="font-semibold text-sm md:text-base">{feature.title}</h3>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadge(feature.status)} className="text-xs">
                          {feature.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Accuracy</span>
                          <span>{feature.accuracy}%</span>
                        </div>
                        <Progress value={feature.accuracy} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Field Mapping Results */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  AR Field Mapping Results
                </CardTitle>
                <CardDescription>Zones identified through AR analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fieldMappingData.map((zone, idx) => (
                    <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{zone.zone}</h4>
                        <Badge variant="outline" className="text-xs">{zone.area}</Badge>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Health Score</span>
                          <span className="text-green-600 font-medium">{zone.health}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Predicted Yield</span>
                          <span className="font-medium">{zone.predictedYield}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session History & Controls */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Session History</CardTitle>
                <CardDescription>Recent AR analysis sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {arSessions.map((session, idx) => (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{session.field}</p>
                        <p className="text-xs text-muted-foreground">{session.date}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{session.duration}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.insights} insights generated
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile AR App
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export AR Data
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Session
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Layers className="h-4 w-4 mr-2" />
                  Layer Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>AR Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">47</div>
                  <p className="text-sm text-muted-foreground">Total AR Sessions</p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Average Session</span>
                    <span>24 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insights Generated</span>
                    <span>312 total</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy Rate</span>
                    <span className="text-green-600">91.3%</span>
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
