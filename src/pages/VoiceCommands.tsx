import { VoiceCommands } from '@/components/ai/VoiceCommands';
import { Mic } from 'lucide-react';

export default function VoiceCommandsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 w-full flex flex-col items-center justify-center p-0 m-0 overflow-x-hidden">
      {/* Header */}
      <div className="text-center space-y-4 w-full max-w-full mt-6">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Mic className="h-8 w-8 text-primary" />
          Voice Commands
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Control your farm with your voice in your native language. Get instant responses 
          and manage your agricultural operations hands-free.
        </p>
      </div>
      {/* Main Voice Commands Component - Fullscreen */}
      <div className="w-full flex-1 flex items-center justify-center">
        <VoiceCommands />
      </div>
      {/* Tips Section - Not a Card */}
      <div className="w-full max-w-2xl mx-auto bg-muted/30 rounded-xl p-6 my-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h4 className="font-bold text-lg">For Best Results:</h4>
            <ul className="space-y-2 text-base text-muted-foreground">
              <li>• Speak clearly and at a normal pace</li>
              <li>• Use a quiet environment when possible</li>
              <li>• Hold the device close to your mouth</li>
              <li>• Wait for the listening indicator before speaking</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-lg">Common Commands:</h4>
            <ul className="space-y-2 text-base text-muted-foreground">
              <li>• "Help"</li>
              <li>• "Open Market"</li>
              <li>• "Scan my crop"</li>
              <li>• "Open community"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
