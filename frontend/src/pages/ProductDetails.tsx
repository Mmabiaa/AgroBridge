import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Heart,
  MapPin,
  Package,
  Truck,
  Star,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Share2,
  MessageCircle
} from 'lucide-react';
import { useProduct } from '@/api/hooks/useMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { OrderButton } from '@/components/marketplace/OrderButton';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch product details
  const { data: product, isLoading, isError, error } = useProduct(id || '', !!id);

  const normalizeImageUrl = (url: string): string | null => {
    if (!url) return null;
    if (url.startsWith('/')) {
      const base = API_BASE_URL.replace(/\/api\/?v?1?\/?$/, '').replace(/\/$/, '');
      return `${base}${url}`;
    }
    return url;
  };

  const getProductImages = () => {
    if (!product?.images || product.images.length === 0) {
      return [];
    }

    return product.images.map((img: any) => {
      if (typeof img === 'string') {
        return normalizeImageUrl(img);
      } else if (img?.image) {
        return normalizeImageUrl(img.image);
      } else if (img?.url) {
        return normalizeImageUrl(img.url);
      } else if (img?.image_url) {
        return normalizeImageUrl(img.image_url);
      } else if (img?.file) {
        return normalizeImageUrl(img.file);
      }
      return null;
    }).filter(Boolean);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      }).catch(() => {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const isOwner = product?.seller && product.seller.id === user?.id;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Product not found</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'The product you are looking for does not exist'}
          </p>
          <Button onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const images = getProductImages();
  const currentImage = images[selectedImage] || null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/marketplace')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Marketplace
      </Button>

      {/* Product Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <Card className="overflow-hidden">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
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
              <div className={`fallback-image w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex flex-col items-center justify-center text-green-600 ${currentImage ? 'hidden' : ''}`}>
                <Package className="h-24 w-24 mb-4 opacity-50" />
                <span className="text-lg opacity-70">No Image Available</span>
              </div>
            </div>
          </Card>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img || ''}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {typeof product.location === 'string'
                      ? product.location
                      : (product.location && typeof product.location === 'object' && 'city' in product.location)
                        ? product.location.city || 'Unknown'
                        : 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFavorite}
                  className={isFavorite ? 'text-red-500' : ''}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.organic && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Organic
                </Badge>
              )}
              {product.quality_grade && (
                <Badge variant="outline">
                  Grade {product.quality_grade.replace('_', ' ')}
                </Badge>
              )}
              {product.delivery_available && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Truck className="h-3 w-3 mr-1" />
                  Delivery Available
                </Badge>
              )}
              {product.pickup_available && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  <Package className="h-3 w-3 mr-1" />
                  Pickup Available
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="text-4xl font-bold text-primary mb-1">
                {formatPrice(product.price_per_unit)}
              </div>
              <div className="text-muted-foreground">
                per {product.unit_type}
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2 mb-6">
              {product.quantity_available > 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">
                    {product.quantity_available} {product.unit_type}s available
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-600">Out of stock</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isOwner && product.quantity_available > 0 && (
                <OrderButton
                  productId={product.id}
                  productName={product.name}
                  price={product.price_per_unit}
                  availableQuantity={product.quantity_available}
                  onOrderSuccess={(order) => {
                    console.log('Order placed successfully:', order);
                  }}
                  onOrderError={(error) => {
                    console.error('Order failed:', error);
                  }}
                />
              )}

              {isOwner && (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => navigate(`/marketplace/products/${product.id}/edit`)}>
                    Edit Product
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Analytics
                  </Button>
                </div>
              )}

              <Button variant="outline" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Seller
              </Button>
            </div>
          </div>

          <Separator />

          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">
                  {product.seller?.business_name || product.seller?.username || 'Unknown Seller'}
                </span>
              </div>
              {product.seller?.email && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{product.seller.email}</span>
                </div>
              )}
              {product.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Listed:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(product.created_at)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Card>
        <Tabs defaultValue="description" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="description" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Product Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground">
                  Be the first to review this product
                </p>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Product ID:</span>
                  <p className="font-medium">{product.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium capitalize">{product.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit Type:</span>
                  <p className="font-medium">{product.unit_type}</p>
                </div>
                {product.quality_grade && (
                  <div>
                    <span className="text-muted-foreground">Quality Grade:</span>
                    <p className="font-medium">{product.quality_grade.replace('_', ' ')}</p>
                  </div>
                )}
                {product.view_count !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Views:</span>
                    <p className="font-medium">{product.view_count}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
