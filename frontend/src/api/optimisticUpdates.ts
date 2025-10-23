/**
 * Optimistic update utilities for better user experience
 */
import { queryClient, queryKeys, optimisticUpdates } from './queryClient';
import type { Farm, Product, Conversation, User } from './types';

// Farm optimistic updates
export const farmOptimisticUpdates = {
  // Create farm optimistically
  createFarm: (farmData: Partial<Farm>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticFarm: Farm = {
      id: tempId,
      name: farmData.name || '',
      description: farmData.description || '',
      location: farmData.location || {
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        coordinates: { latitude: 0, longitude: 0 },
      },
      size_hectares: farmData.size_hectares || 0,
      farm_type: farmData.farm_type || 'crop',
      crops: farmData.crops || [],
      owner: farmData.owner || '',
      owner_name: farmData.owner_name || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...farmData,
    };

    // Add to farm lists
    const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.farms.lists() });
    listQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], optimisticFarm, 'create');
    });

    // Add to user farms
    const userFarmQueries = queryClient.getQueriesData({ queryKey: queryKeys.farms.userFarms() });
    userFarmQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], optimisticFarm, 'create');
    });

    return tempId;
  },

  // Update farm optimistically
  updateFarm: (id: string, updateData: Partial<Farm>) => {
    // Update detail cache
    queryClient.setQueryData(queryKeys.farms.detail(id), (oldData: Farm | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updateData, updated_at: new Date().toISOString() };
    });

    // Update in all list caches
    const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.farms.lists() });
    listQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], { id, ...updateData }, 'update');
    });

    const userFarmQueries = queryClient.getQueriesData({ queryKey: queryKeys.farms.userFarms() });
    userFarmQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], { id, ...updateData }, 'update');
    });
  },

  // Delete farm optimistically
  deleteFarm: (id: string) => {
    // Remove from detail cache
    queryClient.removeQueries({ queryKey: queryKeys.farms.detail(id) });
    queryClient.removeQueries({ queryKey: queryKeys.farms.analytics(id) });

    // Remove from all list caches
    const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.farms.lists() });
    listQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], { id } as Farm, 'delete');
    });

    const userFarmQueries = queryClient.getQueriesData({ queryKey: queryKeys.farms.userFarms() });
    userFarmQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], { id } as Farm, 'delete');
    });
  },

  // Revert optimistic update on error
  revertFarmUpdate: (id: string, originalData?: Farm) => {
    if (originalData) {
      queryClient.setQueryData(queryKeys.farms.detail(id), originalData);
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.detail(id) });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.farms.lists() });
    queryClient.invalidateQueries({ queryKey: queryKeys.farms.userFarms() });
  },
};

// Product optimistic updates
export const productOptimisticUpdates = {
  // Create product optimistically
  createProduct: (productData: Partial<Product>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticProduct: Product = {
      id: tempId,
      seller: productData.seller || '',
      seller_name: productData.seller_name || '',
      name: productData.name || '',
      description: productData.description || '',
      category: productData.category || '',
      price: productData.price || 0,
      unit: productData.unit || 'kg',
      quantity_available: productData.quantity_available || 0,
      location: productData.location || {
        address: '',
        city: '',
        state: '',
        coordinates: { latitude: 0, longitude: 0 },
      },
      images: productData.images || [],
      quality_grade: productData.quality_grade || 'A',
      harvest_date: productData.harvest_date || new Date().toISOString().split('T')[0],
      expiry_date: productData.expiry_date || '',
      organic_certified: productData.organic_certified || false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...productData,
    };

    // Add to product lists
    const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.lists() });
    listQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], optimisticProduct, 'create');
    });

    // Add to user products
    const userProductQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.userProducts() });
    userProductQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], optimisticProduct, 'create');
    });

    return tempId;
  },

  // Update product optimistically
  updateProduct: (id: string, updateData: Partial<Product>) => {
    // Update detail cache
    queryClient.setQueryData(queryKeys.marketplace.products.detail(id), (oldData: Product | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updateData, updated_at: new Date().toISOString() };
    });

    // Update in all list caches
    const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.lists() });
    listQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], { id, ...updateData }, 'update');
    });

    const userProductQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.userProducts() });
    userProductQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], { id, ...updateData }, 'update');
    });
  },

  // Delete product optimistically
  deleteProduct: (id: string) => {
    // Remove from detail cache
    queryClient.removeQueries({ queryKey: queryKeys.marketplace.products.detail(id) });

    // Remove from all list caches
    const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.lists() });
    listQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], { id } as Product, 'delete');
    });

    const userProductQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.userProducts() });
    userProductQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], { id } as Product, 'delete');
    });
  },

  // Update product quantity after purchase
  updateProductQuantity: (id: string, quantityPurchased: number) => {
    queryClient.setQueryData(queryKeys.marketplace.products.detail(id), (oldData: Product | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        quantity_available: Math.max(0, oldData.quantity_available - quantityPurchased),
        updated_at: new Date().toISOString(),
      };
    });

    // Update in lists as well
    const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.marketplace.products.lists() });
    listQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], {
        id,
        quantity_available: (queryClient.getQueryData(queryKeys.marketplace.products.detail(id)) as Product)?.quantity_available,
      }, 'update');
    });
  },
};

