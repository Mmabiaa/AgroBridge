import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Post } from '@/api/services/community.service';
import { PostCard } from './PostCard';
import { CommentsSection } from './CommentsSection';

interface PostDetailsDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PostDetailsDialog({
  post,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: PostDetailsDialogProps) {
  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Post</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="px-6 pb-6 space-y-6">
            {/* Post Content */}
            <PostCard
              post={post}
              onEdit={onEdit}
              onDelete={onDelete}
            />

            <Separator />

            {/* Comments Section */}
            <div>
              <h3 className="font-semibold mb-4">Comments</h3>
              <CommentsSection postId={post.id} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
