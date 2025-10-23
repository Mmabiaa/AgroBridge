/**
 * Product Grid Component using API hooks
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  Heart, 
  MapPin, 
  Star, 
  Search,
  Filter,
  Grid,
  List,
  Plus
} from 'lucide-react';
import { useProducts, useCreateOrder } from '@/api/hooks/useMarketplace';
import { useAuth } from '@/contexts/AuthContext';

interface ProductGridProps {
  searchTerm?: string;
  category?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ searchTerm, category }) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearch, setLocalSearch] = useState(searchTerm || '');
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  
  // API hooks
  const { 
    data: productsData, 
    isLoading, 
    error,
    refetch 
  } = useProducts({
    search: localSearch,
    category: selectedCategory,
    page: 1,
    page_size: 12,
  });

  const createOrderMutation = useCreateOrder();

  const products = productsData?.results || [];

  const handleOrder = async (product: any) => {
    if (!user) return;
    
    try {
      await createOrderMutation.mutateAsync({
        product: product.id,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
        delivery_address: {
          address: '123 Main St',
          city: 'Accra',
          state: 'Greater Accra',
          coordinates: { latitude: 5.6037, longitude: -0.1870 }
        },
        payment_method: 'mobile_money',
        notes: `Order for ${product.name}`,
      });
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  const formatPrice = (price: number, currency = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDistance = (location: any) => {
    // Mock distance calculation
    return `${Math.floor(Math.random() * 50) + 1} km away`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <ShoppingCart className="h-12 w-12 mx-auto opacity-50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Failed to load products</h3>
        <p className="text-muted-foreground mb-4">There was an error loading the marketplace</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground mb-4">
          {localSearch || selectedCategory 
            ? 'Try adjusting your search or filters' 
            : 'Be the first to list a product!'}
        </p>
        {user?.hasPermission?.('create_product') && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            List Your Product
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className={viewMode === 'grid' 
        ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "space-y-4"
      }>
        {products.map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow">
            {product.images && product.images.length > 0 ? (
              <div className="h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-t-lg flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-green-600 opacity-50" />
              </div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{formatDistance(product.location)}</span>
                <span>•</span>
                <span>{product.seller_name}</span>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {product.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={product.quantity_available > 0 ? 'default' : 'secondary'}>
                      {product.quantity_available > 0 
                        ? `${product.quantity_available} ${product.unit} available`
                        : 'Out of stock'
                      }
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Grade {product.quality_grade}
                  </Badge>
                  {product.organic_certified && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      Organic
                    </Badge>
                  )}
                </div>
                
                <Button 
                  className="w-full" 
                  disabled={product.quantity_available === 0 || createOrderMutation.isPending}
                  onClick={() => handleOrder(product)}
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Ordering...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Order Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Load More */}
      {productsData?.next && (
        <div className="text-center">
          <Button variant="outline">
            Load More Products
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;