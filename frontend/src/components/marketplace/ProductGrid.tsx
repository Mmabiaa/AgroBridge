/**
 * Product Grid Component using API hooks
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    ShoppingCart,
    Heart,
    MapPin,
    Search,
    Grid,
    List,
    Plus,
    Image as ImageIcon,
    User
} from 'lucide-react';
import { useProducts, useCreateOrder } from '@/api/hooks/useMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { Product, OrderCreateData } from '@/types/basicTypes';
import apiClient from '@/api/axiosClient';

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

    // Check if current user is the product seller
    const isProductOwner = (product: Product) => {
        return user && product.seller && (
            product.seller.id === user.id || 
            product.seller.username === user.username
        );
    };

    const handleOrder = async (product: Product) => {
        createOrderMutation.setPending(true);
        try {
            const response = await apiClient.post('/api/orders/', {
                product_id: product.id,
                quantity: 1,
            });
            console.log('Order created:', response.data);
            // Update local state logic here to reflect the new order
        } catch (error) {
            console.error('Error creating order:', error);
            // Show specific error message
        } finally {
            createOrderMutation.setPending(false);
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

    // Function to get the correct image URL
    const getProductImageUrl = (product: Product) => {
        if (!product.images || product.images.length === 0) {
            return null;
        }

        // Handle different image data structures
        const firstImage = product.images[0];
        
        if (typeof firstImage === 'string') {
            // If it's a direct URL string
            return firstImage;
        } else if (firstImage?.image) {
            // If it's an object with image property
            return firstImage.image;
        } else if (firstImage?.url) {
            // If it's an object with url property
            return firstImage.url;
        }
        
        return null;
    };

    // Get seller display name
    const getSellerName = (product: Product) => {
        if (isProductOwner(product)) {
            return 'You';
        }
        return product.seller?.business_name || product.seller?.username || 'Seller';
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
                {user?.permissions?.includes('create_product') && (
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
                {products.map((product) => {
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
                                            // Fallback if image fails to load
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex flex-col items-center justify-center text-green-600">
                                        <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                                        <span className="text-sm opacity-70">No Image</span>
                                    </div>
                                )}
                                
                                {/* Fallback placeholder - hidden by default */}
                                <div className={`hidden w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex flex-col items-center justify-center text-green-600 ${!imageUrl ? '!flex' : ''}`}>
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

                                {/* Quality Grade Badge */}
                                {product.quality_grade && (
                                    <div className={`absolute top-2 ${isOwner ? 'left-20' : 'left-2'}`}>
                                        <Badge variant="secondary" className="text-xs">
                                            {product.quality_grade.replace('_', ' ').toUpperCase()}
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
                                    <span>{formatDistance(product.location)}</span>
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
                                                    ? `${product.quantity_available} ${product.unit_type} available`
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
                                        {product.organic_certified && (
                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                                Organic
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
                                        <div className="text-center py-2">
                                            <Badge variant="outline" className="text-sm text-muted-foreground">
                                                This is your product
                                            </Badge>
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full"
                                            disabled={
                                                product.quantity_available === 0 || 
                                                createOrderMutation.isPending ||
                                                !user
                                            }
                                            onClick={() => {
                                                handleOrder(product);
                                            }}
                                        >
                                            {!user ? (
                                                <>
                                                    <User className="h-4 w-4 mr-2" />
                                                    Login to Order
                                                </>
                                            ) : createOrderMutation.isPending ? (
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
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
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