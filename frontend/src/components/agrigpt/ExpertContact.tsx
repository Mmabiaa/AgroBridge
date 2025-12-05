
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Users, Clock } from 'lucide-react';

export function ExpertContact() {
  return (
    <Card className="shadow-soft hover:shadow-strong transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Need Human Help?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect with certified agricultural experts for complex issues
        </p>
        
        {/* Expert Status */}
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-700 dark:text-green-400">
            3 experts online
          </span>
        </div>
        
        <div className="space-y-2">
          <Button variant="farmer" className="w-full shadow-soft">
            <Phone className="h-4 w-4 mr-2" />
            Call Expert Now
          </Button>
          
          <Button variant="outline" className="w-full hover:bg-muted/70">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Expert
          </Button>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <Clock className="h-3 w-3" />
            Average response time: 2 minutes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
