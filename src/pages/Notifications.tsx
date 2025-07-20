
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-0 sm:px-4">
        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4 px-0 sm:px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center justify-center gap-2 md:gap-3">
            <Bell className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Notifications
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay informed with real-time alerts and updates about your farm activities.
          </p>
        </div>

        {/* Main Notification Component */}
        <div className="px-0 sm:px-1 w-full max-w-full">
          <NotificationCenter />
        </div>
      </div>
    </div>
  );
}
