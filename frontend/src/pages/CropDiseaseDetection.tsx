
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
    const data = {
      id: scan.id,
      crop: scan.crop,
      result: scan.result,
      confidence: scan.confidence,
      timestamp: scan.timestamp.toISOString(),
      severity: scan.severity,
      diseaseDetails: scan.diseaseDetails
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crop-scan-${scan.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportScanReport = (scan: UserScan) => {
    let reportContent = `CROP DISEASE DETECTION REPORT\n`;
    reportContent += `================================\n\n`;
    reportContent += `Scan ID: ${scan.id}\n`;
    reportContent += `Date: ${scan.timestamp.toLocaleDateString()}\n`;
    reportContent += `Time: ${scan.timestamp.toLocaleTimeString()}\n\n`;
    
    reportContent += `SCAN SUMMARY\n`;
    reportContent += `-------------\n`;
    reportContent += `Crop Type: ${scan.crop}\n`;
    reportContent += `Analysis Result: ${scan.result}\n`;
    reportContent += `AI Confidence: ${scan.confidence}%\n`;
    if (scan.severity) {
      reportContent += `Disease Severity: ${scan.severity}\n`;
    }
    reportContent += `\n`;
    
    if (scan.diseaseDetails) {
      reportContent += `DISEASE DETAILS\n`;
      reportContent += `----------------\n`;
      reportContent += `Disease: ${scan.diseaseDetails.disease}\n`;
      reportContent += `Spread Rate: ${scan.diseaseDetails.spreadRate}\n`;
      reportContent += `Recovery Time: ${scan.diseaseDetails.recoveryTime}\n`;
      reportContent += `Treatment Cost: ${scan.diseaseDetails.cost}\n`;
      reportContent += `Risk Level: ${scan.diseaseDetails.riskLevel}\n\n`;
      
      reportContent += `TREATMENT RECOMMENDATIONS\n`;
      reportContent += `-------------------------\n`;
      scan.diseaseDetails.treatment.forEach((treatment, index) => {
        reportContent += `${index + 1}. ${treatment}\n`;
      });
      reportContent += `\n`;
      
      reportContent += `PREVENTION STRATEGIES\n`;
      reportContent += `----------------------\n`;
      scan.diseaseDetails.prevention.forEach((prevention, index) => {
        reportContent += `${index + 1}. ${prevention}\n`;
      });
      reportContent += `\n`;
      
      reportContent += `SYMPTOMS\n`;
      reportContent += `---------\n`;
      scan.diseaseDetails.symptoms.forEach((symptom, index) => {
        reportContent += `${index + 1}. ${symptom}\n`;
      });
      reportContent += `\n`;
      
      reportContent += `CAUSES\n`;
      reportContent += `-------\n`;
      scan.diseaseDetails.causes.forEach((cause, index) => {
        reportContent += `${index + 1}. ${cause}\n`;
      });
      reportContent += `\n`;
      
      reportContent += `AFFECTED CROPS\n`;
      reportContent += `---------------\n`;
      scan.diseaseDetails.affectedCrops.forEach((crop, index) => {
        reportContent += `${index + 1}. ${crop}\n`;
      });
      reportContent += `\n`;
      
      reportContent += `ENVIRONMENTAL FACTORS\n`;
      reportContent += `----------------------\n`;
      scan.diseaseDetails.environmentalFactors.forEach((factor, index) => {
        reportContent += `${index + 1}. ${factor}\n`;
      });
      reportContent += `\n`;
      
      reportContent += `RECOMMENDED PRODUCTS\n`;
      reportContent += `---------------------\n`;
      scan.diseaseDetails.recommendedProducts.forEach((product, index) => {
        reportContent += `${index + 1}. ${product}\n`;
      });
      reportContent += `\n`;
    } else {
      reportContent += `SCAN BENEFITS\n`;
      reportContent += `--------------\n`;
      reportContent += `• Early detection of crop health issues\n`;
      reportContent += `• AI-powered analysis with high accuracy\n`;
      reportContent += `• Comprehensive treatment recommendations\n`;
      reportContent += `• Prevention strategies for future protection\n`;
      reportContent += `• Cost-effective disease management\n`;
      reportContent += `• Improved crop yield and quality\n\n`;
    }
    
    reportContent += `Generated by AgroBridge AI\n`;
    reportContent += `For more information, visit your AgroBridge dashboard\n`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crop-report-${scan.id}-${scan.timestamp.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-4 mb-6">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Scan className="h-8 w-8 text-primary" />
            AI Crop Disease Detection
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Powered by advanced AI technology, instantly identify crop diseases and receive 
            treatment recommendations to protect your harvest.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Detection Component */}
          <div className="lg:col-span-3">
            <CropDiseaseDetection />
              </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 h-[calc(100vh-200px)]">
            <div className="space-y-6">
              {/* User Scan History */}
              {userScans.length > 0 && (
                <Card className="shadow-soft w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <History className="h-6 w-6" />
                      Your Scan History
                    </CardTitle>
                    <CardDescription className="text-base">
                      Recent crop health assessments from your scans - Click to view details or export data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {userScans.slice(0, 5).map((scan) => (
                        <div key={scan.id} className="group p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
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
                                className="text-xs px-2 py-1"
                              >
                                {scan.severity}
                              </Badge>
                            )}
              </div>
                          
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Result:</span>
                              <span className={`text-xs font-semibold ${
                                scan.result === 'Healthy' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {scan.result}
                              </span>
        </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Confidence:</span>
                              <span className="text-xs font-semibold">{scan.confidence}%</span>
                            </div>
                            
                  <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Time:</span>
                              <span className="text-xs text-muted-foreground">
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
                    
                    {userScans.length > 5 && (
                      <div className="text-center mt-4">
                        <p className="text-xs text-muted-foreground">
                          Showing 5 of {userScans.length} scans
                        </p>
                  </div>
                    )}
            </CardContent>
          </Card>
              )}

        {/* How It Works */}
              <Card className="shadow-soft w-full">
          <CardHeader>
                  <CardTitle className="text-xl">How AI Detection Works</CardTitle>
                  <CardDescription className="text-base">Understanding our disease detection process</CardDescription>
          </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Camera className="h-8 w-8 text-primary" />
                </div>
                      <h3 className="font-semibold text-lg">1. Capture Image</h3>
                <p className="text-sm text-muted-foreground">
                  Take a clear photo of your crop leaves or upload an existing image
                </p>
              </div>
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Brain className="h-8 w-8 text-primary" />
                </div>
                      <h3 className="font-semibold text-lg">2. AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI model analyzes the image using machine learning algorithms
                </p>
              </div>
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Shield className="h-8 w-8 text-primary" />
                </div>
                      <h3 className="font-semibold text-lg">3. Get Results</h3>
                <p className="text-sm text-muted-foreground">
                  Receive instant diagnosis with treatment recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
          </div>
        </div>
      </div>

      {/* Scan Detail Modal */}
      {showScanModal && selectedScan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 lg:p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[95vh] lg:max-h-[90vh] overflow-hidden shadow-lg border-0 bg-white">
            {/* Simple Green Header */}
            <CardHeader className="bg-green-600 text-white p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg lg:text-2xl font-bold text-white">
                    Scan Details
                  </CardTitle>
                  <p className="text-green-100 text-sm lg:text-base mt-1 lg:mt-2">
                    {selectedScan.timestamp.toLocaleDateString()} at {selectedScan.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScanModal(false)}
                  className="h-8 w-8 lg:h-10 lg:w-10 rounded-full hover:bg-green-700 text-white p-0"
                >
                  <X className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
              </div>
            </CardHeader>
            
            <div className="overflow-y-auto max-h-[calc(95vh-100px)] lg:max-h-[calc(90vh-120px)]">
              <CardContent className="p-4 lg:p-8 space-y-4 lg:space-y-6">
                {/* Simple Results */}
                <div className="bg-gray-50 rounded-lg lg:rounded-xl p-4 lg:p-6">
                  <h3 className="font-semibold text-gray-800 mb-3 lg:mb-4 text-base lg:text-lg">Analysis Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
                    <div className="bg-white rounded-lg p-3 lg:p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 lg:mb-2">Crop Type</div>
                      <div className="text-lg lg:text-xl font-bold text-gray-800">{selectedScan.crop}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 lg:p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 lg:mb-2">Analysis Result</div>
                      <div className={`text-lg lg:text-xl font-bold ${
                        selectedScan.result === 'Healthy' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedScan.result}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 lg:p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 lg:mb-2">AI Confidence</div>
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="text-lg lg:text-xl font-bold text-blue-600">{selectedScan.confidence}%</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 lg:h-3">
                          <div 
                            className="bg-blue-500 h-2 lg:h-3 rounded-full transition-all duration-300"
                            style={{ width: `${selectedScan.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="bg-blue-50 rounded-lg lg:rounded-xl p-4 lg:p-6">
                  <h3 className="font-semibold text-blue-800 mb-3 lg:mb-4 text-base lg:text-lg">Export Options</h3>
                  <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                    <Button
                      variant="outline"
                      onClick={() => exportScanData(selectedScan)}
                      className="flex items-center gap-2 text-sm lg:text-base"
                    >
                      <FileText className="h-4 w-4" />
                      Export as JSON
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportScanReport(selectedScan)}
                      className="flex items-center gap-2 text-sm lg:text-base"
                    >
                      <Download className="h-4 w-4" />
                      Export Report
                    </Button>
                  </div>
                </div>

                {selectedScan.diseaseDetails && (
                  <div className="space-y-4 lg:space-y-6">
                    <h3 className="font-semibold text-gray-800 text-base lg:text-lg">Disease Information</h3>
                    
                    {/* Treatment */}
                    <div className="bg-red-50 rounded-lg lg:rounded-xl p-4 lg:p-6">
                      <h4 className="font-medium text-red-800 mb-2 lg:mb-3 text-base lg:text-lg">What to Do Now</h4>
                      <div className="space-y-2">
                        {selectedScan.diseaseDetails.treatment.slice(0, 3).map((treatment, index) => (
                          <div key={index} className="text-xs lg:text-sm text-red-700 bg-white p-2 lg:p-3 rounded-lg border border-red-200">
                            {index + 1}. {treatment}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prevention */}
                    <div className="bg-green-50 rounded-lg lg:rounded-xl p-4 lg:p-6">
                      <h4 className="font-medium text-green-800 mb-2 lg:mb-3 text-base lg:text-lg">How to Prevent</h4>
                      <div className="space-y-2">
                        {selectedScan.diseaseDetails.prevention.slice(0, 3).map((prevention, index) => (
                          <div key={index} className="text-xs lg:text-sm text-green-700 bg-white p-2 lg:p-3 rounded-lg border border-green-200">
                            {index + 1}. {prevention}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="bg-orange-50 rounded-lg lg:rounded-xl p-4 lg:p-6">
                      <h4 className="font-medium text-orange-800 mb-2 lg:mb-3 text-base lg:text-lg">Warning Signs</h4>
                      <div className="space-y-2">
                        {selectedScan.diseaseDetails.symptoms.slice(0, 4).map((symptom, index) => (
                          <div key={index} className="text-xs lg:text-sm text-orange-700 bg-white p-2 lg:p-3 rounded-lg border border-orange-200">
                            • {symptom}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-gray-50 rounded-lg lg:rounded-xl p-4 lg:p-6">
                      <h4 className="font-medium text-gray-800 mb-2 lg:mb-3 text-base lg:text-lg">Disease Overview</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 text-xs lg:text-sm">
                        <div className="bg-white p-2 lg:p-3 rounded-lg border border-gray-200">
                          <span className="text-gray-600">Spread:</span>
                          <span className="ml-1 font-medium capitalize">{selectedScan.diseaseDetails.spreadRate}</span>
                        </div>
                        <div className="bg-white p-2 lg:p-3 rounded-lg border border-gray-200">
                          <span className="text-gray-600">Recovery:</span>
                          <span className="ml-1 font-medium">{selectedScan.diseaseDetails.recoveryTime}</span>
                        </div>
                        <div className="bg-white p-2 lg:p-3 rounded-lg border border-gray-200">
                          <span className="text-gray-600">Cost:</span>
                          <span className="ml-1 font-medium capitalize">{selectedScan.diseaseDetails.cost}</span>
                        </div>
                        <div className="bg-white p-2 lg:p-3 rounded-lg border border-gray-200">
                          <span className="text-gray-600">Risk:</span>
                          <span className="ml-1 font-medium capitalize">{selectedScan.diseaseDetails.riskLevel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="bg-green-50 rounded-lg lg:rounded-xl p-4 lg:p-6">
                      <h4 className="font-medium text-green-800 mb-2 lg:mb-3 text-base lg:text-lg">Recommended Products</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedScan.diseaseDetails.recommendedProducts.slice(0, 6).map((product, index) => (
                          <Badge key={index} variant="outline" className="text-xs lg:text-sm p-1 lg:p-2 bg-white border-green-200 text-green-700">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No Disease Details Message */}
                {!selectedScan.diseaseDetails && (
                  <div className="bg-green-50 rounded-lg lg:rounded-xl p-4 lg:p-6 text-center">
                    <CheckCircle className="h-8 w-8 lg:h-12 lg:w-12 text-green-600 mx-auto mb-3 lg:mb-4" />
                    <h4 className="font-semibold text-green-800 mb-2 lg:mb-3 text-base lg:text-lg">Scan Completed Successfully!</h4>
                    <p className="text-xs lg:text-sm text-green-700 mb-3 lg:mb-4">
                      Your crop analysis has been completed and saved. The scan shows: <strong>{selectedScan.result}</strong> with {selectedScan.confidence}% confidence.
                    </p>
                    <div className="bg-white rounded-lg p-3 lg:p-4 border border-green-200">
                      <p className="text-xs lg:text-sm text-green-600 font-medium">
                        💡 <strong>Tip:</strong> Perform new scans to get detailed treatment recommendations and prevention strategies for detected diseases.
                      </p>
                    </div>
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
