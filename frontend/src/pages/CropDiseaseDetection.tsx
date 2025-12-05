/**
 * Crop Disease Detection Page - Production Ready with API Integration
 */
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Upload, 
  Scan, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  History,
  BookOpen,
  Loader2,
  Download,
  Share,
  Eye
} from 'lucide-react';
import { useAnalyzeImage, useDiseases, useScans } from '@/api/hooks/useCropDetection';
import { useAuth } from '@/contexts/AuthContext';

export default function CropDiseaseDetection() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // API hooks
  const analyzeImageMutation = useAnalyzeImage();
  const { data: diseasesData, isLoading: diseasesLoading } = useDiseases();
  const { data: scansData, isLoading: scansLoading } = useScans();

  const diseases = diseasesData?.results || [];
  const scans = scansData?.results || [];

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  // Handle image analysis
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    try {
      const result = await analyzeImageMutation.mutateAsync({
        data: {
          image: selectedImage,
          crop_type: 'auto-detect',
        },
      });
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    // In a real app, this would open camera
    fileInputRef.current?.click();
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      case 'high': 
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Crop Disease Detection</h1>
        <p className="text-muted-foreground">
          Upload or capture images of your crops to detect diseases and get treatment recommendations
        </p>
      </div>

      <Tabs defaultValue="scan" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scan">Scan</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="diseases">Diseases</TabsTrigger>
          <TabsTrigger value="guide">Guide</TabsTrigger>
        </TabsList>

        {/* Scan Tab */}
        <TabsContent value="scan" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* Image Upload/Capture */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Capture or Upload Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Image Preview */}
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Selected crop" 
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        setAnalysisResult(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                    <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Take a photo or upload an image of your crop
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCameraCapture}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Camera
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </div>

                {/* Analyze Button */}
                {selectedImage && (
                  <Button 
                    onClick={handleAnalyze}
                    disabled={analyzeImageMutation.isPending}
                    className="w-full"
                  >
                    {analyzeImageMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4 mr-2" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!analysisResult ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Scan className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Upload an image to see analysis results</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Health Score */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Health Score</span>
                        <span className="text-2xl font-bold text-primary">
                          {analysisResult.health_score}%
                        </span>
                      </div>
                      <Progress value={analysisResult.health_score} className="h-2" />
                    </div>

                    {/* Detected Crop */}
                    <div>
                      <span className="font-medium">Detected Crop:</span>
                      <Badge variant="outline" className="ml-2 capitalize">
                        {analysisResult.crop_type}
                      </Badge>
                    </div>

                    {/* Detected Diseases */}
                    {analysisResult.detected_diseases?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Detected Issues:</h4>
                        <div className="space-y-2">
                          {analysisResult.detected_diseases.map((disease: any, index: number) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{disease.disease_name}</span>
                                <Badge className={getSeverityColor(disease.severity)}>
                                  <div className="flex items-center gap-1">
                                    {getSeverityIcon(disease.severity)}
                                    {disease.severity}
                                  </div>
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Confidence: {(disease.confidence * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Affected area: {disease.affected_area_percentage}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {analysisResult.recommendations?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations:</h4>
                        <div className="space-y-2">
                          {analysisResult.recommendations.map((rec: any, index: number) => (
                            <div key={index} className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="capitalize">
                                  {rec.type}
                                </Badge>
                                <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                                  {rec.priority} priority
                                </Badge>
                              </div>
                              <p className="text-sm">{rec.description}</p>
                              {rec.estimated_cost && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Estimated cost: GHS {rec.estimated_cost}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4 mr-2" />
                        Share Results
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Scan History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scansLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="h-16 w-16 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : scans.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
                  <p className="text-muted-foreground">Your scan history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scans.map((scan: any) => (
                    <div key={scan.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <img 
                        src={scan.image_url} 
                        alt="Scanned crop"
                        className="h-16 w-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">{scan.crop_type}</span>
                          <Badge variant="outline">
                            {scan.health_score}% health
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {scan.detected_diseases?.length || 0} issues detected
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diseases Tab */}
        <TabsContent value="diseases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Disease Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              {diseasesLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {diseases.map((disease: any) => (
                    <Card key={disease.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold line-clamp-1">{disease.name}</h4>
                          <Badge className={getSeverityColor(disease.typical_severity)}>
                            {disease.typical_severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {disease.description}
                        </p>
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="font-medium">Affects:</span>
                            <span className="ml-1">{disease.affected_crops?.join(', ')}</span>
                          </div>
                          <div className="text-xs">
                            <span className="font-medium">Category:</span>
                            <span className="ml-1 capitalize">{disease.category}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guide Tab */}
        <TabsContent value="guide" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>How to Take Good Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-primary/10 mt-1">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Good Lighting</p>
                    <p className="text-sm text-muted-foreground">
                      Take photos in natural daylight for best results
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-primary/10 mt-1">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Close-up Shots</p>
                    <p className="text-sm text-muted-foreground">
                      Focus on affected areas with clear, close-up images
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-primary/10 mt-1">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Multiple Angles</p>
                    <p className="text-sm text-muted-foreground">
                      Take photos from different angles for better analysis
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supported Crops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Tomato', 'Maize', 'Rice', 'Cassava',
                    'Yam', 'Plantain', 'Cocoa', 'Coffee',
                    'Pepper', 'Onion', 'Cabbage', 'Lettuce'
                  ].map((crop) => (
                    <Badge key={crop} variant="outline" className="justify-center">
                      {crop}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}