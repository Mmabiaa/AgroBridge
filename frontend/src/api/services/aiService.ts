import apiClient from '../axiosClient';
import type {
  Conversation,
  ConversationCreateData,
  Message,
  SendMessageData,
  PaginatedResponse,
  ConversationListParams,
  SendMessageResponse
} from '../../types/ai';

class AIService {
  private readonly baseUrl = '/ai';

  async getConversations(params?: ConversationListParams): Promise<PaginatedResponse<Conversation>> {
    return apiClient.get<PaginatedResponse<Conversation>>(`${this.baseUrl}/conversations/`, { params });
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return apiClient.get<Message[]>(`${this.baseUrl}/conversations/${conversationId}/messages/`);
  }

  async createConversation(data: ConversationCreateData): Promise<Conversation> {
    return apiClient.post<Conversation>(`${this.baseUrl}/conversations/`, data);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/conversations/${conversationId}/`);
  }

  async sendMessage(conversationId: string, data: SendMessageData & { requestId?: string }): Promise<SendMessageResponse> {
    const response = await apiClient.post<SendMessageResponse>(
      `${this.baseUrl}/conversations/${conversationId}/send_message/`, 
      {
        content: data.content,
        message_type: data.message_type || 'text',
        attachments: data.attachments || [],
        request_id: data.requestId // 🆕 Include request ID for deduplication
      }
    );

    if (!response.response) {
      throw new Error('AI service returned empty response');
    }

    return response;
  }

  async transcribeVoice(audioBlob: Blob): Promise<{ text: string; language?: string; confidence?: number }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    return apiClient.post<{ text: string; language?: string; confidence?: number }>(
      `${this.baseUrl}/voice/transcribe/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  async getActiveRecommendations(): Promise<any[]> {
    return apiClient.get<any[]>(`${this.baseUrl}/recommendations/active/`);
  }

  async provideRecommendationFeedback(recommendationId: string, feedback: { rating: number; comment?: string }): Promise<void> {
    return apiClient.post(`${this.baseUrl}/recommendations/${recommendationId}/provide_feedback/`, feedback);
  }

  async archiveConversation(conversationId: string): Promise<void> {
    return apiClient.post(`${this.baseUrl}/conversations/${conversationId}/archive/`);
  }

  async unarchiveConversation(conversationId: string): Promise<void> {
    return apiClient.post(`${this.baseUrl}/conversations/${conversationId}/unarchive/`);
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>(`${this.baseUrl}/conversations/search/`, {
      params: { q: query },
    });
  }

  async exportConversation(conversationId: string, format: 'json' | 'txt' | 'pdf' = 'json'): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/conversations/${conversationId}/export/`, {
      params: { format },
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }
}

export default new AIService();