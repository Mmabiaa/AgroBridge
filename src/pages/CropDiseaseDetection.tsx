
import { CropDiseaseDetection } from '@/components/ai/CropDiseaseDetection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Scan, 
  Clock,
  Leaf,
  Shield,
  Brain,
  History
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface UserScan {
  id: string;
  crop: string;
  result: string;
  confidence: number;
  timestamp: Date;
  imageUrl?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export default function CropDiseaseDetectionPage() {
  const [userScans, setUserScans] = useState<UserScan[]>([]);

  // Load user scans from localStorage or initialize empty
  useEffect(() => {
    const savedScans = localStorage.getItem('userCropScans');
    if (savedScans) {
      try {
        const scans = JSON.parse(savedScans).map((scan: any) => ({
          ...scan,
          timestamp: new Date(scan.timestamp)
        }));
        setUserScans(scans);
      } catch (error) {
        console.error('Error loading user scans:', error);
        setUserScans([]);
      }
    }
  }, []);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return timestamp.toLocaleDateString();
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getResultColor = (result: string) => {
    return result === 'Healthy' ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Scan className="h-8 w-8 text-primary" />
            AI Crop Disease Detection
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powered by advanced AI technology, instantly identify crop diseases and receive 
            treatment recommendations to protect your harvest.
          </p>
        </div>

        {/* Main Detection Component */}
        <CropDiseaseDetection />

        {/* User Scan History */}
        {userScans.length > 0 && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Your Scan History
              </CardTitle>
              <CardDescription>
                Recent crop health assessments from your scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userScans.slice(0, 6).map((scan) => (
                  <div key={scan.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getResultColor(scan.result)}`} />
                        <span className="font-semibold text-sm">{scan.crop}</span>
                      </div>
                      {scan.severity && scan.result !== 'Healthy' && (
                        <Badge 
                          variant={
                            scan.severity === 'critical' ? 'destructive' : 
                            scan.severity === 'high' ? 'default' : 'secondary'
                          } 
                          className="text-xs"
                        >
                          {scan.severity}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Result:</span>
                        <span className={`text-sm font-medium ${
                          scan.result === 'Healthy' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {scan.result}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Confidence:</span>
                        <span className="text-sm font-medium">{scan.confidence}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Time:</span>
                        <span className="text-sm text-muted-foreground">
                          {formatTimeAgo(scan.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {userScans.length > 6 && (
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing 6 of {userScans.length} scans
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>How AI Detection Works</CardTitle>
            <CardDescription>Understanding our disease detection process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">1. Capture Image</h3>
                <p className="text-sm text-muted-foreground">
                  Take a clear photo of your crop leaves or upload an existing image
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">2. AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI model analyzes the image using machine learning algorithms
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">3. Get Results</h3>
                <p className="text-sm text-muted-foreground">
                  Receive instant diagnosis with treatment recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
