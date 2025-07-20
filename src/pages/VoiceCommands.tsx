import { VoiceCommands } from '@/components/ai/VoiceCommands';
import { Mic } from 'lucide-react';

export default function VoiceCommandsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-0 overflow-x-hidden w-full">
      <div className="w-full max-w-full flex flex-col items-center justify-center px-0 sm:px-4">
        {/* Header */}
        <div className="text-center space-y-4 w-full max-w-full">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Mic className="h-8 w-8 text-primary" />
            Voice Commands
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Control your farm with your voice in your native language. Get instant responses 
            and manage your agricultural operations hands-free.
          </p>
        </div>

        {/* Main Voice Commands Component - Large Card */}
        <div className="w-full max-w-full my-6">
          <VoiceCommands />
        </div>
      </div>
    </div>
  );
}
