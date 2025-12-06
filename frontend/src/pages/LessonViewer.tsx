import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Play,
  BookOpen,
} from 'lucide-react';
import { useLesson, useLessons, useCompleteLesson, useCourse } from '@/api/hooks/useLearning';
import { toast } from 'sonner';

export default function LessonViewer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);

  // Fetch lesson details
  const { data: lesson, isLoading: lessonLoading, isError: lessonError } = useLesson(lessonId!);

  // Fetch course details to get course info
  const { data: course } = useCourse(lesson?.course || '');

  // Fetch all lessons for navigation
  const { data: lessons } = useLessons(lesson?.course || '');

  // Ensure lesson is loaded before accessing its properties
  const courseId = lesson?.course || '';

  // Complete lesson mutation
  const completeMutation = useCompleteLesson();

  // Find current lesson index and navigation
  const currentIndex = lessons?.findIndex(l => l.id === lessonId) ?? -1;
  const previousLesson = currentIndex > 0 ? lessons?.[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < (lessons?.length ?? 0) - 1 ? lessons?.[currentIndex + 1] : null;

  // Auto-scroll to top on lesson change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [lessonId]);

  // Handle complete lesson
  const handleCompleteLesson = async () => {
    if (!lessonId || lesson?.is_completed) return;

    setCompleting(true);
    try {
      const result = await completeMutation.mutateAsync(lessonId);
      toast.success('Lesson completed!', {
        description: `Progress: ${Math.round(result.progress)}%`,
      });

      // Navigate to next lesson if available
      if (nextLesson) {
        setTimeout(() => {
          navigate(`/learning/lessons/${nextLesson.id}`);
        }, 1000);
      } else {
        // Course completed
        toast.success('Course completed!', {
          description: 'Congratulations on finishing the course!',
        });
        setTimeout(() => {
          navigate(`/learning/courses/${courseId}`);
        }, 1500);
      }
    } catch (error: any) {
      toast.error('Failed to complete lesson', {
        description: error?.message || 'Please try again later.',
      });
    } finally {
      setCompleting(false);
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

  if (lessonLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8">
        <div className="container mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8">
        <div className="container mx-auto max-w-5xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load lesson. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8">
      <div className="container mx-auto max-w-5xl space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Link to={`/learning/courses/${courseId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </Link>
          {lesson.is_completed && (
            <Badge className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>

        {/* Course Progress */}
        {course && lessons && (
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{course.title}</p>
                <p className="text-sm text-muted-foreground">
                  Lesson {currentIndex + 1} of {lessons.length}
                </p>
              </div>
              <Progress value={((currentIndex + 1) / lessons.length) * 100} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Lesson Content */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl md:text-3xl mb-2">{lesson.title}</CardTitle>
                {lesson.description && (
                  <p className="text-muted-foreground">{lesson.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(lesson.duration_minutes)}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Video Content */}
            {lesson.content_type === 'video' && lesson.content_url && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-full"
                  src={lesson.content_url}
                  poster={lesson.content_url.replace(/\.[^/.]+$/, '.jpg')}
                >
                  <source src={lesson.content_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Text Content */}
            {lesson.content_type === 'text' && (
              <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                <div className="p-6 bg-muted/50 rounded-lg">
                  <BookOpen className="h-8 w-8 mb-4 text-primary" />
                  <p className="text-muted-foreground">
                    Text content would be displayed here. This would typically be fetched from the API
                    and rendered as formatted text or markdown.
                  </p>
                </div>
              </div>
            )}

            {/* Quiz Content */}
            {lesson.content_type === 'quiz' && (
              <div className="p-6 bg-muted/50 rounded-lg text-center">
                <Play className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Quiz</h3>
                <p className="text-muted-foreground mb-4">
                  Interactive quiz content would be displayed here.
                </p>
              </div>
            )}

            {/* Assignment Content */}
            {lesson.content_type === 'assignment' && (
              <div className="p-6 bg-muted/50 rounded-lg text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Assignment</h3>
                <p className="text-muted-foreground mb-4">
                  Assignment instructions and submission form would be displayed here.
                </p>
              </div>
            )}

            {/* Lesson Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              {!lesson.is_completed && (
                <Button
                  variant="farmer"
                  size="lg"
                  className="flex-1"
                  onClick={handleCompleteLesson}
                  disabled={completing || completeMutation.isPending}
                >
                  {completing || completeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              )}

              {lesson.is_completed && nextLesson && (
                <Button
                  variant="farmer"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate(`/learning/lessons/${nextLesson.id}`)}
                >
                  Next Lesson
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lesson Navigation */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Course Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            {lessons && lessons.length > 0 ? (
              <div className="space-y-2">
                {lessons.map((l, index) => (
                  <button
                    key={l.id}
                    onClick={() => navigate(`/learning/lessons/${l.id}`)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      l.id === lessonId
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {l.is_completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : l.id === lessonId ? (
                          <Play className="h-5 w-5 text-primary" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm truncate">
                          {index + 1}. {l.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(l.duration_minutes)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No lessons available.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          {previousLesson ? (
            <Button
              variant="outline"
              onClick={() => navigate(`/learning/lessons/${previousLesson.id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Lesson
            </Button>
          ) : (
            <div />
          )}

          {nextLesson && (
            <Button
              variant="outline"
              onClick={() => navigate(`/learning/lessons/${nextLesson.id}`)}
            >
              Next Lesson
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
