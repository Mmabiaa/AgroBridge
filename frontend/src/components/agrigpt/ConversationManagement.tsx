import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreVertical,
  Archive,
  Download,
  Search,
  Loader2,
  FileText,
  FileJson,
  FileType,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useArchiveConversation,
  useUnarchiveConversation,
  useExportConversation,
} from '@/api/hooks/useAI';

interface ConversationManagementProps {
  conversationId: string;
  isArchived?: boolean;
  onArchiveSuccess?: () => void;
}

export function ConversationManagement({
  conversationId,
  isArchived = false,
  onArchiveSuccess,
}: ConversationManagementProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { toast } = useToast();

  const archiveMutation = useArchiveConversation();
  const unarchiveMutation = useUnarchiveConversation();
  const exportMutation = useExportConversation();

  const handleArchive = async () => {
    try {
      if (isArchived) {
        await unarchiveMutation.mutateAsync(conversationId);
        toast({
          title: "Conversation Unarchived",
          description: "The conversation has been restored",
        });
      } else {
        await archiveMutation.mutateAsync(conversationId);
        toast({
          title: "Conversation Archived",
          description: "The conversation has been archived",
        });
      }
      onArchiveSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isArchived ? 'unarchive' : 'archive'} conversation`,
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: 'json' | 'txt' | 'pdf') => {
    try {
      const blob = await exportMutation.mutateAsync({ conversationId, format });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${conversationId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Conversation exported as ${format.toUpperCase()}`,
      });
      setExportDialogOpen(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleArchive} disabled={archiveMutation.isPending || unarchiveMutation.isPending}>
            {archiveMutation.isPending || unarchiveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            {isArchived ? 'Unarchive' : 'Archive'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Conversation</DialogTitle>
            <DialogDescription>
              Choose a format to export your conversation history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleExport('json')}
              disabled={exportMutation.isPending}
            >
              <FileJson className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">JSON Format</div>
                <div className="text-xs text-muted-foreground">
                  Machine-readable format with full metadata
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleExport('txt')}
              disabled={exportMutation.isPending}
            >
              <FileText className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Text Format</div>
                <div className="text-xs text-muted-foreground">
                  Simple text file for easy reading
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleExport('pdf')}
              disabled={exportMutation.isPending}
            >
              <FileType className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">PDF Format</div>
                <div className="text-xs text-muted-foreground">
                  Formatted document for printing or sharing
                </div>
              </div>
            </Button>
          </div>
          {exportMutation.isPending && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Preparing export...
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ConversationSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function ConversationSearch({ onSearch, placeholder = "Search conversations..." }: ConversationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
