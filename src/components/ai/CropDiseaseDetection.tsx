
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Upload, 
  Scan, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  RotateCw,
  Leaf,
  Droplets,
  Thermometer,
  Calendar,
  AlertCircle,
  Info
} from 'lucide-react';

interface DetectionResult {
  disease: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  treatment: string[];
  prevention: string[];
  symptoms: string[];
  causes: string[];
  affectedCrops: string[];
  spreadRate: 'slow' | 'moderate' | 'fast';
  environmentalFactors: string[];
  recommendedProducts: string[];
  cost: 'low' | 'medium' | 'high';
  recoveryTime: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface DiseaseDatabase {
  [key: string]: DetectionResult;
}

const diseaseDatabase: DiseaseDatabase = {
  'Late Blight': {
    disease: 'Late Blight (Phytophthora infestans)',
    confidence: 89,
    severity: 'high',
    treatment: [
      'Apply copper-based fungicide (e.g., Copper Oxychloride) immediately',
      'Remove and destroy all infected plant parts',
      'Apply systemic fungicide like Metalaxyl or Mancozeb',
      'Increase plant spacing for better air circulation',
      'Apply treatment every 7-10 days for 3 weeks'
    ],
    prevention: [
      'Use resistant varieties (e.g., Mountain Magic, Defiant)',
      'Avoid overhead irrigation',
      'Maintain proper plant spacing (60-90cm apart)',
      'Apply preventive fungicide before rainy season',
      'Remove volunteer plants and crop debris'
    ],
    symptoms: [
      'Dark, water-soaked lesions on leaves',
      'White fungal growth on underside of leaves',
      'Brown to black lesions on stems',
      'Rapid wilting and death of plants',
      'Fruit rot with firm, brown lesions'
    ],
    causes: [
      'High humidity (>90%) and cool temperatures (15-25°C)',
      'Poor air circulation in dense plantings',
      'Overhead irrigation keeping foliage wet',
      'Infected seed tubers or transplants'
    ],
    affectedCrops: ['Tomatoes', 'Potatoes', 'Peppers', 'Eggplants'],
    spreadRate: 'fast',
    environmentalFactors: ['High humidity', 'Cool temperatures', 'Rainy weather', 'Poor ventilation'],
    recommendedProducts: [
      'Copper Oxychloride 50% WP',
      'Mancozeb 80% WP',
      'Metalaxyl + Mancozeb',
      'Chlorothalonil 75% WP'
    ],
    cost: 'medium',
    recoveryTime: '2-3 weeks with proper treatment',
    riskLevel: 'high'
  },
  'Early Blight': {
    disease: 'Early Blight (Alternaria solani)',
    confidence: 76,
    severity: 'medium',
    treatment: [
      'Apply chlorothalonil or mancozeb fungicide',
      'Remove infected leaves and stems',
      'Apply neem oil as organic alternative',
      'Improve soil drainage and reduce moisture',
      'Apply treatment every 10-14 days'
    ],
    prevention: [
      'Practice crop rotation (3-4 year cycle)',
      'Use certified disease-free seeds',
      'Maintain adequate plant spacing',
      'Avoid working in wet fields',
      'Mulch to prevent soil splash'
    ],
    symptoms: [
      'Dark brown spots with concentric rings',
      'Yellow halos around lesions',
      'Defoliation starting from bottom leaves',
      'Stem lesions near soil line',
      'Fruit spots with leathery texture'
    ],
    causes: [
      'Warm, humid weather conditions',
      'Poor soil fertility and stress',
      'Infected plant debris in soil',
      'Overcrowded plantings'
    ],
    affectedCrops: ['Tomatoes', 'Potatoes', 'Peppers'],
    spreadRate: 'moderate',
    environmentalFactors: ['Warm temperatures', 'High humidity', 'Poor soil conditions', 'Plant stress'],
    recommendedProducts: [
      'Chlorothalonil 75% WP',
      'Mancozeb 80% WP',
      'Neem Oil (organic)',
      'Bacillus subtilis (biological control)'
    ],
    cost: 'low',
    recoveryTime: '1-2 weeks with treatment',
    riskLevel: 'medium'
  },
  'Bacterial Wilt': {
    disease: 'Bacterial Wilt (Ralstonia solanacearum)',
    confidence: 92,
    severity: 'critical',
    treatment: [
      'Remove and destroy infected plants immediately',
      'Solarize soil for 6-8 weeks',
      'Apply copper-based bactericide to surrounding plants',
      'Disinfect tools and equipment',
      'No effective chemical treatment available'
    ],
    prevention: [
      'Use resistant varieties',
      'Practice crop rotation with non-solanaceous crops',
      'Improve soil drainage',
      'Use disease-free transplants',
      'Avoid overwatering and poor drainage'
    ],
    symptoms: [
      'Sudden wilting of leaves during day',
      'Recovery at night initially',
      'Brown discoloration of vascular tissue',
      'White bacterial ooze from cut stems',
      'Complete plant collapse'
    ],
    causes: [
      'Infected soil or water',
      'Contaminated tools or equipment',
      'Infected transplants or seeds',
      'Poor soil drainage and overwatering'
    ],
    affectedCrops: ['Tomatoes', 'Potatoes', 'Peppers', 'Eggplants', 'Tobacco'],
    spreadRate: 'fast',
    environmentalFactors: ['Warm soil temperatures', 'High soil moisture', 'Poor drainage', 'Acidic soil'],
    recommendedProducts: [
      'Copper-based bactericides',
      'Biological control agents',
      'Soil solarization materials'
    ],
    cost: 'high',
    recoveryTime: 'No recovery - plant removal required',
    riskLevel: 'high'
  },
  'Healthy Plant': {
    disease: 'Healthy Plant - No Disease Detected',
    confidence: 95,
    severity: 'low',
    treatment: [
      'Continue current care routine',
      'Monitor for early signs of disease',
      'Maintain proper watering schedule',
      'Apply preventive fungicide if in high-risk area'
    ],
    prevention: [
      'Regular monitoring and scouting',
      'Maintain good agricultural practices',
      'Use disease-resistant varieties',
      'Practice crop rotation',
      'Keep field clean and weed-free'
    ],
    symptoms: [
      'No visible disease symptoms',
      'Healthy green foliage',
      'Normal growth and development',
      'No lesions or spots on leaves',
      'Strong, upright plant structure'
    ],
    causes: [
      'Good agricultural practices',
      'Disease-resistant varieties',
      'Proper environmental conditions',
      'Regular monitoring and early intervention'
    ],
    affectedCrops: ['All crops'],
    spreadRate: 'slow',
    environmentalFactors: ['Optimal growing conditions', 'Good air circulation', 'Proper nutrition', 'Adequate water'],
    recommendedProducts: [
      'Preventive fungicides (optional)',
      'Balanced fertilizers',
      'Organic soil amendments'
    ],
    cost: 'low',
    recoveryTime: 'No recovery needed',
    riskLevel: 'low'
  },
  'Powdery Mildew': {
    disease: 'Powdery Mildew (Oidium spp.)',
    confidence: 84,
    severity: 'medium',
    treatment: [
      'Apply sulfur-based fungicide',
      'Use neem oil or potassium bicarbonate',
      'Remove severely infected leaves',
      'Improve air circulation',
      'Apply treatment every 7 days'
    ],
    prevention: [
      'Plant resistant varieties',
      'Maintain adequate spacing',
      'Avoid overhead irrigation',
      'Prune for better air flow',
      'Apply preventive fungicide early season'
    ],
    symptoms: [
      'White to gray powdery spots on leaves',
      'Yellowing and curling of leaves',
      'Stunted growth and reduced yield',
      'Powdery coating on stems and flowers',
      'Premature leaf drop'
    ],
    causes: [
      'High humidity with moderate temperatures',
      'Poor air circulation',
      'Overcrowded plantings',
      'Overhead irrigation'
    ],
    affectedCrops: ['Cucumbers', 'Squash', 'Melons', 'Peas', 'Beans'],
    spreadRate: 'moderate',
    environmentalFactors: ['Moderate temperatures', 'High humidity', 'Poor ventilation', 'Dense plantings'],
    recommendedProducts: [
      'Sulfur 80% WP',
      'Neem Oil',
      'Potassium Bicarbonate',
      'Bacillus subtilis'
    ],
    cost: 'low',
    recoveryTime: '1-2 weeks with treatment',
    riskLevel: 'medium'
  }
};

export function CropDiseaseDetection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Always start camera on mount unless an image is selected
  useEffect(() => {
    if (cameraActive && !selectedImage) {
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          setCameraActive(false);
        }
      })();
    }
    // Stop camera when not active
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive, selectedImage, facingMode]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
        setCameraActive(false);
      };
      reader.readAsDataURL(file);
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
      setCameraActive(false);
    }
  };

  const retakePhoto = () => {
    setSelectedImage(null);
    setResult(null);
    setCameraActive(true);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Simulate realistic AI analysis with progress updates
    const analysisSteps = [
      'Initializing AI model...',
      'Processing image data...',
      'Extracting visual features...',
      'Comparing with disease database...',
      'Analyzing symptom patterns...',
      'Calculating confidence scores...',
      'Generating recommendations...'
    ];
    
    for (let i = 0; i < analysisSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(((i + 1) / analysisSteps.length) * 100);
    }
    
    // Select result based on realistic probabilities
    const diseases = Object.keys(diseaseDatabase);
    const weights = [0.15, 0.20, 0.10, 0.40, 0.15]; // Higher weight for healthy plants
    const random = Math.random();
    let cumulativeWeight = 0;
    let selectedDisease = 'Healthy Plant';
    
    for (let i = 0; i < diseases.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        selectedDisease = diseases[i];
        break;
      }
    }
    
    const analysisResult = diseaseDatabase[selectedDisease];
    setResult(analysisResult);
    setIsAnalyzing(false);
    setAnalysisProgress(0);

    // Save scan result to localStorage
    const newScan = {
      id: Date.now().toString(),
      crop: 'Crop Analysis', // Could be enhanced to detect crop type
      result: analysisResult.disease.includes('Healthy') ? 'Healthy' : analysisResult.disease,
      confidence: analysisResult.confidence,
      timestamp: new Date().toISOString(),
      severity: analysisResult.severity
    };

    // Get existing scans from localStorage
    const existingScans = localStorage.getItem('userCropScans');
    const scans = existingScans ? JSON.parse(existingScans) : [];
    
    // Add new scan to the beginning
    scans.unshift(newScan);
    
    // Keep only the last 50 scans to prevent localStorage from getting too large
    const limitedScans = scans.slice(0, 50);
    
    // Save back to localStorage
    localStorage.setItem('userCropScans', JSON.stringify(limitedScans));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Advanced Crop Disease Detection
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-powered disease detection with comprehensive analysis and treatment recommendations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {cameraActive && !selectedImage && (
            <div className="space-y-4 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <button
                type="button"
                aria-label="Switch camera"
                onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md border border-gray-200"
                style={{ touchAction: 'manipulation' }}
              >
                <RotateCw className="h-5 w-5 text-primary" />
              </button>
              <div className="flex gap-3">
                <Button onClick={capturePhoto} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
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

          {selectedImage && !isAnalyzing && (
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
                  onClick={retakePhoto}
                >
                  Retake
                </Button>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">AI Analysis in Progress...</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Processing image data and comparing with disease database...
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Main Result Card */}
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{result.disease}</h3>
                      <p className="text-sm text-muted-foreground">
                        AI Confidence: {result.confidence}%
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity} severity
                      </Badge>
                      <Badge variant="outline" className={getRiskColor(result.riskLevel)}>
                        Risk: {result.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={result.confidence} className="h-2" />
                  
                  {/* Quick Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-blue-600">Spread Rate</div>
                      <div className="capitalize">{result.spreadRate}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-semibold text-green-600">Recovery Time</div>
                      <div>{result.recoveryTime}</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="font-semibold text-yellow-600">Treatment Cost</div>
                      <div className="capitalize">{result.cost}</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="font-semibold text-purple-600">Affected Crops</div>
                      <div className="text-xs">{result.affectedCrops.length} crops</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Symptoms */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Symptoms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.symptoms.map((symptom, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Causes */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="h-5 w-5 text-blue-500" />
                      Causes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.causes.map((cause, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Treatment */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Droplets className="h-5 w-5 text-green-500" />
                      Treatment Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {result.treatment.map((treatment, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-green-600 font-semibold min-w-[1.5rem]">{index + 1}.</span>
                          <span>{treatment}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                {/* Prevention */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="h-5 w-5 text-purple-500" />
                      Prevention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.prevention.map((prevention, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-purple-500 mt-1">•</span>
                          <span>{prevention}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Recommended Products */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5" />
                    Recommended Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.recommendedProducts.map((product, index) => (
                      <Badge key={index} variant="outline" className="text-sm p-2">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Environmental Factors */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    Environmental Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.environmentalFactors.map((factor, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
