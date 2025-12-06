/**
 * Custom Reports Generator Component
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Download,
  Trash2,
  Calendar,
  Filter,
  Plus,
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useGenerateReport, useReports, useDeleteReport } from '@/api/hooks/useAnalytics';
import { useFarms } from '@/api/hooks/useFarms';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import analyticsService from '@/api/services/analytics.service';

export const ReportGenerator: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState<'farm_performance' | 'financial' | 'marketplace' | 'iot' | 'custom'>('farm_performance');
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<'json' | 'pdf' | 'excel'>('pdf');

  // Fetch farms list
  const { data: farmsData } = useFarms();
  const farms = farmsData?.results || [];

  // Fetch saved reports
  const { data: reports, isLoading: reportsLoading, refetch } = useReports();

  // Mutations
  const generateReport = useGenerateReport();
  const deleteReport = useDeleteReport();

  const handleGenerateReport = async () => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }

    try {
      await generateReport.mutateAsync({
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        farm_id: selectedFarmId || undefined,
        format,
        filters: {
          name: reportName,
        },
      });

      toast.success('Report generated successfully');
      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport.mutateAsync(reportId);
      toast.success('Report deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const handleDownloadReport = async (reportId: string, reportFormat: 'pdf' | 'excel') => {
    try {
      await analyticsService.downloadReport(reportId, reportFormat);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const resetForm = () => {
    setReportName('');
    setReportType('farm_performance');
    setSelectedFarmId('');
    setStartDate('');
    setEndDate('');
    setFormat('pdf');
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      farm_performance: 'Farm Performance',
      financial: 'Financial',
      marketplace: 'Marketplace',
      iot: 'IoT Analytics',
      custom: 'Custom',
    };
    return labels[type] || type;
  };

  const getReportTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      farm_performance: 'bg-green-50 text-green-600',
      financial: 'bg-blue-50 text-blue-600',
      marketplace: 'bg-orange-50 text-orange-600',
      iot: 'bg-purple-50 text-purple-600',
      custom: 'bg-gray-50 text-gray-600',
    };
    return colors[type] || 'bg-gray-50 text-gray-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Custom Reports
              </CardTitle>
              <CardDescription>
                Generate and manage custom analytics reports
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Generate Custom Report</DialogTitle>
                  <DialogDescription>
                    Configure report parameters and generate analytics
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Report Name */}
                  <div className="space-y-2">
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input
                      id="report-name"
                      placeholder="e.g., Q4 Farm Performance"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                    />
                  </div>

                  {/* Report Type */}
                  <div className="space-y-2">
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                      <SelectTrigger id="report-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="farm_performance">Farm Performance</SelectItem>
                        <SelectItem value="financial">Financial Analysis</SelectItem>
                        <SelectItem value="marketplace">Marketplace Analytics</SelectItem>
                        <SelectItem value="iot">IoT Sensor Data</SelectItem>
                        <SelectItem value="custom">Custom Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Farm Selection (optional) */}
                  {(reportType === 'farm_performance' || reportType === 'iot') && (
                    <div className="space-y-2">
                      <Label htmlFor="farm">Farm (Optional)</Label>
                      <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                        <SelectTrigger id="farm">
                          <SelectValue placeholder="All farms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All farms</SelectItem>
                          {farms.map((farm) => (
                            <SelectItem key={farm.id} value={farm.id}>
                              {farm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Export Format */}
                  <div className="space-y-2">
                    <Label htmlFor="format">Export Format</Label>
                    <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                      <SelectTrigger id="format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="json">JSON Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateReport} disabled={generateReport.isPending}>
                    {generateReport.isPending ? 'Generating...' : 'Generate Report'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Reports</CardTitle>
          <CardDescription>
            View, download, or delete your generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <div className="bg-gray-200 h-4 w-48 rounded"></div>
                    <div className="bg-gray-200 h-3 w-32 rounded"></div>
                  </div>
                  <div className="bg-gray-200 h-8 w-24 rounded"></div>
                </div>
              ))}
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No reports generated yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Generate Report" to create your first report
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{report.name}</p>
                        <Badge className={getReportTypeColor(report.type)}>
                          {getReportTypeLabel(report.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(report.generated_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Generated
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(report.id, 'pdf')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(report.id, 'excel')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Report</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this report? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteReport(report.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportGenerator;
