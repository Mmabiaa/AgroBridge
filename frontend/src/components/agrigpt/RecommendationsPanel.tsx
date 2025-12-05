import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Lightbulb,
  TrendingUp,
  DollarSign,
  Sprout,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import aiService from '@/api/services/aiService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Recommendation {
  id: string;
  type: 'crop' | 'treatment' | 'market' | 'financial';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  metadata?: {
    crop_name?: string;
    disease_name?: string;
    market_price?: number;
    expected_roi?: number;
  };
}

const recommendationIcons = {
  crop: Sprout,
  treatment: Lightbulb,
  market: TrendingUp,
  financial: DollarSign,
};

const recommendationColors = {
  crop: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  treatment: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  market: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  financial: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export function RecommendationsPanel() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['ai', 'recommendations', 'active'],
    queryFn: () => aiService.getActiveRecommendations(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ recommendationId, feedback }: { recommendationId: string; feedback: { rating: number; comment?: string } }) =>
      aiService.provideRecommendationFeedback(recommendationId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'recommendations'] });
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      setFeedbackDialogOpen(false);
      setFeedbackRating(null);
      setFeedbackComment('');
      setSelectedRecommendation(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFeedback = (recommendation: Recommendation, rating: number) => {
    setSelectedRecommendation(recommendation);
    setFeedbackRating(rating);
    setFeedbackDialogOpen(true);
  };

  const submitFeedback = () => {
    if (!selectedRecommendation || feedbackRating === null) return;

    feedbackMutation.mutate({
      recommendationId: selectedRecommendation.id,
      feedback: {
        rating: feedbackRating,
        comment: feedbackComment || undefined,
      },
    });
  };

  const groupedRecommendations = recommendations.reduce((acc: Record<string, Recommendation[]>, rec: Recommendation) => {
    if (!acc[rec.type]) {
      acc[rec.type] = [];
    }
    acc[rec.type].push(rec);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            AI Recommendations
            {recommendations.length > 0 && (
              <Badge variant="secondary">{recommendations.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {recommendations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                  <Lightbulb className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No active recommendations at the moment.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back later for personalized farming insights.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {Object.entries(groupedRecommendations).map(([type, recs]) => {
                  const Icon = recommendationIcons[type as keyof typeof recommendationIcons];
                  const typedRecs = recs as Recommendation[];
                  return (
                    <div key={type}>
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.charAt(0).toUpperCase() + type.slice(1)} Recommendations
                      </h3>
                      <div className="space-y-3">
                        {typedRecs.map((rec: Recommendation) => {
                          const Icon = recommendationIcons[rec.type];
                          return (
                            <Card key={rec.id} className="border-l-4" style={{
                              borderLeftColor: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f97316' : '#6b7280'
                            }}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "p-2 rounded-lg",
                                    recommendationColors[rec.type]
                                  )}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h4 className="font-semibold text-sm">{rec.title}</h4>
                                      <Badge className={cn("text-xs", priorityColors[rec.priority])}>
                                        {rec.priority}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">
                                      {rec.description}
                                    </p>
                                    
                                    {/* Metadata */}
                                    {rec.metadata && (
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        {rec.metadata.crop_name && (
                                          <Badge variant="outline" className="text-xs">
                                            🌱 {rec.metadata.crop_name}
                                          </Badge>
                                        )}
                                        {rec.metadata.disease_name && (
                                          <Badge variant="outline" className="text-xs">
                                            🦠 {rec.metadata.disease_name}
                                          </Badge>
                                        )}
                                        {rec.metadata.market_price && (
                                          <Badge variant="outline" className="text-xs">
                                            💰 ${rec.metadata.market_price}
                                          </Badge>
                                        )}
                                        {rec.metadata.expected_roi && (
                                          <Badge variant="outline" className="text-xs">
                                            📈 {rec.metadata.expected_roi}% ROI
                                          </Badge>
                                        )}
                                      </div>
                                    )}

                                    {/* Confidence Score */}
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                                          style={{ width: `${rec.confidence * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {Math.round(rec.confidence * 100)}% confident
                                      </span>
                                    </div>

                                    {/* Feedback Buttons */}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleFeedback(rec, 1)}
                                        className="h-8 text-xs"
                                      >
                                        <ThumbsUp className="h-3 w-3 mr-1" />
                                        Helpful
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleFeedback(rec, -1)}
                                        className="h-8 text-xs"
                                      >
                                        <ThumbsDown className="h-3 w-3 mr-1" />
                                        Not Helpful
                                      </Button>
                                      <span className="text-xs text-muted-foreground ml-auto">
                                        {new Date(rec.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Help us improve our recommendations by sharing your thoughts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Your Rating
              </label>
              <div className="flex items-center gap-2">
                {feedbackRating === 1 ? (
                  <Badge className="bg-green-100 text-green-700">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Helpful
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700">
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    Not Helpful
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional Comments (Optional)
              </label>
              <Textarea
                placeholder="Tell us more about your experience..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFeedbackDialogOpen(false);
                setFeedbackRating(null);
                setFeedbackComment('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitFeedback}
              disabled={feedbackMutation.isPending}
            >
              {feedbackMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
