
import { CommunityForum } from '@/components/community/CommunityForum';
import { Users } from 'lucide-react';

export default function Community() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-3 md:px-4">
      <div className="container mx-auto space-y-6 md:space-y-8">
        <div className="px-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-2">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Community & Expert Support
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Connect with fellow farmers, ask experts, and join local events</p>
        </div>

        <div className="px-1">
          <CommunityForum />
        </div>
      </div>
    </div>
  );
}
