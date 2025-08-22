
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Volume2, Languages, MessageSquare, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAgriQAAnswer } from '@/data/agrigpt_knowledge';
import { Label } from '@/components/ui/label';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tw', name: 'Twi', flag: '🇬🇭' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
];

const voiceCommands = {
  en: [
    'Check weather forecast',
    'Show my farm status',
    'Market prices today',
    'Pest alert information',
    'Irrigation schedule'
  ],
  tw: [
    'Hwɛ wiem tebea',
    'Kyerɛ me afuo tebea',
    'Nnɛ aguadi bo',
    'Mmoawa kɔkɔbɔ ho amanneɛ',
    'Nsu gu nhyehyɛe'
  ],
  ha: [
    'Duba yanayin yanayi',
    'Nuna halin gonata',
    'Farashin kasuwa yau',
    'Bayanin faɗakarwar kwari',
    'Jadawalin ban ruwa'
  ],
  yo: [
    'Wo asọ oju-ọjọ',
    'Fi ipo ọkọ mi han',
    'Awọn idiyele ọja loni',
    'Alaye ikilọ kokoro',
    'Eto irin omi'
  ]
};

const englishIntents = [
  {
    route: '/dashboard',
    phrases: [
      'dashboard', 'go to dashboard', 'open dashboard', 'show dashboard', 'main page', 'home', 'main screen'
    ]
  },
  {
    route: '/crop-calendar',
    phrases: [
      'calendar', 'go to calender', 'open calender', 'show calender', 'main calender', 'crop calender'
    ]
  },
  {
    route: '/farmer-stories',
    phrases: [
      'stories', 'go to stories', 'farmer-stories', 'show stories', 'farmer stories', 'story'
    ]
  },
  {
    route: '/marketplace',
    phrases: [
      'markets','market', 'marketplace', 'go to market', 'open market', 'show market', 'market prices', 'market page', 'market price'
    ]
  },
  {
    route: '/agrigpt',
    phrases: [
      'chat', 'chatbot', 'agri gpt', 'agri bot', 'open chat', 'ask question', 'open agrigpt', 'agri gpt chat'
    ]
  },
  {
    route: '/crop-disease-detection',
    phrases: [
      'crop disease', 'detect disease', 'scan crops', 'scan my crops', 'disease detection', 'crop health', 'diagnose crops', 'diagnose my crops'
    ]
  },
  {
    route: '/community',
    phrases: [
      'community', 'open community', 'farmer community', 'ask community', 'join community'
    ]
  },
  {
    route: '/voice-commands',
    phrases: [
      'voice', 'voice commands', 'open voice', 'voice control', 'voice navigation'
    ]
  },
  {
    route: '/support',
    phrases: [
      'support', 'help', 'open support', 'open help', 'show help', 'show support', 'get help'
    ]
  },
  {
    route: '/settings',
    phrases: [
      'settings', 'open settings', 'show settings', 'preferences', 'account settings'
    ]
  },
  {
    route: '/notifications',
    phrases: [
      'notification', 'notifications', 'show notifications', 'open notifications', 'alerts', 'show alerts'
    ]
  },
  {
    route: '/monitoring',
    phrases: [
      'monitor', 'show farm monitor', 'open farm monitor', 'farm monitoring', 'show farm monitor'
    ]
  },
  {
    route: '/analytics',
    phrases: [
      'Show my analytics', 'show farm analysis', 'open analytics', 'analytics', 'show analysis', 'analysis', 'analytics'
    ]
  },
  {
    route: '/learning',
    phrases: [
      'I want to learn', 'Learning page', 'trends', 'learning', 'show learning progress', 'learn', 'study'
    ]
  },
  {
    route: '/',
    phrases: [
      'I want to logout', 'logout', 'log me out', 'signout', 'sign me out',
      ]
  },
];

const englishSuggestions = [
  'Open Support',
  'Open Market',
  'Chat',
  'Scan crops',
  'Open Community',
  'Show Help',
  'Open Settings',
  'Show Notifications',
  'Farmer story',
  'Crop Calender'
];

const greetingPhrases = [
  'hello agrobridge', 'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'yo', 'howdy', 'peace', 'shalom'
];

