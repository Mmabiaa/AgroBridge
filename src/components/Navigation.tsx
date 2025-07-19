
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { 
  BarChart3, 
  Bot, 
  Monitor, 
  TrendingUp, 
  ShoppingCart, 
  GraduationCap, 
  Users, 
  Settings,
  Shield,
  Menu,
  Wheat,
  Globe,
  Bell,
  Search,
  Camera,
  Mic
} from 'lucide-react';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/agrigpt', label: 'AgriGPT', icon: Bot },
  { href: '/monitoring', label: 'Farm Monitor', icon: Monitor },
  { href: '/analytics', label: 'Predictive Analytics', icon: TrendingUp },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
  { href: '/learning', label: 'Learning Center', icon: GraduationCap },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Support & Help', icon: Shield },
];

const languages = ['English', 'Twi', 'Hausa', 'Yoruba'];

export const Navigation = () => {
  const location = useLocation();
  const [currentLang, setCurrentLang] = useState('English');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavItems = ({ mobile = false, onItemClick = () => {} }) => (
    <div className={`flex ${mobile ? 'flex-col space-y-2' : 'flex-row space-x-1'} items-start`}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => { onItemClick(); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              active 
                ? 'bg-primary text-primary-foreground shadow-soft' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Icon size={16} />
            {mobile && <span>{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );

  const LanguageSelector = () => (
    <div className="flex items-center gap-2">
      <Globe size={16} className="text-muted-foreground" />
      <select 
        value={currentLang} 
        onChange={(e) => setCurrentLang(e.target.value)}
        className="bg-transparent border border-border rounded px-2 py-1 text-sm"
      >
        {languages.map((lang) => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
    </div>
  );

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Wheat className="h-8 w-8 text-primary" />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              AgroBridge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <NavItems />
            <div className="border-l pl-4 flex items-center gap-2">
              <Link to="/search">
                <Button variant="ghost" size="icon" className="relative">
                  <Search className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/crop-disease-detection">
                <Button variant="ghost" size="icon" className="relative">
                  <Camera className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/voice-commands">
                <Button variant="ghost" size="icon" className="relative">
                  <Mic className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
              </Link>
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelector />
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  <NavItems mobile onItemClick={() => setMobileNavOpen(false)} />
                  
                  <div className="border-t pt-4 space-y-2">
                    <Link to="/search" className="w-full">
                      <Button variant="ghost" className="w-full justify-start">
                        <Search className="h-4 w-4 mr-2" />
                        Advanced Search
                      </Button>
                    </Link>
                    <Link to="/crop-disease-detection" className="w-full">
                      <Button variant="ghost" className="w-full justify-start">
                        <Camera className="h-4 w-4 mr-2" />
                        Disease Detection
                      </Button>
                    </Link>
                    <Link to="/voice-commands" className="w-full">
                      <Button variant="ghost" className="w-full justify-start">
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Commands
                      </Button>
                    </Link>
                    <Link to="/notifications" className="w-full">
                      <Button variant="ghost" className="w-full justify-start relative">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                        <span className="absolute right-4 h-2 w-2 bg-red-500 rounded-full"></span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
