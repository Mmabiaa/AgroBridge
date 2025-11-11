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

// Category query hooks - FIXED VERSION (using marketplaceService)
export const useCategories = () => {
  return useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: async (): Promise<Category[]> => {
      console.log('🔄 Fetching categories from API...');
      try {
        // Use marketplaceService instead of direct axios call
        const response = await marketplaceService.getCategories();
        console.log('✅ Categories API response received:', response);
        
        // Handle paginated response structure
        let categories: Category[] = [];
        
        if (response && typeof response === 'object') {
          // Case 1: Paginated response with results array
          if (response.results && Array.isArray(response.results)) {
            categories = response.results;
            console.log(`📊 Found ${categories.length} categories in 'results' array`);
          }
          // Case 2: Direct array
          else if (Array.isArray(response)) {
            categories = response;
            console.log(`📊 Found ${categories.length} categories in direct array`);
          }
          // Case 3: Data property
          else if (response.data && Array.isArray(response.data)) {
            categories = response.data;
            console.log(`📊 Found ${categories.length} categories in 'data' array`);
          }
          // Case 4: Categories property
          else if (response.categories && Array.isArray(response.categories)) {
            categories = response.categories;
            console.log(`📊 Found ${categories.length} categories in 'categories' array`);
          }
          else {
            console.warn('⚠️ Unexpected categories response structure:', response);
            categories = [];
          }
        }
        
        console.log(`🎯 Final categories count: ${categories.length}`);
        categories.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.name} (ID: ${cat.id})`);
        });
        
        return categories;
      } catch (error) {
        console.error('❌ Categories API error:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  });
};

// Product query hooks
export const useProducts = (params?: ProductListParams) => {
    return useQuery({
        queryKey: ['marketplace', 'products', 'list', params],
        queryFn: () => marketplaceService.getProducts(params),
        staleTime: 1 * 60 * 1000,
        placeholderData: (previousData) => previousData,
        retry: (failureCount, error: any) => {
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
        staleTime: 3 * 60 * 1000,
    });
};

export const useUserProducts = (params?: ProductListParams) => {
    return useQuery({
        queryKey: ['marketplace', 'products', 'user', params],
        queryFn: () => marketplaceService.getUserProducts(params),
        staleTime: 30 * 1000,
        retry: (failureCount, error: any) => {
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
        staleTime: 30 * 1000,
    });
};

export const useOrder = (id: string, enabled = true) => {
    return useQuery({
        queryKey: ['marketplace', 'orders', 'detail', id],
        queryFn: () => marketplaceService.getOrder(id),
        enabled: enabled && !!id,
        staleTime: 1 * 60 * 1000,
    });
};

export const useUserOrders = (params?: OrderListParams) => {
    return useQuery({
        queryKey: ['marketplace', 'orders', 'user', params],
        queryFn: () => marketplaceService.getUserOrders(params),
        staleTime: 30 * 1000,
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 404) return false;
            return failureCount < 2;
        },
    });
};

// Product mutation hooks
export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['create_product'],
        mutationFn: (productData: ProductCreateData) => marketplaceService.createProduct(productData),
        onSuccess: (newProduct: Product) => {
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'user'] });
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
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'products', 'user'] });
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
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'orders', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'orders', 'user'] });
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
        staleTime: 30 * 1000,
    });
};

export const useProductsByCategory = (category: string, enabled = true) => {
    return useQuery({
        queryKey: ['marketplace', 'products', 'category', category],
        queryFn: () => marketplaceService.getProducts({ category }),
        enabled: enabled && !!category,
        staleTime: 2 * 60 * 1000,
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