/**
 * Community Platform API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface Post {
  id: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  images?: string[];
  videos?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  likes_count: number;
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  attachments?: Array<{
    type: 'image' | 'document';
    url: string;
    filename: string;
  }>;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    username: string;
    avatar?: string;
  }>;
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePostRequest {
  content: string;
  images?: File[];
  videos?: File[];
}

export interface PostListParams {
  page?: number;
  page_size?: number;
  author?: string;
  ordering?: string;
}

class CommunityService {
  private readonly baseUrl = '/community';

  /**
   * Get community feed
   */
  async getFeed(params?: PostListParams): Promise<PaginatedResponse<Post>> {
    return apiClient.getPaginated<Post>(`${this.baseUrl}/feed`, params);
  }

  /**
   * Get list of posts
   */
  async getPosts(params?: PostListParams): Promise<PaginatedResponse<Post>> {
    return apiClient.getPaginated<Post>(`${this.baseUrl}/posts`, params);
  }

  /**
   * Get post by ID
   */
  async getPost(postId: string): Promise<Post> {
    return apiClient.get<Post>(`${this.baseUrl}/posts/${postId}`);
  }

  /**
   * Create post
   */
  async createPost(data: CreatePostRequest): Promise<Post> {
    // Handle file uploads
    if (data.images || data.videos) {
      const formData = new FormData();
      formData.append('content', data.content);
      
      if (data.images) {
        data.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }
      
      if (data.videos) {
        data.videos.forEach((video, index) => {
          formData.append(`videos[${index}]`, video);
        });
      }

      return apiClient.post<Post>(`${this.baseUrl}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return apiClient.post<Post>(`${this.baseUrl}/posts`, data);
  }

  /**
   * Update post
   */
  async updatePost(postId: string, data: { content: string }): Promise<Post> {
    return apiClient.patch<Post>(`${this.baseUrl}/posts/${postId}`, data);
  }

  /**
   * Delete post
   */
  async deletePost(postId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/posts/${postId}`);
  }

  /**
   * Like post
   */
  async likePost(postId: string): Promise<{ message: string; likes_count: number }> {
    return apiClient.post<{ message: string; likes_count: number }>(
      `${this.baseUrl}/posts/${postId}/like`
    );
  }

  /**
   * Unlike post
   */
  async unlikePost(postId: string): Promise<{ message: string; likes_count: number }> {
    return apiClient.delete<{ message: string; likes_count: number }>(
      `${this.baseUrl}/posts/${postId}/like`
    );
  }

  /**
   * Share post
   */
  async sharePost(postId: string): Promise<{ message: string; shares_count: number }> {
    return apiClient.post<{ message: string; shares_count: number }>(
      `${this.baseUrl}/posts/${postId}/share`
    );
  }

  /**
   * Bookmark post
   */
  async bookmarkPost(postId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/posts/${postId}/bookmark`);
  }

  /**
   * Get post comments
   */
  async getComments(postId: string): Promise<Comment[]> {
    return apiClient.get<Comment[]>(`${this.baseUrl}/posts/${postId}/comments`);
  }

  /**
   * Create comment
   */
  async createComment(postId: string, content: string): Promise<Comment> {
    return apiClient.post<Comment>(`${this.baseUrl}/posts/${postId}/comments`, { content });
  }

  /**
   * Update comment
   */
  async updateComment(postId: string, commentId: string, content: string): Promise<Comment> {
    return apiClient.patch<Comment>(
      `${this.baseUrl}/posts/${postId}/comments/${commentId}`,
      { content }
    );
  }

  /**
   * Delete comment
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/posts/${postId}/comments/${commentId}`);
  }

  /**
   * Like comment
   */
  async likeComment(postId: string, commentId: string): Promise<{ message: string; likes_count: number }> {
    return apiClient.post<{ message: string; likes_count: number }>(
      `${this.baseUrl}/posts/${postId}/comments/${commentId}/like`
    );
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<{
    user: {
      id: string;
      username: string;
      avatar?: string;
      bio?: string;
    };
    posts_count: number;
    followers_count: number;
    following_count: number;
    is_following?: boolean;
  }> {
    return apiClient.get(`${this.baseUrl}/users/${userId}`);
  }

  /**
   * Follow user
   */
  async followUser(userId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/users/${userId}/follow`);
  }

  /**
   * Unfollow user
   */
  async unfollowUser(userId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`${this.baseUrl}/users/${userId}/follow`);
  }

  /**
   * Get conversations
   */
  async getConversations(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>(`${this.baseUrl}/messages`);
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    return apiClient.get<Message[]>(`${this.baseUrl}/messages/${conversationId}`);
  }

  /**
   * Send message
   */
  async sendMessage(recipientId: string, content: string, attachments?: File[]): Promise<Message> {
    if (attachments && attachments.length > 0) {
      const formData = new FormData();
      formData.append('recipient', recipientId);
      formData.append('content', content);
      attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      return apiClient.post<Message>(`${this.baseUrl}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return apiClient.post<Message>(`${this.baseUrl}/messages`, {
      recipient: recipientId,
      content,
    });
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `${this.baseUrl}/messages/${conversationId}/mark-read`
    );
  }
}

export default new CommunityService();
