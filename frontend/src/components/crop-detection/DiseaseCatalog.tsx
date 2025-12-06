/**
 * DiseaseCatalog Component
 * Task 8.4: Display disease database with search and detailed information
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Search,
  Info,
  Leaf,
  Droplets,
  Sun,
  Wind,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { useDiseases, useDiseaseCategories } from '@/api/hooks/useCropDetection';
import { Disease } from '@/api/services/cropDetectionService';

export function DiseaseCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [page, setPage] = useState(1);

  // Build query params
  const queryParams = {
    page,
    page_size: 12,
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
    ...(severityFilter !== 'all' && { typical_severity: severityFilter }),
    ...(searchQuery && { search: searchQuery }),
  };

  // API hooks
  const { data: diseasesData, isLoading: diseasesLoading } = useDiseases(queryParams);
  const { data: categoriesData } = useDiseaseCategories();

  const diseases = diseasesData?.results || [];
  const totalDiseases = diseasesData?.count || 0;
  const hasNextPage = !!diseasesData?.next;
  const hasPreviousPage = !!diseasesData?.previous;
  const categories = categoriesData || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Disease Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search diseases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.category} value={cat.category} className="capitalize">
                    {cat.category} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Disease Grid */}
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
          ) : diseases.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No diseases found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {diseases.map((disease) => (
                  <DiseaseCard
                    key={disease.id}
                    disease={disease}
                    onClick={() => setSelectedDisease(disease)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalDiseases > 12 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 12 + 1} to {Math.min(page * 12, totalDiseases)} of{' '}
                    {totalDiseases} diseases
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

      {/* Disease Detail Dialog */}
      {selectedDisease && (
        <DiseaseDetailDialog
          disease={selectedDisease}
          open={!!selectedDisease}
          onClose={() => setSelectedDisease(null)}
        />
      )}
    </>
  );
}

// Disease Card Component
interface DiseaseCardProps {
  disease: Disease;
  onClick: () => void;
}

function DiseaseCard({ disease, onClick }: DiseaseCardProps) {
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

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold line-clamp-1 flex-1">{disease.name}</h4>
          <Badge className={getSeverityColor(disease.typical_severity)} variant="outline">
            {disease.typical_severity}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {disease.description}
        </p>
        <div className="space-y-1.5">
          <div className="text-xs">
            <span className="font-medium">Category:</span>
            <Badge variant="outline" className="ml-2 capitalize text-xs">
              {disease.category}
            </Badge>
          </div>
          <div className="text-xs">
            <span className="font-medium">Affects:</span>
            <span className="ml-2 text-muted-foreground">
              {disease.affected_crops?.slice(0, 3).join(', ')}
              {disease.affected_crops && disease.affected_crops.length > 3 && '...'}
            </span>
          </div>
          {disease.treatments_count > 0 && (
            <div className="text-xs">
              <span className="font-medium">Treatments:</span>
              <span className="ml-2 text-muted-foreground">
                {disease.treatments_count} available
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Disease Detail Dialog Component
interface DiseaseDetailDialogProps {
  disease: Disease;
  open: boolean;
  onClose: () => void;
}

function DiseaseDetailDialog({ disease, open, onClose }: DiseaseDetailDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{disease.name}</span>
            <Badge className={getSeverityColor(disease.typical_severity)} variant="outline">
              {disease.typical_severity} severity
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-sm italic">
            {disease.scientific_name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{disease.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Category
                </h4>
                <Badge variant="outline" className="capitalize">
                  {disease.category}
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  Spread Rate
                </h4>
                <Badge variant="outline" className="capitalize">
                  {disease.spread_rate}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Affected Crops</h4>
              <div className="flex flex-wrap gap-2">
                {disease.affected_crops?.map((crop, idx) => (
                  <Badge key={idx} variant="secondary" className="capitalize">
                    {crop}
                  </Badge>
                ))}
              </div>
            </div>

            {disease.common_names && disease.common_names.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Common Names</h4>
                <p className="text-sm text-muted-foreground">
                  {disease.common_names.join(', ')}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="symptoms" className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-2">Symptoms</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {disease.symptoms}
              </p>
            </div>

            {disease.visual_indicators && disease.visual_indicators.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Visual Indicators</h4>
                <ul className="space-y-2">
                  {disease.visual_indicators.map((indicator, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="conditions" className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Seasonal Pattern
              </h4>
              <p className="text-sm text-muted-foreground capitalize">
                {disease.seasonal_pattern}
              </p>
            </div>

            {disease.favorable_conditions && (
              <div>
                <h4 className="font-semibold mb-2">Favorable Conditions</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(disease.favorable_conditions).map(([key, value]) => (
                    <div key={key} className="p-3 bg-muted rounded-lg">
                      <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                      <span className="ml-2 text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="treatment" className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-2">Prevention Methods</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {disease.prevention_methods}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                Organic Treatments
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {disease.organic_treatments}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                Chemical Treatments
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {disease.chemical_treatments}
              </p>
            </div>

            {disease.treatments_count > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Info className="h-4 w-4 inline mr-2" />
                  {disease.treatments_count} detailed treatment plan(s) available
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* External Links */}
        {disease.external_links && disease.external_links.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold mb-2">External Resources</h4>
            <div className="flex flex-wrap gap-2">
              {disease.external_links.map((link, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Resource {idx + 1}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
