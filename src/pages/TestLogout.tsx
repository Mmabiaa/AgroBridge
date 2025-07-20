import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { getCurrentUser, isLoggedIn, logout, initializeUserData } from '@/utils/auth';

export default function TestLogout() {
  const [user, setUser] = useState(getCurrentUser());
  const [isLoggedInState, setIsLoggedInState] = useState(isLoggedIn());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    // Initialize user data for testing
    if (!isLoggedIn()) {
      initializeUserData();
      setUser(getCurrentUser());
      setIsLoggedInState(true);
    }
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testLogout = async () => {
    setIsLoggingOut(true);
    addTestResult('Starting logout test...');

    try {
      // Test logout function
      await logout();
      addTestResult('✅ Logout function completed successfully');
      
      // Check if user data is cleared
      const userAfterLogout = getCurrentUser();
      const isStillLoggedIn = isLoggedIn();
      
      if (!userAfterLogout && !isStillLoggedIn) {
        addTestResult('✅ User data cleared successfully');
      } else {
        addTestResult('❌ User data not cleared properly');
      }

      // Check localStorage
      const remainingKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('agroBridge')
      );
      
      if (remainingKeys.length === 0) {
        addTestResult('✅ All AgroBridge data cleared from localStorage');
      } else {
        addTestResult(`⚠️ Some data remains: ${remainingKeys.join(', ')}`);
      }

    } catch (error) {
      addTestResult(`❌ Logout error: ${error}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const resetTest = () => {
    setTestResults([]);
    initializeUserData();
    setUser(getCurrentUser());
    setIsLoggedInState(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Logout Functionality Test</h1>
          <p className="text-muted-foreground">Testing the logout implementation</p>
        </div>

        {/* Current User Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current User Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant={isLoggedInState ? "default" : "secondary"}>
                {isLoggedInState ? "Logged In" : "Logged Out"}
              </Badge>
              {user && (
                <div className="text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={testLogout}
                disabled={isLoggingOut}
                className="flex-1"
              >
                {isLoggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing Logout...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Test Logout Function
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={resetTest}
                className="flex-1"
              >
                Reset Test
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-muted-foreground">No test results yet. Click "Test Logout Function" to start.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm p-2 bg-muted rounded">
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* LocalStorage Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>LocalStorage Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.keys(localStorage).filter(key => key.startsWith('agroBridge')).map(key => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-mono">{key}</span>
                  <Badge variant="outline" className="text-xs">
                    {localStorage.getItem(key)?.length || 0} chars
                  </Badge>
                </div>
              ))}
              {Object.keys(localStorage).filter(key => key.startsWith('agroBridge')).length === 0 && (
                <p className="text-muted-foreground">No AgroBridge data in localStorage</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 