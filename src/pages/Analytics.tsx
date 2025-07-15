
import { InteractiveDashboard } from '@/components/analytics/InteractiveDashboard';
import { TrendingUp } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Predictive Analytics & Insights
          </h1>
          <p className="text-muted-foreground">AI-powered analytics for smarter farming decisions</p>
        </div>

        <InteractiveDashboard />
      </div>
    </div>
  );
}
