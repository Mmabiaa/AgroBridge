import { FarmerStories } from '@/components/stories/FarmerStories';

export default function FarmerStoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-0 sm:px-4">
        <div className="px-0 sm:px-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-2">
            <span className="text-primary">👨‍🌾</span>
            Farmer Success Stories
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Learn from real farmers who have transformed their lives through smart farming
          </p>
        </div>

        <div className="px-0 sm:px-1 w-full max-w-full">
          <FarmerStories />
        </div>
      </div>
    </div>
  );
} 