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

// Mock data and hooks (replace with your actual implementations)
const mockProducts = [
  {
    id: '1',
    name: 'Fresh Tomatoes',
    description: 'Organic vine-ripened tomatoes',
    price_per_unit: 15.50,
    unit_type: 'kg',
    quantity_available: 100,
    quality_grade: 'grade_a',
    organic_certified: true,
    delivery_available: true,
    pickup_available: true,
    is_active: true,
    images: ['https://images.unsplash.com/photo-1546470427-227a87e3e2c6?w=400'],
    seller: { id: 'user1', username: 'FarmFresh', business_name: 'Farm Fresh Produce' },
    location: { city: 'Accra' }
  },
  {
    id: '2',
    name: 'Sweet Corn',
    description: 'Fresh yellow corn',
    price_per_unit: 8.00,
    unit_type: 'dozen',
    quantity_available: 50,
    quality_grade: 'grade_b',
    organic_certified: false,
    delivery_available: true,
    pickup_available: false,
    is_active: true,
    images: [{ image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400' }],
    seller: { id: 'user2', username: 'CornKing', business_name: 'Corn King Farms' },
    location: { city: 'Kumasi' }
  }
];

const mockUser = {
  id: 'user1',
  username: 'FarmFresh',
  email: 'farm@example.com',
  role: 'farmer',
  permissions: ['create_product', 'delete_product']
};

// Product Grid Component
const ProductGrid = ({ searchTerm = '', category = '', onDeleteProduct }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [products] = useState(mockProducts);

  const getProductImageUrl = (product) => {
    if (!product.images || product.images.length === 0) {
      return null;
    }

    const firstImage = product.images[0];
    
    if (typeof firstImage === 'string') {
      return firstImage;
    } else if (firstImage?.image) {
      return firstImage.image;
    } else if (firstImage?.url) {
      return firstImage.url;
    }
    
    return null;
  };

  const isProductOwner = (product) => {
    return product.seller && product.seller.id === mockUser.id;
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
    </div>
  );
};

// Main Marketplace Component
export default function Marketplace() {
  const [activeTab, setActiveTab] = useState('browse');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [userProducts, setUserProducts] = useState(mockProducts.filter(p => p.seller.id === mockUser.id));

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      // Here you would call your API to delete the product
      console.log('Deleting product:', productToDelete.id);
      
      // Update local state
      setUserProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      
      // Show success message
      alert('Product deleted successfully!');
      
      setProductToDelete(null);
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
        
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

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
          <ProductGrid onDeleteProduct={handleDeleteProduct} />
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
              {userProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No products listed</h3>
                  <p className="text-muted-foreground mb-4">
                    Start selling by listing your first product
                  </p>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    List Product
                  </Button>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground">
                  Browse products to place your first order
                </p>
              </div>
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
                <div className="text-2xl font-bold">GHS 0</div>
                <p className="text-sm text-muted-foreground">Total sales</p>
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
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Total orders</p>
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
    </div>
  );
}