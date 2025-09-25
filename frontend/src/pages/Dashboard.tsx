
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
import { RoleBasedDashboard } from '@/components/RoleBasedDashboard';
import { useAuth } from '@/contexts/AuthContext';

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
const messages = [
  "Welcome to AgroBridge, your smart farming partner.",
  "AgroBridge connects farmers and markets with AI.",
  "Hello! AgroBridge is here to power your agriculture journey.",
  "AgroBridge — smarter farming, stronger connections.",
  "Akwaaba to AgroBridge, wo AI farming partner.",
  "AgroBridge yɛ wo kuayo boafo — your farm helper."
];
const quickActions = [
  { title: 'Chat with AgriGPT', icon: Bot, href: '/agrigpt', variant: 'farmer' },
  { title: 'Check Farm Monitor', icon: Monitor, href: '/monitoring', variant: 'sky' },
  { title: 'View Analytics', icon: TrendingUp, href: '/analytics', variant: 'earth' },
  { title: 'Browse Marketplace', icon: ShoppingCart, href: '/marketplace', variant: 'harvest' }
];

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({
    temp: '28°C',
    desc: 'Partly Cloudy',
    humidity: '65%',
    wind: '12 km/h',
    icon: 'sun',
    bg: 'from-blue-50 to-sky-100',
    error: null
  });
  const [isLoading, setIsLoading] = useState(false);

  // Speech functionality
  const [speechEnabled, setSpeechEnabled] = useState(false);

  useEffect(() => {
    // Welcome speech on every dashboard visit
    
    const messages = [
      "Welcome to AgroBridge, your smart farming partner.",
      "Welcome to AgroBridge, your friend for better farming!",
      "AgroBridge connects you to markets with smart AI help.",
      "Hello farmer! AgroBridge makes your farming journey easier.",
      "AgroBridge — grow more, sell smarter, succeed faster.",
      "Hi there! AgroBridge is your AI partner for farm success.",
      "Join AgroBridge to link with buyers and boost your farm!",
      "AgroBridge connects farmers and markets with AI.",
      "Hello! AgroBridge is here to power your agriculture journey.",
      "AgroBridge — smarter farming, stronger connections.",
      "AgroBridge, your digital farming assistant.",
      "Welcome back to AgroBridge, supporting farmers every step.",
      "AgroBridge helps you grow smarter and sell faster.",
      "Discover new opportunities with AgroBridge.",
      "AgroBridge — bridging farmers and buyers seamlessly.",
      "Your agriculture future starts here, with AgroBridge.",
      "AgroBridge — your smart farming companion."
    ];
    
    
    const speakWelcome = () => { 
      if ('speechSynthesis' in window) {
        // Pick a random message
        const text = messages[Math.floor(Math.random() * messages.length)];
        const utterance = new SpeechSynthesisUtterance(text);
    
        utterance.rate = 0.8;
        utterance.pitch = 0.8;
        utterance.volume = 0.8;
    
        // Wait until voices are loaded (important for Safari & mobile)
        const setVoice = () => {
          const voices = speechSynthesis.getVoices();
    
          // Pick a good voice (prefer Google/English voices)
          const preferredVoice = voices.find(voice =>
            voice.lang.toLowerCase().includes('en') &&
            (voice.name.includes('Google') || voice.name.includes('Natural'))
          );
    
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
    
          speechSynthesis.speak(utterance);
          setSpeechEnabled(true);
        };
    
        // If voices are already loaded
        if (speechSynthesis.getVoices().length > 0) {
          setVoice();
        } else {
          // On Safari/iOS, voices load later
          speechSynthesis.onvoiceschanged = setVoice;
        }
      } else {
        console.warn("This browser does not support speech synthesis.");
      }
    };
    


    // Delay speech slightly to ensure page is loaded
    const timer = setTimeout(speakWelcome, 1000);
    return () => clearTimeout(timer);
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
        let icon = 'sun', bg = 'from-blue-50 to-sky-100';
        if (sky.includes('cloud')) { icon = 'cloud'; bg = 'from-gray-300 to-blue-200'; }
        if (sky.includes('rain')) { icon = 'cloud-rain'; bg = 'from-blue-400 to-gray-500'; }
        if (sky.includes('clear')) { icon = 'sun'; bg = 'from-blue-50 to-sky-100'; }
        if (sky.includes('thunder')) { icon = 'zap'; bg = 'from-gray-400 to-yellow-200'; }
        setWeather({
          temp: Math.round(weatherData.temp) + '°C',
          desc: weatherData.weather.description.replace(/\b\w/g, l => l.toUpperCase()),
          humidity: weatherData.rh + '%',
          wind: Math.round(weatherData.wind_spd) + ' km/h',
          icon,
          bg,
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

  // If user has basic dashboard permission, show role-based dashboard
  if (user && hasPermission('view_dashboard')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8">
          <RoleBasedDashboard />
        </div>
      </div>
    );
  }

  // Fallback to basic dashboard for users without specific permissions
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Welcome to AgroBridge
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Your comprehensive agricultural platform
            </p>
          </div>

          {/* Basic Dashboard Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Getting Started</CardTitle>
                <CardDescription className="text-sm md:text-base">Begin your journey with AgroBridge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/profile-setup">
                  <Button className="w-full text-sm md:text-base">Complete Profile Setup</Button>
                </Link>
                <Link to="/learning">
                  <Button variant="outline" className="w-full text-sm md:text-base">Explore Learning Center</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Support</CardTitle>
                <CardDescription className="text-sm md:text-base">Need help? We're here for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/support">
                  <Button variant="outline" className="w-full text-sm md:text-base">Get Support</Button>
                </Link>
                <Link to="/community">
                  <Button variant="outline" className="w-full text-sm md:text-base">Join Community</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Account</CardTitle>
                <CardDescription className="text-sm md:text-base">Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/settings">
                  <Button variant="outline" className="w-full text-sm md:text-base">Account Settings</Button>
                </Link>
                <Link to="/notifications">
                  <Button variant="outline" className="w-full text-sm md:text-base">Notifications</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
