/**
 * React Query hooks for marketplace with caching and optimization
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import marketplaceService from '../services/marketplaceService';
import { queryKeys, optimisticUpdates } from '../queryClient';
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

// Product query hooks
export const useProducts = (params?: ProductListParams) => {
  return useQuery({
    queryKey: queryKeys.marketplace.products.list(params),
    queryFn: () => marketplaceService.getProducts(params),
    staleTime: 1 * 60 * 1000, // 1 minute for product listings
    placeholderData: (previousData) => previousData,
  });
};

export const useInfiniteProducts = (params?: Omit<ProductListParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: queryKeys.marketplace.products.list({ ...params, infinite: true }),
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
    queryKey: queryKeys.marketplace.products.detail(id),
    queryFn: () => marketplaceService.getProduct(id),
    enabled: enabled && !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes for individual products
  });
};

export const useUserProducts = (params?: ProductListParams) => {
  return useQuery({
    queryKey: queryKeys.marketplace.products.userProducts(params),
    queryFn: () => marketplaceService.getUserProducts(params),
    staleTime: 30 * 1000, // 30 seconds for user's own products
  });
};

// Order query hooks
export const useOrders = (params?: OrderListParams) => {
  return useQuery({
    queryKey: queryKeys.marketplace.orders.list(params),
    queryFn: () => marketplaceService.getOrders(params),
    staleTime: 30 * 1000, // 30 seconds for orders
  });
};

export const useOrder = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.marketplace.orders.detail(id),
    queryFn: () => marketplaceService.getOrder(id),
    enabled: enabled && !!id,
    staleTime: 1 * 60 * 1000, // 1 minute for individual orders
  });
};

export const useUserOrders = (params?: OrderListParams) => {
  return useQuery({
    queryKey: queryKeys.marketplace.orders.userOrders(params),
    queryFn: () => marketplaceService.getUserOrders(params),
    staleTime: 30 * 1000, // 30 seconds for user's orders
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
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.products.userProducts() });
      
      // Add to cache
      queryClient.setQueryData(queryKeys.marketplace.products.detail(newProduct.id), newProduct);
      
      // Optimistically update lists
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.lists() });
      listQueries.forEach(([queryKey]) => {
        optimisticUpdates.updateList([...queryKey], newProduct, 'create');
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['update_product'],
    mutationFn: ({ id, data }: { id: string; data: ProductUpdateData }) => 
      marketplaceService.updateProduct(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.marketplace.products.detail(id) });
      
      // Snapshot previous value
      const previousProduct = queryClient.getQueryData(queryKeys.marketplace.products.detail(id));
      
      // Optimistically update detail
      optimisticUpdates.updateDetail([...queryKeys.marketplace.products.detail(id)], data);
      
      // Optimistically update lists
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.lists() });
      listQueries.forEach(([queryKey]) => {
        optimisticUpdates.updateList([...queryKey], { id, ...data } as any, 'update');
      });
      
      return { previousProduct, id };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProduct && context?.id) {
        queryClient.setQueryData(queryKeys.marketplace.products.detail(context.id), context.previousProduct);
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.products.lists() });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['delete_product'],
    mutationFn: (id: string) => marketplaceService.deleteProduct(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.marketplace.products.detail(id) });
      
      // Snapshot previous value
      const previousProduct = queryClient.getQueryData(queryKeys.marketplace.products.detail(id));
      
      // Optimistically remove from lists
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.lists() });
      listQueries.forEach(([queryKey]) => {
        optimisticUpdates.updateList([...queryKey], { id } as any, 'delete');
      });
      
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: queryKeys.marketplace.products.detail(id) });
      
      return { previousProduct, id };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.marketplace.products.detail(id), context.previousProduct);
      }
    },
    onSettled: () => {
      // Refetch lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.products.userProducts() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.orders.userOrders() });
      
      // Add to cache
      queryClient.setQueryData(queryKeys.marketplace.orders.detail(newOrder.id), newOrder);
      
      // Update product quantity optimistically
      if (newOrder.product_id) {
        queryClient.setQueryData(
          queryKeys.marketplace.products.detail(newOrder.product_id),
          (oldProduct: Product | undefined) => {
            if (!oldProduct) return oldProduct;
            return {
              ...oldProduct,
              quantity_available: Math.max(0, oldProduct.quantity_available - newOrder.quantity),
            };
          }
        );
      }
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['update_order'],
    mutationFn: ({ id, data }: { id: string; data: OrderUpdateData }) => 
      marketplaceService.updateOrder(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.marketplace.orders.detail(id) });
      
      // Snapshot previous value
      const previousOrder = queryClient.getQueryData(queryKeys.marketplace.orders.detail(id));
      
      // Optimistically update detail
      optimisticUpdates.updateDetail([...queryKeys.marketplace.orders.detail(id)], data);
      
      return { previousOrder, id };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousOrder && context?.id) {
        queryClient.setQueryData(queryKeys.marketplace.orders.detail(context.id), context.previousOrder);
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.orders.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.orders.lists() });
    },
  });
};

// Search and filter hooks
export const useProductSearch = (searchTerm: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.marketplace.products.list({ search: searchTerm }),
    queryFn: () => marketplaceService.getProducts({ search: searchTerm }),
    enabled: enabled && searchTerm.length > 2,
    staleTime: 30 * 1000, // 30 seconds for search results
  });
};

export const useProductsByCategory = (category: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.marketplace.products.list({ category }),
    queryFn: () => marketplaceService.getProducts({ category }),
    enabled: enabled && !!category,
    staleTime: 2 * 60 * 1000, // 2 minutes for category listings
  });
};

export const useNearbyProducts = (location: { latitude: number; longitude: number }, radius = 50, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.marketplace.products.list({ location, radius }),
    queryFn: () => marketplaceService.getProducts({ 
      location: `${location.latitude},${location.longitude}`,
      radius: radius.toString(),
    } as any),
    enabled: enabled && !!location.latitude && !!location.longitude,
    staleTime: 1 * 60 * 1000, // 1 minute for location-based results
  });
};

// Prefetch utilities
export const useMarketplacePrefetch = () => {
  const queryClient = useQueryClient();
  
  const prefetchProduct = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.marketplace.products.detail(id),
      queryFn: () => marketplaceService.getProduct(id),
      staleTime: 3 * 60 * 1000,
    });
  };
  
  const prefetchOrder = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.marketplace.orders.detail(id),
      queryFn: () => marketplaceService.getOrder(id),
      staleTime: 1 * 60 * 1000,
    });
  };
  
  const prefetchUserProducts = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.marketplace.products.userProducts(),
      queryFn: () => marketplaceService.getUserProducts(),
      staleTime: 30 * 1000,
    });
  };
  
  const prefetchUserOrders = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.marketplace.orders.userOrders(),
      queryFn: () => marketplaceService.getUserOrders(),
      staleTime: 30 * 1000,
    });
  };
  
  return {
    prefetchProduct,
    prefetchOrder,
    prefetchUserProducts,
    prefetchUserOrders,
  };
};