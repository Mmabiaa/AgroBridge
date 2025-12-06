/**
 * React Query hooks for Community Platform
 */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import communityService, {
  Post,
  Comment,
  CreatePostRequest,
  PostListParams,
  Message,
  Conversation,
} from '../services/community.service';
import { toast } from 'sonner';

// Query keys for cache management
export const communityKeys = {
  all: ['community'] as const,
  feed: () => [...communityKeys.all, 'feed'] as const,
  posts: () => [...communityKeys.all, 'posts'] as const,
  post: (id: string) => [...communityKeys.posts(), id] as const,
  comments: (postId: string) => [...communityKeys.post(postId), 'comments'] as const,
  userProfile: (userId: string) => [...communityKeys.all, 'user', userId] as const,
  conversations: () => [...communityKeys.all, 'conversations'] as const,
  messages: (conversationId: string) => [...communityKeys.conversations(), conversationId] as const,
};

/**
 * Get community feed with infinite scroll
 */
export function useFeed() {
  return useInfiniteQuery({
    queryKey: communityKeys.feed(),
    queryFn: ({ pageParam = 1 }) =>
      communityService.getFeed({ page: pageParam as number, page_size: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        return Number(url.searchParams.get('page'));
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get posts list
 */
export function usePosts(params?: PostListParams) {
  return useQuery({
    queryKey: [...communityKeys.posts(), params],
    queryFn: () => communityService.getPosts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single post
 */
export function usePost(postId: string) {
  return useQuery({
    queryKey: communityKeys.post(postId),
    queryFn: () => communityService.getPost(postId),
    enabled: !!postId,
  });
}

/**
 * Create post mutation
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => communityService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.feed() });
      queryClient.invalidateQueries({ queryKey: communityKeys.posts() });
      toast.success('Post created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create post');
    },
  });
}

/**
 * Update post mutation
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      communityService.updatePost(postId, { content }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.post(variables.postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.feed() });
      toast.success('Post updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update post');
    },
  });
}

/**
 * Delete post mutation
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => communityService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.feed() });
      queryClient.invalidateQueries({ queryKey: communityKeys.posts() });
      toast.success('Post deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete post');
    },
  });
}

/**
 * Like post mutation with optimistic update
 */
export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => communityService.likePost(postId),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: communityKeys.post(postId) });

      // Snapshot previous value
      const previousPost = queryClient.getQueryData<Post>(communityKeys.post(postId));

      // Optimistically update
      if (previousPost) {
        queryClient.setQueryData<Post>(communityKeys.post(postId), {
          ...previousPost,
          likes_count: previousPost.likes_count + 1,
          is_liked: true,
        });
      }

      return { previousPost };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(communityKeys.post(postId), context.previousPost);
      }
      toast.error('Failed to like post');
    },
    onSettled: (data, error, postId) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.post(postId) });
    },
  });
}

/**
 * Unlike post mutation
 */
export function useUnlikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => communityService.unlikePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: communityKeys.post(postId) });
      const previousPost = queryClient.getQueryData<Post>(communityKeys.post(postId));

      if (previousPost) {
        queryClient.setQueryData<Post>(communityKeys.post(postId), {
          ...previousPost,
          likes_count: Math.max(0, previousPost.likes_count - 1),
          is_liked: false,
        });
      }

      return { previousPost };
    },
    onError: (err, postId, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(communityKeys.post(postId), context.previousPost);
      }
      toast.error('Failed to unlike post');
    },
    onSettled: (data, error, postId) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.post(postId) });
    },
  });
}

/**
 * Share post mutation
 */
export function useSharePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => communityService.sharePost(postId),
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.post(postId) });
      toast.success('Post shared successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to share post');
    },
  });
}

/**
 * Bookmark post mutation
 */
export function useBookmarkPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => communityService.bookmarkPost(postId),
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.post(postId) });
      toast.success('Post bookmarked');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to bookmark post');
    },
  });
}

/**
 * Get post comments
 */
export function useComments(postId: string) {
  return useQuery({
    queryKey: communityKeys.comments(postId),
    queryFn: () => communityService.getComments(postId),
    enabled: !!postId,
  });
}

/**
 * Create comment mutation
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      communityService.createComment(postId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(variables.postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.post(variables.postId) });
      toast.success('Comment added');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
}

/**
 * Update comment mutation
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      commentId,
      content,
    }: {
      postId: string;
      commentId: string;
      content: string;
    }) => communityService.updateComment(postId, commentId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(variables.postId) });
      toast.success('Comment updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update comment');
    },
  });
}

/**
 * Delete comment mutation
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      communityService.deleteComment(postId, commentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(variables.postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.post(variables.postId) });
      toast.success('Comment deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });
}

/**
 * Like comment mutation
 */
export function useLikeComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      communityService.likeComment(postId, commentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(variables.postId) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to like comment');
    },
  });
}

/**
 * Get user profile
 */
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: communityKeys.userProfile(userId),
    queryFn: () => communityService.getUserProfile(userId),
    enabled: !!userId,
  });
}

/**
 * Follow user mutation
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => communityService.followUser(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.userProfile(userId) });
      toast.success('User followed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to follow user');
    },
  });
}

/**
 * Unfollow user mutation
 */
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => communityService.unfollowUser(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.userProfile(userId) });
      toast.success('User unfollowed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unfollow user');
    },
  });
}

/**
 * Get conversations
 */
export function useConversations() {
  return useQuery({
    queryKey: communityKeys.conversations(),
    queryFn: () => communityService.getConversations(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get messages for a conversation
 */
export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: communityKeys.messages(conversationId),
    queryFn: () => communityService.getMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });
}

/**
 * Send message mutation
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipientId,
      content,
      attachments,
    }: {
      recipientId: string;
      content: string;
      attachments?: File[];
    }) => communityService.sendMessage(recipientId, content, attachments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.conversations() });
      toast.success('Message sent');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
}

/**
 * Mark messages as read mutation
 */
export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      communityService.markMessagesAsRead(conversationId),
    onSuccess: (data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.conversations() });
    },
  });
}
