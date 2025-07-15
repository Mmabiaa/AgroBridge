
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  id: number;
  type: 'user' | 'bot';
  message: string;
  time: string;
}

export function ChatMessage({ type, message, time }: ChatMessageProps) {
  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-[85%] ${type === 'user' ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          type === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-gradient-primary text-primary-foreground shadow-glow'
        }`}>
          {type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message Bubble */}
        <div className={`relative p-4 rounded-2xl shadow-soft transition-all duration-300 hover:shadow-strong ${
          type === 'user'
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card text-card-foreground border rounded-tl-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-line">{message}</p>
          <p className={`text-xs mt-2 ${
            type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            {time}
          </p>
          
          {/* Message tail */}
          <div className={`absolute top-4 w-0 h-0 ${
            type === 'user' 
              ? 'right-0 translate-x-full border-l-8 border-l-primary border-t-4 border-b-4 border-t-transparent border-b-transparent'
              : 'left-0 -translate-x-full border-r-8 border-r-card border-t-4 border-b-4 border-t-transparent border-b-transparent'
          }`} />
        </div>
      </div>
    </div>
  );
}
