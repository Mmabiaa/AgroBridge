
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff, Camera, Paperclip } from 'lucide-react';

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: () => void;
  isListening: boolean;
  onVoiceToggle: () => void;
  currentLanguage: string;
}

export function ChatInput({
  message,
  setMessage,
  onSendMessage,
  isListening,
  onVoiceToggle,
  currentLanguage
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="border-t bg-card/50 backdrop-blur-sm p-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Ask me anything in ${currentLanguage}...`}
            onKeyDown={handleKeyPress}
            className="min-h-[50px] max-h-32 resize-none pr-24 border-2 focus:border-primary/50 transition-colors"
          />
          
          {/* Input Actions */}
          <div className="absolute right-2 bottom-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onVoiceToggle}
              className={`transition-all duration-300 ${
                isListening ? 'text-red-500 animate-pulse' : 'hover:text-primary'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            <Button variant="ghost" size="sm" className="hover:text-primary">
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" className="hover:text-primary">
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={onSendMessage} 
          variant="farmer" 
          size="lg"
          disabled={!message.trim()}
          className="px-6 shadow-strong hover:shadow-glow transition-all duration-300"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      
      {isListening && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Listening in {currentLanguage}...
        </div>
      )}
    </div>
  );
}
