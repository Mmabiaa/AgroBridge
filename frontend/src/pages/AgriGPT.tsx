import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Loader2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AgriGPT() {
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

  // Create new conversation
  const createConversation = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/conversations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          title: 'New Farming Consultation',
          conversation_type: 'farming_advice',
          language: 'en',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.id);
        return data.id;
      } else {
        const errorText = await response.text();
        console.error('Create conversation failed:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  };

  // Send message to backend
  const sendMessage = async (message: string, convId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/conversations/${convId}/send_message/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ content: message }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Send message failed:', response.status, text);
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  };

  // Handle user sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      let convId = conversationId;
      if (!convId) convId = await createConversation();
      if (!convId) throw new Error('Could not create conversation');

      const data = await sendMessage(currentMessage, convId);

      const assistantMessage: Message = {
        id: data.message_id || Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const fallback: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          "I'm having trouble connecting right now, but I can still help with your farming questions — try asking about tomatoes, maize, or soil improvement!",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallback]);
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
    'How do I treat tomato leaf curl disease?',
    'What\'s the best fertilizer for maize?',
    'When should I plant onions in Ghana?',
    'How can I improve my soil quality?',
    'What are the signs of nutrient deficiency in crops?',
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 h-[calc(100vh-100px)] flex flex-col">
      <Card className="flex flex-col flex-1 overflow-hidden shadow-md rounded-xl border border-muted">
        {/* Header */}
        <CardHeader className="border-b flex items-center justify-between py-3 px-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl">AgriGPT Assistant</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">
                Your AI-powered farming advisor
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-280px)] p-4 sm:p-6">
            {messages.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">
                  Welcome to AgriGPT!
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto">
                  I'm your AI farming assistant. Ask me anything about crops,
                  livestock, soil management, pest control, and more.
                </p>

                {/* Quick Questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                  {quickQuestions.map((question, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-left justify-start h-auto p-3 text-sm"
                      onClick={() => setInputMessage(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>

                    <div
                      className={`flex-1 max-w-[85%] sm:max-w-[75%] ${
                        msg.role === 'user' ? 'text-right' : ''
                      }`}
                    >
                      <div
                        className={`p-3 rounded-lg shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-sm">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      AgriGPT is thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>

        {/* Input */}
        <div className="border-t p-3 sm:p-4 bg-background">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about crops, livestock, soil..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1 text-sm sm:text-base"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-3 sm:px-4"
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