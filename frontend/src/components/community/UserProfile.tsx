import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserProfile, useFollowUser, useUnfollowUser, usePosts } from '@/api/hooks/useCommunity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from './PostCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Users,
  Calendar,
  MessageCircle,
  UserPlus,
  UserMinus,
  Mail,
} from 'lucide-react';

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');

  const { data: profile, isLoading: profileLoading } = useUserProfile(userId || '');
  const { data: userPosts, isLoading: postsLoading } = usePosts({
    author: userId,
  });

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isOwnProfile = currentUser?.id === userId;
  const isFollowing = profile?.is_following;

  const handleFollowToggle = () => {
    if (!userId) return;

    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
        <div className="container mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">User not found</h2>
              <p className="text-muted-foreground">
                The user profile you're looking for doesn't exist.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.user.avatar} alt={profile.user.username} />
                <AvatarFallback className="text-2xl">
                  {profile.user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-2xl font-bold">{profile.user.username}</h1>
                  {profile.user.bio && (
                    <p className="text-muted-foreground mt-1">{profile.user.bio}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{profile.posts_count}</span>
                    <span className="text-muted-foreground">Posts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{profile.followers_count}</span>
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{profile.following_count}</span>
                    <span className="text-muted-foreground">Following</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      variant={isFollowing ? 'outline' : 'default'}
                      className="gap-2"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => navigate('/messages')}
                    >
                      <Mail className="h-4 w-4" />
                      Message
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4 mt-6">
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userPosts && userPosts.results.length > 0 ? (
              <div className="space-y-4">
                {userPosts.results.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile
                      ? "You haven't created any posts yet."
                      : "This user hasn't posted anything yet."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">About</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.user.bio ? (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Bio</h4>
                    <p className="text-sm">{profile.user.bio}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bio available</p>
                )}

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Joined {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Recent Activity</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 pb-4 border-b">
                    <Badge variant="secondary" className="mt-1">
                      Post
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">
                        Created {profile.posts_count} posts in the community
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Community engagement</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pb-4 border-b">
                    <Badge variant="secondary" className="mt-1">
                      Social
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">
                        Following {profile.following_count} users
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Network connections</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="mt-1">
                      Reach
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">
                        {profile.followers_count} followers
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Community impact</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
