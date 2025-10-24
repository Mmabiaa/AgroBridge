import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Loader2, User, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    tokens_used?: number;
    confidence_score?: number;
    model?: string;
  };
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export default function AgriGPT() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // React Query hooks
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations({ 
    page_size: 20 
  });
  const { data: messagesData, isLoading: messagesLoading } = useConversationMessages(
    currentConversationId || '',
    !!currentConversationId
  );
  const createConversationMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage();
  const deleteConversationMutation = useDeleteConversation();

  // Safely extract conversations array from PaginatedResponse
  const conversations = Array.isArray(conversationsData) 
    ? conversationsData 
    : conversationsData?.results || [];

  const messages = messagesData || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      let conversationId = currentConversationId;

      // Create new conversation if none exists
      if (!conversationId) {
        const newConversation = await createConversationMutation.mutateAsync({
          title: inputMessage.slice(0, 50),
          conversation_type: 'farming_advice',
          language: 'en'
        });
        conversationId = newConversation.id;
        setCurrentConversationId(conversationId);
      }

      // Send message
      await sendMessageMutation.mutateAsync({
        conversationId,
        content: inputMessage
      });

      setInputMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const loadConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const startNewConversation = () => {
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
      await deleteConversationMutation.mutateAsync(conversationId);
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
      
      toast({
        title: "Conversation Deleted",
        description: "The conversation has been removed",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  };

  const isLoading = 
    sendMessageMutation.isPending || 
    createConversationMutation.isPending ||
    messagesLoading;

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

  return (
    <div className="container mx-auto p-4 max-w-6xl h-[calc(100vh-100px)]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
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
                    disabled={createConversationMutation.isPending}
                  >
                    + New Chat
                  </Button>

                  {conversations.length === 0 && !conversationsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No conversations yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => loadConversation(conv.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors group relative ${
                            currentConversationId === conv.id 
                              ? 'bg-primary/10 border border-primary/20' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="font-medium text-sm truncate pr-8">
                            {conv.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(conv.created_at).toLocaleDateString()} • {conv.message_count || 0} messages
                          </div>
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            disabled={deleteConversationMutation.isPending}
                          >
                            {deleteConversationMutation.isPending && deleteConversationMutation.variables === conv.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
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
                            onClick={() => setInputMessage(`Tell me about ${topic.name.toLowerCase()}`)}
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
                          onClick={() => setInputMessage(question)}
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
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`p-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted border'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="h-5 w-5" />
                          ) : (
                            <Bot className="h-5 w-5" />
                          )}
                        </div>

                        <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                          <div className={`p-4 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-auto shadow-sm'
                              : 'bg-white dark:bg-gray-800 border shadow-sm'
                          }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                          
                          <div className={`flex items-center gap-3 mt-2 text-xs text-muted-foreground ${
                            message.role === 'user' ? 'justify-end' : 'justify-between'
                          }`}>
                            <span>
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {message.role === 'assistant' && message.metadata && (
                              <div className="flex items-center gap-2">
                                {message.metadata.confidence_score && (
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(message.metadata.confidence_score * 100)}% confident
                                  </Badge>
                                )}
                                {message.metadata.tokens_used && (
                                  <span className="text-xs">
                                    {message.metadata.tokens_used} tokens
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-4">
                        <div className="p-3 rounded-2xl bg-muted border">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border shadow-sm">
                            <div className="flex items-center gap-3">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <span className="text-muted-foreground">AgriGPT is thinking...</span>
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
                <Input
                  placeholder="Ask about crops, soil, pests, weather, market prices..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
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
                AgriGPT provides real-time farming advice using AI
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}