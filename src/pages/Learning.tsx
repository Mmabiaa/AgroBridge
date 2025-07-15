
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-3 md:px-4">
      <div className="container mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-2">
              <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              Learning & Training Center
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Master modern farming techniques with expert guidance</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="flex-1 md:flex-none">
              <Bot className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">Ask AgriGPT</span>
            </Button>
            <Button variant="farmer" size="sm" className="flex-1 md:flex-none">
              <Award className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">My Progress</span>
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-1">
          <Card className="shadow-soft">
            <CardContent className="flex items-center p-3 md:p-6">
              <Book className="h-6 w-6 md:h-8 md:w-8 text-primary mr-2 md:mr-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">8</p>
                <p className="text-xs md:text-sm text-muted-foreground">Courses Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-3 md:p-6">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-sky mr-2 md:mr-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">24h</p>
                <p className="text-xs md:text-sm text-muted-foreground">Learning Time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-3 md:p-6">
              <Award className="h-6 w-6 md:h-8 md:w-8 text-harvest mr-2 md:mr-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">12</p>
                <p className="text-xs md:text-sm text-muted-foreground">Certificates Earned</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-3 md:p-6">
              <Star className="h-6 w-6 md:h-8 md:w-8 text-warning mr-2 md:mr-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">4.9</p>
                <p className="text-xs md:text-sm text-muted-foreground">Average Rating</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 md:h-auto p-1 bg-muted/50">
            <TabsTrigger value="courses" className="text-xs md:text-sm py-2 md:py-3">Video Courses</TabsTrigger>
            <TabsTrigger value="guides" className="text-xs md:text-sm py-2 md:py-3">PDF Guides</TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs md:text-sm py-2 md:py-3">Achievements</TabsTrigger>
          </TabsList>

          {/* Video Courses Tab */}
          <TabsContent value="courses" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            {/* Search and Filter */}
            <Card className="shadow-soft mx-1">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 md:h-10"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="flex-shrink-0 text-xs md:text-sm"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-0 md:px-1">
              {courses.map((course) => (
                <Card key={course.id} className="shadow-soft hover:shadow-strong transition-all duration-300 touch-manipulation">
                  <div className="relative">
                    <div className="w-full h-32 md:h-48 bg-muted rounded-t-lg flex items-center justify-center">
                      <Play className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
                    </div>
                    <div className="absolute top-2 md:top-4 left-2 md:left-4">
                      <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                    </div>
                    <div className="absolute top-2 md:top-4 right-2 md:right-4">
                      <Badge variant="outline" className="bg-white/90 text-xs">
                        {course.level}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                    <CardTitle className="text-base md:text-lg line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="text-xs md:text-sm line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
                    {/* Course Info */}
                    <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
                      <span className="truncate mr-2">By {course.instructor}</span>
                      <span className="flex-shrink-0">{course.duration}</span>
                    </div>

                    {/* Rating and Students */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 md:h-4 md:w-4 text-warning fill-current" />
                        <span className="text-xs md:text-sm font-medium">{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                        <span className="text-xs md:text-sm">{course.students} students</span>
                      </div>
                    </div>

                    {/* Progress */}
                    {course.progress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs md:text-sm">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    )}

                    {/* Action Button */}
                    <Button variant="farmer" className="w-full text-sm md:text-base py-2 md:py-3">
                      {course.progress === 0 ? 'Start Course' : 
                       course.progress === 100 ? 'Review' : 'Continue Learning'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* PDF Guides Tab */}
          <TabsContent value="guides" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-0 md:px-1">
              {guides.map((guide) => (
                <Card key={guide.id} className="shadow-soft touch-manipulation">
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 md:p-3 bg-red-100 rounded-lg flex-shrink-0">
                        <Book className="h-4 w-4 md:h-6 md:w-6 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base md:text-lg line-clamp-2">{guide.title}</CardTitle>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mt-1">
                          <span>{guide.type}</span>
                          <span>•</span>
                          <span>{guide.size}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">{guide.description}</p>
                    
                    <div className="flex items-center gap-1 text-xs md:text-sm">
                      <Download className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                      <span>{guide.downloads} downloads</span>
                    </div>

                    <Button variant="outline" className="w-full text-sm md:text-base py-2 md:py-3">
                      <Download className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-0 md:px-1">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={`shadow-soft touch-manipulation ${achievement.unlocked ? '' : 'opacity-60'}`}>
                  <CardContent className="flex items-center p-4 md:p-6">
                    <div className={`p-2 md:p-3 rounded-full mr-3 md:mr-4 flex-shrink-0 ${
                      achievement.unlocked ? 'bg-gradient-primary' : 'bg-muted'
                    }`}>
                      {achievement.unlocked ? (
                        <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
                      ) : (
                        <Award className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm md:text-base font-semibold line-clamp-1">{achievement.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{achievement.description}</p>
                      {achievement.unlocked && (
                        <Badge variant="secondary" className="mt-2 text-xs">Unlocked</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* AgriGPT Integration */}
        <Card className="shadow-soft bg-gradient-sky text-primary-foreground mx-1">
          <CardContent className="p-6 md:p-8 text-center">
            <Bot className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">Need Help Understanding?</h3>
            <p className="mb-4 text-sm md:text-base">
              Ask AgriGPT to explain any concept from your courses in simple terms or in your local language.
            </p>
            <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-sm md:text-base py-2 md:py-3 px-4 md:px-6">
              <Bot className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              Chat with AgriGPT
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
