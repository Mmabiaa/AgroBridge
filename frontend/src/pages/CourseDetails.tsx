import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Clock,
  Users,
  Star,
  BookOpen,
  Play,
  CheckCircle,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCourse, useLessons, useEnrollInCourse, useEnrollments } from '@/api/hooks/useLearning';
import { toast } from 'sonner';

export default function CourseDetails() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);

  // Fetch course details
  const { data: course, isLoading: courseLoading, isError: courseError } = useCourse(courseId!);

  // Fetch course lessons
  const { data: lessons, isLoading: lessonsLoading } = useLessons(courseId!);

  // Fetch user enrollments to check if already enrolled
  const { data: enrollments } = useEnrollments();

  // Enroll mutation
  const enrollMutation = useEnrollInCourse();

  // Check if user is enrolled
  const enrollment = enrollments?.find(e => e.course === courseId);
  const isEnrolled = !!enrollment;

  // Handle enrollment
  const handleEnroll = async () => {
    if (!courseId) return;

    setEnrolling(true);
    try {
      await enrollMutation.mutateAsync(courseId);
      toast.success('Enrolled successfully!', {
        description: 'You can now start learning.',
      });
    } catch (error: any) {
      toast.error('Enrollment failed', {
        description: error?.message || 'Please try again later.',
      });
    } finally {
      setEnrolling(false);
    }
  };

  // Handle start learning
  const handleStartLearning = () => {
    if (lessons && lessons.length > 0) {
      // Find first incomplete lesson or first lesson
      const firstIncompleteLesson = lessons.find(l => !l.is_completed) || lessons[0];
      navigate(`/learning/lessons/${firstIncompleteLesson.id}`);
    }
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get instructor initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8">
        <div className="container mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8">
        <div className="container mx-auto max-w-6xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load course details. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Back Button */}
        <Link to="/learning">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <Card className="shadow-soft">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge variant="outline" className="capitalize">{course.level}</Badge>
                  {course.is_free && <Badge className="bg-green-500">Free</Badge>}
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl mb-2">{course.title}</CardTitle>
                  <CardDescription className="text-base">{course.description}</CardDescription>
                </div>

                {/* Course Stats */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-warning fill-current" />
                    <span className="font-medium">{course.rating.toFixed(1)}</span>
                    <span>({course.reviews_count} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.enrolled_count} students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration_hours} hours</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.lessons_count} lessons</span>
                  </div>
                </div>

                {/* Progress Bar for Enrolled Users */}
                {isEnrolled && enrollment && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Your Progress</span>
                      <span className="font-medium">{Math.round(enrollment.progress)}%</span>
                    </div>
                    <Progress value={enrollment.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {enrollment.completed_lessons} of {enrollment.total_lessons} lessons completed
                    </p>
                  </div>
                )}
              </CardHeader>

              {/* Course Thumbnail */}
              {course.thumbnail && (
                <div className="px-6 pb-6">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-64 md:h-96 object-cover rounded-lg"
                  />
                </div>
              )}
            </Card>

            {/* Instructor Info */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={course.instructor.avatar} alt={course.instructor.name} />
                    <AvatarFallback>{getInitials(course.instructor.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{course.instructor.name}</h3>
                    <p className="text-sm text-muted-foreground">Course Instructor</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Curriculum */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Course Curriculum</CardTitle>
                <CardDescription>
                  {course.lessons_count} lessons • {course.duration_hours} hours total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lessonsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : lessons && lessons.length > 0 ? (
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {lesson.is_completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : lesson.is_preview || isEnrolled ? (
                              <Play className="h-5 w-5 text-primary" />
                            ) : (
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {index + 1}. {lesson.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDuration(lesson.duration_minutes)}
                              {lesson.is_preview && ' • Preview'}
                            </p>
                          </div>
                        </div>
                        {(lesson.is_preview || isEnrolled) && (
                          <Link to={`/learning/lessons/${lesson.id}`}>
                            <Button variant="ghost" size="sm">
                              {lesson.is_completed ? 'Review' : 'Start'}
                            </Button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No lessons available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <Card className="shadow-soft sticky top-4">
              <CardContent className="p-6 space-y-4">
                {!course.is_free && (
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {course.currency} {course.price}
                    </p>
                    <p className="text-sm text-muted-foreground">One-time payment</p>
                  </div>
                )}

                {isEnrolled ? (
                  <Button
                    variant="farmer"
                    size="lg"
                    className="w-full"
                    onClick={handleStartLearning}
                    disabled={!lessons || lessons.length === 0}
                  >
                    {enrollment?.progress === 100 ? 'Review Course' : 'Continue Learning'}
                  </Button>
                ) : (
                  <Button
                    variant="farmer"
                    size="lg"
                    className="w-full"
                    onClick={handleEnroll}
                    disabled={enrolling || enrollMutation.isPending}
                  >
                    {enrolling || enrollMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>Enroll Now</>
                    )}
                  </Button>
                )}

                <Separator />

                {/* Course Includes */}
                <div className="space-y-3">
                  <p className="font-semibold text-sm">This course includes:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{course.duration_hours} hours of video content</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{course.lessons_count} lessons</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Lifetime access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Certificate of completion</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Mobile and desktop access</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
