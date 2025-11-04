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
} from '../../types/ai';

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
            if (data && Array.isArray(data) && data.length > 0) {
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
                optimisticUpdates.updateList([...queryKey], newConversation, 'create');
            });
        },
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['send_message'],
        mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
            console.log('🔍 useSendMessage - Sending message:', { conversationId, contentLength: content.length });
            
            const response = await aiService.sendMessage(conversationId, { content });
            
            // Validate the response structure
            if (!response || !response.response || !response.message_id) {
                console.error('❌ useSendMessage - Invalid response format:', response);
                throw new Error('Invalid response format from AI service');
            }
            
            console.log('✅ useSendMessage - Response validated:', {
                hasResponse: !!response.response,
                responseLength: response.response.length,
                messageId: response.message_id
            });
            
            return response;
        },
        onMutate: async ({ conversationId, content }) => {
            console.log('🔄 useSendMessage - onMutate:', { conversationId });
            
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.ai.conversations.messages(conversationId) });

            // Snapshot previous messages
            const previousMessages = queryClient.getQueryData(queryKeys.ai.conversations.messages(conversationId));

            // Create optimistic user message
            const optimisticUserMessage: Message = {
                id: `temp-${Date.now()}`,
                role: 'user',
                content: content,
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
        onSuccess: (response, { conversationId, content }) => {
            console.log('✅ useSendMessage - onSuccess:', { 
                conversationId, 
                messageId: response.message_id,
                responseLength: response.response.length 
            });

            // Validate response before creating message
            if (!response.response) {
                console.error('❌ useSendMessage - AI response is empty');
                throw new Error('AI response is empty');
            }

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
                (old: Message[] | undefined) => {
                    if (!old) return [assistantMessage];
                    const withoutOptimistic = old.filter(msg => !msg.id.startsWith('temp-'));
                    return [...withoutOptimistic, assistantMessage];
                }
            );

            queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations.detail(conversationId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations.lists() });
        },
        onError: (error: Error, { conversationId }, context) => {
            console.error('❌ useSendMessage - onError:', error);
            
            // Rollback on error
            if (context?.previousMessages) {
                console.log('🔄 useSendMessage - Rolling back messages');
                queryClient.setQueryData(queryKeys.ai.conversations.messages(conversationId), context.previousMessages);
            }
            
            // Show specific error message
            const errorMessage = error.message.includes('Invalid response format') 
                ? 'The AI service returned an unexpected response format'
                : error.message.includes('empty response')
                ? 'AI service returned empty response'
                : 'Failed to send message';
                
            console.error('💬 useSendMessage - Error message:', errorMessage);
        },
        onSettled: (data, error, variables) => {
            console.log('🔚 useSendMessage - onSettled:', { 
                hasData: !!data, 
                hasError: !!error,
                conversationId: variables.conversationId 
            });
        },
    });
};

export const useDeleteConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['delete_conversation'],
        mutationFn: (id: string) => aiService.deleteConversation(id),
        onMutate: async (id: string) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.ai.conversations.detail(id) });

            // Snapshot previous value
            const previousConversation = queryClient.getQueryData(queryKeys.ai.conversations.detail(id));

            // Optimistically remove from lists
            const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.ai.conversations.lists() });
            listQueries.forEach(([queryKey]) => {
                optimisticUpdates.updateList([...queryKey], { id } as Conversation, 'delete');
            });

            // Remove from cache
            queryClient.removeQueries({ queryKey: queryKeys.ai.conversations.detail(id) });
            queryClient.removeQueries({ queryKey: queryKeys.ai.conversations.messages(id) });

            return { previousConversation, id };
        },
        onError: (error: Error, id: string, context) => {
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
        mutationFn: (audioBlob: Blob) => {
            // Convert Blob to File if needed
            const audioFile = audioBlob instanceof File ? audioBlob : new File([audioBlob], 'audio.wav', { type: audioBlob.type });
            return aiService.transcribeAudio({ audio_file: audioFile });
        },
    });
};

export const useSynthesizeSpeech = () => {
    return useMutation({
        mutationKey: ['synthesize_speech'],
        mutationFn: ({ text, voice }: { text: string; voice?: string }) =>
            aiService.synthesizeSpeech({ text, voice_model: voice || 'default' }),
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