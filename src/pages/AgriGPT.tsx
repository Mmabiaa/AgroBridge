
import { useRef, useState, useEffect } from 'react';
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
import { getAgriQAAnswer } from '@/data/agrigpt_knowledge';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Add ChatMessage type
interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  message: string;
  time: string;
  audio?: string;
  image?: string;
}

const chatHistory: ChatMessage[] = [
  {
    id: 1,
    type: 'bot',
    message: "Hi there, I'm AgriGPT of AgroBridge. How can I help you today?",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

const quickQuestions = preloadedQA.map(qa => qa.question);

// Add a shared normalize function for punctuation-insensitive comparison
function normalize(str: string) {
  return str.trim().toLowerCase().replace(/[^\w\s]/g, '');
}

function findPreloadedAnswer(userQuestion: string) {
  const norm = normalize(userQuestion);
  for (const qa of preloadedQA) {
    if (normalize(qa.question) === norm) {
      return qa.answer;
    }
  }
  return null;
}

function findAgriGPTAnswer(userInput: string) {
  const norm = normalize(userInput);
  for (const qa of preloadedQA) {
    if (normalize(qa.question) === norm) {
      return qa.answer;
    }
  }
  return null;
}

function getPreloadedAnswer(question: string) {
  const normalized = normalize(question);
  return preloadedQA.find(qa => normalize(qa.question) === normalized)?.answer;
}

// Add TTS helper
function speakText(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}

export default function AgriGPT() {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [chat, setChat] = useState<ChatMessage[]>(chatHistory);
  const lastInputWasAudio = useRef(false);
  const fromVoiceNav = useRef(false);
  const location = useLocation();
  const [pendingVoiceConfirmation, setPendingVoiceConfirmation] = useState<null | { botMsgId: number, answer: string }>(null);
  // Feedback state and UI should be fully isolated
  const [pendingFeedback, setPendingFeedback] = useState<null | { botMsgId: number }>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<{ [id: number]: 'yes' | 'no' }>({});


  // Auto-ask question from navigation state
  useEffect(() => {
    if (location.state && location.state.question) {
      const question = location.state.question;
      fromVoiceNav.current = true;
      handleSendMessageDirect(question);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Add a direct send function for navigation state
  function handleSendMessageDirect(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: chat.length + 1,
      type: 'user',
      message: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChat(prev => [...prev, userMsg]);
    // Step 1: Try to match with local preloaded answers
    let answer = findPreloadedAnswer(text);
    // Step 2: If no match, call local knowledge base for answer
    if (!answer) {
      answer = getAgriQAAnswer(text);
    }
    // Step 3: Display answer in chat and speak it aloud if from voice nav
    setChat(prev => {
      const botMsg = {
        id: prev.length + 1,
        type: 'bot' as const,
        message: answer || "Sorry, I don’t know that yet. Can you ask another way?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      if (fromVoiceNav.current) {
        speakText(botMsg.message);
        fromVoiceNav.current = false;
      }
      // Voice confirmation prompt
      setPendingVoiceConfirmation({ botMsgId: botMsg.id, answer: botMsg.message });
      setPendingFeedback({ botMsgId: botMsg.id });
      return [...prev, botMsg];
    });
  }

  // New: handle sending message with attachments
  const handleSendMessage = async (attachments?: { audio?: Blob; image?: File }) => {
    if (!message.trim() && !attachments?.audio && !attachments?.image) return;
  
    const userMsg: ChatMessage = {
      id: chat.length + 1,
      type: 'user',
      message: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (attachments?.audio) {
      userMsg.audio = URL.createObjectURL(attachments.audio);
      lastInputWasAudio.current = true;
    } else {
      lastInputWasAudio.current = false;
    }
    if (attachments?.image) {
      userMsg.image = URL.createObjectURL(attachments.image);
    }
    setChat(prev => [...prev, userMsg]);
  
    // Step 1: Try to match with local preloaded answers
    let answer = findPreloadedAnswer(message);
  
    // Step 2: If no match, call local knowledge base for answer
    if (!answer) {
      answer = getAgriQAAnswer(message);
    }
  
    // Step 3: Display answer in chat and speak it only if last input was audio
    setChat(prev => {
      const botMsg = {
        id: prev.length + 1,
        type: 'bot' as const,
        message: answer || "Sorry, I don’t know that yet. Can you ask another way?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      // Voice confirmation prompt
      setPendingVoiceConfirmation({ botMsgId: botMsg.id, answer: botMsg.message });
      setPendingFeedback({ botMsgId: botMsg.id });
      return [...prev, botMsg];
    });
  
    setMessage('');
  };
  

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
  };

  const handleSpeakToggle = () => {
    setIsSpeaking(!isSpeaking);
  };

  const handleQuestionClick = (question: string) => {
    setMessage("");
    const userMsg: ChatMessage = {
      id: chat.length + 1,
      type: 'user',
      message: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChat(prev => [...prev, userMsg]);
    // Use findPreloadedAnswer for exact answer matching from preloadedQA
    const answer = findPreloadedAnswer(question);
    if (answer) {
      setChat(prev => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'bot',
          message: answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setTimeout(() => {
        setChat(prev => [
          ...prev,
          {
            id: prev.length + 1,
            type: 'bot',
            message: "Sorry, I don't have an exact answer for that question. Please ask a different question.",
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
                    {chat.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        id={msg.id}
                        type={msg.type}
                        message={msg.message}
                        time={msg.time}
                        audio={msg.audio}
                        image={msg.image}
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
                  questions={quickQuestions}
                  onQuestionClick={handleQuestionClick}
                />

                

                <ExpertContact />

                
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
      {pendingVoiceConfirmation && (
  <div className="mt-2 p-3 bg-muted/50 rounded-lg flex flex-col gap-2">
    <div>Would you like to hear more details or tips?</div>
    <div className="flex gap-2">
      <Button size="sm" onClick={() => {
        setChat(prev => [...prev, {
          id: prev.length + 1,
          type: 'bot',
          message: 'Here are more details and tips: ...',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setPendingVoiceConfirmation(null);
      }}>Yes</Button>
      <Button size="sm" variant="outline" onClick={() => setPendingVoiceConfirmation(null)}>No</Button>
    </div>
  </div>
)}
{pendingFeedback && !feedbackGiven[pendingFeedback.botMsgId] && (
  <div className="mt-2 p-3 bg-muted/50 rounded-lg flex flex-col gap-2">
    <div>Was this answer helpful?</div>
    <div className="flex gap-2">
      <Button size="sm" onClick={() => {
        setFeedbackGiven(fb => ({ ...fb, [pendingFeedback.botMsgId]: 'yes' }));
        setPendingFeedback(null);
        speakText('Thank you for your feedback!');
      }}>👍</Button>
      <Button size="sm" variant="outline" onClick={() => {
        setFeedbackGiven(fb => ({ ...fb, [pendingFeedback.botMsgId]: 'no' }));
        setPendingFeedback(null);
        speakText('Thanks for your feedback. We will use it to improve.');
      }}>👎</Button>
    </div>
  </div>
)}
    </div>
  );
}
