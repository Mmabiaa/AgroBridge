import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Loader2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AgriGPTSimple() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createConversation = async () => {
    try {
      const response = await fetch('/api/v1/ai/conversations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          title: 'New Farming Consultation',
          conversation_type: 'farming_advice',
          language: 'en'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.id);
        return data.id;
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
    return null;
  };

  const sendMessage = async (message: string, convId?: string) => {
    try {
      const response = await fetch(`/api/v1/ai/conversations/${convId}/send_message/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          content: message
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let currentConvId = conversationId;
      
      // Create conversation if it doesn't exist
      if (!currentConvId) {
        currentConvId = await createConversation();
        if (!currentConvId) {
          throw new Error('Failed to create conversation');
        }
      }

      // Send message
      const response = await sendMessage(inputMessage, currentConvId);
      
      const assistantMessage: Message = {
        id: response.message_id || Date.now().toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add fallback response
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm here to help with your farming questions! I can provide advice on crops, livestock, soil management, pest control, and more. What would you like to know?",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "How do I treat tomato leaf curl disease?",
    "What's the best fertilizer for maize?",
    "When should I plant onions in Ghana?",
    "How can I improve my soil quality?",
    "What are the signs of nutrient deficiency in crops?"
  ];

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-120px)]">
      <Card className="h-full flex flex-col">
        {/* Header */}
        <CardHeader className="border-b">
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
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-300px)] p-4">
            {messages.length === 0 ? (
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
                      onClick={() => setInputMessage(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              // Messages
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`p-2 rounded-full ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-6 w-6" />
                      ) : (
                        <Bot className="h-6 w-6" />
                      )}
                    </div>

                    <div className={`flex-1 max-w-[80%] ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}>
                      <div className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
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
            <Input
              placeholder="Ask me anything about farming..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}