export function VoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [commandHistory, setCommandHistory] = useState<{cmd: string, result: string}[]>([]);
  const recognitionRef = useRef<any>(null);
  const wakeWordRecognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const listeningTimeout = useRef<NodeJS.Timeout | null>(null);
  const [agroBridgeFlow, setAgroBridgeFlow] = useState(false);
  const [agroBridgeFlowStep, setAgroBridgeFlowStep] = useState(0); // 0: off, 1: waiting Yes/No, 2: waiting question
  
  // Wake word functionality
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [wakeWord, setWakeWord] = useState('Hey AgroBridge');
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [wakeWordResponse, setWakeWordResponse] = useState('');

  // Navigation command mapping (English only)
  const navigationCommands: { [key: string]: string } = {
    // Dashboard
    'go to dashboard': '/dashboard',
    'open dashboard': '/dashboard',
    'show me the dashboard': '/dashboard',
    'take me home': '/dashboard',
    'home screen': '/dashboard',
  
    // Weather
    'show me the weather': '/weather',
    'check weather forecast': '/weather',
    'what is the weather': '/weather',
    'weather update': '/weather',
    "today's weather": '/weather',
    'how is the weather': '/weather',
  
    // Crop Disease
    'open crop disease page': '/crop-disease-detection',
    'check crop health': '/crop-disease-detection',
    'scan my crops': '/crop-disease-detection',
    'detect crop disease': '/crop-disease-detection',
    'scan my crop': '/crop-disease-detection',
  
    // Community
    'open community': '/community',
    'go to community page': '/community',
    'join the community': '/community',
    'see community updates': '/community',
  
    // Market
    'take me to the market': '/marketplace',
    'open market': '/marketplace',
    'go to market': '/marketplace',
    'market prices today': '/marketplace',
    'show me the market': '/marketplace',
    'check crop prices': '/marketplace',
    'how much is maize': '/marketplace',
  
    // AgriGPT Chat
    'open chat': '/agrigpt',
    'open agrigpt': '/agrigpt',
    'talk to the bot': '/agrigpt',
    'ask a question': '/agrigpt',
    'agriculture advice': '/agrigpt',
  
    // Voice Commands
    'open voice commands': '/voice-commands',
    'show voice options': '/voice-commands',
    'help with voice commands': '/voice-commands',
  
    // New: Tips & Training
    'show me farming tips': '/training',
    'open training': '/training',
    'access learning center': '/training',

    // Crop Calender
    'calender': '/crop-calender',
    'open calender': '/crop-calender',
    
    // Farmer Stories
    'Open Farmer stories':'/farmer-stories',
    'Stories': '/farmer-stories',
  
    // New: Support
    'open support': '/support',
    'need help': '/support',
    'contact support': '/support',
    'report a problem': '/support',
  
    // New: NGO or Aid Info
    'find ngo help': '/ngo',
    'open ngo programs': '/ngo',
    'any farming support': '/ngo',
  
    // Logout
    'log me out': '/logout',
    'logout': '/logout',
    'sign me out': '/logout',

    // Farm Monitoring
    'farm monitoring': '/monitoring',
    'farm monitor': '/monitoring',
    'open farm monitor': '/monitoring'
  };
  

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setResponse('Sorry, your browser does not support speech recognition. Try Chrome or Edge.');
      return;
    }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (final) {
        setTranscript(final);
        processVoiceCommand(final); // Immediate intent processing
      }
    };

    recognitionInstance.onerror = (event: any) => {
      setIsListening(false);
      setResponse('Microphone error or permission denied. Please check your browser settings and allow mic access.');
      };
      
    recognitionInstance.onaudioend = () => {
        setIsListening(false);
      };
      
    recognitionRef.current = recognitionInstance;
  }, []);

  // Wake word detection - continuous listening
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const wakeWordInstance = new SpeechRecognition();
    wakeWordInstance.continuous = true;
    wakeWordInstance.interimResults = true;
    wakeWordInstance.lang = 'en-US';

    wakeWordInstance.onresult = (event: any) => {
      let final = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        }
      }
      
      if (final) {
        const normalizedFinal = normalizeText(final);
        const normalizedWakeWord = normalizeText(wakeWord);
        
        // Check if wake word is detected
        if (normalizedFinal.includes(normalizedWakeWord) || 
            normalizedFinal.includes('hey agrobridge') || 
            normalizedFinal.includes('hello agrobridge') ||
            normalizedFinal.includes('hi agrobridge')) {
          
          // Wake word detected!
          setIsWakeWordActive(true);
          setIsWakeWordListening(false);
          
          // Stop wake word listening
          if (wakeWordRecognitionRef.current) {
            wakeWordRecognitionRef.current.stop();
          }
          
          // Respond to wake word
          const greeting = `Hello! I'm AgroBridge, your farming assistant. How may I help you today?`;
          setWakeWordResponse(greeting);
          setResponse(greeting);
          
          // Speak the greeting
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(greeting);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
          }
          
          // Start active listening for commands
          setTimeout(() => {
            startListening();
          }, 2000); // Wait for greeting to finish
        }
      }
    };

    wakeWordInstance.onerror = (event: any) => {
      console.log('Wake word recognition error:', event.error);
      // Restart wake word listening on error
      setTimeout(() => {
        if (isWakeWordActive && !isListening) {
          startWakeWordListening();
        }
      }, 1000);
    };

    wakeWordInstance.onaudioend = () => {
      // Restart wake word listening if it ends unexpectedly
      if (isWakeWordActive && !isListening) {
        setTimeout(() => {
          startWakeWordListening();
        }, 100);
      }
    };

    wakeWordRecognitionRef.current = wakeWordInstance;
  }, [isWakeWordActive, isListening, wakeWord]);

  // Start wake word listening
  const startWakeWordListening = () => {
    if (wakeWordRecognitionRef.current && isWakeWordActive && !isListening) {
      setIsWakeWordListening(true);
      wakeWordRecognitionRef.current.start();
    }
  };

  // Stop wake word listening
  const stopWakeWordListening = () => {
    if (wakeWordRecognitionRef.current) {
      setIsWakeWordListening(false);
      wakeWordRecognitionRef.current.stop();
    }
  };

  // Toggle wake word functionality
  const toggleWakeWord = () => {
    if (isWakeWordActive) {
      setIsWakeWordActive(false);
      stopWakeWordListening();
      setWakeWordResponse('');
    } else {
      setIsWakeWordActive(true);
      startWakeWordListening();
    }
  };

  // Function to speak text
  const speakCommand = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageCode(selectedLanguage);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  // Keyboard shortcut (spacebar) to start/stop listening
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isListening) {
        startListening();
      } else if (e.code === 'Space' && isListening) {
        stopListening();
    }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isListening]);

  const getLanguageCode = (lang: string) => {
    const codes: { [key: string]: string } = {
      'en': 'en-US',
      'tw': 'tw-GH',
      'ha': 'ha-NG',
      'yo': 'yo-NG'
    };
    return codes[lang] || 'en-US';
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setTranscript('');
      setInterimTranscript('');
      setResponse('');
      recognitionRef.current.start();
      if (listeningTimeout.current) clearTimeout(listeningTimeout.current);
      
      // Stop wake word listening while actively listening for commands
      stopWakeWordListening();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      // No need to processVoiceCommand here, now handled in onresult
      
      // Restart wake word listening after command listening stops
      if (isWakeWordActive) {
        setTimeout(() => {
          startWakeWordListening();
        }, 1000);
      }
    }
  };

  function normalizeText(text: string) {
    return text.trim().toLowerCase().replace(/[.,!?;:()\[\]{}'"-]/g, '');
  }

  function findIntent(text: string) {
    const norm = normalizeText(text);
    // 1. Direct phrase match
    for (const intent of englishIntents) {
      for (const phrase of intent.phrases) {
        const phraseNorm = normalizeText(phrase);
        if (norm === phraseNorm || norm.includes(phraseNorm) || phraseNorm.includes(norm)) {
          return intent;
        }
      }
    }
    // 2. Fuzzy/keyword match (case-insensitive, any keyword in any order, ignoring punctuation)
    for (const intent of englishIntents) {
      for (const phrase of intent.phrases) {
        const phraseWords = normalizeText(phrase).split(/\s+/).filter(w => w.length > 2);
        const normWords = norm.split(/\s+/).filter(w => w.length > 2);
        if (phraseWords.some(w => normWords.includes(w))) {
          return intent;
        }
      }
    }
    // 3. Fallback: direct route match (e.g., user says 'support' or 'marketplace')
    for (const intent of englishIntents) {
      // Only allow fallback for non-root routes
      if (intent.route !== '/') {
        const routeName = intent.route.replace('/', '').replace('-', ' ');
        if (norm === routeName || norm.includes(routeName) || routeName.includes(norm)) {
          return intent;
        }
      }
    }
    return null;
  }

  const YES_VARIANTS = ['yes', 'yeah'];
  const NO_VARIANTS = ['nah', 'no thank you', 'no thanks', 'no'];
  const THANKS_VARIANTS = ['thanks', 'thank you', 'thankyou', 'thank u', 'thanks'];
  const BYE_VARIANTS = ['bye', 'goodbye', 'bye bye', 'see you', 'see you later', 'talk to you later', 'catch you later'];

  function isYes(text: string) {
    const norm = normalizeText(text);
    return YES_VARIANTS.some(v => norm === normalizeText(v));
  }
  function isNo(text: string) {
    const norm = normalizeText(text);
    return NO_VARIANTS.some(v => norm === normalizeText(v));
  }
  function isThanks(text: string) {
    const norm = normalizeText(text);
    return THANKS_VARIANTS.some(v => norm.includes(normalizeText(v)));
  }
  function isBye(text: string) {
    const norm = normalizeText(text);
    return BYE_VARIANTS.some(v => norm.includes(normalizeText(v)));
  }

  const processVoiceCommand = (command: string) => {
    const norm = normalizeText(command);
    // Special case for 'Thank you', 'No', 'Yes', 'Goodbye', 'Bye'
    if (isThanks(command)) {
      const msg = 'You’re welcome!';
      setResponse(msg);
      setCommandHistory(prev => [{cmd: command, result: msg}, ...prev.slice(0, 9)]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
      return;
    }
    if (isNo(command)) {
      const msg = 'No problem! Feel free to come back anytime you need help.';
      setResponse(msg);
      setCommandHistory(prev => [{cmd: command, result: msg}, ...prev.slice(0, 9)]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
      return;
    }
    if (isYes(command)) {
      const msg = 'Great! Go ahead and ask your question.';
      setResponse(msg);
      setCommandHistory(prev => [{cmd: command, result: msg}, ...prev.slice(0, 9)]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
      return;
    }
    if (isBye(command)) {
      const msg = 'Goodbye! Wishing you a bountiful harvest and a wonderful day!';
      setResponse(msg);
      setCommandHistory(prev => [{cmd: command, result: msg}, ...prev.slice(0, 9)]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
      return;
    }
    // Always use the original command for matching
    if (agroBridgeFlowStep === 1) {
      if (isNo(command) || isThanks(command)) {
        setAgroBridgeFlowStep(0);
        const msg = 'No problem! Feel free to come back anytime you need help. 🌾';
        setResponse(msg);
        setCommandHistory(prev => [{cmd: command, result: msg}, ...prev.slice(0, 9)]);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(msg);
          utterance.lang = 'en-US';
          speechSynthesis.speak(utterance);
        }
        return;
      } else if (isYes(command)) {
        setAgroBridgeFlowStep(2);
        const prompt = 'Go ahead, ask your question.';
        setResponse(prompt);
        setCommandHistory(prev => [{cmd: command, result: prompt}, ...prev.slice(0, 9)]);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(prompt);
          utterance.lang = 'en-US';
          speechSynthesis.speak(utterance);
        }
        return;
      }
      // Ignore any other input at this step
      return;
    }
    if (agroBridgeFlowStep === 2) {
      if (isYes(command) || isNo(command) || isThanks(command)) {
        setAgroBridgeFlowStep(0);
        const msg = 'No problem! Feel free to come back anytime you need help. 🌾';
        setResponse(msg);
        setCommandHistory(prev => [{cmd: command, result: msg}, ...prev.slice(0, 9)]);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(msg);
          utterance.lang = 'en-US';
          speechSynthesis.speak(utterance);
        }
        return;
      }
      setAgroBridgeFlowStep(0);
      // Strictly remove leading 'yes' (case-insensitive, with or without punctuation/space)
      let question = command.replace(/^yes[ ,:;.!?\-]*\s*/i, '').trim();
      setResponse('Let me get farming advice for you...');
      setCommandHistory(prev => [{cmd: command, result: 'Asked AgriGPT'}, ...prev.slice(0, 9)]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Let me get farming advice for you.');
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
      setTimeout(() => navigate('/agrigpt', { state: { question } }), 500);
      return;
    }
    // 1. Greeting detection (Hello, AgroBridge special case)
    if (normalizeText(command) === normalizeText('hello agrobridge')) {
      const greeting = 'Hi farmer, how can I help you today? Do you need any farming advice?';
      setResponse(greeting);
      setCommandHistory(prev => [{cmd: command, result: greeting}, ...prev.slice(0, 9)]);
      setAgroBridgeFlowStep(1);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(greeting);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
      return;
    }
    // 1b. Other greetings
    if (greetingPhrases.some(greet => normalizeText(command) === normalizeText(greet) || normalizeText(command).includes(normalizeText(greet)))) {
      const greeting = 'Hi farmer, how can I help you today? Do you need any farming advice?';
      setResponse(greeting);
      setCommandHistory(prev => [{cmd: command, result: greeting}, ...prev.slice(0, 9)]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(greeting);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
      return;
    }
    // 2. Navigation intent
    const intent = findIntent(command);
    setTranscript(command); // Always show what the user said
    if (intent) {
      // Special case for logout route (support both '/logout' and '/')
      if (intent.route === '/') {
        const msg = 'Goodbye! Wishing you a bountiful harvest and a wonderful day!';
        setResponse(msg);
        setCommandHistory(prev => [{cmd: command, result: msg}, ...prev.slice(0, 9)]);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(msg);
          utterance.lang = 'en-US';
          speechSynthesis.speak(utterance);
        }
        setTimeout(() => navigate(intent.route), 1000); // Give time for TTS
        return;
      }
      setResponse(`Navigating to ${intent.route.replace('/', '').replace('-', ' ')}`);
      setCommandHistory(prev => [{cmd: command, result: `Navigated to ${intent.route}`} , ...prev.slice(0, 9)]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Navigating to ${intent.route.replace('/', '').replace('-', ' ')}`);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
      if (location.pathname !== intent.route) {
        setTimeout(() => navigate(intent.route), 500);
      }
      return;
    }
    // 3. Treat as agriGPT question
    setResponse('Let me get farming advice for you...');
    setCommandHistory(prev => [{cmd: command, result: 'Asked AgriGPT'}, ...prev.slice(0, 9)]);
      if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Let me get farming advice for you.');
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
    // Pass question to AgriGPT via navigation state
    setTimeout(() => navigate('/agrigpt', { state: { question: command } }), 500);
  };

  return (
    <Card className="shadow-soft w-full max-w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-primary" />
          Voice Commands
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        {/* Language Selection */}
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Wake Word Controls */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Wake Word Detection</h4>
              <p className="text-sm text-muted-foreground">
                Say "{wakeWord}" to activate voice commands automatically
              </p>
            </div>
            <Button
              variant={isWakeWordActive ? "default" : "outline"}
              onClick={toggleWakeWord}
              className="flex items-center gap-2"
            >
              {isWakeWordActive ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Active
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          </div>
          
          {isWakeWordActive && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isWakeWordListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {isWakeWordListening ? 'Listening for wake word...' : 'Wake word detection ready'}
                </span>
              </div>
              {wakeWordResponse && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">Wake word detected!</p>
                  <p className="text-sm text-muted-foreground">{wakeWordResponse}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Voice Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant={isListening ? "destructive" : "default"}
              onClick={isListening ? stopListening : startListening}
              className="h-20 w-20 rounded-full text-2xl"
            >
              {isListening ? '🎤' : '🎙️'}
            </Button>
            {isListening && (
              <Button
                size="lg"
                variant="outline"
                onClick={stopListening}
                className="h-12 w-24 rounded"
              >
                Stop
              </Button>
            )}
          </div>
          <div className="text-center">
            {isListening ? (
              <Badge variant="destructive">Listening...</Badge>
            ) : (
              <Badge variant="outline">Tap or press Space to speak</Badge>
            )}
          </div>
        </div>

        {/* Live Transcript Preview */}
        {isListening && (
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <h4 className="font-medium mb-2">You are saying:</h4>
            <p className="text-lg font-mono">
              {interimTranscript || transcript || '...'}
            </p>
            {/* Highlight recognized intent if any */}
            {findIntent(interimTranscript || transcript) && (
              <p className="text-green-700 font-semibold mt-2">Intent: {findIntent(interimTranscript || transcript)?.route.replace('/', '').replace('-', ' ')}</p>
            )}
          </div>
        )}

        {/* Transcript and Response */}
        {!isListening && transcript && (
          <div className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">You said:</h4>
              <p className="text-sm">{transcript}</p>
            </div>
            {response && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Response:</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => speakCommand(response)}
                  >
                    🔊
                  </Button>
                </div>
                <p className="text-sm">{response}</p>
              </div>
            )}
          </div>
        )}

        {/* Command History */}
        <div className="space-y-3">
          <h4 className="font-medium">Recent Voice Commands:</h4>
          <div className="space-y-1">
            {commandHistory.length === 0 && <p className="text-xs text-muted-foreground">No commands yet.</p>}
            {commandHistory.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="font-mono bg-muted/30 px-2 py-1 rounded">{item.cmd}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold">{item.result}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <h4 className="font-medium">Try Saying:</h4>
          <div className="flex flex-wrap gap-2">
            {englishSuggestions.map((s, i) => (
              <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs cursor-pointer" onClick={() => speakCommand(s)}>{s}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
