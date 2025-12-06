/**
 * ScanHistory Component
 * Task 8.3: Display scan history with filtering and statistics
 * Task 8.5: Integrated feedback mechanism
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Eye,
  Calendar,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Leaf,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { useScans, useScanHistory, useScanStatistics } from '@/api/hooks/useCropDetection';
import { format } from 'date-fns';
import { CropScan } from '@/api/services/cropDetectionService';
import { ScanFeedback } from './ScanFeedback';

interface ScanHistoryProps {
  onViewScan?: (scan: CropScan) => void;
}

export function ScanHistory({ onViewScan }: ScanHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cropTypeFilter, setCropTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [feedbackScanId, setFeedbackScanId] = useState<string | null>(null);
  const [feedbackScan, setFeedbackScan] = useState<CropScan | null>(null);

  // Build query params
  const queryParams = {
    page,
    page_size: 10,
    ...(cropTypeFilter !== 'all' && { crop_type: cropTypeFilter }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
  };

  // API hooks
  const { data: scansData, isLoading: scansLoading } = useScans(queryParams);
  const { data: historyData } = useScanHistory();
  const { data: statsData } = useScanStatistics();

  const scans = scansData?.results || [];
  const totalScans = scansData?.count || 0;
  const hasNextPage = !!scansData?.next;
  const hasPreviousPage = !!scansData?.previous;

  // Filter scans by search query (client-side)
  const filteredScans = scans.filter((scan) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      scan.crop_type.toLowerCase().includes(query) ||
      scan.crop_variety?.toLowerCase().includes(query) ||
      scan.detected_diseases.some((d) => d.disease_name.toLowerCase().includes(query))
    );
  });

  // Get unique crop types for filter
  const cropTypes = Array.from(new Set(scans.map((s) => s.crop_type))).filter(Boolean);

  // Get health trend icon
  const getHealthTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statsData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Scans</p>
                  <p className="text-2xl font-bold">{statsData.total_scans}</p>
                </div>
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{statsData.success_rate.toFixed(1)}%</p>
                </div>
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Health</p>
                  <p className="text-2xl font-bold">
                    {statsData.average_health_score?.toFixed(0) || 'N/A'}%
                  </p>
                </div>
                {historyData && getHealthTrendIcon(historyData.health_trend)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold">
                    {statsData.average_rating?.toFixed(1) || 'N/A'}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Scan History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by crop type or disease..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={cropTypeFilter} onValueChange={setCropTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Crop Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crops</SelectItem>
                {cropTypes.map((crop) => (
                  <SelectItem key={crop} value={crop} className="capitalize">
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scan List */}
          {scansLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <div className="h-16 w-16 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No scans found</h3>
              <p className="text-muted-foreground">
                {searchQuery || cropTypeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your scan history will appear here'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {filteredScans.map((scan) => (
                  <ScanHistoryItem
                    key={scan.id}
                    scan={scan}
                    onView={() => onViewScan?.(scan)}
                    onFeedback={() => {
                      setFeedbackScanId(scan.id);
                      setFeedbackScan(scan);
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalScans > 10 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalScans)} of{' '}
                    {totalScans} scans
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={!hasPreviousPage}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      {feedbackScanId && feedbackScan && (
        <ScanFeedback
          scanId={feedbackScanId}
          detectedDiseases={feedbackScan.detected_diseases}
          open={!!feedbackScanId}
          onClose={() => {
            setFeedbackScanId(null);
            setFeedbackScan(null);
          }}
          onSuccess={() => {
            // Optionally refresh the scans list
          }}
        />
      )}
    </div>
  );
}

// Scan History Item Component
interface ScanHistoryItemProps {
  scan: CropScan;
  onView?: () => void;
  onFeedback?: () => void;
}

function ScanHistoryItem({ scan, onView, onFeedback }: ScanHistoryItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <img
        src={scan.image}
        alt="Scanned crop"
        className="h-16 w-16 object-cover rounded"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder-crop.png';
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium capitalize">{scan.crop_type}</span>
          {scan.crop_variety && (
            <Badge variant="outline" className="text-xs">
              {scan.crop_variety}
            </Badge>
          )}
          <Badge className={getStatusColor(scan.status)} variant="outline">
            {scan.status}
          </Badge>
          <span className={`text-sm font-semibold ${getHealthColor(scan.health_score)}`}>
            {scan.health_score}% health
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {scan.detected_diseases?.length || 0} issue(s) detected
          {scan.detected_diseases && scan.detected_diseases.length > 0 && (
            <span className="ml-2">
              • {scan.detected_diseases.map((d) => d.disease_name).join(', ')}
            </span>
          )}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(scan.created_at), 'MMM dd, yyyy')}
          </span>
          {scan.accuracy_rating && (
            <span>Rating: {scan.accuracy_rating}/5</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
        {!scan.accuracy_rating && (
          <Button variant="outline" size="sm" onClick={onFeedback}>
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
