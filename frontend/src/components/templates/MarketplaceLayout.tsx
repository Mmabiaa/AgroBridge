import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SearchBar } from '@/components/molecules/SearchBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, SlidersHorizontal, X } from 'lucide-react';

interface MarketplaceLayoutProps {
  children?: React.ReactNode;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: MarketplaceFilters) => void;
  categories?: string[];
  priceRange?: [number, number];
}

export interface MarketplaceFilters {
  categories: string[];
  priceRange: [number, number];
  inStockOnly: boolean;
  sortBy: 'price-asc' | 'price-desc' | 'date-desc' | 'rating-desc';
}

const defaultFilters: MarketplaceFilters = {
  categories: [],
  priceRange: [0, 10000],
  inStockOnly: false,
  sortBy: 'date-desc',
};

export function MarketplaceLayout({
  children,
  onSearch,
  onFilterChange,
  categories = ['Vegetables', 'Fruits', 'Grains', 'Livestock', 'Equipment', 'Seeds'],
  priceRange = [0, 10000],
}: MarketplaceLayoutProps) {
  const [filters, setFilters] = useState<MarketplaceFilters>(defaultFilters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const handleFilterChange = (newFilters: Partial<MarketplaceFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    handleFilterChange({ categories: newCategories });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    onFilterChange?.(defaultFilters);
  };

  const activeFilterCount =
    filters.categories.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1] ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <Label
                htmlFor={`category-${category}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="space-y-4">
          <Slider
            min={priceRange[0]}
            max={priceRange[1]}
            step={100}
            value={filters.priceRange}
            onValueChange={(value) =>
              handleFilterChange({ priceRange: value as [number, number] })
            }
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>KES {filters.priceRange[0].toLocaleString()}</span>
            <span>KES {filters.priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stock Status */}
      <div>
        <h3 className="font-semibold mb-3">Availability</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={filters.inStockOnly}
            onCheckedChange={(checked) =>
              handleFilterChange({ inStockOnly: checked as boolean })
            }
          />
          <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">
            In Stock Only
          </Label>
        </div>
      </div>

      {/* Sort By */}
      <div>
        <h3 className="font-semibold mb-3">Sort By</h3>
        <div className="space-y-2">
          {[
            { value: 'date-desc', label: 'Newest First' },
            { value: 'price-asc', label: 'Price: Low to High' },
            { value: 'price-desc', label: 'Price: High to Low' },
            { value: 'rating-desc', label: 'Highest Rated' },
          ].map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`sort-${option.value}`}
                checked={filters.sortBy === option.value}
                onCheckedChange={() =>
                  handleFilterChange({ sortBy: option.value as MarketplaceFilters['sortBy'] })
                }
              />
              <Label
                htmlFor={`sort-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar
                placeholder="Search products..."
                onSearch={onSearch || (() => {})}
                debounceMs={300}
              />
            </div>

            {/* Mobile Filter Button */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden relative">
                  <SlidersHorizontal className="h-5 w-5" />
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.categories.map((category) => (
                <Badge key={category} variant="secondary" className="gap-1">
                  {category}
                  <button
                    onClick={() => handleCategoryToggle(category)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.inStockOnly && (
                <Badge variant="secondary" className="gap-1">
                  In Stock
                  <button
                    onClick={() => handleFilterChange({ inStockOnly: false })}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h2>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">{activeFilterCount}</Badge>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {children || <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
}
