
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot } from 'lucide-react';
import { ChatHeader } from '@/components/agrigpt/ChatHeader';
import { ChatMessage } from '@/components/agrigpt/ChatMessage';
import { ChatInput } from '@/components/agrigpt/ChatInput';
import { QuickQuestions } from '@/components/agrigpt/QuickQuestions';
import { ImageUpload } from '@/components/agrigpt/ImageUpload';
import { ExpertContact } from '@/components/agrigpt/ExpertContact';
import { VoiceControls } from '@/components/agrigpt/VoiceControls';

const sampleQuestions = [
  "How do I treat tomato leaf curl disease?",
  "What's the best fertilizer for maize?",
  "When should I plant onions in Ghana?",
  "How to prevent pest attacks naturally?",
  "What crops grow well in dry season?",
  "How to improve soil fertility?"
];

const chatHistory = [
  {
    id: 1,
    type: 'user' as const,
    message: "What's the best time to plant tomatoes in Northern Ghana?",
    time: '10:30 AM'
  },
  {
    id: 2,
    type: 'bot' as const,
    message: "For Northern Ghana, the best time to plant tomatoes is during the dry season from November to February. The weather is cooler and there's less rainfall, which reduces disease pressure. Make sure to have irrigation available as rainfall is minimal during this period.",
    time: '10:31 AM'
  },
  {
    id: 3,
    type: 'user' as const,
    message: "What about fertilizer recommendations?",
    time: '10:32 AM'
  },
  {
    id: 4,
    type: 'bot' as const,
    message: "For tomatoes, I recommend:\n\n1. **Base application**: NPK 15-15-15 at 200kg/hectare during planting\n2. **Side dressing**: Urea (46-0-0) at 50kg/hectare 3-4 weeks after transplanting\n3. **Organic option**: Well-decomposed compost or poultry manure at 5-10 tons/hectare\n\nApply fertilizers when soil is moist and water immediately after application.",
    time: '10:32 AM'
  }
];

export default function AgriGPT() {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
  };

  const handleSpeakToggle = () => {
    setIsSpeaking(!isSpeaking);
  };

  const handleQuestionClick = (question: string) => {
    setMessage(question);
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="container mx-auto p-4 max-w-7xl">
        <ChatHeader
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
          isSpeaking={isSpeaking}
          onSpeakToggle={handleSpeakToggle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface - Main */}
          <div className="lg:col-span-3">
            <Card className="flex flex-col shadow-strong hover:shadow-glow transition-all duration-500 border-2 border-primary/10">
              {/* Chat Header */}
              <CardHeader className="border-b bg-gradient-to-r from-card to-muted/20 rounded-t-lg flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xl">AgriGPT Chat</span>
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-950/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                      Online
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages */}
              <CardContent className="flex-1 p-0">
                <div className="p-6 bg-gradient-to-b from-background to-muted/10 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {chatHistory.map((chat) => (
                      <ChatMessage
                        key={chat.id}
                        id={chat.id}
                        type={chat.type}
                        message={chat.message}
                        time={chat.time}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>

              {/* Chat Input - Fixed at bottom */}
              <div className="flex-shrink-0">
                <ChatInput
                  message={message}
                  setMessage={setMessage}
                  onSendMessage={handleSendMessage}
                  isListening={isListening}
                  onVoiceToggle={handleVoiceToggle}
                  currentLanguage={currentLanguage}
                />
              </div>
            </Card>
          </div>

          {/* Sidebar - Scrollable */}
          <div className="lg:col-span-1 h-[calc(100vh-200px)]">
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-2">
                <QuickQuestions
                  questions={sampleQuestions}
                  onQuestionClick={handleQuestionClick}
                />

                <ImageUpload />

                <ExpertContact />

                <VoiceControls
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onVoiceToggle={handleVoiceToggle}
                  onSpeakToggle={handleSpeakToggle}
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
