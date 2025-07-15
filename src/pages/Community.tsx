
import { CommunityForum } from '@/components/community/CommunityForum';
import { Users } from 'lucide-react';

export default function Community() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Community & Expert Support
          </h1>
          <p className="text-muted-foreground">Connect with fellow farmers, ask experts, and join local events</p>
        </div>

        <CommunityForum />
      </div>
    </div>
  );
}
