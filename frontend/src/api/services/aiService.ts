/**
 * AI Assistant API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface ChatConversation {
  id: string;
  title: string;
  conversation_type: string;
  status: string;
  context_data: Record<string, any>;
  language: string;
  voice_enabled: boolean;
  message_count: number;
  total_tokens_used: number;
  created_at: string;
  updated_at: string;
  last_activity: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: string;
  attachments: any[];
  voice_file?: string;
  metadata: Record<string, any>;
  tokens_used: number;
  processing_time_ms?: number;
  confidence_score?: number;
  is_edited: boolean;
  is_flagged: boolean;
  timestamp: string;
}

export interface AIRecommendation {
  id: string;
  recommendation_type: string;
  title: string;
  description: string;
  content: Record<string, any>;
  confidence_score: number;
  reasoning: string;
  sources: any[];
  context_data: Record<string, any>;
  conditions: any[];
  status: string;
  priority: string;
  valid_from: string;
  valid_until?: string;
  user_rating?: number;
  user_feedback: string;
  implementation_notes: string;
  implementation_date?: string;
  created_at: string;
  updated_at: string;
}

export interface VoiceInteraction {
  id: string;
  audio_input?: string;
  audio_output?: string;
  transcribed_text: string;
  response_text: string;
  status: string;
  processing_time_ms: number;
  transcription_confidence?: number;
  input_language: string;
  output_language: string;
  voice_model: string;
  error_message: string;
  created_at: string;
  completed_at?: string;
}

export interface CreateConversationRequest {
  title?: string;
  conversation_type?: string;
  context_data?: Record<string, any>;
  language?: string;
  voice_enabled?: boolean;
  initial_message?: string;
}

export interface SendMessageRequest {
  content: string;
  message_type?: string;
  attachments?: any[];
  voice_file?: File;
}

export interface SendMessageResponse {
  conversation_id: string;
  message_id: string;
  response: string;
  confidence_score: number;
  processing_time_ms: number;
  tokens_used: number;
  recommendations: any[];
  error?: string;
  status?: string;
}

export interface RecommendationFeedbackRequest {
  user_rating: number;
  user_feedback?: string;
  status?: 'accepted' | 'rejected' | 'implemented';
  implementation_notes?: string;
}

export interface VoiceTranscriptionRequest {
  audio_file: File;
  language?: string;
}

export interface VoiceSynthesisRequest {
  text: string;
  language?: string;
  voice_model?: string;
}

export interface AIUsageStatistics {
  user: string;
  date: string;
  conversations_started: number;
  messages_sent: number;
  voice_interactions: number;
  recommendations_received: number;
  recommendations_implemented: number;
  total_tokens_used: number;
  features_used: Record<string, number>;
  average_response_time_ms: number;
  user_satisfaction_score?: number;
}

class AIService {
  private readonly baseUrl = '/ai';

  /**
   * Get list of conversations
   */
  async getConversations(params?: {
    page?: number;
    page_size?: number;
    conversation_type?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<ChatConversation>> {
    return apiClient.getPaginated<ChatConversation>(`${this.baseUrl}/conversations/`, params);
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<ChatConversation> {
    return apiClient.get<ChatConversation>(`${this.baseUrl}/conversations/${conversationId}/`);
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return apiClient.get<ChatMessage[]>(`${this.baseUrl}/conversations/${conversationId}/messages/`);
  }

  /**
   * Create new conversation
   */
  async createConversation(data: CreateConversationRequest): Promise<ChatConversation> {
    return apiClient.post<ChatConversation>(`${this.baseUrl}/conversations/`, data);
  }

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string, 
    data: Partial<CreateConversationRequest>
  ): Promise<ChatConversation> {
    return apiClient.patch<ChatConversation>(`${this.baseUrl}/conversations/${conversationId}/`, data);
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/conversations/${conversationId}/`);
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/conversations/${conversationId}/archive/`);
  }

  /**
   * Restore conversation
   */
  async restoreConversation(conversationId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/conversations/${conversationId}/restore/`);
  }

  /**
   * Send message in conversation
   */
  async sendMessage(
    conversationId: string, 
    data: SendMessageRequest
  ): Promise<SendMessageResponse> {
    try {
      let response: SendMessageResponse;

      // If there's a voice file, use FormData
      if (data.voice_file) {
        const formData = new FormData();
        formData.append('content', data.content);
        
        if (data.message_type) {
          formData.append('message_type', data.message_type);
        }
        
        if (data.attachments) {
          formData.append('attachments', JSON.stringify(data.attachments));
        }
        
        formData.append('voice_file', data.voice_file);

        response = await apiClient.post<SendMessageResponse>(
          `${this.baseUrl}/conversations/${conversationId}/send_message/`, 
          formData, 
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
      } else {
        // For text messages, use JSON
        response = await apiClient.post<SendMessageResponse>(
          `${this.baseUrl}/conversations/${conversationId}/send_message/`, 
          {
            content: data.content,
            message_type: data.message_type || 'text',
            attachments: data.attachments || []
          }
        );
      }

      console.log('🔍 AI Service - Send Message Response:', {
        status: 'success',
        hasResponse: !!response.response,
        responseLength: response.response?.length,
        messageId: response.message_id,
        conversationId: response.conversation_id
      });

      // Validate required fields
      if (!response.response) {
        console.error('❌ AI Service - Invalid response: missing response field', response);
        throw new Error('Invalid response: AI service returned empty response');
      }

      if (!response.message_id) {
        console.error('❌ AI Service - Invalid response: missing message_id', response);
        throw new Error('Invalid response: missing message ID');
      }

      return response;
    } catch (error) {
      console.error('❌ AI Service - Send message error:', error);
      throw error;
    }
  }

  /**
   * Get messages for conversation
   */
  async getMessages(conversationId: string, params?: {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<ChatMessage>> {
    return apiClient.getPaginated<ChatMessage>(
      `${this.baseUrl}/conversations/${conversationId}/messages/`,
      params
    );
  }

  /**
   * Get list of recommendations
   */
  async getRecommendations(params?: {
    page?: number;
    page_size?: number;
    recommendation_type?: string;
    status?: string;
    priority?: string;
  }): Promise<PaginatedResponse<AIRecommendation>> {
    return apiClient.getPaginated<AIRecommendation>(`${this.baseUrl}/recommendations/`, params);
  }

  /**
   * Get recommendation by ID
   */
  async getRecommendation(recommendationId: string): Promise<AIRecommendation> {
    return apiClient.get<AIRecommendation>(`${this.baseUrl}/recommendations/${recommendationId}/`);
  }

  /**
   * Provide feedback on recommendation
   */
  async provideRecommendationFeedback(
    recommendationId: string,
    feedback: RecommendationFeedbackRequest
  ): Promise<AIRecommendation> {
    return apiClient.post<AIRecommendation>(
      `${this.baseUrl}/recommendations/${recommendationId}/provide_feedback/`,
      feedback
    );
  }

  /**
   * Get active recommendations
   */
  async getActiveRecommendations(): Promise<PaginatedResponse<AIRecommendation>> {
    return apiClient.getPaginated<AIRecommendation>(`${this.baseUrl}/recommendations/active/`);
  }

  /**
   * Get recommendations by type
   */
  async getRecommendationsByType(type: string): Promise<AIRecommendation[]> {
    return apiClient.get<AIRecommendation[]>(`${this.baseUrl}/recommendations/by_type/`, {
      params: { type },
    });
  }

  /**
   * Transcribe audio to text
   */
  async transcribeAudio(data: VoiceTranscriptionRequest): Promise<{
    success: boolean;
    transcription: string;
    confidence: number;
    language: string;
    duration_seconds: number;
    word_count: number;
    interaction_id: string;
  }> {
    const formData = new FormData();
    formData.append('audio_file', data.audio_file);
    
    if (data.language) {
      formData.append('language', data.language);
    }

    return apiClient.post<{
      success: boolean;
      transcription: string;
      confidence: number;
      language: string;
      duration_seconds: number;
      word_count: number;
      interaction_id: string;
    }>(`${this.baseUrl}/voice/transcribe/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  /**
   * Synthesize text to speech
   */
  async synthesizeSpeech(data: VoiceSynthesisRequest): Promise<{
    success: boolean;
    audio_url?: string;
    duration_seconds: number;
    character_count: number;
    language: string;
    voice_model: string;
    interaction_id: string;
  }> {
    return apiClient.post<{
      success: boolean;
      audio_url?: string;
      duration_seconds: number;
      character_count: number;
      language: string;
      voice_model: string;
      interaction_id: string;
    }>(`${this.baseUrl}/voice/synthesize/`, data);
  }

  /**
   * Process complete voice command
   */
  async processVoiceCommand(
    audioFile: File,
    conversationId?: string,
    language?: string
  ): Promise<{
    success: boolean;
    transcription: {
      text: string;
      confidence: number;
      language: string;
    };
    command_interpretation: Record<string, any>;
    text_response: string;
    audio_response: {
      url?: string;
      duration_seconds: number;
    };
    processing_summary: Record<string, any>;
    interaction_id: string;
    conversation_updated: boolean;
  }> {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    
    if (conversationId) {
      formData.append('conversation_id', conversationId);
    }
    
    if (language) {
      formData.append('language', language);
    }

    return apiClient.post<{
      success: boolean;
      transcription: {
        text: string;
        confidence: number;
        language: string;
      };
      command_interpretation: Record<string, any>;
      text_response: string;
      audio_response: {
        url?: string;
        duration_seconds: number;
      };
      processing_summary: Record<string, any>;
      interaction_id: string;
      conversation_updated: boolean;
    }>(`${this.baseUrl}/voice/process_command/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  /**
   * Get supported languages for voice processing
   */
  async getSupportedLanguages(): Promise<{ supported_languages: string[] }> {
    return apiClient.get<{ supported_languages: string[] }>(`${this.baseUrl}/voice/supported_languages/`);
  }

  /**
   * Get available voice models
   */
  async getVoiceModels(language?: string): Promise<{
    language: string;
    voice_models: string[];
  }> {
    return apiClient.get<{
      language: string;
      voice_models: string[];
    }>(`${this.baseUrl}/voice/voice_models/`, {
      params: language ? { language } : undefined,
    });
  }

  /**
   * Get voice interaction statistics
   */
  async getVoiceStatistics(): Promise<{
    total_interactions: number;
    successful_interactions: number;
    failed_interactions: number;
    success_rate: number;
    average_confidence: number;
    average_processing_time_ms: number;
    language_distribution: Array<{ input_language: string; count: number }>;
  }> {
    return apiClient.get(`${this.baseUrl}/voice/statistics/`);
  }

  /**
   * Get usage statistics
   */
  async getUsageStatistics(params?: {
    days?: number;
  }): Promise<{
    period_days: number;
    summary: {
      total_conversations: number;
      total_messages: number;
      total_voice_interactions: number;
      total_recommendations: number;
      implemented_recommendations: number;
      total_tokens: number;
      avg_satisfaction: number;
    };
    daily_stats: AIUsageStatistics[];
  }> {
    return apiClient.get(`${this.baseUrl}/statistics/summary/`, { params });
  }

  /**
   * Get knowledge base entries
   */
  async getKnowledgeBase(params?: {
    page?: number;
    page_size?: number;
    content_type?: string;
    category?: string;
    language?: string;
    search?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    title: string;
    content_type: string;
    category: string;
    content: string;
    summary: string;
    tags: string[];
    keywords: string[];
    relevance_score: number;
    usage_count: number;
    language: string;
    created_at: string;
  }>> {
    return apiClient.getPaginated(`${this.baseUrl}/knowledge/`, params);
  }

  /**
   * Get knowledge base entry by ID
   */
  async getKnowledgeEntry(entryId: string): Promise<{
    id: string;
    title: string;
    content_type: string;
    category: string;
    content: string;
    summary: string;
    tags: string[];
    keywords: string[];
    relevance_score: number;
    usage_count: number;
    language: string;
    created_at: string;
  }> {
    return apiClient.get(`${this.baseUrl}/knowledge/${entryId}/`);
  }
}

export default new AIService();