import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRequestPasswordReset } from '@/api/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wheat, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const requestPasswordResetMutation = useRequestPasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      await requestPasswordResetMutation.mutateAsync(email);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Password reset request failed:', error);
      setError(error.message || 'Failed to send password reset email. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-gradient-primary shadow-glow">
                <CheckCircle className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-muted-foreground">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <Card className="shadow-strong">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <Mail className="h-12 w-12 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Please check your email and click the link to reset your password.
                </p>
                <p className="text-xs text-muted-foreground">
                  If you don't see the email, check your spam folder.
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <Link to="/login" className="block">
                  <Button className="w-full">
                    Back to Login
                  </Button>
                </Link>
                
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full text-sm"
                >
                  Try Different Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
          
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-gradient-primary shadow-glow">
              <Wheat className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <Card className="shadow-strong">
          <CardHeader className="text-center">
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>We'll help you get back into your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${error ? 'border-destructive' : ''}`}
                />
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full font-medium"
                disabled={requestPasswordResetMutation.isPending || !email.trim()}
              >
                {requestPasswordResetMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}