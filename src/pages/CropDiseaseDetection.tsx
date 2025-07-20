
import { CropDiseaseDetection } from '@/components/ai/CropDiseaseDetection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Scan, 
  Clock,
  Leaf,
  Shield,
  Brain,
  History,
  Download,
  Eye,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  X,
  TrendingUp,
  AlertCircle,
  Info,
  Thermometer
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
  diseaseDetails?: {
    disease: string;
    treatment: string[];
    prevention: string[];
    symptoms: string[];
    causes: string[];
    affectedCrops: string[];
    spreadRate: string;
    recoveryTime: string;
    cost: string;
    riskLevel: string;
    environmentalFactors: string[];
    recommendedProducts: string[];
  };
}

export default function CropDiseaseDetectionPage() {
  const [userScans, setUserScans] = useState<UserScan[]>([]);
  const [selectedScan, setSelectedScan] = useState<UserScan | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);

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

  const exportScanData = (scan: UserScan) => {
    const scanData = {
      scanId: scan.id,
      timestamp: scan.timestamp.toISOString(),
      crop: scan.crop,
      result: scan.result,
      confidence: scan.confidence,
      severity: scan.severity,
      diseaseDetails: scan.diseaseDetails,
      exportDate: new Date().toISOString(),
      exportedFrom: 'AgroBridge AI Crop Disease Detection'
    };

    const dataStr = JSON.stringify(scanData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `crop-scan-${scan.id}-${scan.timestamp.toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportScanReport = (scan: UserScan) => {
    const report = `
AGROBRIDGE CROP DISEASE DETECTION REPORT
========================================

Scan ID: ${scan.id}
Date: ${scan.timestamp.toLocaleDateString()}
Time: ${scan.timestamp.toLocaleTimeString()}

CROP ANALYSIS RESULTS
---------------------
Crop: ${scan.crop}
Result: ${scan.result}
Confidence: ${scan.confidence}%
Severity: ${scan.severity || 'N/A'}

${scan.diseaseDetails ? `
DISEASE DETAILS
---------------
Disease: ${scan.diseaseDetails.disease}
Spread Rate: ${scan.diseaseDetails.spreadRate}
Recovery Time: ${scan.diseaseDetails.recoveryTime}
Treatment Cost: ${scan.diseaseDetails.cost}
Risk Level: ${scan.diseaseDetails.riskLevel}

SYMPTOMS
--------
${scan.diseaseDetails.symptoms.map((symptom, index) => `${index + 1}. ${symptom}`).join('\n')}

CAUSES
------
${scan.diseaseDetails.causes.map((cause, index) => `${index + 1}. ${cause}`).join('\n')}

TREATMENT PLAN
-------------
${scan.diseaseDetails.treatment.map((treatment, index) => `${index + 1}. ${treatment}`).join('\n')}

PREVENTION MEASURES
------------------
${scan.diseaseDetails.prevention.map((prevention, index) => `${index + 1}. ${prevention}`).join('\n')}

AFFECTED CROPS
-------------
${scan.diseaseDetails.affectedCrops.join(', ')}
` : ''}

Report generated on: ${new Date().toLocaleString()}
Generated by: AgroBridge AI Crop Disease Detection System
    `.trim();

    const dataBlob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `crop-report-${scan.id}-${scan.timestamp.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                Recent crop health assessments from your scans - Click to view details or export data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userScans.slice(0, 6).map((scan) => (
                  <div key={scan.id} className="group p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
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
                    
                    <div className="space-y-2 mb-4">
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

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedScan(scan);
                          setShowScanModal(true);
                        }}
                        className="flex-1 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportScanData(scan)}
                        className="text-xs"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
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

      {/* Scan Detail Modal */}
      {showScanModal && selectedScan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-lg border-0 bg-white">
            {/* Simple Green Header */}
            <CardHeader className="bg-green-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-white">
                    Scan Details
                  </CardTitle>
                  <p className="text-green-100 text-sm mt-1">
                    {selectedScan.timestamp.toLocaleDateString()} at {selectedScan.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScanModal(false)}
                  className="h-8 w-8 rounded-full hover:bg-green-700 text-white p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
              <CardContent className="p-6 space-y-4">
                {/* Simple Results */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Analysis Results</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crop:</span>
                      <span className="font-medium">{selectedScan.crop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Result:</span>
                      <span className={`font-medium ${
                        selectedScan.result === 'Healthy' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedScan.result}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-medium">{selectedScan.confidence}%</span>
                    </div>
                    {selectedScan.severity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Severity:</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedScan.severity}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simple Export */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Export Data</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => exportScanData(selectedScan)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      JSON
                    </Button>
                    <Button
                      onClick={() => exportScanReport(selectedScan)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>

                {/* Disease Information - Only if available */}
                {selectedScan.diseaseDetails && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Disease Information</h3>
                    
                    {/* Treatment */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">What to Do Now</h4>
                      <div className="space-y-1">
                        {selectedScan.diseaseDetails.treatment.slice(0, 2).map((treatment, index) => (
                          <div key={index} className="text-sm text-red-700">
                            {index + 1}. {treatment}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prevention */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">How to Prevent</h4>
                      <div className="space-y-1">
                        {selectedScan.diseaseDetails.prevention.slice(0, 2).map((prevention, index) => (
                          <div key={index} className="text-sm text-green-700">
                            {index + 1}. {prevention}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-medium text-orange-800 mb-2">Warning Signs</h4>
                      <div className="space-y-1">
                        {selectedScan.diseaseDetails.symptoms.slice(0, 3).map((symptom, index) => (
                          <div key={index} className="text-sm text-orange-700">
                            • {symptom}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Disease Overview</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Spread:</span>
                          <span className="ml-1 font-medium capitalize">{selectedScan.diseaseDetails.spreadRate}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Recovery:</span>
                          <span className="ml-1 font-medium">{selectedScan.diseaseDetails.recoveryTime}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost:</span>
                          <span className="ml-1 font-medium capitalize">{selectedScan.diseaseDetails.cost}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Risk:</span>
                          <span className="ml-1 font-medium capitalize">{selectedScan.diseaseDetails.riskLevel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">Recommended Products</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedScan.diseaseDetails.recommendedProducts.slice(0, 4).map((product, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-white border-green-200 text-green-700">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No Disease Details Message */}
                {!selectedScan.diseaseDetails && (
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                    <h4 className="font-medium text-yellow-800 mb-1">Limited Information</h4>
                    <p className="text-sm text-yellow-700">
                      This scan was performed before detailed disease information was available. 
                      New scans will include comprehensive treatment and prevention details.
                    </p>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
