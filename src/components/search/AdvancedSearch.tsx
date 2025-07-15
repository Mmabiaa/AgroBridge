
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  MapPin, 
  Calendar,
  DollarSign,
  Star,
  Leaf,
  Truck,
  X
} from 'lucide-react';

interface SearchFilters {
  query: string;
  category: string;
  location: string;
  priceRange: [number, number];
  isOrganic: boolean;
  rating: number;
  deliveryOptions: string[];
  harvestDateRange: string;
  sortBy: string;
}

const categories = [
  'All Categories',
  'Vegetables',
  'Fruits',
  'Grains',
  'Livestock',
  'Dairy',
  'Equipment',
  'Seeds'
];

const locations = [
  'All Locations',
  'Kumasi',
  'Accra',
  'Tamale',
  'Sunyani',
  'Cape Coast',
  'Takoradi'
];

const deliveryOptions = [
  'Pickup Available',
  'Local Delivery',
  'Regional Shipping',
  'Nationwide Shipping'
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'distance', label: 'Nearest First' }
];

export function AdvancedSearch() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'All Categories',
    location: 'All Locations',
    priceRange: [0, 1000],
    isOrganic: false,
    rating: 0,
    deliveryOptions: [],
    harvestDateRange: 'any',
    sortBy: 'relevance'
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const active: string[] = [];
    
    if (filters.category !== 'All Categories') active.push(`Category: ${filters.category}`);
    if (filters.location !== 'All Locations') active.push(`Location: ${filters.location}`);
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
      active.push(`Price: ₦${filters.priceRange[0]} - ₦${filters.priceRange[1]}`);
    }
    if (filters.isOrganic) active.push('Organic Only');
    if (filters.rating > 0) active.push(`Rating: ${filters.rating}+ stars`);
    if (filters.deliveryOptions.length > 0) {
      active.push(`Delivery: ${filters.deliveryOptions.join(', ')}`);
    }
    if (filters.harvestDateRange !== 'any') active.push(`Harvest: ${filters.harvestDateRange}`);
    
    setActiveFilters(active);
  };

  const clearFilter = (filterText: string) => {
    if (filterText.startsWith('Category:')) {
      setFilters(prev => ({ ...prev, category: 'All Categories' }));
    } else if (filterText.startsWith('Location:')) {
      setFilters(prev => ({ ...prev, location: 'All Locations' }));
    } else if (filterText.startsWith('Price:')) {
      setFilters(prev => ({ ...prev, priceRange: [0, 1000] }));
    } else if (filterText === 'Organic Only') {
      setFilters(prev => ({ ...prev, isOrganic: false }));
    } else if (filterText.startsWith('Rating:')) {
      setFilters(prev => ({ ...prev, rating: 0 }));
    } else if (filterText.startsWith('Delivery:')) {
      setFilters(prev => ({ ...prev, deliveryOptions: [] }));
    } else if (filterText.startsWith('Harvest:')) {
      setFilters(prev => ({ ...prev, harvestDateRange: 'any' }));
    }
    updateActiveFilters();
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      category: 'All Categories',
      location: 'All Locations',
      priceRange: [0, 1000],
      isOrganic: false,
      rating: 0,
      deliveryOptions: [],
      harvestDateRange: 'any',
      sortBy: 'relevance'
    });
    setActiveFilters([]);
  };

  const handleSearch = () => {
    console.log('Searching with filters:', filters);
    // Implement search logic here
  };

  const handleDeliveryOptionChange = (option: string, checked: boolean) => {
    if (checked) {
      setFilters(prev => ({
        ...prev,
        deliveryOptions: [...prev.deliveryOptions, option]
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        deliveryOptions: prev.deliveryOptions.filter(opt => opt !== option)
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Search Bar */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search for products, farmers, or categories..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="pl-10 text-lg h-12"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6"
            >
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filters
            </Button>
            
            <Button onClick={handleSearch} className="h-12 px-8">
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {filter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => clearFilter(filter)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Category
                </label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Price Range */}
            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range: ₦{filters.priceRange[0]} - ₦{filters.priceRange[1]}
              </label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => handleFilterChange('priceRange', value)}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Rating Filter */}
            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Minimum Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={filters.rating >= rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange('rating', rating)}
                    className="flex items-center gap-1"
                  >
                    <Star className="h-4 w-4" />
                    {rating}+
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Additional Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="organic"
                  checked={filters.isOrganic}
                  onCheckedChange={(checked) => handleFilterChange('isOrganic', checked)}
                />
                <label htmlFor="organic" className="text-sm font-medium flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Organic Products Only
                </label>
              </div>
            </div>

            <Separator />

            {/* Delivery Options */}
            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery Options
              </label>
              <div className="grid grid-cols-2 gap-2">
                {deliveryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={filters.deliveryOptions.includes(option)}
                      onCheckedChange={(checked) => handleDeliveryOptionChange(option, !!checked)}
                    />
                    <label htmlFor={option} className="text-sm">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Harvest Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Harvest Date
              </label>
              <Select value={filters.harvestDateRange} onValueChange={(value) => handleFilterChange('harvestDateRange', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
