
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { RoleBasedDashboard } from '@/components/RoleBasedDashboard';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useAuth } from '@/contexts/AuthContext';



export default function Dashboard() {
  const { user, hasPermission } = useAuth();

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



  // If user has basic dashboard permission, show role-based dashboard
  if (user && hasPermission('view_dashboard')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8 py-6">
          {/* Welcome Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user.name || user.username}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your {user.role === 'farmer' ? 'farm' : user.role === 'buyer' ? 'purchases' : user.role === 'ngo' ? 'community' : 'system'} today.
            </p>
          </div>

          {/* API-Integrated Dashboard Stats */}
          <DashboardStats />
          
          {/* Quick Actions */}
          <QuickActions />
          
          {/* Recent Activity */}
          <RecentActivity />
          
          {/* Role-Based Dashboard Content */}
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
