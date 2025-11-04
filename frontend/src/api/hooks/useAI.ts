import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import aiService from '../services/aiService';
import type {
  Conversation,
  ConversationCreateData,
  Message,
  SendMessageData,
  PaginatedResponse,
  ConversationListParams,
  SendMessageResponse
} from '../../types/ai';

// Query keys
export const queryKeys = {
  ai: {
    conversations: {
      lists: () => ['ai', 'conversations'] as const,
      list: (params?: ConversationListParams) => ['ai', 'conversations', 'list', params] as const,
      detail: (id: string) => ['ai', 'conversations', 'detail', id] as const,
      messages: (conversationId: string) => ['ai', 'conversations', 'messages', conversationId] as const,
    },
  },
};

// Query hooks
export const useConversations = (params?: ConversationListParams) => {
  return useQuery({
    queryKey: queryKeys.ai.conversations.list(params),
    queryFn: () => aiService.getConversations(params),
    staleTime: 1 * 60 * 1000,
  });
};

export const useConversationMessages = (conversationId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.ai.conversations.messages(conversationId),
    queryFn: () => aiService.getConversationMessages(conversationId),
    enabled: enabled && !!conversationId,
    staleTime: 10 * 1000,
  });
};

// Mutation hooks
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationData: ConversationCreateData) => 
      aiService.createConversation(conversationData),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.ai.conversations.lists() 
      });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { 
      conversationId: string; 
      content: string 
    }): Promise<SendMessageResponse> => {
      const response = await aiService.sendMessage(conversationId, { content });
      
      if (!response?.response) {
        throw new Error('AI service returned empty response');
      }
      
      return response;
    },
    onMutate: async ({ conversationId, content }) => {
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.ai.conversations.messages(conversationId) 
      });

      const previousMessages = queryClient.getQueryData(
        queryKeys.ai.conversations.messages(conversationId)
      ) as Message[];

      const optimisticUserMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: content,
        timestamp: new Date().toISOString(),
        conversation_id: conversationId,
      };

      queryClient.setQueryData(
        queryKeys.ai.conversations.messages(conversationId),
        (old: Message[] = []) => [...old, optimisticUserMessage]
      );

      return { previousMessages };
    },
    onSuccess: (response, { conversationId }) => {
      const assistantMessage: Message = {
        id: response.message_id,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        conversation_id: conversationId,
        confidence_score: response.confidence_score,
        tokens_used: response.tokens_used,
        processing_time_ms: response.processing_time_ms,
      };

      queryClient.setQueryData(
        queryKeys.ai.conversations.messages(conversationId),
        (old: Message[] = []) => {
          const withoutTemp = old.filter(msg => !msg.id.startsWith('temp-'));
          return [...withoutTemp, assistantMessage];
        }
      );

      queryClient.invalidateQueries({ 
        queryKey: queryKeys.ai.conversations.lists() 
      });
    },
    onError: (error: Error, { conversationId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.ai.conversations.messages(conversationId), 
          context.previousMessages
        );
      }
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => aiService.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.ai.conversations.lists() 
      });
    },
  });
};