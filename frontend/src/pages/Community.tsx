import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { CommunityForum } from '@/components/community/CommunityForum';
import { Users } from 'lucide-react';

export default function Community() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-4xl space-y-6 md:space-y-8 px-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-2">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Community
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Connect with fellow farmers, share knowledge, and grow together
          </p>
        </div>

        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="forum">Forum & Events</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <CommunityFeed />
          </TabsContent>

          <TabsContent value="forum" className="space-y-6">
            <CommunityForum />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
