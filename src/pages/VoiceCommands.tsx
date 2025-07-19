
import { VoiceCommands } from '@/components/ai/VoiceCommands';
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

const commandCategories = [
  
];

const recentCommands = [
  { command: 'Check weather forecast', language: 'English', time: '2 min ago', success: true },
  { command: 'Hwɛ me afuo tebea', language: 'Twi', time: '5 min ago', success: true },
  { command: 'Farashin kasuwa yau', language: 'Hausa', time: '10 min ago', success: true },
  { command: 'Wo asọ oju-ọjọ', language: 'Yoruba', time: '15 min ago', success: false }
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

        {/* Language Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {languageStats.map((lang, index) => (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-6 text-center">
                <div className="text-2xl mb-2">{lang.flag}</div>
                <div className="text-xl font-bold">{lang.usage}%</div>
                <p className="text-sm font-medium">{lang.name}</p>
                <p className="text-xs text-muted-foreground">{lang.speakers} speakers</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Voice Commands Component */}
        <VoiceCommands />

        {/* Analytics and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Command Categories */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Command Categories
              </CardTitle>
              <CardDescription>Available voice commands by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {commandCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <Badge variant="outline">{category.commands} commands</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

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
              {recentCommands.map((cmd, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      cmd.success ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{cmd.command}</p>
                      <p className="text-xs text-muted-foreground">{cmd.language} • {cmd.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center space-y-3">
              <Languages className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Multi-Language</h3>
              <p className="text-sm text-muted-foreground">
                Supports English, Twi, Hausa, and Yoruba languages
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 text-center space-y-3">
              <Zap className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Instant Response</h3>
              <p className="text-sm text-muted-foreground">
                Get immediate answers to your farming questions
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 text-center space-y-3">
              <Headphones className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Hands-Free</h3>
              <p className="text-sm text-muted-foreground">
                Control your farm while working in the field
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 text-center space-y-3">
              <Users className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Accessible</h3>
              <p className="text-sm text-muted-foreground">
                Designed for farmers with varying literacy levels
              </p>
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
                  <li>• "What's the weather today?"</li>
                  <li>• "Show me market prices"</li>
                  <li>• "Check my farm status"</li>
                  <li>• "Any pest alerts?"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
