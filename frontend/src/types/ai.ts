export interface Conversation {
  id: string;
  title: string;
  conversation_type: string;
  status: string;
  context_data?: Record<string, unknown>;
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

export interface SendMessageResponse {
  conversation_id: string;
  message_id: string;
  response: string;
  confidence_score?: number;
  processing_time_ms?: number;
  tokens_used?: number;
  recommendations?: unknown[];
  error?: string;
  status?: string;
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