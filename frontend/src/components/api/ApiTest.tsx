/**
 * Simple API Test Component
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

export const ApiTest = () => {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const testEndpoint = async (name: string, url: string, options: any = {}) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    
    try {
      const response = await axios({
        url,
        timeout: 10000,
        ...options
      });
      
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'success',
          data: response.data,
          statusCode: response.status
        }
      }));

      // Save token if this is a login request
      if (name === 'login' && response.data.tokens?.access) {
        localStorage.setItem('access_token', response.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'error',
          error: error.message,
          statusCode: error.response?.status,
          data: error.response?.data
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const testHealth = () => {
    testEndpoint('health', 'http://127.0.0.1:8000/health/', { method: 'GET' });
  };

  const testLogin = () => {
    testEndpoint('login', 'http://127.0.0.1:8000/api/v1/auth/login/', {
      method: 'POST',
      data: {
        username: 'testuser',
        password: 'testpass123'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };

  const testAuthUser = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setResults(prev => ({
        ...prev,
        authUser: {
          status: 'error',
          error: 'No token found. Please login first.'
        }
      }));
      return;
    }

    testEndpoint('authUser', 'http://127.0.0.1:8000/api/v1/auth/user/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  const getStatusBadge = (result: any) => {
    if (!result) return <Badge variant="outline">Not Tested</Badge>;
    
    if (result.status === 'success') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
    } else {
      return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Test Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            onClick={testHealth} 
            disabled={loading.health}
            variant="outline"
            size="sm"
          >
            {loading.health ? 'Testing...' : 'Test Health'}
          </Button>
          
          <Button 
            onClick={testLogin} 
            disabled={loading.login}
            variant="outline"
            size="sm"
          >
            {loading.login ? 'Testing...' : 'Test Login'}
          </Button>
          
          <Button 
            onClick={testAuthUser} 
            disabled={loading.authUser}
            variant="outline"
            size="sm"
          >
            {loading.authUser ? 'Testing...' : 'Test Auth'}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {['health', 'login', 'authUser'].map(test => {
            const result = results[test];
            return (
              <div key={test} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{test}</span>
                  {getStatusBadge(result)}
                </div>
                
                {result && (
                  <div className="text-sm">
                    {result.statusCode && (
                      <p className="text-muted-foreground">Status: {result.statusCode}</p>
                    )}
                    
                    {result.status === 'success' && result.data && (
                      <div className="mt-2">
                        <p className="font-medium">Response:</p>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {result.status === 'error' && (
                      <div className="mt-2">
                        <p className="text-red-600">Error: {result.error}</p>
                        {result.statusCode && (
                          <p className="text-red-600 text-xs">Status Code: {result.statusCode}</p>
                        )}
                        {result.data && (
                          <div>
                            <p className="font-medium text-xs">Response Data:</p>
                            <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground">
          <p>1. Test Health to verify backend connection</p>
          <p>2. Test Login to get authentication token</p>
          <p>3. Test Auth to verify authenticated requests</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiTest;