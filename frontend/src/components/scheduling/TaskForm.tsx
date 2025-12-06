import { Task, CreateTaskRequest } from '@/api/services/scheduling.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreateTask, useUpdateTask, useTaskCategories } from '@/api/hooks/useScheduling';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  due_date: z.date({ required_error: 'Due date is required' }),
  due_time: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().min(1, 'Category is required'),
  farm: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task;
}

export default function TaskForm({ open, onClose, task }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: categories } = useTaskCategories();
  
  const [hasRecurrence, setHasRecurrence] = useState(!!task?.recurrence);
  const [recurrence, setRecurrence] = useState<{
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    end_date?: string;
  }>(task?.recurrence || { frequency: 'daily', interval: 1 });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description || '',
          due_date: new Date(task.due_date),
          due_time: task.due_time || '',
          priority: task.priority,
          category: task.category,
          farm: task.farm || '',
        }
      : {
          priority: 'medium',
          category: '',
        },
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      const payload: CreateTaskRequest = {
        title: data.title,
        description: data.description,
        due_date: format(data.due_date, 'yyyy-MM-dd'),
        due_time: data.due_time || undefined,
        priority: data.priority,
        category: data.category,
        farm: data.farm || undefined,
        recurrence: hasRecurrence ? recurrence : undefined,
      };

      if (task) {
        await updateTask.mutateAsync({ taskId: task.id, data: payload });
      } else {
        await createTask.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Apply fertilizer to Field A"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details about this task..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Due Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="due_date"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.due_date && (
                <p className="text-sm text-destructive">{errors.due_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_time">Due Time (Optional)</Label>
              <Input
                id="due_time"
                type="time"
                {...register('due_time')}
              />
            </div>
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Priority <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.length > 0 ? (
                        categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="planting">Planting</SelectItem>
                          <SelectItem value="irrigation">Irrigation</SelectItem>
                          <SelectItem value="fertilization">Fertilization</SelectItem>
                          <SelectItem value="pest_control">Pest Control</SelectItem>
                          <SelectItem value="harvesting">Harvesting</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="recurrence">Recurring Task</Label>
              <Switch
                id="recurrence"
                checked={hasRecurrence}
                onCheckedChange={setHasRecurrence}
              />
            </div>

            {hasRecurrence && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={recurrence.frequency}
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                        setRecurrence({ ...recurrence, frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Interval</Label>
                    <Input
                      type="number"
                      min="1"
                      value={recurrence.interval}
                      onChange={(e) =>
                        setRecurrence({
                          ...recurrence,
                          interval: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={recurrence.end_date || ''}
                    onChange={(e) =>
                      setRecurrence({ ...recurrence, end_date: e.target.value || undefined })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
