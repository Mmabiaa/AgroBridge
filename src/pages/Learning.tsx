import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Play, 
  Book, 
  Award, 
  Search,
  Clock,
  Users,
  Star,
  Download,
  CheckCircle,
  Bot
} from 'lucide-react';

const categories = ['All', 'Crop Management', 'Poultry Care', 'Soil Health', 'Pest Control', 'Equipment'];

const courses = [
  {
    id: 1,
    title: 'Tomato Farming Masterclass',
    instructor: 'Dr. Samuel Osei',
    duration: '2 hours',
    level: 'Beginner',
    rating: 4.8,
    students: 1247,
    price: 0,
    category: 'Crop Management',
    description: 'Complete guide to growing healthy, profitable tomatoes',
    progress: 0,
    thumbnail: '/placeholder.svg'
  },
  {
    id: 2,
    title: 'Poultry Disease Prevention',
    instructor: 'Dr. Grace Asante',
    duration: '1.5 hours',
    level: 'Intermediate',
    rating: 4.9,
    students: 892,
    price: 0,
    category: 'Poultry Care',
    description: 'Learn to identify and prevent common poultry diseases',
    progress: 60,
    thumbnail: '/placeholder.svg'
  },
  {
    id: 3,
    title: 'Soil Testing & Analysis',
    instructor: 'Prof. James Kwame',
    duration: '3 hours',
    level: 'Advanced',
    rating: 4.7,
    students: 534,
    price: 0,
    category: 'Soil Health',
    description: 'Master soil testing techniques for optimal crop growth',
    progress: 100,
    thumbnail: '/placeholder.svg'
  },
  {
    id: 4,
    title: 'Organic Pest Control Methods',
    instructor: 'Mary Adjei',
    duration: '2.5 hours',
    level: 'Intermediate',
    rating: 4.8,
    students: 678,
    price: 0,
    category: 'Pest Control',
    description: 'Natural and safe pest control techniques',
    progress: 25,
    thumbnail: '/placeholder.svg'
  }
];

const guides = [
  {
    id: 1,
    title: 'Complete Maize Farming Guide',
    type: 'PDF',
    size: '2.5 MB',
    downloads: 3421,
    description: 'Comprehensive guide covering maize cultivation from seed to harvest'
  },
  {
    id: 2,
    title: 'Broiler Management Handbook',
    type: 'PDF',
    size: '1.8 MB',
    downloads: 2156,
    description: 'Best practices for raising healthy broiler chickens'
  },
  {
    id: 3,
    title: 'Irrigation Planning Workbook',
    type: 'PDF',
    size: '3.2 MB',
    downloads: 1534,
    description: 'Step-by-step guide to planning efficient irrigation systems'
  }
];

const achievements = [
  { id: 1, title: 'First Course Completed', description: 'Complete your first course', unlocked: true },
  { id: 2, title: 'Knowledge Seeker', description: 'Complete 5 courses', unlocked: true },
  { id: 3, title: 'Expert Learner', description: 'Complete 10 courses', unlocked: false },
  { id: 4, title: 'Master Farmer', description: 'Complete all available courses', unlocked: false }
];

export default function Learning() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Learning & Training Center
            </h1>
            <p className="text-muted-foreground">Master modern farming techniques with expert guidance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Bot className="h-4 w-4 mr-2" />
              Ask AgriGPT
            </Button>
            <Button variant="farmer">
              <Award className="h-4 w-4 mr-2" />
              My Progress
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="flex items-center p-6">
              <Book className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Courses Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-sky mr-4" />
              <div>
                <p className="text-2xl font-bold">24h</p>
                <p className="text-sm text-muted-foreground">Learning Time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-6">
              <Award className="h-8 w-8 text-harvest mr-4" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Certificates Earned</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-6">
              <Star className="h-8 w-8 text-warning mr-4" />
              <div>
                <p className="text-2xl font-bold">4.9</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">Video Courses</TabsTrigger>
            <TabsTrigger value="guides">PDF Guides</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Video Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            {/* Search and Filter */}
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="shadow-soft hover:shadow-strong transition-all duration-300">
                  <div className="relative">
                    <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary">{course.category}</Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-white/90">
                        {course.level}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Course Info */}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>By {course.instructor}</span>
                      <span>{course.duration}</span>
                    </div>

                    {/* Rating and Students */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning fill-current" />
                        <span className="text-sm font-medium">{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{course.students} students</span>
                      </div>
                    </div>

                    {/* Progress */}
                    {course.progress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    )}

                    {/* Action Button */}
                    <Button variant="farmer" className="w-full">
                      {course.progress === 0 ? 'Start Course' : 
                       course.progress === 100 ? 'Review' : 'Continue Learning'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* PDF Guides Tab */}
          <TabsContent value="guides" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <Card key={guide.id} className="shadow-soft">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Book className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{guide.type}</span>
                          <span>•</span>
                          <span>{guide.size}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                    
                    <div className="flex items-center gap-1 text-sm">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span>{guide.downloads} downloads</span>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={`shadow-soft ${achievement.unlocked ? '' : 'opacity-60'}`}>
                  <CardContent className="flex items-center p-6">
                    <div className={`p-3 rounded-full mr-4 ${
                      achievement.unlocked ? 'bg-gradient-primary' : 'bg-muted'
                    }`}>
                      {achievement.unlocked ? (
                        <CheckCircle className="h-8 w-8 text-primary-foreground" />
                      ) : (
                        <Award className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {achievement.unlocked && (
                        <Badge variant="secondary" className="mt-2">Unlocked</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* AgriGPT Integration */}
        <Card className="shadow-soft bg-gradient-sky text-primary-foreground">
          <CardContent className="p-8 text-center">
            <Bot className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Need Help Understanding?</h3>
            <p className="mb-4">
              Ask AgriGPT to explain any concept from your courses in simple terms or in your local language.
            </p>
            <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Bot className="h-4 w-4 mr-2" />
              Chat with AgriGPT
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}