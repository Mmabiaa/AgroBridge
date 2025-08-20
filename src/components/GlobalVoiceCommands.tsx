import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, X, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const GlobalVoiceCommands = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const listeningTimeout = useRef<NodeJS.Timeout | null>(null);

  // Navigation command mapping for all pages
  const navigationCommands: { [key: string]: string } = {
    // Core Navigation
    'go to dashboard': '/dashboard',
    'open dashboard': '/dashboard',
    'take me home': '/dashboard',
    'home': '/dashboard',
    
    // AI & Smart Tools
    'open agrigpt': '/agrigpt',
    'open chat': '/agrigpt',
    'scan my crops': '/crop-disease-detection',
    'check crop health': '/crop-disease-detection',
    'crop detection': '/crop-disease-detection',
    
    // Monitoring & Analytics
    'open monitoring': '/monitoring',
    'show monitoring': '/monitoring',
    'farm monitor': '/monitoring',
    'open analytics': '/analytics',
    'show analytics': '/analytics',
    'farm analysis': '/analytics',
    
    // Marketplace & Commerce
    'open market': '/marketplace',
    'go to market': '/marketplace',
    'marketplace': '/marketplace',
    'show market': '/marketplace',
    
    // Planning & Management
    'open calendar': '/crop-calendar',
    'crop calendar': '/crop-calendar',
    'show calendar': '/crop-calendar',
    'open scheduling': '/smart-scheduling',
    'smart scheduling': '/smart-scheduling',
    'open financial': '/financial-planning',
    'financial planning': '/financial-planning',
    
    // Learning & Community
    'open learning': '/learning',
    'show learning': '/learning',
    'learning center': '/learning',
    'open community': '/community',
    'show community': '/community',
    'farmer community': '/community',
    'open stories': '/farmer-stories',
    'farmer stories': '/farmer-stories',
    
    // Advanced Technologies
    'open satellite': '/satellite-integration',
    'satellite data': '/satellite-integration',
    'open iot': '/iot-sensor-network',
    'iot sensors': '/iot-sensor-network',
    'open drone': '/drone-integration',
    'drone control': '/drone-integration',
    'open ar': '/ar-visualization',
    'ar visualization': '/ar-visualization',
    'open blockchain': '/blockchain-certificates',
    'blockchain': '/blockchain-certificates',
    
    // System & Settings
    'open settings': '/settings',
    'show settings': '/settings',
    'open notifications': '/notifications',
    'show notifications': '/notifications',
    'open support': '/support',
    'show support': '/support',
    'get help': '/support',
    'open search': '/search',
    'show search': '/search',
    
    // Admin
    'open admin': '/admin',
    'admin panel': '/admin',
    'administration': '/admin',
    
    // Other Features
    'open social learning': '/social-learning',
    'open emergency': '/emergency-response',
    'open export': '/export-documentation',
    'setup profile': '/profile-setup',
    
    // Voice Commands
    'open voice commands': '/voice-commands',
    'voice help': '/voice-commands',
    'show voice commands': '/voice-commands',
    
    // Logout
    'logout': '/logout',
    'log me out': '/logout',
    'sign out': '/logout'
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
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
      
      if (final) {
        setTranscript(final);
        processVoiceCommand(final);
      }
    };

    recognitionInstance.onerror = (event: any) => {
      setIsListening(false);
      setResponse('Microphone error. Please check your browser settings.');
    };
      
    recognitionInstance.onaudioend = () => {
      setIsListening(false);
    };
      
    recognitionRef.current = recognitionInstance;
  }, []);

  // Global keyboard shortcut (Ctrl/Cmd + Space)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isListening]);

  const startListening = () => {
    if (recognitionRef.current && hasPermission('use_voice_commands')) {
      setIsListening(true);
      setTranscript('');
      setResponse('');
      setShowHelp(false);
      recognitionRef.current.start();
      
      // Auto-stop after 10 seconds
      listeningTimeout.current = setTimeout(() => {
        stopListening();
      }, 10000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (listeningTimeout.current) {
        clearTimeout(listeningTimeout.current);
      }
    }
  };

  const processVoiceCommand = (command: string) => {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Check for navigation commands
    for (const [phrase, route] of Object.entries(navigationCommands)) {
      if (normalizedCommand.includes(phrase.toLowerCase())) {
        setResponse(`Navigating to ${route.replace('/', '').replace('-', ' ')}`);
        setTimeout(() => {
          navigate(route);
          setResponse('');
          setTranscript('');
        }, 1000);
        return;
      }
    }
    
    // Check for common phrases
    if (normalizedCommand.includes('help') || normalizedCommand.includes('what can you do')) {
      setResponse('I can help you navigate to any page. Try saying "go to dashboard", "open market", or "show learning"');
      setShowHelp(true);
    } else if (normalizedCommand.includes('where am i')) {
      const currentPage = location.pathname.replace('/', '').replace('-', ' ') || 'dashboard';
      setResponse(`You are currently on the ${currentPage} page`);
    } else if (normalizedCommand.includes('hello') || normalizedCommand.includes('hi')) {
      setResponse('Hello! I can help you navigate AgroBridge. What would you like to do?');
    } else {
      setResponse('I didn\'t understand that command. Try saying "help" to see what I can do.');
    }
  };

  if (!user || !hasPermission('use_voice_commands')) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2">
        {/* Main Voice Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={isListening ? "destructive" : "default"}
              onClick={isListening ? stopListening : startListening}
              className={`h-14 w-14 rounded-full shadow-lg transition-all duration-300 ${
                isListening 
                  ? 'animate-pulse scale-110' 
                  : 'hover:scale-105'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice commands (Ctrl+Space)'}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">🎤 Global Voice Commands</p>
              <p className="text-sm">Available on every page!</p>
              <p className="text-xs text-muted-foreground">
                Say "help" to see all commands
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Help Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowHelp(!showHelp)}
              className="h-10 w-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
              title="Voice commands help"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Voice commands help</p>
          </TooltipContent>
        </Tooltip>

        {/* Voice Status Panel */}
        {isListening && (
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg min-w-[300px]">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="destructive" className="animate-pulse">
                🎤 Listening...
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={stopListening}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Say a command or press Ctrl+Space to stop
            </p>
            {transcript && (
              <div className="bg-muted/50 rounded p-2 mb-2">
                <p className="text-sm font-medium">You said:</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}
            {response && (
              <div className="bg-primary/10 rounded p-2">
                <p className="text-sm font-medium">Response:</p>
                <p className="text-sm">{response}</p>
              </div>
            )}
          </div>
        )}

        {/* Help Panel */}
        {showHelp && !isListening && (
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg min-w-[350px] max-w-[400px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">🎤 Voice Commands Help</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHelp(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-primary">Navigation:</h4>
                <p className="text-muted-foreground">
                  "Go to dashboard", "Open market", "Show learning"
                </p>
              </div>
              <div>
                <h4 className="font-medium text-primary">Tools:</h4>
                <p className="text-muted-foreground">
                  "Scan my crops", "Open AgriGPT", "Show analytics"
                </p>
              </div>
              <div>
                <h4 className="font-medium text-primary">Shortcuts:</h4>
                <p className="text-muted-foreground">
                  Ctrl+Space to start/stop, "Help" for assistance
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}; 