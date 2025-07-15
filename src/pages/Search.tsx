
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, TrendingUp, Star, MapPin, Calendar } from 'lucide-react';

const recentSearches = [
  'Organic tomatoes',
  'Maize seeds',
  'Farming equipment',
  'Livestock feed'
];

const trendingSearches = [
  'Drought resistant crops',
  'Pest control methods',
  'Harvest machinery',
  'Soil testing kits'
];

const popularCategories = [
  { name: 'Vegetables', count: 1234, icon: '🥕' },
  { name: 'Fruits', count: 987, icon: '🍎' },
  { name: 'Grains', count: 756, icon: '🌾' },
  { name: 'Equipment', count: 543, icon: '🚜' },
  { name: 'Seeds', count: 432, icon: '🌱' },
  { name: 'Livestock', count: 321, icon: '🐄' }
];

export default function Search() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <SearchIcon className="h-8 w-8 text-primary" />
            Smart Search
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find exactly what you need with our advanced search and filtering system. 
            Connect with local farmers, discover quality products, and grow your agricultural network.
          </p>
        </div>

        {/* Advanced Search Component */}
        <AdvancedSearch />

        {/* Search Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Searches */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="h-5 w-5" />
                Recent Searches
              </CardTitle>
              <CardDescription>Your latest search queries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentSearches.map((search, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted/70 cursor-pointer transition-colors">
                  <span className="text-sm">{search}</span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.floor(Math.random() * 7) + 1}d ago
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Trending Searches */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending Now
              </CardTitle>
              <CardDescription>Popular searches in your area</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {trendingSearches.map((search, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted/70 cursor-pointer transition-colors">
                  <span className="text-sm">{search}</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600">{Math.floor(Math.random() * 50) + 10}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Popular Categories */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Popular Categories
              </CardTitle>
              <CardDescription>Browse by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {popularCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted/70 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {category.count}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Tips */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Search Tips</CardTitle>
            <CardDescription>Get better results with these helpful tips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Use specific keywords</h4>
                <p className="text-sm text-muted-foreground">
                  Try "organic tomato seeds" instead of just "tomatoes" for more relevant results.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Filter by location</h4>
                <p className="text-sm text-muted-foreground">
                  Set your location to find products and services in your area.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Use price ranges</h4>
                <p className="text-sm text-muted-foreground">
                  Set budget limits to find products within your price range.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Check delivery options</h4>
                <p className="text-sm text-muted-foreground">
                  Filter by delivery methods to find convenient shipping options.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
