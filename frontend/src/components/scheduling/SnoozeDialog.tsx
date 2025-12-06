import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSnoozeTask } from '@/api/hooks/useScheduling';
import { format } from 'date-fns';

interface SnoozeDialogProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
}

export default function SnoozeDialog({ open, onClose, taskId }: SnoozeDialogProps) {
  const snoozeTask = useSnoozeTask();
  const [snoozeDate, setSnoozeDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );

  const handleSnooze = async () => {
    try {
      await snoozeTask.mutateAsync({
        taskId,
        snooze_until: format(new Date(snoozeDate), "yyyy-MM-dd'T'HH:mm:ss"),
      });
      onClose();
    } catch (error) {
      console.error('Failed to snooze task:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Snooze Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="snooze-date">Snooze until</Label>
            <Input
              id="snooze-date"
              type="datetime-local"
              value={snoozeDate}
              onChange={(e) => setSnoozeDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
            <p className="text-xs text-muted-foreground">
              The task will be hidden until the specified date and time
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSnooze} disabled={snoozeTask.isPending}>
            {snoozeTask.isPending ? 'Snoozing...' : 'Snooze Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
