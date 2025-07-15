
import { useState } from 'react';
import { LiveMarketplace } from '@/components/marketplace/LiveMarketplace';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { FileUpload } from '@/components/upload/FileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Upload, Search, TrendingUp } from 'lucide-react';


export default function Marketplace() {
  const initialMockProducts = [
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
      image: 'https://i.pinimg.com/736x/4e/d6/fe/4ed6feb64a7f21255f3f9d9174509cd9.jpg',
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
      image: 'https://i.pinimg.com/736x/16/5e/6f/165e6f24df657daecce50dde8fcd0037.jpg',
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
      image: 'https://i.pinimg.com/736x/45/7d/f3/457df3e0fc340a8eef6a52e4e8964a31.jpg',
      category: 'Grains',
      isOrganic: true,
      harvestDate: '2024-01-10',
      deliveryOptions: ['Pickup', 'Nationwide Shipping']
    }
  ];
  const [products, setProducts] = useState(initialMockProducts);
  const [searchFilters, setSearchFilters] = useState(null);

  // Handler to add a new product (from Sell tab)
  const handleAddProduct = (product) => {
    setProducts(prev => [product, ...prev]);
  };

  // Handler to update filters (from AdvancedSearch)
  const handleAdvancedSearch = (filters) => {
    setSearchFilters(filters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-3 md:px-4">
      <div className="container mx-auto space-y-6 md:space-y-8">
        <div className="px-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-2">
            <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Live Marketplace
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Connect directly with farmers and buyers across Ghana</p>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12 md:h-auto p-1 bg-muted/50">
            <TabsTrigger value="marketplace" className="text-xs md:text-sm py-2 md:py-3">Marketplace</TabsTrigger>
            <TabsTrigger value="search" className="text-xs md:text-sm py-2 md:py-3">Advanced Search</TabsTrigger>
            <TabsTrigger value="sell" className="text-xs md:text-sm py-2 md:py-3">Sell Products</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <div className="px-1">
              <LiveMarketplace products={products} searchFilters={searchFilters} />
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <Card className="shadow-soft mx-1">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Search className="h-4 w-4 md:h-5 md:w-5" />
                  Advanced Search & Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <AdvancedSearch onSearch={handleAdvancedSearch} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <Card className="shadow-soft mx-1">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Upload className="h-4 w-4 md:h-5 md:w-5" />
                  List Your Products
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {/* Product form will be added here, pass handleAddProduct */}
                <FileUpload onProductUpload={handleAddProduct} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
