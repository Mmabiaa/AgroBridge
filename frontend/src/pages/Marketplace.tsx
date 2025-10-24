/**
 * Marketplace Page - Production Ready with API Integration
 */
import { useState, useEffect } from 'react';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProducts, useUserOrders } from '@/api/hooks/useMarketplace';
import { toast } from 'sonner';
import { CreateProductModal } from '@/components/marketplace/CreateProductModal';
import type { Product, Order } from '@/types/basicTypes';

export default function Marketplace() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [retryCount, setRetryCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // API hooks for user data with enhanced error handling
  const { 
    data: userProductsData, 
    isLoading: productsLoading, 
    error: productsError,
    refetch: refetchProducts,
    isError: productsHasError
  } = useUserProducts();
  
  const { 
    data: userOrdersData, 
    isLoading: ordersLoading, 
    error: ordersError,
    refetch: refetchOrders,
    isError: ordersHasError
  } = useUserOrders();

  // Handle errors and provide fallback data
  useEffect(() => {
    if (productsError) {
      console.warn('Failed to load user products:', productsError);
      if (retryCount === 0) {
        toast.error('Failed to load your products', {
          description: 'Showing available data instead.',
          action: {
            label: 'Retry',
            onClick: () => {
              setRetryCount(prev => prev + 1);
              refetchProducts();
            }
          }
        });
      }
    }
    
    if (ordersError) {
      console.warn('Failed to load user orders:', ordersError);
      if (retryCount === 0) {
        toast.error('Failed to load your orders', {
          description: 'Showing available data instead.',
          action: {
            label: 'Retry',
            onClick: () => {
              setRetryCount(prev => prev + 1);
              refetchOrders();
            }
          }
        });
      }
    }
  }, [productsError, ordersError, refetchProducts, refetchOrders, retryCount]);

  // Use data with fallback to empty array if error occurs
  const userProducts: Product[] = (productsHasError ? { results: [] } : userProductsData)?.results || [];
  const userOrders: Order[] = (ordersHasError ? { results: [] } : userOrdersData)?.results || [];

  const categories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Vegetables', value: 'vegetables' },
    { label: 'Fruits', value: 'fruits' },
    { label: 'Grains', value: 'grains' },
    { label: 'Legumes', value: 'legumes' },
    { label: 'Herbs & Spices', value: 'herbs-spices' },
    { label: 'Livestock', value: 'livestock' },
    { label: 'Dairy', value: 'dairy' },
    { label: 'Poultry', value: 'poultry' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'confirmed': return <CheckCircle className="h-3 w-3" />;
      case 'shipped': return <Package className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetchProducts();
    refetchOrders();
  };

  // Show error state if both API calls fail after multiple retries
  if ((productsHasError && ordersHasError) && retryCount > 2) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Unable to load marketplace</h3>
          <p className="text-muted-foreground mb-4">
            There seems to be a connection issue with the marketplace service.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            Connect with farmers and buyers across Ghana
          </p>
        </div>
        
        {user?.permissions?.includes('create_product') && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            List Product
          </Button>
        )}
      </div>

      {/* Create Product Modal */}
      <CreateProductModal 
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          refetchProducts();
        }}
      />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, farmers, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Error Banner */}
      {(productsHasError || ordersHasError) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Some data may not be loading correctly. 
                  {productsHasError && ' Products data unavailable. '}
                  {ordersHasError && ' Orders data unavailable.'}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="my-products">My Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Browse Products */}
        <TabsContent value="browse" className="space-y-6">
          <ProductGrid searchTerm={searchTerm} category={selectedCategory === 'all' ? '' : selectedCategory} />
        </TabsContent>

        {/* My Products */}
        <TabsContent value="my-products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                My Products
                {productsHasError && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    Limited Data
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : userProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {productsHasError ? 'Unable to load products' : 'No products listed'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {productsHasError 
                      ? 'There was an issue loading your products.' 
                      : 'Start selling by listing your first product'
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      List Product
                    </Button>
                    {productsHasError && (
                      <Button variant="outline" onClick={handleRetry}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userProducts.map((product: Product) => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold line-clamp-1">{product.name}</h4>
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-primary">
                              GHS {product.price_per_unit}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              /{product.unit_type}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {product.quantity_available} available
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                My Orders
                {ordersHasError && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    Limited Data
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="h-12 w-12 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : userOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {ordersHasError ? 'Unable to load orders' : 'No orders yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {ordersHasError 
                      ? 'There was an issue loading your orders.' 
                      : 'Browse products to place your first order'
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setActiveTab('browse')}>
                      Browse Products
                    </Button>
                    {ordersHasError && (
                      <Button variant="outline" onClick={handleRetry}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {userOrders.map((order: Order) => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{order.product_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Order #{order.id?.slice(-8) || 'N/A'}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="ml-2 font-medium">
                              {order.quantity} {order.unit || 'units'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span>
                            <span className="ml-2 font-medium">
                              GHS {order.total_price || order.total_amount}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Seller:</span>
                            <span className="ml-2">{order.seller_name || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="ml-2">
                              {order.created_at 
                                ? new Date(order.created_at).toLocaleDateString()
                                : 'Unknown date'
                              }
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sales Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">GHS {userOrders.reduce((sum: number, order: Order) => sum + (order.total_price || 0), 0).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total sales</p>
                <div className="mt-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {userOrders.length} orders
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userProducts.length}</div>
                <p className="text-sm text-muted-foreground">Your listings</p>
                <div className="mt-2">
                  <Badge variant="outline">
                    {userProducts.filter((p: Product) => p.is_active).length} active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userOrders.length}</div>
                <p className="text-sm text-muted-foreground">Total orders</p>
                <div className="mt-2">
                  <Badge variant="outline">
                    {userOrders.filter((o: Order) => o.status === 'delivered' || o.status === 'completed').length} completed
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}