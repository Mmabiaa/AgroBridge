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

  async getConversation(conversationId: string): Promise<Conversation> {
    return apiClient.get<Conversation>(`${this.baseUrl}/conversations/${conversationId}/`);
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

  async sendMessage(conversationId: string, data: SendMessageData): Promise<SendMessageResponse> {
    console.log('🚀 Sending message to:', conversationId, data);
    
    const response = await apiClient.post<SendMessageResponse>(
      `${this.baseUrl}/conversations/${conversationId}/send_message/`, 
      {
        content: data.content,
        message_type: data.message_type || 'text',
        attachments: data.attachments || []
      }
    );

    // Validate response
    if (!response.response) {
      throw new Error('AI service returned empty response');
    }

    return response;
  }
}

export default new AIService();