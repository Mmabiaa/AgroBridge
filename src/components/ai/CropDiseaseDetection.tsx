
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, Scan, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface DetectionResult {
  disease: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  treatment: string;
  prevention: string;
}

export function CropDiseaseDetection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCamera, setIsCamera] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setSelectedImage(imageData);
      setIsCamera(false);
      
      // Stop camera stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockResults: DetectionResult[] = [
      {
        disease: 'Late Blight',
        confidence: 89,
        severity: 'high',
        treatment: 'Apply copper-based fungicide immediately. Remove affected leaves.',
        prevention: 'Improve air circulation, avoid overhead watering, use resistant varieties.'
      },
      {
        disease: 'Early Blight',
        confidence: 76,
        severity: 'medium',
        treatment: 'Apply organic fungicide, prune affected areas.',
        prevention: 'Crop rotation, proper spacing, avoid wet foliage.'
      },
      {
        disease: 'Healthy Plant',
        confidence: 95,
        severity: 'low',
        treatment: 'No treatment needed. Continue current care routine.',
        prevention: 'Maintain good agricultural practices.'
      }
    ];
    
    setResult(mockResults[Math.floor(Math.random() * mockResults.length)]);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Crop Disease Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedImage && !isCamera && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-gradient-to-br from-muted/20 to-transparent">
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-primary" />
                  <div>
                    <p className="text-lg font-medium mb-2">Upload or Capture Plant Image</p>
                    <p className="text-sm text-muted-foreground">
                      Get instant AI-powered disease analysis
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Use Camera
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {isCamera && (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <div className="flex gap-3">
                <Button onClick={capturePhoto} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
                <Button variant="outline" onClick={() => setIsCamera(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {selectedImage && !isCamera && (
            <div className="space-y-4">
              <img 
                src={selectedImage} 
                alt="Crop analysis" 
                className="w-full rounded-lg max-h-64 object-cover"
              />
              
              <div className="flex gap-3">
                <Button 
                  onClick={analyzeImage} 
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Scan className="h-4 w-4 mr-2" />
                      Analyze Disease
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedImage(null);
                    setResult(null);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm">AI is analyzing your crop image...</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{result.disease}</h3>
                  <Badge variant={
                    result.severity === 'high' ? 'destructive' : 
                    result.severity === 'medium' ? 'default' : 'secondary'
                  }>
                    {result.severity} severity
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Confidence</span>
                    <span>{result.confidence}%</span>
                  </div>
                  <Progress value={result.confidence} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Treatment
                    </h4>
                    <p className="text-sm text-muted-foreground">{result.treatment}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      Prevention
                    </h4>
                    <p className="text-sm text-muted-foreground">{result.prevention}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
