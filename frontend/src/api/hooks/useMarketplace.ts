/**
 * React Query hooks for marketplace with caching and optimization
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import marketplaceService from '../services/marketplaceService';
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
} from '@/types/basicTypes';

// Product query hooks
export const useProducts = (params?: ProductListParams) => {
    return useQuery({
        queryKey: ['marketplace', 'products', 'list', params],
        queryFn: () => marketplaceService.getProducts(params),
        staleTime: 1 * 60 * 1000, // 1 minute for product listings
        placeholderData: (previousData) => previousData,
        retry: (failureCount, error: any) => {
            // Don't retry on 404 errors for products
            if (error?.response?.status === 404) return false;
            return failureCount < 3;
        },
    });
};

export const useInfiniteProducts = (params?: Omit<ProductListParams, 'page'>) => {
    return useInfiniteQuery({
        queryKey: ['marketplace', 'products', 'infinite', params],
        queryFn: ({ pageParam = 1 }) => marketplaceService.getProducts({ ...params, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage: PaginatedResponse<Product>) => {
            if (lastPage.next) {
                const url = new URL(lastPage.next, window.location.origin);
                const page = url.searchParams.get('page');
                return page ? parseInt(page, 10) : undefined;
            }
            return undefined;
        },
        staleTime: 1 * 60 * 1000,
    });
};

export const useProduct = (id: string, enabled = true) => {
    return useQuery({
        queryKey: ['marketplace', 'products', 'detail', id],
        queryFn: () => marketplaceService.getProduct(id),
        enabled: enabled && !!id,
        staleTime: 3 * 60 * 1000, // 3 minutes for individual products
    });
};

export const useUserProducts = (params?: ProductListParams) => {
    return useQuery({
        queryKey: ['marketplace', 'products', 'user', params],
        queryFn: () => marketplaceService.getUserProducts(params),
        staleTime: 30 * 1000, // 30 seconds for user's own products
        retry: (failureCount, error: any) => {
            // Don't retry on 404 errors - these endpoints might not exist
            if (error?.response?.status === 404) return false;
            return failureCount < 2;
        },
    });
};

// Order query hooks
export const useOrders = (params?: OrderListParams) => {
    return useQuery({
        queryKey: ['marketplace', 'orders', 'list', params],
        queryFn: () => marketplaceService.getOrders(params),
        staleTime: 30 * 1000, // 30 seconds for orders
    });
};

export const useOrder = (id: string, enabled = true) => {
    return useQuery({
        queryKey: ['marketplace', 'orders', 'detail', id],
        queryFn: () => marketplaceService.getOrder(id),
        enabled: enabled && !!id,
        staleTime: 1 * 60 * 1000, // 1 minute for individual orders
    });
};

export const useUserOrders = (params?: OrderListParams) => {
    return useQuery({
        queryKey: ['marketplace', 'orders', 'user', params],
        queryFn: () => marketplaceService.getUserOrders(params),
        staleTime: 30 * 1000, // 30 seconds for user's orders
        retry: (failureCount, error: any) => {
            // Don't retry on 404 errors - these endpoints might not exist
            if (error?.response?.status === 404) return false;
            return failureCount < 2;
        },
    });
};

// Category query hooks
export const useCategories = () => {
    return useQuery({
        queryKey: ['marketplace', 'categories'],
        queryFn: () => marketplaceService.getCategories(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Product mutation hooks
export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['create_product'],
        mutationFn: (productData: ProductCreateData) => marketplaceService.createProduct(productData),
        onSuccess: (newProduct: Product) => {
            // Invalidate product lists
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'user'] });

            // Add to cache
            queryClient.setQueryData(['marketplace', 'products', 'detail', newProduct.id], newProduct);
        },
    });
};

export const useCreateProductWithImages = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['create_product_with_images'],
        mutationFn: ({ productData, images }: { productData: ProductCreateData; images: File[] }) => 
            marketplaceService.createProductWithImages(productData, images),
        onSuccess: (newProduct: Product) => {
            // Invalidate product lists
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'user'] });

            // Add to cache
            queryClient.setQueryData(['marketplace', 'products', 'detail', newProduct.id], newProduct);
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['update_product'],
        mutationFn: ({ id, data }: { id: string; data: ProductUpdateData }) =>
            marketplaceService.updateProduct(id, data),
        onSuccess: (updatedProduct: Product) => {
            // Update cache
            queryClient.setQueryData(['marketplace', 'products', 'detail', updatedProduct.id], updatedProduct);
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'user'] });
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['delete_product'],
        mutationFn: (id: string) => marketplaceService.deleteProduct(id),
        onSuccess: (_, id) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: ['marketplace', 'products', 'detail', id] });
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'user'] });
        },
    });
};

// Order mutation hooks
export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['create_order'],
        mutationFn: (orderData: OrderCreateData) => marketplaceService.createOrder(orderData),
        onSuccess: (newOrder: Order) => {
            // Invalidate order lists
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'orders', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'orders', 'user'] });

            // Add to cache
            queryClient.setQueryData(['marketplace', 'orders', 'detail', newOrder.id], newOrder);
        },
    });
};

export const useUpdateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['update_order'],
        mutationFn: ({ id, data }: { id: string; data: OrderUpdateData }) =>
            marketplaceService.updateOrder(id, data),
        onSuccess: (updatedOrder: Order) => {
            // Update cache
            queryClient.setQueryData(['marketplace', 'orders', 'detail', updatedOrder.id], updatedOrder);
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'orders', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'orders', 'user'] });
        },
    });
};

// Search and filter hooks
export const useProductSearch = (searchTerm: string, enabled = true) => {
    return useQuery({
        queryKey: ['marketplace', 'products', 'search', searchTerm],
        queryFn: () => marketplaceService.getProducts({ search: searchTerm }),
        enabled: enabled && searchTerm.length > 2,
        staleTime: 30 * 1000, // 30 seconds for search results
    });
};

export const useProductsByCategory = (category: string, enabled = true) => {
    return useQuery({
        queryKey: ['marketplace', 'products', 'category', category],
        queryFn: () => marketplaceService.getProducts({ category }),
        enabled: enabled && !!category,
        staleTime: 2 * 60 * 1000, // 2 minutes for category listings
    });
};

// Prefetch utilities
export const useMarketplacePrefetch = () => {
    const queryClient = useQueryClient();

    const prefetchProduct = (id: string) => {
        queryClient.prefetchQuery({
            queryKey: ['marketplace', 'products', 'detail', id],
            queryFn: () => marketplaceService.getProduct(id),
            staleTime: 3 * 60 * 1000,
        });
    };

    const prefetchOrder = (id: string) => {
        queryClient.prefetchQuery({
            queryKey: ['marketplace', 'orders', 'detail', id],
            queryFn: () => marketplaceService.getOrder(id),
            staleTime: 1 * 60 * 1000,
        });
    };

    const prefetchUserProducts = () => {
        queryClient.prefetchQuery({
            queryKey: ['marketplace', 'products', 'user'],
            queryFn: () => marketplaceService.getUserProducts(),
            staleTime: 30 * 1000,
        });
    };

    const prefetchUserOrders = () => {
        queryClient.prefetchQuery({
            queryKey: ['marketplace', 'orders', 'user'],
            queryFn: () => marketplaceService.getUserOrders(),
            staleTime: 30 * 1000,
        });
    };

    const prefetchCategories = () => {
        queryClient.prefetchQuery({
            queryKey: ['marketplace', 'categories'],
            queryFn: () => marketplaceService.getCategories(),
            staleTime: 5 * 60 * 1000,
        });
    };

    return {
        prefetchProduct,
        prefetchOrder,
        prefetchUserProducts,
        prefetchUserOrders,
        prefetchCategories,
    };
};