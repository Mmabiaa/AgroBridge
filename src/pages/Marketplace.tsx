
import { useState, useEffect } from 'react';
import { LiveMarketplace } from '@/components/marketplace/LiveMarketplace';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { FileUpload } from '@/components/upload/FileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Upload, Search, TrendingUp, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notifyMarketplaceActivity } from '@/components/notifications/NotificationCenter';

// Mock user data
const mockUser = {
  id: 'user123',
  name: 'Kwame Addo',
  balance: 25000,
  location: 'Accra, Ghana',
  rating: 4.7,
  totalOrders: 15
};

// Mock orders data
const mockOrders = [
  {
    id: 'order001',
    productId: '1',
    productName: 'Fresh Tomatoes',
    farmer: 'John Asante',
    quantity: 50,
    unit: 'kg',
    totalPrice: 22500,
    status: 'pending',
    orderDate: '2024-01-20T10:30:00Z',
    expectedDelivery: '2024-01-22T14:00:00Z',
    paymentMethod: 'Mobile Money'
  },
  {
    id: 'order002',
    productId: '3',
    productName: 'Organic Maize',
    farmer: 'Samuel Oseh',
    quantity: 100,
    unit: 'kg',
    totalPrice: 32000,
    status: 'confirmed',
    orderDate: '2024-01-19T15:45:00Z',
    expectedDelivery: '2024-01-25T10:00:00Z',
    paymentMethod: 'Bank Transfer'
  }
];

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
      deliveryOptions: ['Pickup', 'Local Delivery'],
      description: 'Fresh, ripe tomatoes harvested from organic farms in Kumasi. Perfect for cooking and salads.',
      minOrder: 10,
      maxOrder: 200,
      stockStatus: 'in-stock'
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
      image: 'https://i.pinimg.com/736x/6b/16/fa/6b16fafc2ea41361f16126aeb56ec888.jpg',
      category: 'Vegetables',
      isOrganic: false,
      harvestDate: '2024-01-12',
      deliveryOptions: ['Pickup', 'Regional Shipping'],
      description: 'Quality red onions from Northern Ghana. Sweet and flavorful, perfect for various dishes.',
      minOrder: 5,
      maxOrder: 100,
      stockStatus: 'in-stock'
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
      deliveryOptions: ['Pickup', 'Nationwide Shipping'],
      description: 'Premium organic maize from Bono Region. High quality grain for various uses.',
      minOrder: 25,
      maxOrder: 500,
      stockStatus: 'in-stock'
    },
    {
      id: '4',
      name: 'Fresh Pineapples',
      farmer: 'Grace Mensah',
      location: 'Cape Coast, Ghana',
      price: 180,
      previousPrice: 200,
      unit: 'kg',
      quantity: 300,
      rating: 4.7,
      image: 'https://i.pinimg.com/736x/4d/90/47/4d9047453cd1cad8452d6d085e0365b5.jpg',
      category: 'Fruits',
      isOrganic: true,
      harvestDate: '2024-01-18',
      deliveryOptions: ['Pickup', 'Local Delivery'],
      description: 'Sweet and juicy pineapples from the Central Region. Perfect for fresh consumption.',
      minOrder: 5,
      maxOrder: 150,
      stockStatus: 'in-stock'
    },
    {
      id: '5',
      name: 'Yam Tubers',
      farmer: 'Kofi Owusu',
      location: 'Ho, Ghana',
      price: 350,
      previousPrice: 380,
      unit: 'kg',
      quantity: 800,
      rating: 4.5,
      image: 'https://i.pinimg.com/736x/5a/37/d0/5a37d059fae037c9e3764494911f6af1.jpg',
      category: 'Tubers',
      isOrganic: false,
      harvestDate: '2024-01-14',
      deliveryOptions: ['Pickup', 'Regional Shipping'],
      description: 'Fresh yam tubers from Volta Region. High quality and nutritious.',
      minOrder: 10,
      maxOrder: 300,
      stockStatus: 'in-stock'
    }
  ];

  const [products, setProducts] = useState(initialMockProducts);
  const [searchFilters, setSearchFilters] = useState(null);
  const [orders, setOrders] = useState(mockOrders);
  const [user, setUser] = useState(mockUser);
  const [activeTab, setActiveTab] = useState('marketplace');

  // Handler to add a new product (from Sell tab)
  const handleAddProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now().toString(),
      rating: 0,
      harvestDate: new Date().toISOString().split('T')[0],
      stockStatus: 'in-stock'
    };
    setProducts(prev => [newProduct, ...prev]);
    setActiveTab('marketplace');
    notifyMarketplaceActivity('listing', product.name);
  };

  // Handler to update filters (from AdvancedSearch)
  const handleAdvancedSearch = (filters) => {
    setSearchFilters(filters);
  };

  // Handler for buying products
  const handleBuyProduct = (product, quantity) => {
    const totalCost = product.price * quantity;
    
    if (totalCost > user.balance) {
      alert('Insufficient balance. Please add more funds to your account.');
      return;
    }

    if (quantity > product.quantity) {
      alert('Requested quantity exceeds available stock.');
      return;
    }

    if (quantity < product.minOrder) {
      alert(`Minimum order quantity is ${product.minOrder} ${product.unit}`);
      return;
    }

    if (quantity > product.maxOrder) {
      alert(`Maximum order quantity is ${product.maxOrder} ${product.unit}`);
      return;
    }

    // Create new order
    const newOrder = {
      id: `order${Date.now()}`,
      productId: product.id,
      productName: product.name,
      farmer: product.farmer,
      quantity: quantity,
      unit: product.unit,
      totalPrice: totalCost,
      status: 'pending',
      orderDate: new Date().toISOString(),
      expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      paymentMethod: 'Mobile Money'
    };

    // Update orders
    setOrders(prev => [newOrder, ...prev]);

    // Update user balance
    setUser(prev => ({
      ...prev,
      balance: prev.balance - totalCost,
      totalOrders: prev.totalOrders + 1
    }));

    // Update product quantity
    setProducts(prev => prev.map(p => 
      p.id === product.id 
        ? { ...p, quantity: p.quantity - quantity }
        : p
    ));

    alert(`Order placed successfully! Order ID: ${newOrder.id}`);
    notifyMarketplaceActivity('purchase', product.name, totalCost);
  };

  // Handler for order status updates
  const handleOrderStatusUpdate = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'shipped':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-0 sm:px-4">
        <div className="px-0 sm:px-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-2">
            <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Live Marketplace
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Connect directly with farmers and buyers across Ghana</p>
        </div>

        {/* User Balance and Stats */}
        <Card className="shadow-soft mx-1">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Welcome, {user.name}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Balance:</span>
                    <span className="text-primary font-bold">₵{user.balance.toLocaleString()}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Orders:</span>
                    <span>{user.totalOrders}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Rating:</span>
                    <span>⭐ {user.rating}</span>
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={() => alert('Add funds feature coming soon!')}>
                Add Funds
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6 w-full max-w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 md:h-auto p-1 bg-muted/50">
            <TabsTrigger value="marketplace" className="text-xs md:text-sm py-2 md:py-3">Marketplace</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs md:text-sm py-2 md:py-3">My Orders</TabsTrigger>
            <TabsTrigger value="search" className="text-xs md:text-sm py-2 md:py-3">Advanced Search</TabsTrigger>
            <TabsTrigger value="sell" className="text-xs md:text-sm py-2 md:py-3">Sell Products</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-4 md:space-y-6 mt-4 md:mt-6 w-full max-w-full">
            <div className="px-0 sm:px-1 w-full max-w-full">
              <LiveMarketplace 
                products={products} 
                searchFilters={searchFilters} 
                onBuyProduct={handleBuyProduct}
                userBalance={user.balance}
              />
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 md:space-y-6 mt-4 md:mt-6 w-full max-w-full">
            <Card className="shadow-soft mx-1">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Package className="h-4 w-4 md:h-5 md:w-5" />
                  My Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No orders yet. Start shopping in the marketplace!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="shadow-soft">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">{order.productName}</h4>
                                <Badge className={getStatusColor(order.status)}>
                                  {getStatusIcon(order.status)}
                                  <span className="ml-1 capitalize">{order.status}</span>
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Farmer: {order.farmer}</p>
                                <p>Quantity: {order.quantity} {order.unit}</p>
                                <p>Total: ₵{order.totalPrice.toLocaleString()}</p>
                                <p>Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                                <p>Expected Delivery: {new Date(order.expectedDelivery).toLocaleDateString()}</p>
                                <p>Payment: {order.paymentMethod}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {order.status === 'pending' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleOrderStatusUpdate(order.id, 'confirmed')}
                                  >
                                    Confirm Order
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleOrderStatusUpdate(order.id, 'cancelled')}
                                  >
                                    Cancel Order
                                  </Button>
                                </>
                              )}
                              {order.status === 'confirmed' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleOrderStatusUpdate(order.id, 'shipped')}
                                >
                                  Mark as Shipped
                                </Button>
                              )}
                              {order.status === 'shipped' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                                >
                                  Mark as Delivered
                                </Button>
                              )}
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

          <TabsContent value="search" className="space-y-4 md:space-y-6 mt-4 md:mt-6 w-full max-w-full">
            <Card className="shadow-soft mx-1 w-full max-w-full">
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

          <TabsContent value="sell" className="space-y-4 md:space-y-6 mt-4 md:mt-6 w-full max-w-full">
            <Card className="shadow-soft mx-1 w-full max-w-full">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Upload className="h-4 w-4 md:h-5 md:w-5" />
                  List Your Products
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <FileUpload onProductUpload={handleAddProduct} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
