
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Volume2, Languages, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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
      'notifications', 'show notifications', 'open notifications', 'alerts', 'show alerts'
    ]
  }
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

export function VoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [commandHistory, setCommandHistory] = useState<{cmd: string, result: string}[]>([]);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const listeningTimeout = useRef<NodeJS.Timeout | null>(null);

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
    'sign me out': '/logout'
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
      if (final) setTranscript(final);
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
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (transcript.trim()) {
        processVoiceCommand(transcript);
      } else {
        setResponse('No command detected. Please try again.');
      }
      // Start continuous listening after a short delay
      listeningTimeout.current = setTimeout(() => {
        startListening();
      }, 3000); // 3 seconds pause before listening again
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
      const routeName = intent.route.replace('/', '').replace('-', ' ');
      if (norm === routeName || norm.includes(routeName) || routeName.includes(norm)) {
        return intent;
      }
    }
    return null;
  }

  const processVoiceCommand = (command: string) => {
    console.log('Raw transcript:', command);
    console.log('Normalized:', normalizeText(command));
    const intent = findIntent(command);
    setTranscript(command); // Always show what the user said
    if (intent) {
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
    } else {
      setResponse("Command not recognized. Try: " + englishSuggestions.join(', '));
      setCommandHistory(prev => [{cmd: command, result: 'Not recognized'}, ...prev.slice(0, 9)]);
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Command not recognized. Please try again.");
        utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
      }
    }
  };

  const speakCommand = (command: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(command);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-primary" />
          Voice Commands
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Language</label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
