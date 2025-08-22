
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  Brain, 
  CloudRain, 
  Thermometer, 
  Sprout,
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter
} from 'lucide-react';

const scheduledTasks = [
  {
    id: 1,
    title: 'Apply Organic Fertilizer - Field A',
    priority: 'high',
    aiScore: 95,
    weather: 'optimal',
    cropStage: 'vegetative',
    dueDate: '2024-07-16',
    duration: '2 hours',
    equipment: ['Spreader', 'Tractor'],
    aiReason: 'Soil nitrogen levels are low, weather conditions perfect for next 3 days'
  },
  {
    id: 2,
    title: 'Pest Inspection - Tomato Greenhouse',
    priority: 'medium',
    aiScore: 87,
    weather: 'good',
    cropStage: 'flowering',
    dueDate: '2024-07-17',
    duration: '1 hour',
    equipment: ['Inspection tools', 'Camera'],
    aiReason: 'Increased pest activity detected in neighboring farms'
  },
  {
    id: 3,
    title: 'Irrigation System Maintenance',
    priority: 'low',
    aiScore: 72,
    weather: 'any',
    cropStage: 'n/a',
    dueDate: '2024-07-19',
    duration: '3 hours',
    equipment: ['Tools', 'Spare parts'],
    aiReason: 'Scheduled maintenance before peak growing season'
  }
];

const upcomingEvents = [
  { date: '2024-07-18', event: 'Harvest Window Opens - Maize Field B', type: 'harvest' },
  { date: '2024-07-20', event: 'Optimal Planting Conditions - Beans', type: 'planting' },
  { date: '2024-07-22', event: 'Fertilizer Application Due - Field C', type: 'maintenance' }
];

export default function SmartScheduling() {
  const [filter, setFilter] = useState('all');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'optimal': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good': return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'any': return <Thermometer className="h-4 w-4 text-gray-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center justify-center gap-2 md:gap-3">
            <Brain className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            AI Smart Scheduling
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Intelligent task scheduling powered by AI, weather data, and crop science
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">12</div>
              <p className="text-xs md:text-sm text-muted-foreground">Tasks This Week</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">8</div>
              <p className="text-xs md:text-sm text-muted-foreground">Completed Today</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">3</div>
              <p className="text-xs md:text-sm text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              <Brain className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">94%</div>
              <p className="text-xs md:text-sm text-muted-foreground">AI Accuracy</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* AI Scheduled Tasks */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg md:text-xl">AI-Optimized Task Schedule</CardTitle>
                    <CardDescription className="text-sm md:text-base">Tasks optimized for weather, crop cycles, and efficiency</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs md:text-sm">
                      <Filter className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Filter
                    </Button>
                    <Button size="sm" className="text-xs md:text-sm">
                      <Plus className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6">
                {scheduledTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-3 md:p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm md:text-base">{task.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{task.aiReason}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                          {task.priority}
                        </Badge>
                        {getWeatherIcon(task.weather)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">{task.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{task.duration}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Crop Stage</p>
                        <p className="font-medium capitalize">{task.cropStage}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">AI Score</p>
                        <p className="font-medium text-primary">{task.aiScore}%</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Equipment Needed:</p>
                      <div className="flex flex-wrap gap-1">
                        {task.equipment.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Task Optimization</span>
                        <span>{task.aiScore}%</span>
                      </div>
                      <Progress value={task.aiScore} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events & Weather */}
          <div className="space-y-4 md:space-y-6">
            <Card className="shadow-soft">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Sprout className="h-4 w-4 md:h-5 md:w-5" />
                  Upcoming Farm Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6 pt-0">
                {upcomingEvents.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{event.event}</p>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">AI Scheduling Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6 pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Weather Optimization</span>
                    <span className="text-green-600">+23% efficiency</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Resource Allocation</span>
                    <span className="text-blue-600">92% optimal</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Time Savings</span>
                    <span className="text-purple-600">4.2 hours/week</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 md:p-6 pt-0">
                <Button variant="outline" className="w-full justify-start text-xs md:text-sm" size="sm">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  View Full Calendar
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs md:text-sm" size="sm">
                  <Brain className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  AI Schedule Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs md:text-sm" size="sm">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Time Tracking
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
