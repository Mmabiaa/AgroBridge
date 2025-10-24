import apiClient from '@/api/axiosClient';
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
    Category,
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
            // Try the custom endpoint first (the one we defined in Django URLs)
            const response = await apiClient.get<PaginatedResponse<Product>>(
                `${this.basePath}/products/my-products/`,
                { params }
            );
            return response;
        } catch (error: any) {
            // If custom endpoint fails, try the DRF action endpoint
            if (error.response?.status === 404) {
                try {
                    const response = await apiClient.get<PaginatedResponse<Product>>(
                        `${this.basePath}/products/my_products/`,
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
            // Try the custom endpoint first (the one we defined in Django URLs)
            const response = await apiClient.get<PaginatedResponse<Order>>(
                `${this.basePath}/orders/my-orders/`,
                { params }
            );
            return response;
        } catch (error: any) {
            // If custom endpoint fails, try the DRF action endpoint
            if (error.response?.status === 404) {
                try {
                    const response = await apiClient.get<PaginatedResponse<Order>>(
                        `${this.basePath}/orders/my_purchases/`,
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

    // Category methods
    async getCategories(): Promise<PaginatedResponse<Category>> {
        const response = await apiClient.get<PaginatedResponse<Category>>(`${this.basePath}/categories/`);
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

    // Image upload method
    async createProductWithImages(productData: ProductCreateData, images: File[]): Promise<Product> {
        const formData = new FormData();
        
        // Append product data
        Object.keys(productData).forEach(key => {
            if (productData[key] !== undefined && productData[key] !== null) {
                formData.append(key, productData[key].toString());
            }
        });
        
        // Append images
        images.forEach((image, index) => {
            formData.append(`images`, image);
        });

        const response = await apiClient.post<Product>(`${this.basePath}/products/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    }
}

export default new MarketplaceService();