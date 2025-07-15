
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Thermometer,
  Droplets,
  Sun,
  Wind,
  Sprout,
  ShoppingCart,
  Bot,
  Monitor,
  Calendar,
  Bell,
  Eye,
  MessageSquare,
  Camera,
  Mic,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CropDiseaseDetection } from '@/components/ai/CropDiseaseDetection';
import { VoiceCommands } from '@/components/ai/VoiceCommands';
import { InteractiveDashboard } from '@/components/analytics/InteractiveDashboard';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

const weatherData = {
  current: {
    temp: 28,
    humidity: 65,
    condition: 'Partly Cloudy',
    rainfall: 2.5,
    windSpeed: 12
  },
  forecast: [
    { day: 'Today', temp: '28°C', icon: Sun, rain: '10%' },
    { day: 'Tomorrow', temp: '26°C', icon: Cloud, rain: '40%' },
    { day: 'Thursday', temp: '25°C', icon: Cloud, rain: '60%' },
    { day: 'Friday', temp: '27°C', icon: Sun, rain: '20%' }
  ]
};

const alerts = [
  {
    id: 1,
    type: 'warning',
    title: 'Pest Alert: Fall Armyworm',
    description: 'High risk detected in your area. Check maize crops.',
    priority: 'high',
    time: '2 hours ago'
  },
  {
    id: 2,
    type: 'info',
    title: 'Optimal Planting Window',
    description: 'Next week is ideal for planting tomatoes.',
    priority: 'medium',
    time: '1 day ago'
  },
  {
    id: 3,
    type: 'success',
    title: 'Market Demand High',
    description: 'Onion prices increased by 15% this week.',
    priority: 'medium',
    time: '2 days ago'
  }
];

const todoTasks = [
  { id: 1, task: 'Check soil moisture in Field A', priority: 'high', completed: false },
  { id: 2, task: 'Apply fertilizer to tomato crops', priority: 'medium', completed: false },
  { id: 3, task: 'Inspect poultry for signs of disease', priority: 'high', completed: true },
  { id: 4, task: 'Harvest mature maize', priority: 'low', completed: false }
];

const farmHealth = {
  overall: 85,
  soilMoisture: 70,
  cropHealth: 90,
  pestRisk: 25,
  weatherSuitability: 95
};

const quickActions = [
  { title: 'Chat with AgriGPT', icon: Bot, href: '/agrigpt', variant: 'farmer' },
  { title: 'Check Farm Monitor', icon: Monitor, href: '/monitoring', variant: 'sky' },
  { title: 'View Analytics', icon: TrendingUp, href: '/analytics', variant: 'earth' },
  { title: 'Browse Marketplace', icon: ShoppingCart, href: '/marketplace', variant: 'harvest' }
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-8 px-0 sm:px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full max-w-full">
          <div>
            <h1 className="text-3xl font-bold">Farmer Intelligence Hub</h1>
            <p className="text-muted-foreground">Welcome back, John! Here's your farm overview.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Link to="/notifications">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-full">
          <Link to="/agrigpt">
            <Card className="cursor-pointer hover:shadow-soft transition-all duration-300 h-full w-full max-w-full">
              <CardContent className="flex items-center p-4 sm:p-6">
                <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-3 sm:mr-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Chat with AgriGPT</span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/crop-disease-detection">
            <Card className="cursor-pointer hover:shadow-soft transition-all duration-300 h-full w-full max-w-full">
              <CardContent className="flex items-center p-4 sm:p-6">
                <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-3 sm:mr-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Crop Disease Detection</span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/voice-commands">
            <Card className="cursor-pointer hover:shadow-soft transition-all duration-300 h-full w-full max-w-full">
              <CardContent className="flex items-center p-4 sm:p-6">
                <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-3 sm:mr-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Voice Commands</span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/marketplace">
            <Card className="cursor-pointer hover:shadow-soft transition-all duration-300 h-full w-full max-w-full">
              <CardContent className="flex items-center p-4 sm:p-6">
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-3 sm:mr-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Live Marketplace</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* AI Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full max-w-full">
          <CropDiseaseDetection />
          <VoiceCommands />
        </div>

        {/* Analytics Dashboard */}
        <Card className="shadow-soft w-full max-w-full">
          <CardHeader>
            <CardTitle>Farm Analytics Overview</CardTitle>
            <CardDescription>Real-time insights into your farm performance</CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveDashboard />
          </CardContent>
        </Card>

        {/* Notifications */}
        <NotificationCenter />

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-full">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weather Card */}
            <Card className="shadow-soft w-full max-w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Weather Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Weather */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold">28°C</p>
                        <p className="text-muted-foreground text-sm sm:text-base">Partly Cloudy</p>
                      </div>
                      <Sun className="h-10 w-10 sm:h-12 sm:w-12 text-warning" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-sky" />
                        <span>Humidity: 65%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-muted-foreground" />
                        <span>Wind: 12 km/h</span>
                      </div>
                    </div>
                  </div>

                  {/* Forecast */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Today</span>
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        <span className="text-sm">28°C</span>
                        <span className="text-xs text-sky">10%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tomorrow</span>
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        <span className="text-sm">26°C</span>
                        <span className="text-xs text-sky">40%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Farm Health Score */}
            <Card className="shadow-soft w-full max-w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Farm Health Score
                </CardTitle>
                <CardDescription>Overall farm performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">85%</div>
                  <p className="text-sm text-muted-foreground">Overall Health</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Soil Moisture</span>
                      <span>70%</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Crop Health</span>
                      <span>90%</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pest Risk</span>
                      <span>25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weather Suitability</span>
                      <span>95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Trends */}
            <Card className="shadow-soft w-full max-w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Live Market Prices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Tomatoes</p>
                      <p className="text-sm text-muted-foreground">High demand • Live update</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">₦450/kg</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12% today
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Onions</p>
                      <p className="text-sm text-muted-foreground">Medium demand • Live update</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">₦280/kg</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +8% today
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Alerts */}
            <Card className="shadow-soft w-full max-w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Smart Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full mt-2 bg-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-red-800">Pest Alert: Fall Armyworm</h4>
                    <p className="text-xs text-red-600 mb-2">High risk detected in maize field</p>
                    <p className="text-xs text-red-500">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full mt-2 bg-yellow-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-yellow-800">Weather Warning</h4>
                    <p className="text-xs text-yellow-600 mb-2">Heavy rainfall expected in 48 hours</p>
                    <p className="text-xs text-yellow-500">6 hours ago</p>
                  </div>
                </div>
                
                <Link to="/notifications">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Alerts
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Today's Tasks */}
            <Card className="shadow-soft w-full max-w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Smart Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">Apply organic pesticide to maize field</p>
                    <Badge variant="destructive" className="mt-1 text-xs">AI Recommended</Badge>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">Harvest tomatoes - optimal ripeness detected</p>
                    <Badge variant="default" className="mt-1 text-xs">Camera Analysis</Badge>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">Prepare drainage for expected rainfall</p>
                    <Badge variant="secondary" className="mt-1 text-xs">Weather Based</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AgriGPT Quick Chat */}
            <Card className="shadow-soft w-full max-w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AgriGPT Assistant
                </CardTitle>
                <CardDescription>AI-powered farming guidance in local languages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    "Sɛn na metumi aboa wo nnɛ?" (How can I help you today?)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/agrigpt" className="flex-1">
                    <Button variant="farmer" size="sm" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                  </Link>
                  <Link to="/voice-commands">
                    <Button variant="outline" size="sm">
                      <Mic className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
