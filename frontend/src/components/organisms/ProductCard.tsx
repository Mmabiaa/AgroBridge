import React from 'react';
import { ShoppingCart, Heart, MapPin, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  unit: string;
  quantity_available: number;
  images: Array<{ url: string; is_primary: boolean }>;
  seller: {
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  location?: {
    address?: string;
  };
  rating?: number;
  reviews_count?: number;
  is_active: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onFavorite?: (productId: string) => void;
  onClick?: (productId: string) => void;
  showActions?: boolean;
  isFavorited?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  onAddToCart,
  onFavorite,
  onClick,
  showActions = true,
  isFavorited = false,
  className,
}: ProductCardProps) {
  const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];
  const isOutOfStock = product.quantity_available === 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick(product.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart && !isOutOfStock) {
      onAddToCart(product.id);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(product.id);
    }
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-lg',
        onClick && 'cursor-pointer',
        !product.is_active && 'opacity-60',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        {/* Favorite Button */}
        {showActions && onFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background',
              isFavorited && 'text-red-500'
            )}
            onClick={handleFavorite}
          >
            <Heart className={cn('h-5 w-5', isFavorited && 'fill-current')} />
          </Button>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock && (
            <Badge variant="destructive">Out of Stock</Badge>
          )}
          {!product.is_active && (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        {/* Product Name */}
        <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">
            {product.currency} {product.price.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            / {product.unit}
          </span>
        </div>

        {/* Rating */}
        {product.rating !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
            {product.reviews_count !== undefined && (
              <span className="text-sm text-muted-foreground">
                ({product.reviews_count})
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {product.location?.address && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{product.location.address}</span>
          </div>
        )}

        {/* Seller */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={product.seller.avatar} />
            <AvatarFallback className="text-xs">
              {product.seller.first_name[0]}{product.seller.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {product.seller.first_name} {product.seller.last_name}
          </span>
        </div>

        {/* Quantity Available */}
        <div className="text-sm">
          <span className={cn(
            'font-medium',
            isOutOfStock ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {product.quantity_available} {product.unit} available
          </span>
        </div>
      </CardContent>

      {/* Actions */}
      {showActions && onAddToCart && (
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={isOutOfStock || !product.is_active}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
