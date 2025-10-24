/**
 * API Connection Test Component
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Server,
  Database,
  Shield
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { API_CONFIG } from '@/api/config';
import axios from 'axios';

interface ConnectionTest {
  name: string;
  description: string;
  endpoint: string;
  icon: React.ElementType;
  test: () => Promise<any>;
}

export const ApiConnectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error' | 'loading'; message: string }>>({});

  const connectionTests: ConnectionTest[] = [
    {
      name: 'Backend Health',
      description: 'Check if backend server is running',
      endpoint: '/health/',
      icon: Server,
      test: async () => {
        const response = await axios.get(`${API_CONFIG.BASE_URL}/health/`);
        return response.data;
      }
    },
    {
      name: 'Database Connection',
      description: 'Verify database connectivity',
      endpoint: '/health/',
      icon: Database,
      test: async () => {
        const response = await axios.get(`${API_CONFIG.BASE_URL}/health/`);
        if (response.data.database !== 'healthy') {
          throw new Error('Database connection failed');
        }
        return response.data;
      }
    },
    {
      name: 'Authentication API',
      description: 'Test authentication endpoints',
      endpoint: '/auth/user/',
      icon: Shield,
      test: async () => {
        // This will fail if not authenticated, which is expected
        try {
          const response = await axios.get(`${API_CONFIG.BASE_URL}/auth/user/`);
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 401) {
            return { message: 'Authentication endpoint is working (401 expected without token)' };
          }
          throw error;
        }
      }
    }
  ];

  const runTest = async (test: ConnectionTest) => {
    setTestResults(prev => ({
      ...prev,
      [test.name]: { status: 'loading', message: 'Testing...' }
    }));

    try {
      const result = await test.test();
      setTestResults(prev => ({
        ...prev,
        [test.name]: { 
          status: 'success', 
          message: result.message || 'Connection successful' 
        }
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [test.name]: { 
          status: 'error', 
          message: error.message || 'Connection failed' 
        }
      }));
    }
  };

  const runAllTests = async () => {
    for (const test of connectionTests) {
      await runTest(test);
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'loading' | undefined) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'error' | 'loading' | undefined) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'loading':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          API Connection Test
        </CardTitle>
        <CardDescription>
          Test connectivity to backend services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Backend URL</p>
            <p className="text-sm text-muted-foreground">{API_CONFIG.BASE_URL}</p>
          </div>
          <Button onClick={runAllTests} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Test All
          </Button>
        </div>

        <div className="space-y-3">
          {connectionTests.map((test) => {
            const result = testResults[test.name];
            const TestIcon = test.icon;
            
            return (
              <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <TestIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                    {result && (
                      <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(result?.status)}
                  {getStatusIcon(result?.status)}
                  <Button
                    onClick={() => runTest(test)}
                    variant="ghost"
                    size="sm"
                    disabled={result?.status === 'loading'}
                  >
                    Test
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Connection Status:</span>
            <div className="flex items-center gap-2">
              {Object.values(testResults).some(r => r.status === 'success') ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Some services connected</span>
                </>
              ) : Object.values(testResults).some(r => r.status === 'error') ? (
                <>
                  <WifiOff className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">Connection issues detected</span>
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 text-gray-400" />
                  <span className="text-muted-foreground">Not tested</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiConnectionTest;