
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Satellite, 
  Globe, 
  Map, 
  Layers, 
  Download, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  Eye,
  Maximize,
  RotateCcw,
  Filter
} from 'lucide-react';

const satelliteData = [
  {
    date: '2024-07-15',
    satellite: 'Landsat 8',
    resolution: '30m',
    cloudCover: 12,
    quality: 'Excellent',
    vegetation: 0.76,
    moisture: 0.68,
    temperature: 28.5
  },
  {
    date: '2024-07-10',
    satellite: 'Sentinel-2',
    resolution: '10m',
    cloudCover: 8,
    quality: 'Excellent',
    vegetation: 0.74,
    moisture: 0.71,
    temperature: 29.2
  },
  {
    date: '2024-07-05',
    satellite: 'MODIS',
    resolution: '250m',
    cloudCover: 25,
    quality: 'Good',
    vegetation: 0.72,
    moisture: 0.69,
    temperature: 27.8
  }
];

const analysisMetrics = [
  { label: 'NDVI (Vegetation Health)', value: 0.76, change: '+0.08', trend: 'up' },
  { label: 'Soil Moisture Index', value: 0.68, change: '-0.03', trend: 'down' },
  { label: 'Surface Temperature', value: 28.5, change: '+1.2°C', trend: 'up' },
  { label: 'Crop Stress Level', value: 0.23, change: '-0.05', trend: 'down' }
];

const fieldZones = [
  { zone: 'North Field', area: '12.5 ha', ndvi: 0.82, stress: 'Low', irrigation: 'Optimal' },
  { zone: 'South Field', area: '8.3 ha', ndvi: 0.74, stress: 'Medium', irrigation: 'Needed' },
  { zone: 'East Field', area: '6.7 ha', ndvi: 0.79, stress: 'Low', irrigation: 'Good' },
  { zone: 'West Field', area: '9.1 ha', ndvi: 0.68, stress: 'High', irrigation: 'Critical' }
];

export default function SatelliteIntegration() {
  const [selectedDate, setSelectedDate] = useState('2024-07-15');
  const [selectedLayer, setSelectedLayer] = useState('vegetation');

  const getStressColor = (stress: string) => {
    switch (stress) {
      case 'Low': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'High': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="h-3 w-3 text-green-500" /> : 
      <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 px-4">
      <div className="container mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl md:text-4xl font-bold flex items-center justify-center gap-3">
            <Satellite className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span className="text-lg md:text-4xl">Satellite Farm Monitoring</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto px-4">
            Real-time satellite imagery and precision agriculture insights from space
          </p>
        </div>

        {/* Satellite Image Viewer */}
        <Card className="shadow-soft border-2 border-primary/20">
          <CardHeader>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Globe className="h-5 w-5 md:h-6 md:w-6" />
                  Live Satellite View
                </CardTitle>
                <CardDescription className="text-sm">Real-time imagery from multiple satellite sources</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Filter className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Layers
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Timeline
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="lg:col-span-3">
                <div className="bg-muted/50 rounded-lg p-6 md:p-8 text-center min-h-[300px] md:min-h-[400px] flex items-center justify-center">
                  <div className="space-y-4">
                    <Map className="h-16 md:h-24 w-16 md:w-24 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-base md:text-lg">Satellite Image Display</h3>
                      <p className="text-muted-foreground text-sm">
                        Latest imagery from {selectedDate}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-2">
                        Resolution: 30m • Cloud Cover: 12% • Quality: Excellent
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button size="sm" className="text-xs">
                        <Eye className="h-3 w-3 mr-1 md:mr-2" />
                        View Full Screen
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Download className="h-3 w-3 mr-1 md:mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Layer Controls</p>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    {['vegetation', 'moisture', 'temperature', 'stress'].map((layer) => (
                      <Button
                        key={layer}
                        variant={selectedLayer === layer ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => setSelectedLayer(layer)}
                      >
                        <Layers className="h-3 w-3 mr-2" />
                        {layer.charAt(0).toUpperCase() + layer.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Analysis Tools</p>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <RotateCcw className="h-3 w-3 mr-2" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Maximize className="h-3 w-3 mr-2" />
                      Full Screen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Analysis Metrics */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Satellite Analysis Metrics</CardTitle>
                <CardDescription className="text-sm">Key agricultural indicators from satellite data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analysisMetrics.map((metric, idx) => (
                    <div key={idx} className="p-3 md:p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-xs md:text-sm">{metric.label}</h4>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(metric.trend)}
                          <span className={`text-xs ${
                            metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.change}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xl md:text-2xl font-bold">{metric.value}</div>
                        <Progress value={metric.value * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Field Zone Analysis */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Field Zone Analysis</CardTitle>
                <CardDescription className="text-sm">Satellite-based field health assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fieldZones.map((zone, idx) => (
                    <div key={idx} className="border rounded-lg p-3 md:p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-sm md:text-base">{zone.zone}</h3>
                          <p className="text-xs text-muted-foreground">Area: {zone.area}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${getStressColor(zone.stress)}`}>
                          {zone.stress} Stress
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 md:gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">NDVI</p>
                          <p className="font-bold text-green-600">{zone.ndvi}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Irrigation</p>
                          <p className="font-medium">{zone.irrigation}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Health</p>
                          <Progress value={zone.ndvi * 100} className="h-2 mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Satellite Data History */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Recent Satellite Passes</CardTitle>
                <CardDescription className="text-sm">Available imagery timeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {satelliteData.map((data, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDate === data.date ? 'bg-primary/10 border border-primary' : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => setSelectedDate(data.date)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{data.satellite}</p>
                        <p className="text-xs text-muted-foreground">{data.date}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{data.resolution}</Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Cloud Cover</span>
                        <span>{data.cloudCover}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality</span>
                        <span className="text-green-600">{data.quality}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Satellite Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">156</div>
                  <p className="text-sm text-muted-foreground">Images Processed</p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Coverage Area</span>
                    <span>36.6 hectares</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Update Frequency</span>
                    <span>Every 3-5 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Resolution</span>
                    <span>10m (Sentinel-2)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Storage</span>
                    <span>2.3 GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-xs" size="sm">
                  <Download className="h-3 w-3 mr-2" />
                  Download Data
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs" size="sm">
                  <Calendar className="h-3 w-3 mr-2" />
                  Schedule Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs" size="sm">
                  <AlertTriangle className="h-3 w-3 mr-2" />
                  Set Alerts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
