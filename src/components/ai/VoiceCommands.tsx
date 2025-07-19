
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Volume2, Languages, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export function VoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

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
    recognitionInstance.lang = getLanguageCode(selectedLanguage);

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
  }, [selectedLanguage]);

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
    }
  };

  const processVoiceCommand = (command: string) => {
    if (selectedLanguage === 'en') {
      const normalized = command.trim().toLowerCase();
      let matchedRoute = null;
      for (const phrase in navigationCommands) {
        if (normalized.includes(phrase)) {
          matchedRoute = navigationCommands[phrase];
          break;
        }
      }
      if (matchedRoute) {
        setResponse(`Navigating to ${matchedRoute.replace('/', '').replace('-', ' ')}`);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`Navigating to ${matchedRoute.replace('/', '').replace('-', ' ')}`);
          utterance.lang = 'en-US';
          speechSynthesis.speak(utterance);
        }
        setTimeout(() => navigate(matchedRoute), 1200); // Give time for TTS feedback
      } else {
        setResponse("Sorry, I didn't understand that command.");
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance("Sorry, I didn't understand that command.");
          utterance.lang = 'en-US';
          speechSynthesis.speak(utterance);
        }
      }
    } else {
      // Fallback: keep your previous logic for other languages
      const responses: { [key: string]: string[] } = {
        tw: [
          'Wiem: Owia hyerɛn, 28°C. Tebea pa ma duadi.',
          'Afuo Tebea: Nneɛma nyinaa rekɔ yiye. Asase nsuo yɛ 65%.',
          'Aguadi Bo: Ntomato ₦450/kg, Gyeene ₦280/kg.',
          'Mmoawa Kɔkɔbɔ: Asiane kakraa bi wɔ hɔ. Kɔ so hwɛ.',
          'Nsu Gu: Nsu gu a edi hɔ no bɛyɛ ɔkyena anɔpa 6.'
        ],
        ha: [
          'Yanayi: Rana, 28°C. Yanayi mai kyau don shuki.',
          'Halin Gona: Komai yana tafiya da kyau. Ruwan ƙasa 65%.',
          'Farashin Kasuwa: Tumatur ₦450/kg, Albasa ₦280/kg.',
          'Faɗakarwar Kwari: Ƙaramin hadari. Ci gaba da kiyayewa.',
          'Ban Ruwa: Ana shirin ban ruwa gobe da safe 6.'
        ],
        yo: [
          'Oju-ọjọ: Oorun, 28°C. Ipo to dara fun gbingbin.',
          'Ipo Oko: Gbogbo nkan n lo daradara. Omi ile ni 65%.',
          'Idiyele Oja: Tomato ₦450/kg, Alubosa ₦280/kg.',
          'Ikilọ Kokoro: Ewu kekere. Tẹsiwaju lati ṣayẹwo.',
          'Irin Omi: Irin omi to kan wa ni ọla ni 6 owuro.'
        ]
      };
      const langResponses = responses[selectedLanguage] || responses.en;
      const randomResponse = langResponses[Math.floor(Math.random() * langResponses.length)];
      setResponse(randomResponse);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(randomResponse);
        utterance.lang = getLanguageCode(selectedLanguage);
        speechSynthesis.speak(utterance);
      }
    }
  };

  const speakCommand = (command: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(command);
      utterance.lang = getLanguageCode(selectedLanguage);
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
              className="h-20 w-20 rounded-full"
            >
              {isListening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
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
              <Badge variant="outline">Tap to speak</Badge>
            )}
          </div>
        </div>

        {/* Live Transcript Preview */}
        {isListening && (
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <h4 className="font-medium mb-2">You are saying:</h4>
            <p className="text-lg font-mono">{interimTranscript || transcript || '...'}</p>
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
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm">{response}</p>
              </div>
            )}
          </div>
        )}

        {/* Sample Commands */}
        <div className="space-y-3">
          <h4 className="font-medium">Sample Commands:</h4>
          <div className="space-y-2">
            {voiceCommands[selectedLanguage as keyof typeof voiceCommands]?.map((command, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => speakCommand(command)}
              >
                <span className="text-sm">{command}</span>
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
