/**
 * Yield Predictions Component with ML-based forecasts
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Sprout,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useYieldPredictions } from '@/api/hooks/useAnalytics';
import { useFarms } from '@/api/hooks/useFarms';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface YieldPredictionsProps {
  farmId?: string;
}

export const YieldPredictions: React.FC<YieldPredictionsProps> = ({ farmId: initialFarmId }) => {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(initialFarmId || '');
  const [selectedCrop, setSelectedCrop] = useState<string>('');

  // Fetch farms list
  const { data: farmsData } = useFarms();
  const farms = farmsData?.results || [];

  // Fetch yield predictions
  const { data: predictions, isLoading } = useYieldPredictions({
    farm_id: selectedFarmId,
    crop: selectedCrop || undefined,
  });

  // Get unique crops from predictions
  const crops = predictions ? [...new Set(predictions.map(p => p.crop))] : [];

  // Prepare historical comparison data
  const getHistoricalData = (prediction: any) => {
    if (!prediction.historical_comparison) return [];
    
    return [
      ...prediction.historical_comparison.map((item: any) => ({
        year: item.year.toString(),
        actual: item.actual_yield,
        type: 'Historical',
      })),
      {
        year: new Date(prediction.harvest_date).getFullYear().toString(),
        predicted: prediction.predicted_yield,
        type: 'Predicted',
      },
    ];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilHarvest = (harvestDate: string) => {
    const today = new Date();
    const harvest = new Date(harvestDate);
    const diffTime = harvest.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Yield Predictions
              </CardTitle>
              <CardDescription>
                ML-based forecasts with confidence intervals
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {crops.length > 0 && (
                <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="All crops" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All crops</SelectItem>
                    {crops.map((crop) => (
                      <SelectItem key={crop} value={crop}>
                        {crop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="grid gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !selectedFarmId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Please select a farm to view yield predictions</p>
          </CardContent>
        </Card>
      ) : !predictions || predictions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No yield predictions available for this farm</p>
            <p className="text-sm text-muted-foreground mt-2">
              Predictions will be generated once sufficient historical data is available
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Predictions Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {predictions.map((prediction, index) => {
              const daysUntilHarvest = getDaysUntilHarvest(prediction.harvest_date);
              const historicalData = getHistoricalData(prediction);

              return (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-50 rounded-full">
                          <Sprout className="h-4 w-4 text-green-600" />
                        </div>
                        <CardTitle className="text-lg">{prediction.crop}</CardTitle>
                      </div>
                      <Badge className={getConfidenceColor(prediction.confidence_level)}>
                        {prediction.confidence_level}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Predicted Yield */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Predicted Yield</p>
                      <p className="text-2xl font-bold">
                        {prediction.predicted_yield} {prediction.unit}
                      </p>
                    </div>

                    {/* Confidence Level */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Confidence Level</p>
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Based on historical data, weather patterns, and soil conditions
                              </p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                      <Progress value={prediction.confidence_level} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {getConfidenceLabel(prediction.confidence_level)}
                      </p>
                    </div>

                    {/* Harvest Date */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Expected Harvest</p>
                        <p className="font-medium">{formatDate(prediction.harvest_date)}</p>
                        <p className="text-xs text-muted-foreground">
                          {daysUntilHarvest > 0 ? `${daysUntilHarvest} days remaining` : 'Harvest due'}
                        </p>
                      </div>
                    </div>

                    {/* Mini Historical Chart */}
                    {historicalData.length > 0 && (
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-2">Historical Comparison</p>
                        <ResponsiveContainer width="100%" height={100}>
                          <LineChart data={historicalData}>
                            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detailed Prediction Analysis */}
          {predictions.map((prediction, index) => (
            <Card key={`detail-${index}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  {prediction.crop} - Detailed Analysis
                </CardTitle>
                <CardDescription>
                  Prediction generated on {formatDate(prediction.prediction_date)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Historical Comparison Chart */}
                <div>
                  <h4 className="font-medium mb-4">Historical vs Predicted Yield</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={getHistoricalData(prediction)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="actual" fill="#10b981" name="Actual Yield" />
                      <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={3} name="Predicted Yield" strokeDasharray="5 5" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Impact Factors */}
                <div>
                  <h4 className="font-medium mb-4">Factors Affecting Prediction</h4>
                  <div className="space-y-3">
                    {prediction.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className={`p-2 rounded-full ${factor.impact > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                          {factor.impact > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{factor.name}</p>
                            <Badge variant={factor.impact > 0 ? 'default' : 'destructive'}>
                              {factor.impact > 0 ? '+' : ''}{factor.impact}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{factor.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
};

export default YieldPredictions;