// Conversation optimistic updates
export const conversationOptimisticUpdates = {
  // Create conversation optimistically
  createConversation: (conversationData: Partial<Conversation>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticConversation: Conversation = {
      id: tempId,
      title: conversationData.title || 'New Conversation',
      conversation_type: conversationData.conversation_type || 'farming_advice',
      status: 'active',
      context_data: conversationData.context_data || {},
      language: conversationData.language || 'en',
      voice_enabled: conversationData.voice_enabled || false,
      message_count: 0,
      total_tokens_used: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      ...conversationData,
    };

    // Add to conversation lists
    const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.ai.conversations.lists() });
    listQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], optimisticConversation, 'create');
    });

    return tempId;
  },

  // Add message optimistically
  addMessage: (conversationId: string, message: any) => {
    // Add to messages cache
    queryClient.setQueryData(queryKeys.ai.conversations.messages(conversationId), (oldData: any) => {
      if (!oldData) return [message];
      return [...oldData, message];
    });

    // Update conversation last activity and message count
    queryClient.setQueryData(queryKeys.ai.conversations.detail(conversationId), (oldData: Conversation | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        message_count: oldData.message_count + 1,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // Update in conversation lists
    const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.ai.conversations.lists() });
    listQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], {
        id: conversationId,
        message_count: (queryClient.getQueryData(queryKeys.ai.conversations.detail(conversationId)) as Conversation)?.message_count,
        last_activity: new Date().toISOString(),
      }, 'update');
    });
  },

  // Delete conversation optimistically
  deleteConversation: (id: string) => {
    // Remove from detail cache
    queryClient.removeQueries({ queryKey: queryKeys.ai.conversations.detail(id) });
    queryClient.removeQueries({ queryKey: queryKeys.ai.conversations.messages(id) });

    // Remove from all list caches
    const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.ai.conversations.lists() });
    listQueries.forEach(([queryKey]) => {
      optimisticUpdates.updateList(queryKey as any[], { id } as Conversation, 'delete');
    });
  },
};

// User profile optimistic updates
export const userOptimisticUpdates = {
  // Update user profile optimistically
  updateProfile: (updateData: Partial<User>) => {
    // Update user cache
    queryClient.setQueryData(queryKeys.auth.user(), (oldData: User | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updateData };
    });

    // Update profile cache
    queryClient.setQueryData(queryKeys.auth.profile(), (oldData: User | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updateData };
    });
  },

  // Revert profile update on error
  revertProfileUpdate: (originalData?: User) => {
    if (originalData) {
      queryClient.setQueryData(queryKeys.auth.user(), originalData);
      queryClient.setQueryData(queryKeys.auth.profile(), originalData);
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
    }
  },
};

// Generic optimistic update utilities
export const genericOptimisticUpdates = {
  // Create a temporary ID for optimistic updates
  createTempId: (prefix = 'temp') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  // Replace temporary ID with real ID after successful mutation
  replaceTempId: (queryKey: any[], tempId: string, realId: string, realData?: any) => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;

      if (Array.isArray(oldData)) {
        return oldData.map(item => 
          item.id === tempId ? { ...item, id: realId, ...realData } : item
        );
      }

      if (oldData.results && Array.isArray(oldData.results)) {
        return {
          ...oldData,
          results: oldData.results.map((item: any) =>
            item.id === tempId ? { ...item, id: realId, ...realData } : item
          ),
        };
      }

      if (oldData.id === tempId) {
        return { ...oldData, id: realId, ...realData };
      }

      return oldData;
    });
  },

  // Remove item with temporary ID on error
  removeTempItem: (queryKey: any[], tempId: string) => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;

      if (Array.isArray(oldData)) {
        return oldData.filter(item => item.id !== tempId);
      }

      if (oldData.results && Array.isArray(oldData.results)) {
        return {
          ...oldData,
          results: oldData.results.filter((item: any) => item.id !== tempId),
          count: Math.max(0, oldData.count - 1),
        };
      }

      return oldData;
    });
  },
};

export {
  farmOptimisticUpdates,
  productOptimisticUpdates,
  conversationOptimisticUpdates,
  userOptimisticUpdates,
  genericOptimisticUpdates,
};