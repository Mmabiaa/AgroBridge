/**
 * Crop Disease Detection Page - Production Ready with API Integration
 * Task 8.1: Enhanced upload interface with drag-and-drop and progress tracking
 */
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Upload, 
  Scan, 
  CheckCircle, 
  Loader2,
  X,
  ImageIcon
} from 'lucide-react';
import { useAnalyzeImage, useCreateScan } from '@/api/hooks/useCropDetection';
import { toast } from 'sonner';
import { ResultsDisplay } from '@/components/crop-detection/ResultsDisplay';
import { ScanHistory } from '@/components/crop-detection/ScanHistory';
import { DiseaseCatalog } from '@/components/crop-detection/DiseaseCatalog';

export default function CropDiseaseDetection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // API hooks
  const analyzeImageMutation = useAnalyzeImage();
  const createScanMutation = useCreateScan();

  // Validate image file
  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload a JPEG, PNG, or WebP image',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Please upload an image smaller than 10MB',
      });
      return false;
    }

    return true;
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateImageFile(file)) {
      processImageFile(file);
    }
  };

  // Process image file
  const processImageFile = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setAnalysisResult(null);
    setUploadProgress(0);
  };

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateImageFile(file)) {
        processImageFile(file);
      }
    }
  }, []);

  // Handle image analysis with progress tracking
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    try {
      setUploadProgress(0);
      
      const result = await analyzeImageMutation.mutateAsync({
        data: {
          image: selectedImage,
          crop_type: 'auto-detect',
        },
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      
      setAnalysisResult(result);
      toast.success('Analysis complete', {
        description: 'Your crop image has been analyzed successfully',
      });
    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed', {
        description: error?.message || 'Failed to analyze image. Please try again.',
      });
    }
  };

  // Handle saving scan to history
  const handleSaveScan = async () => {
    if (!selectedImage || !analysisResult) return;

    try {
      await createScanMutation.mutateAsync({
        data: {
          image: selectedImage,
          crop_type: analysisResult.crop_type,
        },
      });
      
      toast.success('Scan saved', {
        description: 'Your scan has been saved to history',
      });
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error('Save failed', {
        description: error?.message || 'Failed to save scan. Please try again.',
      });
    }
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    // In a real app, this would open camera
    fileInputRef.current?.click();
  };

  // Clear selected image
  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleClearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {selectedImage && (
                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{selectedImage.name}</span>
                          <span>{(selectedImage.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      isDragging 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2 font-medium">
                      {isDragging ? 'Drop image here' : 'Drag and drop your crop image'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click below to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports: JPEG, PNG, WebP (max 10MB)
                    </p>
                  </div>
                )}

                {/* Upload Progress */}
                {analyzeImageMutation.isPending && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uploading...</span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCameraCapture}
                    disabled={analyzeImageMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Camera
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzeImageMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Browse
                  </Button>
                </div>

                {/* Analyze Button */}
                {selectedImage && !analysisResult && (
                  <Button 
                    onClick={handleAnalyze}
                    disabled={analyzeImageMutation.isPending}
                    className="w-full"
                  >
                    {analyzeImageMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {uploadProgress < 100 ? 'Uploading...' : 'Analyzing...'}
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
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <ResultsDisplay
              result={analysisResult}
              isLoading={analyzeImageMutation.isPending}
              onSave={handleSaveScan}
              isSaving={createScanMutation.isPending}
            />
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <ScanHistory onViewScan={(scan) => {
            // TODO: Implement scan detail view
            console.log('View scan:', scan);
          }} />
        </TabsContent>

        {/* Diseases Tab */}
        <TabsContent value="diseases" className="space-y-6">
          <DiseaseCatalog />
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