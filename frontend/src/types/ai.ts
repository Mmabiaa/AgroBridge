// types/ai.ts
export interface ChatConversation {
  id: string;
  title: string;
  conversation_type: string;
  status: string;
  context_data: Record<string, unknown>;
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
  attachments: unknown[];
  voice_file?: string;
  metadata: Record<string, unknown>;
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
  content: Record<string, unknown>;
  confidence_score: number;
  reasoning: string;
  sources: unknown[];
  context_data: Record<string, unknown>;
  conditions: unknown[];
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

export interface KnowledgeBaseEntry {
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
}

export interface SendMessageResponse {
  conversation_id: string;
  message_id: string;
  response: string;
  confidence_score: number;
  processing_time_ms: number;
  tokens_used: number;
  recommendations: unknown[];
  error?: string;
  status?: string;
}

export interface CreateConversationRequest {
  title?: string;
  conversation_type?: string;
  context_data?: Record<string, unknown>;
  language?: string;
  voice_enabled?: boolean;
  initial_message?: string;
}

export interface SendMessageRequest {
  content: string;
  message_type?: string;
  attachments?: unknown[];
  voice_file?: File;
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

// For React Query hooks
export interface Conversation {
  id: string;
  title: string;
  conversation_type: string;
  status: string;
  context_data: Record<string, unknown>;
  language: string;
  voice_enabled: boolean;
  message_count: number;
  total_tokens_used: number;
  created_at: string;
  updated_at: string;
  last_activity: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  conversation_id: string;
  message_type?: string;
  tokens_used?: number;
  processing_time_ms?: number;
  confidence_score?: number;
  model_used?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationCreateData {
  title?: string;
  conversation_type?: string;
  context_data?: Record<string, unknown>;
  language?: string;
  voice_enabled?: boolean;
  initial_message?: string;
}

export interface SendMessageData {
  content: string;
  message_type?: string;
  attachments?: unknown[];
  voice_file?: File;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ConversationListParams {
  page?: number;
  page_size?: number;
  conversation_type?: string;
  status?: string;
  search?: string;
}

export interface VoiceCommandResponse {
  success: boolean;
  transcription: {
    text: string;
    confidence: number;
    language: string;
  };
  command_interpretation: Record<string, unknown>;
  text_response: string;
  audio_response: {
    url?: string;
    duration_seconds: number;
  };
  processing_summary: Record<string, unknown>;
  interaction_id: string;
  conversation_updated: boolean;
}

export interface VoiceStatistics {
  total_interactions: number;
  successful_interactions: number;
  failed_interactions: number;
  success_rate: number;
  average_confidence: number;
  average_processing_time_ms: number;
  language_distribution: Array<{ input_language: string; count: number }>;
}

export interface VoiceModelsResponse {
  language: string;
  voice_models: string[];
}

export interface SupportedLanguagesResponse {
  supported_languages: string[];
}

export interface UsageStatisticsResponse {
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
}

// Error types
export interface APIError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Query key types for React Query
export interface QueryKeys {
  ai: {
    conversations: {
      lists: () => readonly [string, string];
      list: (params?: ConversationListParams) => readonly [string, string, ConversationListParams?];
      detail: (id: string) => readonly [string, string, string];
      messages: (conversationId: string) => readonly [string, string, string];
    };
    recommendations: {
      lists: () => readonly [string, string];
      list: (params?: string) => readonly [string, string, string?];
      detail: (id: string) => readonly [string, string, string];
    };
    voice: {
      interactions: () => readonly [string, string];
      statistics: () => readonly [string, string];
    };
  };
}