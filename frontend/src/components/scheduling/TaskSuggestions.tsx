import { useTaskSuggestions, useAcceptSuggestion, useDismissSuggestion } from '@/api/hooks/useScheduling';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Check, X, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function TaskSuggestions() {
  const { data: suggestions, isLoading } = useTaskSuggestions();
  const acceptSuggestion = useAcceptSuggestion();
  const dismissSuggestion = useDismissSuggestion();

  const handleAccept = async (suggestionId: string) => {
    try {
      await acceptSuggestion.mutateAsync(suggestionId);
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    }
  };

  const handleDismiss = async (suggestionId: string) => {
    try {
      await dismissSuggestion.mutateAsync(suggestionId);
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      planting: 'bg-green-100 text-green-800',
      irrigation: 'bg-blue-100 text-blue-800',
      fertilization: 'bg-yellow-100 text-yellow-800',
      pest_control: 'bg-red-100 text-red-800',
      harvesting: 'bg-orange-100 text-orange-800',
      maintenance: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI Task Suggestions
            </CardTitle>
            <CardDescription>
              Smart recommendations based on your farm data and best practices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Task Suggestions
          </CardTitle>
          <CardDescription>
            Smart recommendations based on your farm data and best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No suggestions available at the moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for AI-powered task recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Task Suggestions
          </CardTitle>
          <CardDescription>
            Smart recommendations based on your farm data, weather patterns, and best practices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="border rounded-lg p-4 space-y-3 bg-gradient-to-r from-yellow-50/50 to-transparent"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-base">{suggestion.title}</h3>
                    <Badge variant={getPriorityColor(suggestion.priority)} className="text-xs">
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Suggested: {format(new Date(suggestion.suggested_date), 'MMM dd, yyyy')}</span>
                </div>
                <Badge className={getCategoryColor(suggestion.category)}>
                  {suggestion.category.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                  <span className="text-xs text-muted-foreground">• {suggestion.reason}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismiss(suggestion.id)}
                    disabled={dismissSuggestion.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(suggestion.id)}
                    disabled={acceptSuggestion.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How AI Suggestions Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <p>
              Our AI analyzes your farm data, crop cycles, weather patterns, and historical performance
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <p>
              Suggestions are prioritized based on urgency, impact, and optimal timing
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <p>
              Confidence scores indicate how strongly we recommend each task based on available data
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
            <p>
              Accepting a suggestion automatically creates a task with pre-filled details
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
