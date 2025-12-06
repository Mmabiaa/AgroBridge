/**
 * React Query hooks for Task Scheduling
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import schedulingService, {
  Task,
  CreateTaskRequest,
  TaskListParams,
} from '../services/scheduling.service';
import { toast } from 'sonner';

// Query keys
export const schedulingKeys = {
  all: ['scheduling'] as const,
  tasks: () => [...schedulingKeys.all, 'tasks'] as const,
  taskList: (params?: TaskListParams) => [...schedulingKeys.tasks(), 'list', params] as const,
  task: (id: string) => [...schedulingKeys.tasks(), 'detail', id] as const,
  upcoming: (days?: number) => [...schedulingKeys.tasks(), 'upcoming', days] as const,
  overdue: () => [...schedulingKeys.tasks(), 'overdue'] as const,
  calendar: (params?: any) => [...schedulingKeys.all, 'calendar', params] as const,
  suggestions: () => [...schedulingKeys.all, 'suggestions'] as const,
  categories: () => [...schedulingKeys.all, 'categories'] as const,
  statistics: () => [...schedulingKeys.all, 'statistics'] as const,
};

/**
 * Get list of tasks
 */
export function useTasks(params?: TaskListParams) {
  return useQuery({
    queryKey: schedulingKeys.taskList(params),
    queryFn: () => schedulingService.getTasks(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get task by ID
 */
export function useTask(taskId: string) {
  return useQuery({
    queryKey: schedulingKeys.task(taskId),
    queryFn: () => schedulingService.getTask(taskId),
    enabled: !!taskId,
  });
}

/**
 * Get upcoming tasks
 */
export function useUpcomingTasks(days?: number) {
  return useQuery({
    queryKey: schedulingKeys.upcoming(days),
    queryFn: () => schedulingService.getUpcomingTasks(days),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get overdue tasks
 */
export function useOverdueTasks() {
  return useQuery({
    queryKey: schedulingKeys.overdue(),
    queryFn: () => schedulingService.getOverdueTasks(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get calendar events
 */
export function useCalendar(params?: {
  start_date?: string;
  end_date?: string;
  view?: 'month' | 'week' | 'day';
}) {
  return useQuery({
    queryKey: schedulingKeys.calendar(params),
    queryFn: () => schedulingService.getCalendar(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get AI task suggestions
 */
export function useTaskSuggestions() {
  return useQuery({
    queryKey: schedulingKeys.suggestions(),
    queryFn: () => schedulingService.getSuggestions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get task categories
 */
export function useTaskCategories() {
  return useQuery({
    queryKey: schedulingKeys.categories(),
    queryFn: () => schedulingService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get task statistics
 */
export function useTaskStatistics() {
  return useQuery({
    queryKey: schedulingKeys.statistics(),
    queryFn: () => schedulingService.getStatistics(),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create task mutation
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => schedulingService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.calendar() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.statistics() });
      toast.success('Task created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create task');
    },
  });
}

/**
 * Update task mutation
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<CreateTaskRequest> }) =>
      schedulingService.updateTask(taskId, data),
    onMutate: async ({ taskId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: schedulingKeys.task(taskId) });

      // Snapshot previous value
      const previousTask = queryClient.getQueryData(schedulingKeys.task(taskId));

      // Optimistically update
      queryClient.setQueryData(schedulingKeys.task(taskId), (old: Task | undefined) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previousTask };
    },
    onError: (_err, { taskId }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(schedulingKeys.task(taskId), context.previousTask);
      }
      toast.error('Failed to update task');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.calendar() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.statistics() });
      toast.success('Task updated successfully');
    },
  });
}

/**
 * Delete task mutation
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => schedulingService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.calendar() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.statistics() });
      toast.success('Task deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });
}

/**
 * Complete task mutation
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => schedulingService.completeTask(taskId),
    onMutate: async (taskId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: schedulingKeys.task(taskId) });

      // Snapshot previous value
      const previousTask = queryClient.getQueryData(schedulingKeys.task(taskId));

      // Optimistically update
      queryClient.setQueryData(schedulingKeys.task(taskId), (old: Task | undefined) => {
        if (!old) return old;
        return { ...old, status: 'completed' as const, completed_at: new Date().toISOString() };
      });

      return { previousTask };
    },
    onError: (_err, taskId, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(schedulingKeys.task(taskId), context.previousTask);
      }
      toast.error('Failed to complete task');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.statistics() });
      toast.success('Task completed!');
    },
  });
}

/**
 * Snooze task mutation
 */
export function useSnoozeTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, snooze_until }: { taskId: string; snooze_until: string }) =>
      schedulingService.snoozeTask(taskId, snooze_until),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.calendar() });
      toast.success('Task snoozed');
    },
    onError: () => {
      toast.error('Failed to snooze task');
    },
  });
}

/**
 * Accept task suggestion mutation
 */
export function useAcceptSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestionId: string) => schedulingService.acceptSuggestion(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.suggestions() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.calendar() });
      toast.success('Task added from suggestion');
    },
    onError: () => {
      toast.error('Failed to accept suggestion');
    },
  });
}

/**
 * Dismiss task suggestion mutation
 */
export function useDismissSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestionId: string) => schedulingService.dismissSuggestion(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.suggestions() });
      toast.success('Suggestion dismissed');
    },
    onError: () => {
      toast.error('Failed to dismiss suggestion');
    },
  });
}
