import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Loader2, User, Sparkles, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VoiceInput } from '@/components/agrigpt/VoiceInput';
import { RecommendationsPanel } from '@/components/agrigpt/RecommendationsPanel';
import { ConversationManagement, ConversationSearch } from '@/components/agrigpt/ConversationManagement';

// Import React Query hooks
import { 
  useConversations, 
  useConversationMessages, 
  useCreateConversation, 
  useSendMessage,
  useDeleteConversation 
} from '../api/hooks/useAI';

interface Message {
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

interface Conversation {
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
  is_archived?: boolean;
}

export default function AgriGPT() {
  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // React Query hooks
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations({ 
    page_size: 20 
  });
  const { data: messagesData, refetch: refetchMessages } = useConversationMessages(
    currentConversationId || '',
    !!currentConversationId
  );
  const createConversationMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage();
  const deleteConversationMutation = useDeleteConversation();

  // Safely extract conversations array from PaginatedResponse
  const allConversations = Array.isArray(conversationsData) 
    ? conversationsData 
    : conversationsData?.results || [];

  // Filter conversations based on search and archive status
  const conversations = allConversations.filter((conv: Conversation) => {
    const matchesSearch = !searchQuery || 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchiveFilter = showArchived ? true : !conv.is_archived;
    return matchesSearch && matchesArchiveFilter;
  });

  const messages = messagesData || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🔄 Fixed auto-refetch with better conditions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Only refetch when we're actively waiting for a response
    if (currentConversationId && isSending && !sendMessageMutation.isPending) {
      console.log('🔄 Setting up auto-refetch for conversation:', currentConversationId);
      interval = setInterval(() => {
        console.log('🔄 Auto-refetching messages...');
        refetchMessages();
      }, 1500); // Reduced from 2000ms to 1500ms
    }
    
    return () => {
      if (interval) {
        console.log('🧹 Clearing auto-refetch interval');
        clearInterval(interval);
      }
    };
  }, [currentConversationId, isSending, sendMessageMutation.isPending, refetchMessages]);

  // 🛑 Generate unique request ID for deduplication
  const generateRequestId = useCallback(() => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const messageContent = inputMessage.trim();
    console.log('🚀 handleSendMessage - Starting:', { 
      messageContent, 
      currentConversationId,
      hasConversation: !!currentConversationId,
      isSending 
    });
    
    // 🛑 Prevent multiple sends
    setIsSending(true);
    const requestId = generateRequestId();
    setPendingRequestId(requestId);
    setInputMessage('');

    try {
      let conversationId = currentConversationId;

      // Create new conversation if none exists
      if (!conversationId) {
        console.log('📝 Creating new conversation...');
        const newConversation = await createConversationMutation.mutateAsync({
          title: messageContent.slice(0, 50),
          conversation_type: 'farming_advice',
          language: 'en'
        });
        conversationId = newConversation.id;
        setCurrentConversationId(conversationId);
        console.log('✅ New conversation created:', conversationId);
      }

      console.log('📤 Sending message to conversation:', conversationId);
      
      // 🛑 Use request ID for deduplication
      const response = await sendMessageMutation.mutateAsync({
        conversationId,
        content: messageContent,
        requestId // Pass request ID to backend
      });

      // Check if we got a valid AI response
      if (!response?.response) {
        console.error('❌ handleSendMessage - AI service returned empty response');
        throw new Error('AI service returned empty response');
      }

      console.log('✅ Message sent successfully:', {
        responseLength: response.response.length,
        messageId: response.message_id,
        requestId
      });

      // Force immediate refetch of messages
      setTimeout(() => {
        console.log('🔄 Manually refetching messages after success');
        refetchMessages();
      }, 300); // Reduced from 500ms to 300ms
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ handleSendMessage - Error:', error);
      
      // Only restore message if this is the most recent request
      if (pendingRequestId === requestId) {
        setInputMessage(messageContent);
      }

      let errorMessage = 'Failed to send message';
      
      if (error?.message?.includes('empty response')) {
        errorMessage = 'AI service is not generating responses currently. Please try again.';
      } else if (error?.message?.includes('Invalid response format')) {
        errorMessage = 'Service returned unexpected data format. Please contact support.';
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message?.includes('already being processed')) {
        errorMessage = 'Your message is already being processed. Please wait.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      console.error('💬 Displaying error to user:', errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // 🛑 Reset sending state
      setIsSending(false);
      setPendingRequestId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const loadConversation = (conversationId: string) => {
    console.log('💾 Loading conversation:', conversationId);
    setCurrentConversationId(conversationId);
  };

  const startNewConversation = () => {
    console.log('🆕 Starting new conversation');
    setCurrentConversationId(null);
    setInputMessage('');
    
    toast({
      title: "New Conversation",
      description: "Start a new farming consultation",
    });
  };

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      console.log('🗑️ Deleting conversation:', conversationId);
      await deleteConversationMutation.mutateAsync(conversationId);
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
      
      toast({
        title: "Conversation Deleted",
        description: "The conversation has been removed",
      });
    } catch (error: unknown) {
      console.error('❌ Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  };

  // 🎯 Use both local state and mutation state for loading
  const isLoading = isSending || sendMessageMutation.isPending || createConversationMutation.isPending;

  const quickQuestions = [
    "How do I treat tomato leaf curl disease?",
    "What's the best fertilizer for maize in Ghana?",
    "When should I plant cassava in West Africa?",
    "How can I improve clay soil for vegetable farming?",
    "What are organic ways to control aphids?",
    "How much water does rice need during dry season?"
  ];

  const farmingTopics = [
    { name: "Crop Health", emoji: "🌱" },
    { name: "Soil Management", emoji: "🪴" },
    { name: "Pest Control", emoji: "🐛" },
    { name: "Irrigation", emoji: "💧" },
    { name: "Harvesting", emoji: "🌾" },
    { name: "Market Prices", emoji: "💰" }
  ];

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  console.log('🔍 Component State:', {
    currentConversationId,
    messagesCount: messages.length,
    isLoading,
    isSending,
    sendMessagePending: sendMessageMutation.isPending,
    createConversationPending: createConversationMutation.isPending
  });

  return (
    <div className="container mx-auto p-4 max-w-7xl h-[calc(100vh-100px)]">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
        {/* Sidebar - Conversations */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Conversations
                {conversationsLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4">
                  <Button 
                    onClick={startNewConversation}
                    className="w-full mb-4"
                    variant="outline"
                    disabled={createConversationMutation.isPending || isSending}
                  >
                    + New Chat
                  </Button>

                  <div className="mb-4">
                    <ConversationSearch onSearch={setSearchQuery} />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant={!showArchived ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowArchived(false)}
                      className="flex-1 text-xs"
                    >
                      Active
                    </Button>
                    <Button
                      variant={showArchived ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowArchived(true)}
                      className="flex-1 text-xs"
                    >
                      Archived
                    </Button>
                  </div>

                  {conversations.length === 0 && !conversationsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No conversations yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv: Conversation) => (
                        <div
                          key={conv.id}
                          onClick={() => loadConversation(conv.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors group relative ${
                            currentConversationId === conv.id 
                              ? 'bg-primary/10 border border-primary/20' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="font-medium text-sm truncate pr-16">
                            {conv.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(conv.created_at).toLocaleDateString()} • {conv.message_count || 0} messages
                          </div>
                          
                          <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ConversationManagement
                              conversationId={conv.id}
                              isArchived={conv.is_archived}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => handleDeleteConversation(conv.id, e)}
                              disabled={deleteConversationMutation.isPending || isSending}
                            >
                              {deleteConversationMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <Card className="flex flex-col flex-1">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-green-50 dark:from-primary/10 dark:to-green-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      AgriGPT Assistant
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        AI Powered
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your expert farming advisor • Real-time AI
                    </p>
                  </div>
                </div>
                {currentConversationId && (
                  <Badge variant="outline" className="text-xs">
                    {messages.length} messages
                    {(isSending || sendMessageMutation.isPending) && (
                      <Loader2 className="h-3 w-3 animate-spin ml-1" />
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-280px)] p-6">
                {messages.length === 0 && !currentConversationId ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-green-100 dark:from-primary/20 dark:to-green-900/20 w-fit mx-auto mb-6">
                      <Bot className="h-16 w-16 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                      Welcome to AgriGPT!
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                      I'm your AI farming expert. Ask me anything about agriculture, crops, livestock, and sustainable farming practices.
                    </p>

                    {/* Farming Topics */}
                    <div className="mb-8">
                      <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                        Popular Topics
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                        {farmingTopics.map((topic, index) => (
                          <Badge 
                            key={index}
                            variant="secondary" 
                            className="p-3 text-center cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => !isSending && setInputMessage(`Tell me about ${topic.name.toLowerCase()}`)}
                          >
                            <span className="text-lg mr-2">{topic.emoji}</span>
                            {topic.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Quick Questions */}
                    <div className="space-y-3 max-w-2xl mx-auto">
                      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Quick Questions
                      </h4>
                      {quickQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full text-left justify-start h-auto p-4 hover:bg-primary/5 hover:border-primary/30 transition-all"
                          onClick={() => !isSending && setInputMessage(question)}
                          disabled={isSending}
                        >
                          <span className="flex-1">{question}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : messages.length === 0 && currentConversationId ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                      <Bot className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">New Conversation Started</h3>
                    <p className="text-muted-foreground mb-6">
                      Ask your first question about farming, crops, or agriculture.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message: Message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                            : 'bg-gradient-to-br from-green-500 to-emerald-600'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="h-5 w-5 text-white" />
                          ) : (
                            <Bot className="h-5 w-5 text-white" />
                          )}
                        </div>

                        {/* Message Content */}
                        <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-2xl px-5 py-3 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                          }`}>
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                          
                          {/* Message Metadata */}
                          <div className={`flex items-center gap-2 mt-1.5 px-2 ${
                            message.role === 'user' ? 'flex-row-reverse' : ''
                          }`}>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(message.timestamp)}
                            </span>
                            
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {message.confidence_score && (
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                    {Math.round(message.confidence_score * 100)}% confident
                                  </Badge>
                                )}
                                {message.tokens_used && (
                                  <span className="text-xs opacity-60">
                                    {message.tokens_used} tokens
                                  </span>
                                )}
                                {message.processing_time_ms && (
                                  <span className="text-xs opacity-60">
                                    • {(message.processing_time_ms / 1000).toFixed(1)}s
                                  </span>
                                )}
                                {message.model_used && (
                                  <span className="text-xs opacity-60">
                                    • {message.model_used}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {(isSending || sendMessageMutation.isPending) && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-green-500 to-emerald-600">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="rounded-2xl px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3">
                              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="border-t p-4 bg-muted/30">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <VoiceInput
                  onTranscript={(text) => setInputMessage(text)}
                  disabled={isLoading}
                />
                <Input
                  placeholder="Ask about crops, soil, pests, weather, market prices..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 text-base h-12"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="h-12 px-6"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="ml-2">Send</span>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center mt-2">
                Powered by OpenAI GPT-4 • Real-time agricultural expertise • Voice input enabled
                {(isSending || sendMessageMutation.isPending) && (
                  <span className="ml-2 text-primary">• Generating response...</span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Recommendations Panel */}
        <div className="lg:col-span-1 hidden lg:block">
          <RecommendationsPanel />
        </div>
      </div>
    </div>
  );
}