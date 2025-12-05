import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List, Mic, Cloud, ShoppingCart, MessageSquare, HelpCircle, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Support() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 flex flex-col items-center">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-soft w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <HelpCircle className="h-6 w-6 text-primary" />
              Farmer Support & Help
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Getting Started</h2>
              <ul className="list-disc ml-6 text-sm md:text-base space-y-1">
                <li>Use the <b>Dashboard</b> to see your farm's health, weather, and quick actions.</li>
                <li>Tap <b>Chat with AgriGPT</b> to ask questions in English or local languages.</li>
                <li>Explore the <b>Market</b> for live prices and trends.</li>
                <li>Access <b>Weather</b> info for your location automatically.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2"><Mic className="h-4 w-4 text-primary" /> Using Voice Commands</h2>
              <ul className="list-disc ml-6 text-sm md:text-base space-y-1">
                <li>Click the <b>mic button</b> on the Voice Commands card.</li>
                <li>Speak clearly in English (e.g. "Go to Dashboard", "Show me the weather").</li>
                <li>The app will speak back and take you to the right page.</li>
                <li>Try commands like: "Open Market", "Open Community", "Log me out".</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2"><Cloud className="h-4 w-4 text-primary" /> Weather & Market Info</h2>
              <ul className="list-disc ml-6 text-sm md:text-base space-y-1">
                <li>Weather is shown live for your location on the Dashboard.</li>
                <li>Market prices update daily for key crops.</li>
                <li>Use these to plan your farming and sales.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Getting More Help</h2>
              <ul className="list-disc ml-6 text-sm md:text-base space-y-1">
                <li>Use the <b>Community</b> page to ask other farmers and experts.</li>
                <li>Contact support or your local extension officer for urgent help.</li>
                <li>Check the <b>FAQ</b> or <b>Help</b> section for more tips.</li>
              </ul>
            </section>
            <div className="mt-6 flex gap-3 flex-wrap">
              <Link to="/dashboard" className="text-primary underline text-sm md:text-base">Go to Dashboard</Link>
              <Link to="/agrigpt" className="text-primary underline text-sm md:text-base">Chat with AgriGPT</Link>
              <Link to="/marketplace" className="text-primary underline text-sm md:text-base">View Market</Link>
              <Link to="/community" className="text-primary underline text-sm md:text-base">Join Community</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 