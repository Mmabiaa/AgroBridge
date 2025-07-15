
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Filter,
  MapPin,
  Star,
  Phone,
  Clock,
  Truck
} from 'lucide-react';
import { getProducts } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  farmer: string;
  location: string;
  price: number;
  previousPrice: number;
  unit: string;
  quantity: number;
  rating: number;
  image: string;
  category: string;
  isOrganic: boolean;
  harvestDate: string;
  deliveryOptions: string[];
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Fresh Tomatoes',
    farmer: 'John Asante',
    location: 'Kumasi, Ghana',
    price: 450,
    previousPrice: 420,
    unit: 'kg',
    quantity: 500,
    rating: 4.8,
    image: '/placeholder.svg',
    category: 'Vegetables',
    isOrganic: true,
    harvestDate: '2024-01-15',
    deliveryOptions: ['Pickup', 'Local Delivery']
  },
  {
    id: '2',
    name: 'Red Onions',
    farmer: 'Fatima Ibrahim',
    location: 'Tamale, Ghana',
    price: 280,
    previousPrice: 300,
    unit: 'kg',
    quantity: 200,
    rating: 4.6,
    image: '/placeholder.svg',
    category: 'Vegetables',
    isOrganic: false,
    harvestDate: '2024-01-12',
    deliveryOptions: ['Pickup', 'Regional Shipping']
  },
  {
    id: '3',
    name: 'Organic Maize',
    farmer: 'Samuel Oseh',
    location: 'Sunyani, Ghana',
    price: 320,
    previousPrice: 325,
    unit: 'kg',
    quantity: 1000,
    rating: 4.9,
    image: '/placeholder.svg',
    category: 'Grains',
    isOrganic: true,
    harvestDate: '2024-01-10',
    deliveryOptions: ['Pickup', 'Nationwide Shipping']
  }
];

export function LiveMarketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceUpdates, setPriceUpdates] = useState<{ [key: string]: number }>({});

  // Simulate real-time price updates
  useEffect(() => {
    getProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.farmer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || product.location.includes(selectedLocation);
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
      default:
        return new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime();
    }
  });

  const getPriceTrend = (product: Product) => {
    if (product.price > product.previousPrice) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (product.price < product.previousPrice) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const startChat = (farmerId: string, farmerName: string) => {
    // This would open a chat interface
    console.log(`Starting chat with ${farmerName} (${farmerId})`);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Live Marketplace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products or farmers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Vegetables">Vegetables</SelectItem>
                <SelectItem value="Fruits">Fruits</SelectItem>
                <SelectItem value="Grains">Grains</SelectItem>
                <SelectItem value="Livestock">Livestock</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Kumasi">Kumasi</SelectItem>
                <SelectItem value="Tamale">Tamale</SelectItem>
                <SelectItem value="Sunyani">Sunyani</SelectItem>
                <SelectItem value="Accra">Accra</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProducts.map((product) => (
          <Card key={product.id} className="shadow-soft hover:shadow-strong transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.isOrganic && (
                    <Badge variant="secondary" className="text-xs">Organic</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{product.location}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">• by {product.farmer}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    ₦{product.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/{product.unit}</span>
                  {getPriceTrend(product)}
                  {priceUpdates[product.id] && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      Updated
                    </Badge>
                  )}
                </div>
                
                {product.price !== product.previousPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₦{product.previousPrice}
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium">{product.quantity} {product.unit}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harvest:</span>
                  <span className="font-medium">{new Date(product.harvestDate).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {product.deliveryOptions.join(', ')}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => console.log(`Buying ${product.name}`)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => startChat(product.id, product.farmer)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => console.log(`Calling ${product.farmer}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedProducts.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No products found matching your criteria</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLocation('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
