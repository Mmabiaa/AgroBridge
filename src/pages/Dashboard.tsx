
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
  Settings,
  CloudRain,
  Zap,
  Volume2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  // Weather state
  const [weather, setWeather] = useState({
    temp: '--',
    desc: 'Loading...',
    humidity: '--',
    wind: '--',
    icon: 'sun',
    bg: 'from-yellow-100 to-blue-200',
    forecast: [] as { day: string; temp: string; icon: string; rain: string }[],
    error: '' as string | null
  });

  // Speech functionality
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome message
    const hasSeenWelcome = localStorage.getItem('agrobridge_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('agrobridge_welcome_seen', 'true');
      
      // Welcome speech on first visit
      const speakWelcome = () => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            "Welcome to AgroBridge, your AI powered agriculture connections"
          );
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 0.8;
          
          // Try to use a more natural voice if available
          const voices = speechSynthesis.getVoices();
          const preferredVoice = voices.find(voice => 
            voice.lang.includes('en') && (voice.name.includes('Google') || voice.name.includes('Natural'))
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          
          speechSynthesis.speak(utterance);
          setSpeechEnabled(true);
        }
      };

      // Delay speech slightly to ensure page is loaded
      const timer = setTimeout(speakWelcome, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Use Weatherbit.io API for current weather
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const apiKey = import.meta.env.VITE_WEATHERBIT_API_KEY;
        const url = `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          console.error('Weatherbit API error:', res.status, text);
          setWeather(w => ({ ...w, desc: 'Weather unavailable', error: `API error: ${res.status} ${text}` }));
          return;
        }
        const data = await res.json();
        const weatherData = data.data[0];
        // Map Weatherbit codes to UI
        const sky = weatherData.weather.description.toLowerCase();
        let icon = 'sun', bg = 'from-yellow-100 to-blue-200';
        if (sky.includes('cloud')) { icon = 'cloud'; bg = 'from-gray-300 to-blue-200'; }
        if (sky.includes('rain')) { icon = 'cloud-rain'; bg = 'from-blue-400 to-gray-500'; }
        if (sky.includes('clear')) { icon = 'sun'; bg = 'from-yellow-100 to-blue-200'; }
        if (sky.includes('thunder')) { icon = 'zap'; bg = 'from-gray-400 to-yellow-200'; }
        setWeather({
          temp: Math.round(weatherData.temp) + '°C',
          desc: weatherData.weather.description.replace(/\b\w/g, l => l.toUpperCase()),
          humidity: weatherData.rh + '%',
          wind: Math.round(weatherData.wind_spd) + ' km/h',
          icon,
          bg,
          forecast: [],
          error: null
        });
      } catch (e: any) {
        console.error('Weatherbit fetch error:', e);
        setWeather(w => ({ ...w, desc: 'Weather unavailable', error: e?.message || String(e) }));
      }
    };
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          // Fallback to Accra, GH
          fetchWeather(5.6037, -0.1870);
        },
        { timeout: 10000 }
      );
    } else {
      // Fallback to Accra, GH
      fetchWeather(5.6037, -0.1870);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-8 px-0 sm:px-4">
        
        {/* Welcome Message - Only shows once after login */}
        {showWelcome && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 lg:p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-white/20 animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Welcome to AgroBridge!</h1>
                <p className="text-sm lg:text-base text-gray-600">Your AI-powered agriculture connections</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(
                      "Welcome to AgroBridge, your AI powered agriculture connections"
                    );
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    utterance.volume = 0.8;
                    
                    const voices = speechSynthesis.getVoices();
                    const preferredVoice = voices.find(voice => 
                      voice.lang.includes('en') && (voice.name.includes('Google') || voice.name.includes('Natural'))
                    );
                    if (preferredVoice) {
                      utterance.voice = preferredVoice;
                    }
                    
                    speechSynthesis.speak(utterance);
                  }
                }}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                <Volume2 className="h-4 w-4" />
                <span className="hidden sm:inline">Replay Welcome</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWelcome(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

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

      
        

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-full">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weather Card */}
            <Card className={`shadow-soft w-full max-w-full bg-gradient-to-br ${weather.bg}`}>
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
                        <p className="text-2xl sm:text-3xl font-bold">{weather.temp}</p>
                        <p className="text-muted-foreground text-sm sm:text-base">{weather.desc}</p>
                        {weather.error && (
                          <p className="text-xs text-red-500 break-all mt-2">{weather.error}</p>
                        )}
                      </div>
                      {weather.icon === 'sun' && <Sun className="h-10 w-10 sm:h-12 sm:w-12 text-warning" />}
                      {weather.icon === 'cloud' && <Cloud className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />}
                      {weather.icon === 'cloud-rain' && <CloudRain className="h-10 w-10 sm:h-12 sm:w-12 text-sky" />}
                      {weather.icon === 'zap' && <Zap className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500" />}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-sky" />
                        <span>Humidity: {weather.humidity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-muted-foreground" />
                        <span>Wind: {weather.wind}</span>
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
  );
}
