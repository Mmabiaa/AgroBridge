
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  Brain,
  AlertTriangle,
  CheckCircle,
  Plus,
  ListTodo,
  CalendarDays,
  Lightbulb
} from 'lucide-react';
import { useTasks, useTaskStatistics, useUpcomingTasks } from '@/api/hooks/useScheduling';
import { format } from 'date-fns';
import TaskForm from '@/components/scheduling/TaskForm';
import TaskList from '@/components/scheduling/TaskList';
import CalendarView from '@/components/scheduling/CalendarView';
import TaskSuggestions from '@/components/scheduling/TaskSuggestions';

export default function SmartScheduling() {
  const [filter, setFilter] = useState<{
    status?: string;
    priority?: string;
  }>({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [view, setView] = useState<'list' | 'calendar' | 'suggestions'>('list');

  // Fetch data
  const { data: tasksData, isLoading: tasksLoading } = useTasks(filter);
  const { data: statistics, isLoading: statsLoading } = useTaskStatistics();
  const { data: upcomingTasks, isLoading: upcomingLoading } = useUpcomingTasks(7);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 md:gap-3">
              <Brain className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              Smart Scheduling
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Manage your farm tasks with AI-powered scheduling
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('list')}
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Tasks
            </Button>
            <Button
              variant={view === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('calendar')}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={view === 'suggestions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('suggestions')}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              AI Suggestions
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              {statsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <ListTodo className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
                  <div className="text-xl md:text-2xl font-bold">
                    {statistics?.total_tasks || 0}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Tasks</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              {statsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-xl md:text-2xl font-bold">
                    {statistics?.completed_tasks || 0}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Completed</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              {statsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-xl md:text-2xl font-bold">
                    {statistics?.overdue_tasks || 0}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Overdue</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              {statsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <Brain className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
                  <div className="text-xl md:text-2xl font-bold">
                    {statistics?.completion_rate ? `${Math.round(statistics.completion_rate)}%` : '0%'}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Completion Rate</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {view === 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Tasks List */}
            <div className="lg:col-span-2">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg md:text-xl">My Tasks</CardTitle>
                      <CardDescription className="text-sm md:text-base">
                        Manage and track your farm tasks
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="text-xs md:text-sm border rounded-md px-3 py-2"
                        value={filter.status || 'all'}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <select
                        className="text-xs md:text-sm border rounded-md px-3 py-2"
                        value={filter.priority || 'all'}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                      >
                        <option value="all">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <Button size="sm" onClick={() => setShowTaskForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <TaskList
                    tasks={tasksData?.results || []}
                    isLoading={tasksLoading}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Tasks Sidebar */}
            <div className="space-y-4 md:space-y-6">
              <Card className="shadow-soft">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Clock className="h-4 w-4 md:h-5 md:w-5" />
                    Upcoming Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                  {upcomingLoading ? (
                    <>
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </>
                  ) : upcomingTasks && upcomingTasks.length > 0 ? (
                    upcomingTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(task.due_date), 'MMM dd, yyyy')}
                            {task.due_time && ` at ${task.due_time}`}
                          </p>
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs mt-1">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No upcoming tasks
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 md:p-6 pt-0">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs md:text-sm"
                    size="sm"
                    onClick={() => setView('calendar')}
                  >
                    <CalendarDays className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                    View Calendar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs md:text-sm"
                    size="sm"
                    onClick={() => setView('suggestions')}
                  >
                    <Lightbulb className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                    AI Suggestions
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs md:text-sm"
                    size="sm"
                    onClick={() => setShowTaskForm(true)}
                  >
                    <Plus className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                    Create Task
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {view === 'calendar' && <CalendarView />}

        {view === 'suggestions' && <TaskSuggestions />}

        {/* Task Form Dialog */}
        {showTaskForm && (
          <TaskForm
            open={showTaskForm}
            onClose={() => setShowTaskForm(false)}
          />
        )}
      </div>
    </div>
  );
}
