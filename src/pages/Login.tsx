
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wheat, Eye, EyeOff, ArrowLeft, User, Shield } from 'lucide-react';
import { RoleSelection } from '@/components/RoleSelection';
import { UserRole } from '@/contexts/AuthContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setShowRoleSelection(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the updated login function with role parameter
      await login(email, password, selectedRole);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove the custom loginWithRole function and helper functions since they're now in AuthContext

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setShowRoleSelection(false);
  };

  const handleBackToLogin = () => {
    setShowRoleSelection(false);
    setSelectedRole(null);
  };

  // Show role selection if requested
  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-6 md:py-12 px-3 md:px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6 md:mb-8">
            <Button
              variant="ghost"
              onClick={handleBackToLogin}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 md:mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
            
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="p-2 md:p-3 rounded-full bg-gradient-primary shadow-glow">
                <Wheat className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold mb-2">Choose Your Role</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Select the role that best describes your needs to get the right features
            </p>
          </div>

          <RoleSelection 
            onRoleSelect={handleRoleSelect}
            selectedRole={selectedRole}
            showDescription={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 flex items-center justify-center py-6 md:py-12 px-3 md:px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 md:mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="p-2 md:p-3 rounded-full bg-gradient-primary shadow-glow">
              <Wheat className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-sm md:text-base text-muted-foreground">Sign in to your AgroBridge account</p>
        </div>

        <Card className="shadow-strong">
          <CardHeader className="text-center p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
            <CardDescription className="text-sm md:text-base">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 h-12 md:h-10 text-base md:text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm md:text-base">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 h-12 md:h-10 text-base md:text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 md:h-10 px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Role Selection Preview */}
              {selectedRole && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">Selected Role:</span>
                    <span className="capitalize text-primary">{selectedRole.replace('_', ' ')}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRoleSelection(true)}
                    className="mt-2 text-xs"
                  >
                    Change Role
                  </Button>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 md:h-10 text-base md:text-sm font-medium"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up here
                </Link>
              </p>
              
              {!selectedRole && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRoleSelection(true)}
                  className="w-full text-sm"
                >
                  <User className="h-4 w-4 mr-2" />
                  Choose Your Role First
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
