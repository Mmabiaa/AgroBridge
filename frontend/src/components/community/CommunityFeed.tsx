import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { PostCard } from './PostCard';
import { PostForm } from './PostForm';
import { EditPostDialog } from './EditPostDialog';
import { PostDetailsDialog } from './PostDetailsDialog';
import { useFeed, useDeletePost } from '@/api/hooks/useCommunity';
import { Post } from '@/api/services/community.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CommunityFeed() {
  const [showPostForm, setShowPostForm] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useFeed();

  const deletePost = useDeletePost();

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleDeletePost = async () => {
    if (deletePostId) {
      await deletePost.mutateAsync(deletePostId);
      setDeletePostId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3 p-6 border rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load feed. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  const posts = data?.pages.flatMap((page) => page.results) || [];

  return (
    <div className="space-y-6">
      {/* Create Post Button */}
      {!showPostForm && (
        <Button
          onClick={() => setShowPostForm(true)}
          className="w-full"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Post
        </Button>
      )}

      {/* Post Form */}
      {showPostForm && (
        <PostForm
          onSuccess={() => setShowPostForm(false)}
          onCancel={() => setShowPostForm(false)}
        />
      )}

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No posts yet. Be the first to share!</p>
          <Button onClick={() => setShowPostForm(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Create First Post
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onCommentClick={() => setSelectedPost(post)}
              onEdit={() => setEditPost(post)}
              onDelete={() => setDeletePostId(post.id)}
            />
          ))}
        </div>
      )}

      {/* Post Details Dialog (with comments) */}
      <PostDetailsDialog
        post={selectedPost}
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
        onEdit={() => {
          setEditPost(selectedPost);
          setSelectedPost(null);
        }}
        onDelete={() => {
          setDeletePostId(selectedPost?.id || null);
          setSelectedPost(null);
        }}
      />

      {/* Edit Post Dialog */}
      <EditPostDialog
        post={editPost}
        open={!!editPost}
        onOpenChange={(open) => !open && setEditPost(null)}
      />

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} className="py-4">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {!hasNextPage && posts.length > 0 && (
          <p className="text-center text-muted-foreground text-sm">
            You've reached the end of the feed
          </p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
