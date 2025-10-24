/**
 * AgriGPT Page - Production Ready with API Integration
 */
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  MessageSquare,
  Loader2,
  Plus,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  useConversations,
  useCreateConversation,
  useSendMessage,
  useConversationMessages
} from '@/api/hooks/useAI';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage, ChatConversation } from '@/api/services/aiService';

export default function AgriGPT() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    searchParams.get('conversation')
  );
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // API hooks
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations();
  const { data: messagesData, isLoading: messagesLoading } = useConversationMessages(
    activeConversationId || ''
  );
  const createConversationMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage();

  const conversations = conversationsData?.results || [];
  const messages: ChatMessage[] = messagesData || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create new conversation
  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversationMutation.mutateAsync({
        title: 'New Farming Consultation',
        conversation_type: 'farming_advice',
        language: 'en',
      });
      setActiveConversationId(newConversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    let conversationId = activeConversationId;

    // Create conversation if none exists
    if (!conversationId) {
      try {
        const newConversation = await createConversationMutation.mutateAsync({
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          conversation_type: 'farming_advice',
          language: 'en',
        });
        conversationId = newConversation.id;
        setActiveConversationId(conversationId);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: conversationId!,
        content: message,
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick questions for new users
  const quickQuestions = [
    "How do I treat tomato leaf curl disease?",
    "What's the best fertilizer for maize?",
    "When should I plant onions in Ghana?",
    "How can I improve my soil quality?",
    "What are the signs of nutrient deficiency in crops?",
  ];

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  // Text-to-speech
  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

        {/* Sidebar - Conversations */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </CardTitle>
                <Button size="sm" onClick={handleNewConversation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {conversationsLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs">Start chatting to create one</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {conversations.map((conversation: ChatConversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${activeConversationId === conversation.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                          }`}
                        onClick={() => setActiveConversationId(conversation.id)}
                      >
                        <h4 className="font-medium text-sm line-clamp-1">
                          {conversation.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {conversation.message_count} messages
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conversation.last_activity).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">

            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>AgriGPT Assistant</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your AI farming advisor
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Online
                  </Badge>
                  {isSpeaking && (
                    <Button size="sm" variant="outline" onClick={stopSpeaking}>
                      <VolumeX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[calc(100vh-400px)] p-4">
                {!activeConversationId ? (
                  // Welcome screen
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                      <Bot className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Welcome to AgriGPT!
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      I'm your AI farming assistant. Ask me anything about crops,
                      livestock, soil management, pest control, and more.
                    </p>

                    {/* Quick Questions */}
                    <div className="space-y-2 max-w-lg mx-auto">
                      <h4 className="font-medium text-sm text-left">Try asking:</h4>
                      {quickQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full text-left justify-start h-auto p-3"
                          onClick={() => handleQuickQuestion(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : messagesLoading ? (
                  // Loading messages
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex gap-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Messages
                  <div className="space-y-4">
                    {messages.map((msg: ChatMessage) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''
                          }`}
                      >
                        <div className={`p-2 rounded-full ${msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                          }`}>
                          {msg.role === 'user' ? (
                            <div className="h-6 w-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-medium">
                              {user?.name?.charAt(0) || 'U'}
                            </div>
                          ) : msg.role === 'assistant' ? (
                            <Bot className="h-6 w-6" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center text-xs font-medium text-white">
                              S
                            </div>
                          )}
                        </div>

                        <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''
                          }`}>
                          <div className={`p-3 rounded-lg ${msg.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                            }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {msg.role === 'assistant' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-auto p-1"
                                onClick={() => speakMessage(msg.content)}
                              >
                                <Volume2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {sendMessageMutation.isPending && (
                      <div className="flex gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <Bot className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="p-3 rounded-lg bg-muted">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>AgriGPT is thinking...</span>
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
            <div className="border-t p-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Ask me anything about farming..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sendMessageMutation.isPending}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => setIsRecording(!isRecording)}
                    >
                      {isRecording ? (
                        <MicOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}