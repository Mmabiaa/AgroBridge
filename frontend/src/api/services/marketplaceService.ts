/**
 * Marketplace API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface Product {
  id: string;
  seller: string;
  seller_name: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  quantity_available: number;
  location: {
    address: string;
    city: string;
    state: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  images: Array<{
    id: string;
    image: string;
    is_primary: boolean;
  }>;
  quality_grade: string;
  harvest_date: string;
  expiry_date: string;
  organic_certified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  quantity_available: number;
  location: Product['location'];
  quality_grade: string;
  harvest_date: string;
  expiry_date: string;
  organic_certified: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface Order {
  id: string;
  buyer: string;
  buyer_name: string;
  seller: string;
  seller_name: string;
  product: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address: {
    address: string;
    city: string;
    state: string;
    postal_code: string;
  };
  delivery_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  product: string;
  quantity: number;
  delivery_address: Order['delivery_address'];
  delivery_date: string;
  notes?: string;
}

export interface ProductListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  organic_certified?: boolean;
  quality_grade?: string;
  ordering?: string;
}

export interface OrderListParams {
  page?: number;
  page_size?: number;
  status?: string;
  ordering?: string;
}

export interface MarketplaceAnalytics {
  total_products: number;
  total_orders: number;
  total_revenue: number;
  products_by_category: Record<string, number>;
  orders_by_status: Record<string, number>;
  revenue_trend: Array<{ date: string; revenue: number }>;
  top_products: Array<{
    product_name: string;
    total_orders: number;
    total_revenue: number;
  }>;
}

class MarketplaceService {
  private readonly baseUrl = '/marketplace';

  /**
   * Get list of products
   */
  async getProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
    return apiClient.getPaginated<Product>(`${this.baseUrl}/products/`, params);
  }

  /**
   * Get user's products
   */
  async getUserProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
    return apiClient.getPaginated<Product>(`${this.baseUrl}/products/my-products/`, params);
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<Product> {
    return apiClient.get<Product>(`${this.baseUrl}/products/${productId}/`);
  }

  /**
   * Create new product
   */
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>(`${this.baseUrl}/products/`, productData);
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, productData: UpdateProductRequest): Promise<Product> {
    return apiClient.patch<Product>(`${this.baseUrl}/products/${productId}/`, productData);
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/products/${productId}/`);
  }

  /**
   * Upload product image
   */
  async uploadProductImage(
    productId: string, 
    file: File, 
    isPrimary: boolean = false,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<Product['images'][0]> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('is_primary', isPrimary.toString());

    return apiClient.post<Product['images'][0]>(
      `${this.baseUrl}/products/${productId}/images/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }
    );
  }

  /**
   * Delete product image
   */
  async deleteProductImage(productId: string, imageId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/products/${productId}/images/${imageId}/`);
  }

  /**
   * Search products
   */
  async searchProducts(query: string, filters?: Omit<ProductListParams, 'search'>): Promise<PaginatedResponse<Product>> {
    return apiClient.getPaginated<Product>(`${this.baseUrl}/products/search/`, {
      q: query,
      ...filters,
    });
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(): Promise<Product[]> {
    return apiClient.get<Product[]>(`${this.baseUrl}/products/featured/`);
  }

  /**
   * Get recommended products
   */
  async getRecommendedProducts(userId?: string): Promise<Product[]> {
    return apiClient.get<Product[]>(`${this.baseUrl}/products/recommended/`, {
      params: userId ? { user_id: userId } : undefined,
    });
  }

  /**
   * Get list of orders
   */
  async getOrders(params?: OrderListParams): Promise<PaginatedResponse<Order>> {
    return apiClient.getPaginated<Order>(`${this.baseUrl}/orders/`, params);
  }

  /**
   * Get user's orders
   */
  async getUserOrders(params?: OrderListParams): Promise<PaginatedResponse<Order>> {
    return apiClient.getPaginated<Order>(`${this.baseUrl}/orders/my-orders/`, params);
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    return apiClient.get<Order>(`${this.baseUrl}/orders/${orderId}/`);
  }

  /**
   * Create new order
   */
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>(`${this.baseUrl}/orders/`, orderData);
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, updateData: Partial<Order>): Promise<Order> {
    return apiClient.patch<Order>(`${this.baseUrl}/orders/${orderId}/`, updateData);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    return apiClient.patch<Order>(`${this.baseUrl}/orders/${orderId}/`, { status });
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return apiClient.post<Order>(`${this.baseUrl}/orders/${orderId}/cancel/`, { reason });
  }

  /**
   * Get user's orders as buyer
   */
  async getMyOrders(): Promise<Order[]> {
    return apiClient.get<Order[]>(`${this.baseUrl}/orders/my-orders/`);
  }

  /**
   * Get user's orders as seller
   */
  async getMySales(): Promise<Order[]> {
    return apiClient.get<Order[]>(`${this.baseUrl}/orders/my-sales/`);
  }

  /**
   * Get user's products
   */
  async getMyProducts(): Promise<Product[]> {
    return apiClient.get<Product[]>(`${this.baseUrl}/products/my-products/`);
  }

  /**
   * Get marketplace analytics
   */
  async getAnalytics(params?: {
    period?: 'day' | 'week' | 'month' | 'year';
    start_date?: string;
    end_date?: string;
  }): Promise<MarketplaceAnalytics> {
    return apiClient.get<MarketplaceAnalytics>(`${this.baseUrl}/analytics/`, { params });
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<Array<{ value: string; label: string; count: number }>> {
    return apiClient.get<Array<{ value: string; label: string; count: number }>>(
      `${this.baseUrl}/categories/`
    );
  }

  /**
   * Get marketplace statistics
   */
  async getStatistics(): Promise<{
    total_products: number;
    active_products: number;
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    top_categories: Array<{ category: string; count: number }>;
    recent_orders: Array<{
      id: string;
      product_name: string;
      buyer_name: string;
      amount: number;
      created_at: string;
    }>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics/`);
  }

  /**
   * Report product
   */
  async reportProduct(productId: string, reason: string, description?: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/products/${productId}/report/`, {
      reason,
      description,
    });
  }

  /**
   * Add product to favorites
   */
  async addToFavorites(productId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/products/${productId}/favorite/`);
  }

  /**
   * Remove product from favorites
   */
  async removeFromFavorites(productId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.baseUrl}/products/${productId}/favorite/`);
  }

  /**
   * Get user's favorite products
   */
  async getFavoriteProducts(): Promise<Product[]> {
    return apiClient.get<Product[]>(`${this.baseUrl}/products/favorites/`);
  }

  /**
   * Get price history for a product
   */
  async getProductPriceHistory(productId: string): Promise<Array<{
    date: string;
    price: number;
  }>> {
    return apiClient.get<Array<{ date: string; price: number }>>(
      `${this.baseUrl}/products/${productId}/price-history/`
    );
  }
}

export default new MarketplaceService();