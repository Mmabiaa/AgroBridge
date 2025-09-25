import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { 
  Menu,
  LogOut,
  User
} from 'lucide-react';
import { notifySystemUpdate } from '@/components/notifications/NotificationCenter';
import { useRoleBasedNavigation } from './RoleBasedNavigation';
import { useAuth, User as AuthUser } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { useServerNavigation } from '@/hooks/useServerNavigation';

const languages = ['English', 'Twi', 'Hausa', 'Yoruba'];

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState('English');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { user: currentUser, logout } = useAuth();
  const { getFilteredNavigation, getGroupedNavigation, getRoleNavigation } = useRoleBasedNavigation();
  const { enableServerDrivenNav } = useFeatureFlags();
  const serverNav = useServerNavigation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to logout? All unsaved data will be lost.');
    if (!confirmed) return;

    setIsLoggingOut(true);
    
    try {
      // Use the auth context logout function
      logout();
      
      // Show success notification
      notifySystemUpdate('Successfully logged out. Thank you for using AgroBridge!', 'success');
      
      // Navigate to home page
      navigate('/');
      
    } catch (error) {
      console.error('Logout error:', error);
      notifySystemUpdate('Error during logout. Please try again.', 'warning');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // If no user is authenticated, don't render navigation
  if (!currentUser) {
    return null;
  }

  // Type assertion to ensure currentUser is not null
  const user = currentUser as AuthUser;

  const NavItems = ({ mobile = false, onItemClick = () => {} }) => {
    let navigationItems = getRoleNavigation();
    if (enableServerDrivenNav && serverNav.items) {
      const allowed = new Set(serverNav.items.map(i => i.href));
      navigationItems = navigationItems.filter(item => allowed.has(item.href));
    }
    
    return (
      <div className={`flex ${mobile ? 'flex-col space-y-3' : 'flex-row space-x-1'} items-start`}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => { onItemClick(); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active 
                  ? 'bg-primary text-primary-foreground shadow-soft' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              } ${mobile ? 'w-full justify-start' : ''}`}
              title={item.description}
            >
              <Icon size={18} />
              {mobile && <span className="text-base">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    );
  };

  const LanguageSelector = () => (
    <div className="flex items-center gap-2">
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

  const UserMenu = ({ mobile = false }) => (
    <div className={`flex ${mobile ? 'flex-col space-y-4' : 'flex-row items-center gap-2'}`}>
      {/* User Info */}
      <div className={`flex items-center gap-3 ${mobile ? 'p-4 bg-muted/50 rounded-lg' : ''}`}>
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        {mobile && (
          <div className="text-sm">
            <div className="font-semibold text-foreground">{user.name}</div>
            <div className="text-muted-foreground capitalize">
              {user.role ? user.role.replace('_', ' ') : 'User'}
            </div>
          </div>
        )}
      </div>
      
      {/* Logout Button */}
      <Button
        variant={mobile ? "destructive" : "outline"}
        size={mobile ? "default" : "sm"}
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`${mobile ? 'w-full justify-center font-medium py-3' : ''} text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200`}
        title="Logout from AgroBridge"
      >
        {isLoggingOut ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
            Logging out...
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4 mr-2" />
            {mobile ? 'Logout' : ''}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              AgroBridge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <NavItems />
            <div className="border-l pl-4 flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="lg:hidden">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 max-h-screen">
                <div className="flex flex-col h-full">
                  {/* Header - Fixed */}
                  <div className="flex items-center gap-2 font-bold text-xl p-6 border-b flex-shrink-0">
                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                      AgroBridge
                    </span>
                  </div>
                  
                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                    <div className="space-y-6">
                      <NavItems mobile onItemClick={() => setMobileNavOpen(false)} />
                      
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-6">
                          <LanguageSelector />
                          <ThemeToggle />
                        </div>
                        <UserMenu mobile />
                      </div>
                    </div>
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
