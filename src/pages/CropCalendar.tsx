import { CropCalendar } from '@/components/calendar/CropCalendar';

export default function CropCalendarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-0 sm:px-4">
        <div className="px-0 sm:px-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-2">
            <span className="text-primary">📅</span>
            Crop Calendar
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Plan your farming activities with our comprehensive crop calendar
          </p>
        </div>

        <div className="px-0 sm:px-1 w-full max-w-full">
          <CropCalendar />
        </div>
      </div>
    </div>
  );
} 