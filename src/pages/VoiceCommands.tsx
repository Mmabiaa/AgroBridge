
import { VoiceCommands } from '@/components/ai/VoiceCommands';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  Languages, 
  Volume2, 
  MessageSquare, 
  Globe,
  Headphones,
  Users,
  Zap
} from 'lucide-react';

const languageStats = [

];

export default function VoiceCommandsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Mic className="h-8 w-8 text-primary" />
            Voice Commands
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Control your farm with your voice in your native language. Get instant responses 
            and manage your agricultural operations hands-free.
          </p>
        </div>

        {/* Main Voice Commands Component */}
        <VoiceCommands />

        {/* Analytics and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Commands */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Recent Commands
              </CardTitle>
              <CardDescription>Your latest voice interactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* The recentCommands state and its usage were removed, so this section is now empty */}
            </CardContent>
          </Card>
        </div>

        {/* Usage Tips */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Voice Command Tips</CardTitle>
            <CardDescription>Get the most out of voice commands</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">For Best Results:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Speak clearly and at a normal pace</li>
                  <li>• Use a quiet environment when possible</li>
                  <li>• Hold the device close to your mouth</li>
                  <li>• Wait for the listening indicator before speaking</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Common Commands:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• "Help"</li>
                  <li>• "Open Market"</li>
                  <li>• "Scan my crop"</li>
                  <li>• "Open community"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
