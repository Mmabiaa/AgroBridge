
import { CropDiseaseDetection } from '@/components/ai/CropDiseaseDetection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Scan, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Leaf,
  Shield,
  Brain
} from 'lucide-react';

const detectionStats = {
  totalScans: 1247,
  healthyPlants: 892,
  diseasesDetected: 355,
  accuracyRate: 94.2
};

const commonDiseases = [
  { name: 'Late Blight', frequency: 23, severity: 'high', color: 'text-red-500' },
  { name: 'Early Blight', frequency: 18, severity: 'medium', color: 'text-yellow-500' },
  { name: 'Leaf Spot', frequency: 15, severity: 'low', color: 'text-green-500' },
  { name: 'Powdery Mildew', frequency: 12, severity: 'medium', color: 'text-yellow-500' },
  { name: 'Rust', frequency: 10, severity: 'high', color: 'text-red-500' }
];

const recentScans = [
  { crop: 'Tomato', result: 'Healthy', confidence: 95, time: '2 hours ago' },
  { crop: 'Maize', result: 'Late Blight', confidence: 89, time: '5 hours ago' },
  { crop: 'Potato', result: 'Healthy', confidence: 97, time: '1 day ago' },
  { crop: 'Beans', result: 'Leaf Spot', confidence: 76, time: '2 days ago' }
];

export default function CropDiseaseDetectionPage() {
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold">{detectionStats.totalScans}</div>
              <p className="text-sm text-muted-foreground">Total Scans</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{detectionStats.healthyPlants}</div>
              <p className="text-sm text-muted-foreground">Healthy Plants</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{detectionStats.diseasesDetected}</div>
              <p className="text-sm text-muted-foreground">Diseases Found</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{detectionStats.accuracyRate}%</div>
              <p className="text-sm text-muted-foreground">AI Accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Detection Component */}
        <CropDiseaseDetection />

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Common Diseases */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Common Diseases Detected
              </CardTitle>
              <CardDescription>Most frequently identified diseases in your area</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {commonDiseases.map((disease, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{disease.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        disease.severity === 'high' ? 'destructive' : 
                        disease.severity === 'medium' ? 'default' : 'secondary'
                      } className="text-xs">
                        {disease.severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{disease.frequency}%</span>
                    </div>
                  </div>
                  <Progress value={disease.frequency} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Scans */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Scans
              </CardTitle>
              <CardDescription>Your latest crop health assessments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      scan.result === 'Healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{scan.crop}</p>
                      <p className="text-xs text-muted-foreground">{scan.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{scan.result}</p>
                    <p className="text-xs text-muted-foreground">{scan.confidence}% confidence</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

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
