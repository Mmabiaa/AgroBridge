import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Post } from '@/api/services/community.service';
import { useLikePost, useUnlikePost, useSharePost, useBookmarkPost } from '@/api/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  onCommentClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PostCard({ post, onCommentClick, onEdit, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const sharePost = useSharePost();
  const bookmarkPost = useBookmarkPost();

  const isOwnPost = user?.id === post.author.id;

  const handleProfileClick = () => {
    navigate(`/community/users/${post.author.id}`);
  };

  const handleLike = async () => {
    const previousState = { isLiked, likesCount };
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      if (isLiked) {
        await unlikePost.mutateAsync(post.id);
      } else {
        await likePost.mutateAsync(post.id);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousState.isLiked);
      setLikesCount(previousState.likesCount);
    }
  };

  const handleShare = () => {
    sharePost.mutate(post.id);
  };

  const handleBookmark = () => {
    bookmarkPost.mutate(post.id);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <Card className="shadow-soft hover:shadow-strong transition-all duration-300">
      <CardContent className="p-4 md:p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleProfileClick}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar} alt={post.author.username} />
              <AvatarFallback>{post.author.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold hover:underline">{post.author.username}</p>
              <p className="text-sm text-muted-foreground">{formatDate(post.created_at)}</p>
            </div>
          </div>

          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-base whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className={cn(
            "grid gap-2 mb-4",
            post.images.length === 1 && "grid-cols-1",
            post.images.length === 2 && "grid-cols-2",
            post.images.length >= 3 && "grid-cols-2 md:grid-cols-3"
          )}>
            {post.images.map((image, index) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
                <img
                  src={image}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}

        {/* Post Videos */}
        {post.videos && post.videos.length > 0 && (
          <div className="mb-4">
            {post.videos.map((video, index) => (
              <video
                key={index}
                src={video}
                controls
                className="w-full rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 pb-3 border-b">
          <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
          <span>{post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}</span>
          <span>{post.shares_count} {post.shares_count === 1 ? 'share' : 'shares'}</span>
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "flex items-center gap-2",
                isLiked && "text-red-500 hover:text-red-600"
              )}
            >
              <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
              <span className="hidden sm:inline">Like</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onCommentClick}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Comment</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-5 w-5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={cn(
              "flex items-center gap-2",
              post.is_bookmarked && "text-primary"
            )}
          >
            <Bookmark className={cn("h-5 w-5", post.is_bookmarked && "fill-current")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
