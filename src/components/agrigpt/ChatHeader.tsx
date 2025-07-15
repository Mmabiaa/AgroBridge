
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Volume2, VolumeX, Globe, Phone } from 'lucide-react';

interface ChatHeaderProps {
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
  isSpeaking: boolean;
  onSpeakToggle: () => void;
}

const languages = ['English', 'Twi', 'Hausa', 'Yoruba'];

export function ChatHeader({ 
  currentLanguage, 
  setCurrentLanguage, 
  isSpeaking, 
  onSpeakToggle 
}: ChatHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative p-4 rounded-2xl bg-gradient-primary shadow-glow animate-pulse">
          <Bot className="h-10 w-10 text-primary-foreground" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            AgriGPT Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Your AI farming expert in local languages
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 backdrop-blur-sm">
          <Globe className="h-4 w-4 text-primary" />
          <select 
            value={currentLanguage} 
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="bg-transparent border-0 outline-none text-sm font-medium"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Voice Toggle */}
        <Button
          variant={isSpeaking ? "default" : "outline"}
          size="sm"
          onClick={onSpeakToggle}
          className="transition-all duration-300"
        >
          {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>

        {/* Contact Expert */}
        <Button variant="farmer" size="sm" className="shadow-strong">
          <Phone className="h-4 w-4 mr-2" />
          Call Expert
        </Button>
      </div>
    </div>
  );
}
