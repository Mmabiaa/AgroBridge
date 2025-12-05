import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Grid3x3, List, Tractor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FarmCard } from '@/components/organisms/FarmCard';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { Pagination } from '@/components/molecules/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useFarms } from '@/api/hooks/useFarms';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

export default function Farms() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [farmType, setFarmType] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('-created_at');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const pageSize = 12;

  // Debounce search term to avoid excessive API calls
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Fetch farms with filters
  const { data, isLoading, isError, error, refetch } = useFarms({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    farm_type: farmType || undefined,
    ordering: sortBy,
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page on search
  };

  const handleFarmTypeChange = (value: string) => {
    setFarmType(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewFarm = (farmId: string) => {
    navigate(`/farms/${farmId}`);
  };

  const handleCreateFarm = () => {
    navigate('/farms/new');
  };

  const handleEditFarm = (farmId: string) => {
    navigate(`/farms/${farmId}/edit`);
  };

  const handleDeleteFarm = (farmId: string) => {
    // TODO: Implement delete confirmation dialog
    console.log('Delete farm:', farmId);
  };

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Farms</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your agricultural operations
          </p>
        </div>
        <Button onClick={handleCreateFarm} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Add Farm
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search farms by name, location, or crops..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Farm Type Filter */}
        <Select value={farmType} onValueChange={handleFarmTypeChange}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="All Farm Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Farm Types</SelectItem>
            <SelectItem value="crop">Crop Farm</SelectItem>
            <SelectItem value="livestock">Livestock Farm</SelectItem>
            <SelectItem value="poultry">Poultry Farm</SelectItem>
            <SelectItem value="mixed">Mixed Farm</SelectItem>
            <SelectItem value="organic">Organic Farm</SelectItem>
            <SelectItem value="greenhouse">Greenhouse</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-created_at">Newest First</SelectItem>
            <SelectItem value="created_at">Oldest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="-name">Name (Z-A)</SelectItem>
            <SelectItem value="-size_hectares">Largest First</SelectItem>
            <SelectItem value="size_hectares">Smallest First</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      {data && !isLoading && (
        <div className="text-sm text-muted-foreground">
          Showing {data.results.length} of {data.count} farms
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div
          className={cn(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          )}
        >
          {Array.from({ length: pageSize }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <ErrorState
          title="Failed to load farms"
          message={error?.message || 'An error occurred while loading your farms'}
          onRetry={refetch}
        />
      )}

      {/* Empty State */}
      {!isLoading && !isError && data?.results.length === 0 && (
        <EmptyState
          icon={Tractor}
          title={searchTerm || farmType ? 'No farms found' : 'No farms yet'}
          description={
            searchTerm || farmType
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first farm'
          }
          action={{
            label: searchTerm || farmType ? 'Clear Filters' : 'Create Farm',
            onClick: searchTerm || farmType
              ? () => {
                  setSearchTerm('');
                  setFarmType('');
                }
              : handleCreateFarm,
          }}
        />
      )}

      {/* Farms Grid/List */}
      {!isLoading && !isError && data && data.results.length > 0 && (
        <>
          <div
            className={cn(
              'grid gap-6',
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            )}
          >
            {data.results.map((farm) => (
              <FarmCard
                key={farm.id}
                farm={{
                  id: farm.id,
                  name: farm.name,
                  description: farm.description,
                  area: farm.size_hectares,
                  area_unit: 'hectares',
                  location: {
                    latitude: farm.location?.coordinates?.latitude || 0,
                    longitude: farm.location?.coordinates?.longitude || 0,
                    address: farm.location?.address || '',
                  },
                  created_at: farm.created_at,
                  statistics: {
                    active_fields: 0, // TODO: Get from API
                    total_crops: farm.crops?.length || 0,
                    yield_this_season: 0, // TODO: Get from API
                  },
                }}
                onClick={handleViewFarm}
                onEdit={handleEditFarm}
                onDelete={handleDeleteFarm}
                showActions={true}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
