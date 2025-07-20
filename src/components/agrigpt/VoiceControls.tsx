
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Volume2, VolumeX, Settings, Languages } from 'lucide-react';

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  onVoiceToggle: () => void;
  onSpeakToggle: () => void;
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tw', name: 'Twi', flag: '🇬🇭' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
];

export function VoiceControls({
  isListening,
  isSpeaking,
  onVoiceToggle,
  onSpeakToggle,
  currentLanguage,
  onLanguageChange
}: VoiceControlsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden w-full">
      <div className="container mx-auto w-full max-w-full flex flex-col items-center justify-center px-0 sm:px-4">
        <Card className="w-full max-w-full min-h-[70vh] shadow-soft px-2 py-6 sm:px-6 sm:py-10 md:px-10 md:py-14 flex flex-col justify-center">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-3 justify-center">
              <Languages className="h-7 w-7 text-primary" />
              Voice Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 flex flex-col justify-center">
            {/* Language Selection */}
            <div className="space-y-3">
              <label className="text-base font-medium">Language</label>
              <Select value={currentLanguage} onValueChange={onLanguageChange}>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="text-lg">
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Mic className="h-6 w-6 text-primary" />
                  <span className="text-base font-medium">Voice Input</span>
                </div>
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="lg"
                  onClick={onVoiceToggle}
                  className="transition-all duration-300"
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-6 w-6 text-primary" />
                  <span className="text-base font-medium">Voice Output</span>
                </div>
                <Button
                  variant={isSpeaking ? "default" : "outline"}
                  size="lg"
                  onClick={onSpeakToggle}
                  className="transition-all duration-300"
                >
                  {isSpeaking ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground text-center">
                Speak in <span className="font-medium text-primary">
                  {languages.find(l => l.code === currentLanguage)?.name}
                </span> for best results
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
