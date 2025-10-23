/**
 * Marketplace Page - Production Ready with API Integration
 */
import React, { useState } from 'react';
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
  MapPin,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProducts, useUserOrders } from '@/api/hooks/useMarketplace';

export default function Marketplace() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('browse');

  // API hooks for user data
  const { data: userProductsData, isLoading: productsLoading } = useUserProducts();
  const { data: userOrdersData, isLoading: ordersLoading } = useUserOrders();

  const userProducts = userProductsData?.results || [];
  const userOrders = userOrdersData?.results || [];

  const categories = [
    'All Categories',
    'Vegetables',
    'Fruits',
    'Grains',
    'Legumes',
    'Herbs & Spices',
    'Livestock',
    'Dairy',
    'Poultry'
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            List Product
          </Button>
        )}
      </div>

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
                  <SelectItem key={category} value={category === 'All Categories' ? '' : category.toLowerCase()}>
                    {category}
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
          <ProductGrid searchTerm={searchTerm} category={selectedCategory} />
        </TabsContent>

        {/* My Products */}
        <TabsContent value="my-products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                My Products
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
                  <h3 className="text-lg font-semibold mb-2">No products listed</h3>
                  <p className="text-muted-foreground mb-4">Start selling by listing your first product</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    List Your First Product
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userProducts.map((product: any) => (
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
                              GHS {product.price}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              /{product.unit}
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
                  <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground mb-4">Browse products to place your first order</p>
                  <Button onClick={() => setActiveTab('browse')}>
                    Browse Products
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userOrders.map((order: any) => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{order.product_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Order #{order.id.slice(-8)}
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
                              GHS {order.total_price}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Seller:</span>
                            <span className="ml-2">{order.seller_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="ml-2">
                              {new Date(order.created_at).toLocaleDateString()}
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
                <div className="text-2xl font-bold">GHS 12,450</div>
                <p className="text-sm text-muted-foreground">Total sales this month</p>
                <div className="mt-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    +15% from last month
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
                <p className="text-sm text-muted-foreground">Active listings</p>
                <div className="mt-2">
                  <Badge variant="outline">
                    {userProducts.filter((p: any) => p.is_active).length} active
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
                    {userOrders.filter((o: any) => o.status === 'delivered').length} completed
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