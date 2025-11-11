import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ShoppingCart,
  Heart,
  MapPin,
  Search,
  Grid,
  List,
  Plus,
  Image as ImageIcon,
  User,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Trash2,
  Edit
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CreateProductModal } from '@/components/marketplace/CreateProductModal';
import apiClient from '@/api/axiosClient';

// API helpers (legacy fetches kept minimal)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const fetchProducts = async (search = '', category = '', token = null) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'all') params.append('category', category);
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/marketplace/products/?${params}`, {
      headers,
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

const fetchUserProducts = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/marketplace/products/my-products/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch user products');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user products:', error);
    throw error;
  }
};

const fetchUserOrders = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/marketplace/my-orders/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch user orders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

const deleteProduct = async (productId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/marketplace/products/${productId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Product Grid Component
const ProductGrid = ({ searchTerm = '', category = '', onDeleteProduct, refreshKey = 0 }) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Public listing does not require auth token
      const data = await fetchProducts(localSearch, category, null);
      setProducts(data.results || data || []);
    } catch (err) {
      setError('Failed to load products');
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [localSearch, category, refreshKey]);

  const getProductImageUrl = (product) => {
    if (!product.images || product.images.length === 0) {
      return null;
    }

    const firstImage = product.images[0];
    
    if (typeof firstImage === 'string') {
      return normalizeImageUrl(firstImage);
    } else if (firstImage?.image) {
      return normalizeImageUrl(firstImage.image);
    } else if (firstImage?.url) {
      return normalizeImageUrl(firstImage.url);
    } else if (firstImage?.image_url) {
      return normalizeImageUrl(firstImage.image_url);
    } else if (firstImage?.file) {
      return normalizeImageUrl(firstImage.file);
    }
    
    return null;
  };
  
  const normalizeImageUrl = (url) => {
    if (!url) return null;
    // If backend returns relative path, prefix with server origin (strip trailing slash)
    if (url.startsWith('/')) {
      const base = API_BASE_URL.replace(/\/api\/?v?1?\/?$/, '').replace(/\/$/, '');
      return `${base}${url}`;
    }
    return url;
  };

  const isProductOwner = (product) => {
    return product.seller && product.seller.id === user?.id;
  };

  const getSellerName = (product) => {
    if (isProductOwner(product)) {
      return 'You';
    }
    return product.seller?.business_name || product.seller?.username || 'Seller';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(price);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(localSearch.toLowerCase()) ||
    product.description.toLowerCase().includes(localSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold mb-2">Failed to load products</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadProducts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and View Controls */}
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
        {filteredProducts.map((product) => {
          const imageUrl = getProductImageUrl(product);
          const isOwner = isProductOwner(product);
          
          return (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="h-48 bg-gray-100 rounded-t-lg overflow-hidden relative">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.fallback-image');
                        if (fallback) fallback.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                
                {/* Fallback placeholder */}
                <div className={`fallback-image absolute inset-0 w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex flex-col items-center justify-center text-green-600 ${imageUrl ? 'hidden' : ''}`}>
                  <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                  <span className="text-sm opacity-70">No Image</span>
                </div>

                {/* Owner Badge */}
                {isOwner && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="default" className="text-xs bg-blue-500">
                      <User className="h-3 w-3 mr-1" />
                      Your Product
                    </Badge>
                  </div>
                )}

                {/* Organic Badge */}
                {product.organic_certified && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Organic
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </div>
                  {!isOwner && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                      <Heart className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{product.location?.city || 'Unknown'}</span>
                  <span>•</span>
                  <span className={isOwner ? "text-blue-600 font-medium" : ""}>
                    {getSellerName(product)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(product.price_per_unit)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        per {product.unit_type}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={product.quantity_available > 0 ? 'default' : 'secondary'}>
                        {product.quantity_available > 0
                          ? `${product.quantity_available} available`
                          : 'Out of stock'
                        }
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {product.quality_grade && (
                      <Badge variant="outline" className="text-xs">
                        Grade {product.quality_grade.replace('_', ' ')}
                      </Badge>
                    )}
                    {product.delivery_available && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        Delivery
                      </Badge>
                    )}
                    {product.pickup_available && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                        Pickup
                      </Badge>
                    )}
                  </div>

                  {isOwner ? (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" 
                        size="sm"
                        onClick={() => onDeleteProduct(product)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={product.quantity_available === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Order Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </div>
  );
};

// Main Marketplace Component
export default function Marketplace() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [productToDelete, setProductToDelete] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState({
    products: false,
    orders: false
  });
  const [error, setError] = useState({
    products: null,
    orders: null
  });

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

  const loadUserProducts = async () => {
    const token = apiClient.getAccessToken();
    if (!user || !token) return;
    
    try {
      setLoading(prev => ({ ...prev, products: true }));
      setError(prev => ({ ...prev, products: null }));
      const data = await fetchUserProducts(token);
      setUserProducts(data.results || data || []);
    } catch (err) {
      setError(prev => ({ ...prev, products: 'Failed to load your products' }));
      toast.error('Failed to load your products');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const loadUserOrders = async () => {
    const token = apiClient.getAccessToken();
    if (!user || !token) return;
    
    try {
      setLoading(prev => ({ ...prev, orders: true }));
      setError(prev => ({ ...prev, orders: null }));
      const data = await fetchUserOrders(token);
      setUserOrders(data.results || data || []);
    } catch (err) {
      setError(prev => ({ ...prev, orders: 'Failed to load your orders' }));
      toast.error('Failed to load your orders');
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  useEffect(() => {
    if (activeTab === 'my-products') {
      loadUserProducts();
    } else if (activeTab === 'orders') {
      loadUserOrders();
    }
  }, [activeTab, user]);

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const token = apiClient.getAccessToken();
    if (!token) {
      toast.error('Please sign in to delete your product.');
      return;
    }
    try {
      await deleteProduct(productToDelete.id, token);
      
      // Update local state
      setUserProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      // Refresh browse list
      setRefreshKey(prev => prev + 1);
      
      toast.success('Product deleted successfully!');
      setProductToDelete(null);
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const canCreateProduct = !!user && (
    user.role === 'farmer' ||
    user.permissions?.includes('create_product')
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
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
        
        {canCreateProduct && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
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
          <ProductGrid 
            searchTerm={searchTerm} 
            category={selectedCategory} 
            onDeleteProduct={handleDeleteProduct}
            refreshKey={refreshKey}
          />
        </TabsContent>

        {/* My Products */}
        <TabsContent value="my-products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                My Products
                {error.products && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    Error
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.products ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : !user ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Sign in required</h3>
                  <p className="text-muted-foreground">
                    Please sign in to view your products
                  </p>
                </div>
              ) : userProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {error.products ? 'Unable to load products' : 'No products listed'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {error.products 
                      ? 'There was an issue loading your products.' 
                      : 'Start selling by listing your first product'
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    {canCreateProduct && (
                      <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        List Product
                      </Button>
                    )}
                    {error.products && (
                      <Button variant="outline" onClick={loadUserProducts}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userProducts.map((product) => (
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
                        <div className="flex items-center justify-between mb-3">
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
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" 
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                My Orders
                {error.orders && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    Error
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.orders ? (
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
              ) : !user ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Sign in required</h3>
                  <p className="text-muted-foreground">
                    Please sign in to view your orders
                  </p>
                </div>
              ) : userOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {error.orders ? 'Unable to load orders' : 'No orders yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {error.orders 
                      ? 'There was an issue loading your orders.' 
                      : 'Browse products to place your first order'
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setActiveTab('browse')}>
                      Browse Products
                    </Button>
                    {error.orders && (
                      <Button variant="outline" onClick={loadUserOrders}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {userOrders.map((order) => (
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sales Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  GHS {userOrders.reduce((sum, order) => sum + (order.total_price || 0), 0).toLocaleString()}
                </div>
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
                    {userProducts.filter(p => p.is_active).length} active
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
                    {userOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length} completed
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{productToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          // Close modal, switch to browse, and refresh product grid so new product + image show
          setActiveTab('browse');
          setRefreshKey(prev => prev + 1);
          // Also refresh "My Products" if currently on that tab
          if (activeTab === 'my-products') {
            loadUserProducts();
          }
        }}
      />
    </div>
  );
}