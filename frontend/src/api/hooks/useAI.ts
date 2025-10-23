/**
 * React Query hooks for AI assistant with caching and optimization
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import aiService from '../services/aiService';
import { queryKeys, optimisticUpdates } from '../queryClient';
import type {
  Conversation,
  ConversationCreateData,
  Message,
  SendMessageData,
  PaginatedResponse,
  ConversationListParams,
} from '../types';

// Query hooks
export const useConversations = (params?: ConversationListParams) => {
  return useQuery({
    queryKey: queryKeys.ai.conversations.list(params),
    queryFn: () => aiService.getConversations(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useInfiniteConversations = (params?: Omit<ConversationListParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: queryKeys.ai.conversations.list({ ...params, infinite: true }),
    queryFn: ({ pageParam = 1 }) => aiService.getConversations({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<Conversation>) => {
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

export const useConversation = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.ai.conversations.detail(id),
    queryFn: () => aiService.getConversation(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000, // 30 seconds for active conversations
  });
};

export const useConversationMessages = (conversationId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.ai.conversations.messages(conversationId),
    queryFn: () => aiService.getConversationMessages(conversationId),
    enabled: enabled && !!conversationId,
    staleTime: 10 * 1000, // 10 seconds for messages
    refetchInterval: (data) => {
      // Auto-refetch if conversation is active and has recent messages
      if (data && data.length > 0) {
        const lastMessage = data[data.length - 1];
        const lastMessageTime = new Date(lastMessage.timestamp).getTime();
        const now = Date.now();
        const timeDiff = now - lastMessageTime;
        
        // Refetch every 5 seconds if last message was within 2 minutes
        return timeDiff < 2 * 60 * 1000 ? 5000 : false;
      }
      return false;
    },
  });
};

// Mutation hooks
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['create_conversation'],
    mutationFn: (conversationData: ConversationCreateData) => aiService.createConversation(conversationData),
    onSuccess: (newConversation: Conversation) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations.lists() });
      
      // Add to cache
      queryClient.setQueryData(queryKeys.ai.conversations.detail(newConversation.id), newConversation);
      
      // Initialize empty messages array
      queryClient.setQueryData(queryKeys.ai.conversations.messages(newConversation.id), []);
      
      // Optimistically update lists
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.ai.conversations.lists() });
      listQueries.forEach(([queryKey]) => {
        optimisticUpdates.updateList(queryKey, newConversation, 'create');
      });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['send_message'],
    mutationFn: ({ conversationId, messageData }: { conversationId: string; messageData: SendMessageData }) =>
      aiService.sendMessage(conversationId, messageData),
    onMutate: async ({ conversationId, messageData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.ai.conversations.messages(conversationId) });
      
      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData(queryKeys.ai.conversations.messages(conversationId));
      
      // Create optimistic user message
      const optimisticUserMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: messageData.content,
        timestamp: new Date().toISOString(),
        conversation_id: conversationId,
      };
      
      // Optimistically add user message
      queryClient.setQueryData(
        queryKeys.ai.conversations.messages(conversationId),
        (old: Message[] | undefined) => {
          if (!old) return [optimisticUserMessage];
          return [...old, optimisticUserMessage];
        }
      );
      
      return { previousMessages, conversationId };
    },
    onSuccess: (response, { conversationId }) => {
      // Replace optimistic message with real messages
      queryClient.setQueryData(
        queryKeys.ai.conversations.messages(conversationId),
        (old: Message[] | undefined) => {
          if (!old) return [response.user_message, response.assistant_message];
          
          // Remove the optimistic message and add real messages
          const withoutOptimistic = old.filter(msg => !msg.id.startsWith('temp-'));
          return [...withoutOptimistic, response.user_message, response.assistant_message];
        }
      );
      
      // Update conversation metadata
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations.lists() });
    },
    onError: (error, { conversationId }, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.ai.conversations.messages(conversationId), context.previousMessages);
      }
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['delete_conversation'],
    mutationFn: (id: string) => aiService.deleteConversation(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.ai.conversations.detail(id) });
      
      // Snapshot previous value
      const previousConversation = queryClient.getQueryData(queryKeys.ai.conversations.detail(id));
      
      // Optimistically remove from lists
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.ai.conversations.lists() });
      listQueries.forEach(([queryKey]) => {
        optimisticUpdates.updateList(queryKey, { id } as Conversation, 'delete');
      });
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.ai.conversations.detail(id) });
      queryClient.removeQueries({ queryKey: queryKeys.ai.conversations.messages(id) });
      
      return { previousConversation, id };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousConversation) {
        queryClient.setQueryData(queryKeys.ai.conversations.detail(id), context.previousConversation);
      }
    },
    onSettled: () => {
      // Refetch lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations.lists() });
    },
  });
};

// Voice-related mutations
export const useTranscribeAudio = () => {
  return useMutation({
    mutationKey: ['transcribe_audio'],
    mutationFn: (audioBlob: Blob) => aiService.transcribeAudio(audioBlob),
  });
};

export const useSynthesizeSpeech = () => {
  return useMutation({
    mutationKey: ['synthesize_speech'],
    mutationFn: ({ text, voice }: { text: string; voice?: string }) => 
      aiService.synthesizeSpeech(text, voice),
  });
};

// Utility hooks
export const useActiveConversation = (conversationId?: string) => {
  const { data: conversation } = useConversation(conversationId || '', !!conversationId);
  const { data: messages, isLoading: messagesLoading } = useConversationMessages(
    conversationId || '', 
    !!conversationId
  );
  
  return {
    conversation,
    messages: messages || [],
    isLoading: messagesLoading,
    hasMessages: (messages?.length || 0) > 0,
  };
};

export const useConversationSearch = (searchTerm: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.ai.conversations.list({ search: searchTerm }),
    queryFn: () => aiService.getConversations({ search: searchTerm }),
    enabled: enabled && searchTerm.length > 2,
    staleTime: 30 * 1000, // 30 seconds for search results
  });
};

// Prefetch utilities
export const useAIPrefetch = () => {
  const queryClient = useQueryClient();
  
  const prefetchConversation = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ai.conversations.detail(id),
      queryFn: () => aiService.getConversation(id),
      staleTime: 30 * 1000,
    });
  };
  
  const prefetchConversationMessages = (conversationId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ai.conversations.messages(conversationId),
      queryFn: () => aiService.getConversationMessages(conversationId),
      staleTime: 10 * 1000,
    });
  };
  
  const prefetchRecentConversations = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ai.conversations.list({ page_size: 10 }),
      queryFn: () => aiService.getConversations({ page_size: 10 }),
      staleTime: 1 * 60 * 1000,
    });
  };
  
  return {
    prefetchConversation,
    prefetchConversationMessages,
    prefetchRecentConversations,
  };
};