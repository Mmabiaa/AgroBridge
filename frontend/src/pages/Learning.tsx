
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Bot,
  AlertCircle
} from 'lucide-react';
import { useCourses, useCategories, useEnrollments } from '@/api/hooks/useLearning';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch categories
  const { data: categoriesData } = useCategories();
  
  // Fetch enrollments to show progress
  const { data: enrollments } = useEnrollments();

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      page_size: 12,
    };
    
    if (debouncedSearchTerm) {
      params.search = debouncedSearchTerm;
    }
    
    if (selectedCategory) {
      params.category = selectedCategory;
    }
    
    return params;
  }, [debouncedSearchTerm, selectedCategory, currentPage]);

  // Fetch courses with filters
  const { data: coursesData, isLoading, isError, error } = useCourses(queryParams);

  // Create enrollment map for quick lookup
  const enrollmentMap = useMemo(() => {
    if (!enrollments) return new Map();
    return new Map(enrollments.map(e => [e.course, e]));
  }, [enrollments]);

  // Get course progress
  const getCourseProgress = (courseId: string) => {
    const enrollment = enrollmentMap.get(courseId);
    return enrollment?.progress || 0;
  };

  // Format duration
  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-0 sm:px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-0 sm:px-2 w-full max-w-full">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-2">
              <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              Learning & Training Center
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Master modern farming techniques with expert guidance</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Link to="/agrigpt" className="flex-1 md:flex-none">
              <Button variant="outline" size="sm" className="w-full">
                <Bot className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="text-xs md:text-sm">Ask AgriGPT</span>
              </Button>
            </Link>
            <Button variant="farmer" size="sm" className="flex-1 md:flex-none">
              <Award className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">My Progress</span>
            </Button>
          </div>
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
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                      }}
                      className="pl-10 h-12 md:h-10"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                      variant={!selectedCategory ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory('');
                        setCurrentPage(1);
                      }}
                      className="flex-shrink-0 text-xs md:text-sm"
                    >
                      All
                    </Button>
                    {categoriesData?.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(category);
                          setCurrentPage(1);
                        }}
                        className="flex-shrink-0 text-xs md:text-sm"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-0 md:px-1">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="shadow-soft">
                    <Skeleton className="w-full h-32 md:h-48 rounded-t-lg" />
                    <CardHeader className="p-4 md:p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <Alert variant="destructive" className="mx-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load courses. {error?.message || 'Please try again later.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Empty State */}
            {!isLoading && !isError && coursesData?.results.length === 0 && (
              <Card className="shadow-soft mx-1">
                <CardContent className="p-8 md:p-12 text-center">
                  <Book className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg md:text-xl font-semibold mb-2">No courses found</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4">
                    {searchTerm || selectedCategory
                      ? 'Try adjusting your search or filters'
                      : 'No courses are available at the moment'}
                  </p>
                  {(searchTerm || selectedCategory) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('');
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Course Grid */}
            {!isLoading && !isError && coursesData && coursesData.results.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-0 md:px-1">
                  {coursesData.results.map((course) => {
                    const progress = getCourseProgress(course.id);
                    const isEnrolled = progress > 0;

                    return (
                      <Card key={course.id} className="shadow-soft hover:shadow-strong transition-all duration-300 touch-manipulation">
                        <div className="relative">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-32 md:h-48 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-32 md:h-48 bg-muted rounded-t-lg flex items-center justify-center">
                              <Play className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-2 md:top-4 left-2 md:left-4">
                            <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                          </div>
                          <div className="absolute top-2 md:top-4 right-2 md:right-4">
                            <Badge variant="outline" className="bg-white/90 text-xs capitalize">
                              {course.level}
                            </Badge>
                          </div>
                          {!course.is_free && (
                            <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4">
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                {course.currency} {course.price}
                              </Badge>
                            </div>
                          )}
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
                            <span className="truncate mr-2">By {course.instructor.name}</span>
                            <span className="flex-shrink-0 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(course.duration_hours)}
                            </span>
                          </div>

                          {/* Rating and Students */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 md:h-4 md:w-4 text-warning fill-current" />
                              <span className="text-xs md:text-sm font-medium">{course.rating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({course.reviews_count})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                              <span className="text-xs md:text-sm">{course.enrolled_count} students</span>
                            </div>
                          </div>

                          {/* Progress */}
                          {isEnrolled && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs md:text-sm">
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}

                          {/* Action Button */}
                          <Link to={`/learning/courses/${course.id}`}>
                            <Button variant="farmer" className="w-full text-sm md:text-base py-2 md:py-3">
                              {!isEnrolled ? 'View Course' : 
                               progress === 100 ? 'Review' : 'Continue Learning'}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {coursesData.count > queryParams.page_size && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={!coursesData.previous}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {Math.ceil(coursesData.count / queryParams.page_size)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={!coursesData.next}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
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
            <Link to="/agrigpt">
              <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-sm md:text-base py-2 md:py-3 px-4 md:px-6 w-full">
                <Bot className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Chat with AgriGPT
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
