import { Task } from '@/api/services/scheduling.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useCompleteTask, useDeleteTask, useSnoozeTask } from '@/api/hooks/useScheduling';
import { format, addHours, addDays } from 'date-fns';
import { Clock, Calendar, MoreVertical, Edit, Trash2, AlarmClock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import TaskForm from './TaskForm';
import SnoozeDialog from './SnoozeDialog';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  getPriorityColor: (priority: string) => 'destructive' | 'default' | 'secondary';
  getStatusColor: (status: string) => 'destructive' | 'default' | 'secondary';
}

export default function TaskList({
  tasks,
  isLoading,
  getPriorityColor,
  getStatusColor,
}: TaskListProps) {
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const snoozeTask = useSnoozeTask();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [snoozeTaskId, setSnoozeTaskId] = useState<string | null>(null);

  const handleComplete = (taskId: string, isCompleted: boolean) => {
    if (!isCompleted) {
      completeTask.mutate(taskId);
    }
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(taskId);
    }
  };

  const handleQuickSnooze = (taskId: string, hours: number) => {
    const snoozeUntil = format(addHours(new Date(), hours), "yyyy-MM-dd'T'HH:mm:ss");
    snoozeTask.mutate({ taskId, snooze_until: snoozeUntil });
  };

  const handleSnoozeDays = (taskId: string, days: number) => {
    const snoozeUntil = format(addDays(new Date(), days), "yyyy-MM-dd'T'HH:mm:ss");
    snoozeTask.mutate({ taskId, snooze_until: snoozeUntil });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tasks found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first task to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`border rounded-lg p-4 space-y-3 transition-opacity ${
              task.status === 'completed' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={(checked) => handleComplete(task.id, !!checked)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3
                      className={`font-semibold text-sm md:text-base ${
                        task.status === 'completed' ? 'line-through' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTask(task)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      
                      {task.status !== 'completed' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <AlarmClock className="h-4 w-4 mr-2" />
                              Snooze
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleQuickSnooze(task.id, 1)}>
                                1 hour
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickSnooze(task.id, 3)}>
                                3 hours
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSnoozeDays(task.id, 1)}>
                                Tomorrow
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSnoozeDays(task.id, 7)}>
                                Next week
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setSnoozeTaskId(task.id)}>
                                Custom...
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(task.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                    {task.priority}
                  </Badge>
                  <Badge variant={getStatusColor(task.status)} className="text-xs">
                    {task.status.replace('_', ' ')}
                  </Badge>
                  {task.category && (
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                  {task.due_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{task.due_time}</span>
                    </div>
                  )}
                  {task.recurrence && (
                    <Badge variant="outline" className="text-xs">
                      Repeats {task.recurrence.frequency}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingTask && (
        <TaskForm
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
        />
      )}

      {snoozeTaskId && (
        <SnoozeDialog
          open={!!snoozeTaskId}
          onClose={() => setSnoozeTaskId(null)}
          taskId={snoozeTaskId}
        />
      )}
    </>
  );
}
