
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
import { greetings, agriQA } from '@/data/agrigpt_knowledge';

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

const preloadedQA = [
  {
    question: "How do I treat tomato leaf curl disease?",
    answer: "Tomato leaf curl is best managed by removing infected plants, controlling whiteflies, and using resistant varieties. Avoid planting tomatoes near cotton or tobacco."
  },
  {
    question: "What's the best fertilizer for maize?",
    answer: "For maize, use NPK 15-15-15 at planting (200kg/hectare) and Urea (46-0-0) as a top dressing (50kg/hectare) 3-4 weeks after planting."
  },
  {
    question: "When should I plant onions in Ghana?",
    answer: "The best time to plant onions in Ghana is at the start of the dry season, typically from November to January."
  },
  {
    question: "How to prevent pest attacks naturally?",
    answer: "Use neem oil spray, encourage beneficial insects, rotate crops, and remove plant debris to prevent pest attacks naturally."
  },
  {
    question: "What crops grow well in dry season?",
    answer: "Crops like tomatoes, onions, okra, pepper, and leafy greens can be grown in the dry season with irrigation."
  },
  {
    question: "How to improve soil fertility?",
    answer: "Add organic matter (compost, manure), practice crop rotation, and use cover crops to improve soil fertility."
  },
  {
    question: "How do I control armyworms in maize?",
    answer: "Scout fields regularly, use recommended insecticides early, and encourage natural predators to control armyworms in maize."
  },
  {
    question: "What is the best way to irrigate tomatoes?",
    answer: "Drip irrigation is best for tomatoes as it delivers water directly to the roots and reduces disease risk."
  },
  {
    question: "How can I tell if my soil is acidic?",
    answer: "Test your soil with a pH kit. Acidic soils have a pH below 6.0. Yellowing leaves and poor growth can also be signs."
  },
  {
    question: "Are organic fertilizers better than chemical ones?",
    answer: "Organic fertilizers improve soil health over time, while chemical fertilizers provide quick nutrients. A balanced approach is often best."
  },
  {
    question: "How do I store harvested maize to prevent spoilage?",
    answer: "Dry maize thoroughly, store in airtight containers or bags, and keep in a cool, dry place to prevent spoilage."
  },
  {
    question: "What are the signs of cassava mosaic disease?",
    answer: "Look for yellow or green mosaic patterns on leaves, leaf distortion, and stunted growth. Remove infected plants promptly."
  },
  {
    question: "How do I access government loans for farmers?",
    answer: "Contact your local Ministry of Food and Agriculture office for information on available government loan schemes and requirements."
  },
  {
    question: "How can I increase my poultry egg production?",
    answer: "Provide balanced feed, clean water, proper lighting, and good housing. Regularly check for diseases and parasites."
  },
  {
    question: "What is the best way to control weeds in rice fields?",
    answer: "Use pre-emergence herbicides, hand weeding, and maintain proper water levels to control weeds in rice fields."
  }
];

function findPreloadedAnswer(userQuestion: string) {
  const normalized = userQuestion.trim().toLowerCase();
  return preloadedQA.find(qa => normalized === qa.question.trim().toLowerCase())?.answer;
}

function findAgriGPTAnswer(userInput: string) {
  const normalized = userInput.trim().toLowerCase();
  // Check greetings (partial match)
  const greet = greetings.find(g => normalized.includes(g.q));
  if (greet) return greet.a;
  // Check Q&A (partial match)
  const qa = agriQA.find(qa => normalized.includes(qa.q));
  if (qa) return qa.a;
  // Fallback
  return null;
}

export default function AgriGPT() {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [chat, setChat] = useState(chatHistory);

  const handleSendMessage = () => {
    if (message.trim()) {
      const userMsg = {
        id: chat.length + 1,
        type: 'user' as const,
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChat(prev => [...prev, userMsg]);
      const agriAnswer = findAgriGPTAnswer(message);
      if (agriAnswer) {
        setChat(prev => [
          ...prev,
          {
            id: prev.length + 1,
            type: 'bot' as const,
            message: agriAnswer,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        // Fallback: simulate backend call (replace with real API call)
        setTimeout(() => {
          setChat(prev => [
            ...prev,
            {
              id: prev.length + 1,
              type: 'bot' as const,
              message: "Sorry, I don’t know that yet. Can you ask another way?",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }, 1000);
      }
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
    setMessage("");
    const userMsg = {
      id: chat.length + 1,
      type: 'user' as const,
      message: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChat(prev => [...prev, userMsg]);
    const agriAnswer = findAgriGPTAnswer(question);
    if (agriAnswer) {
      setChat(prev => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'bot' as const,
          message: agriAnswer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setTimeout(() => {
        setChat(prev => [
          ...prev,
          {
            id: prev.length + 1,
            type: 'bot' as const,
            message: "Sorry, I don’t know that yet. Can you ask another way?",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 1000);
    }
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
                    {chat.map((chat) => (
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
