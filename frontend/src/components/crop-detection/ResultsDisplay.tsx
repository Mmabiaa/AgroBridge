/**
 * ResultsDisplay Component
 * Task 8.2: Display disease detection results with confidence scores and treatments
 * Task 8.5: Integrated feedback mechanism
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Scan,
  Download,
  Share,
  Loader2,
  Leaf,
  Droplets,
  Sun,
  Calendar,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { ImageAnalysisResponse } from '@/api/services/cropDetectionService';
import { useDiseaseTreatments } from '@/api/hooks/useCropDetection';
import { ScanFeedback } from './ScanFeedback';

interface ResultsDisplayProps {
  result: ImageAnalysisResponse | null;
  scanId?: string;
  isLoading?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
}

export function ResultsDisplay({ result, scanId, isLoading, onSave, isSaving }: ResultsDisplayProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing your crop image...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Scan className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Upload an image to see analysis results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Analysis Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Health Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-green-600" />
                  Health Score
                </span>
                <span className="text-2xl font-bold text-primary">
                  {result.health_score}%
                </span>
              </div>
              <Progress value={result.health_score} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {result.health_score >= 80
                  ? 'Your crop appears healthy'
                  : result.health_score >= 60
                  ? 'Minor issues detected'
                  : result.health_score >= 40
                  ? 'Moderate issues detected'
                  : 'Significant issues detected'}
              </p>
            </div>

            {/* Detected Crop */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">Detected Crop:</span>
              <Badge variant="outline" className="capitalize">
                {result.crop_type}
              </Badge>
            </div>

            {/* Processing Info */}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Model: {result.model_version}</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Time: {result.processing_time_ms}ms</span>
              </div>
            </div>

            {/* Detected Diseases */}
            {result.detected_diseases && result.detected_diseases.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Detected Issues ({result.detected_diseases.length})
                </h4>
                <div className="space-y-2">
                  {result.detected_diseases.map((disease, index) => (
                    <DiseaseCard key={index} disease={disease} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">No diseases detected</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your crop appears to be healthy. Continue regular monitoring.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 ? (
              <div className="space-y-3">
                {result.recommendations.map((rec, index) => (
                  <RecommendationCard key={index} recommendation={rec} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No specific recommendations at this time</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t mt-4">
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Save to History
              </>
            )}
          </Button>
          {scanId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeedback(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>

      {/* Feedback Dialog */}
      {scanId && (
        <ScanFeedback
          scanId={scanId}
          detectedDiseases={result?.detected_diseases || []}
          open={showFeedback}
          onClose={() => setShowFeedback(false)}
          onSuccess={() => {
            // Optionally refresh data or show success message
          }}
        />
      )}
    </Card>
  );
}

// Disease Card Component
interface DiseaseCardProps {
  disease: {
    disease_id?: string;
    disease_name: string;
    confidence_score: number;
    affected_area_percentage: number;
    severity: string;
    location_in_image?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

function DiseaseCard({ disease }: DiseaseCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      case 'medium':
        return <Info className="h-4 w-4" />;
      case 'high':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Fetch treatments for this disease
  const { data: treatmentsData, isLoading: treatmentsLoading } = useDiseaseTreatments(
    disease.disease_id || ''
  );

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="font-semibold">{disease.disease_name}</h5>
        </div>
        <Badge className={getSeverityColor(disease.severity)} variant="outline">
          <div className="flex items-center gap-1">
            {getSeverityIcon(disease.severity)}
            {disease.severity}
          </div>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Confidence:</span>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={disease.confidence_score * 100} className="h-1.5 flex-1" />
            <span className="font-medium">{(disease.confidence_score * 100).toFixed(1)}%</span>
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Affected Area:</span>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={disease.affected_area_percentage} className="h-1.5 flex-1" />
            <span className="font-medium">{disease.affected_area_percentage}%</span>
          </div>
        </div>
      </div>

      {/* Treatments */}
      {disease.disease_id && (
        <div className="pt-2 border-t">
          <h6 className="text-sm font-medium mb-2">Available Treatments:</h6>
          {treatmentsLoading ? (
            <div className="text-xs text-muted-foreground">Loading treatments...</div>
          ) : treatmentsData && treatmentsData.length > 0 ? (
            <div className="space-y-1">
              {treatmentsData.slice(0, 3).map((treatment) => (
                <div key={treatment.id} className="text-xs p-2 bg-muted rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{treatment.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {treatment.treatment_type}
                    </Badge>
                  </div>
                  {treatment.estimated_cost && (
                    <div className="text-muted-foreground mt-1">
                      Est. cost: {treatment.estimated_cost}
                    </div>
                  )}
                </div>
              ))}
              {treatmentsData.length > 3 && (
                <div className="text-xs text-muted-foreground text-center pt-1">
                  +{treatmentsData.length - 3} more treatments available
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No treatments available</div>
          )}
        </div>
      )}
    </div>
  );
}

// Recommendation Card Component
interface RecommendationCardProps {
  recommendation: {
    type: string;
    priority: string;
    title: string;
    description: string;
    actions?: string[];
  };
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'treatment':
        return <Droplets className="h-4 w-4" />;
      case 'prevention':
        return <AlertCircle className="h-4 w-4" />;
      case 'monitoring':
        return <Calendar className="h-4 w-4" />;
      case 'environmental':
        return <Sun className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-4 bg-muted rounded-lg space-y-2">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-background">
          {getTypeIcon(recommendation.type)}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {recommendation.type}
            </Badge>
            <Badge variant={getPriorityColor(recommendation.priority)}>
              {recommendation.priority} priority
            </Badge>
          </div>
          <h5 className="font-semibold">{recommendation.title}</h5>
          <p className="text-sm text-muted-foreground">{recommendation.description}</p>
          
          {recommendation.actions && recommendation.actions.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium mb-1">Recommended Actions:</p>
              <ul className="text-xs space-y-1">
                {recommendation.actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
