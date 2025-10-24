import apiClient from '../axiosClient';
import type {
    Product,
    ProductCreateData,
    ProductUpdateData,
    Order,
    OrderCreateData,
    OrderUpdateData,
    PaginatedResponse,
    ProductListParams,
    OrderListParams,
} from '../basicTypes';

class MarketplaceService {
    private basePath = '/marketplace';

    // Product methods
    async getProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
        const response = await apiClient.get<PaginatedResponse<Product>>(
            `${this.basePath}/products/`,
            { params }
        );
        return response;
    }

    async getProduct(id: string): Promise<Product> {
        const response = await apiClient.get<Product>(`${this.basePath}/products/${id}/`);
        return response;
    }

    async getUserProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
        try {
            // Try the correct Django endpoint first
            const response = await apiClient.get<PaginatedResponse<Product>>(
                `${this.basePath}/products/my_products/`,
                { params }
            );
            return response;
        } catch (error: any) {
            // If 404, try alternative endpoints
            if (error.response?.status === 404) {
                try {
                    // Try alternative endpoint name
                    const response = await apiClient.get<PaginatedResponse<Product>>(
                        `${this.basePath}/products/my-products/`,
                        { params }
                    );
                    return response;
                } catch (secondError: any) {
                    // Final fallback: return empty results
                    console.warn('User products endpoints not available, returning empty results');
                    return {
                        count: 0,
                        next: null,
                        previous: null,
                        results: []
                    };
                }
            }
            throw error;
        }
    }

    async createProduct(productData: ProductCreateData): Promise<Product> {
        const response = await apiClient.post<Product>(`${this.basePath}/products/`, productData);
        return response;
    }

    async updateProduct(id: string, data: ProductUpdateData): Promise<Product> {
        const response = await apiClient.patch<Product>(`${this.basePath}/products/${id}/`, data);
        return response;
    }

    async deleteProduct(id: string): Promise<void> {
        await apiClient.delete(`${this.basePath}/products/${id}/`);
    }

    // Order methods
    async getOrders(params?: OrderListParams): Promise<PaginatedResponse<Order>> {
        const response = await apiClient.get<PaginatedResponse<Order>>(
            `${this.basePath}/orders/`,
            { params }
        );
        return response;
    }

    async getOrder(id: string): Promise<Order> {
        const response = await apiClient.get<Order>(`${this.basePath}/orders/${id}/`);
        return response;
    }

    async getUserOrders(params?: OrderListParams): Promise<PaginatedResponse<Order>> {
        try {
            // Try the correct Django endpoint first
            const response = await apiClient.get<PaginatedResponse<Order>>(
                `${this.basePath}/orders/my_purchases/`,
                { params }
            );
            return response;
        } catch (error: any) {
            // If 404, try alternative endpoints
            if (error.response?.status === 404) {
                try {
                    // Try alternative endpoint name
                    const response = await apiClient.get<PaginatedResponse<Order>>(
                        `${this.basePath}/orders/my-orders/`,
                        { params }
                    );
                    return response;
                } catch (secondError: any) {
                    // Final fallback: return empty results
                    console.warn('User orders endpoints not available, returning empty results');
                    return {
                        count: 0,
                        next: null,
                        previous: null,
                        results: []
                    };
                }
            }
            throw error;
        }
    }

    async createOrder(orderData: OrderCreateData): Promise<Order> {
        const response = await apiClient.post<Order>(`${this.basePath}/orders/`, orderData);
        return response;
    }

    async updateOrder(id: string, data: OrderUpdateData): Promise<Order> {
        const response = await apiClient.patch<Order>(`${this.basePath}/orders/${id}/`, data);
        return response;
    }

    // Search and filter methods
    async searchProducts(query: string, params?: ProductListParams): Promise<PaginatedResponse<Product>> {
        return this.getProducts({ ...params, search: query });
    }

    async getProductsByCategory(category: string, params?: ProductListParams): Promise<PaginatedResponse<Product>> {
        return this.getProducts({ ...params, category });
    }

    async getFeaturedProducts(): Promise<PaginatedResponse<Product>> {
        try {
            const response = await apiClient.get<PaginatedResponse<Product>>(
                `${this.basePath}/products/featured/`
            );
            return response;
        } catch (error: any) {
            // Fallback to regular products if featured endpoint doesn't exist
            console.warn('Featured products endpoint not available, using regular products');
            return this.getProducts({ limit: 8 });
        }
    }

    // Analytics methods
    async getSellerAnalytics(): Promise<any> {
        try {
            const response = await apiClient.get(`${this.basePath}/products/seller_insights/`);
            return response;
        } catch (error: any) {
            // Return mock analytics if endpoint doesn't exist
            console.warn('Analytics endpoint not available, returning mock data');
            return this.getMockAnalytics();
        }
    }

    private getMockAnalytics(): any {
        return {
            total_sales: 0,
            total_orders: 0,
            total_products: 0,
            monthly_revenue: 0,
            top_products: []
        };
    }
}

export default new MarketplaceService();