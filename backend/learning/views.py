from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import (
    CourseCategory, Course, Lesson, LessonResource, Enrollment,
    LessonProgress, Certificate, CourseReview, Question, Answer, UserInterest
)
from .serializers import (
    CourseCategorySerializer, CourseListSerializer, CourseDetailSerializer,
    LessonSerializer, LessonResourceSerializer, EnrollmentSerializer,
    LessonProgressSerializer, CertificateSerializer, CourseReviewSerializer,
    QuestionSerializer, AnswerSerializer, UserInterestSerializer
)
from .filters import CourseFilter
from .permissions import IsInstructorOrReadOnly, IsEnrolledOrInstructor


class CourseCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for course categories"""
    queryset = CourseCategory.objects.all()
    serializer_class = CourseCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for courses"""
    queryset = Course.objects.select_related('category', 'instructor').prefetch_related('lessons', 'prerequisites')
    permission_classes = [IsAuthenticatedOrReadOnly, IsInstructorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CourseFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'enrollment_count', 'average_rating', 'published_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Non-instructors can only see published courses
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(status='published')
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        """Enroll user in a course"""
        course = self.get_object()
        
        # Check if already enrolled
        if Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response(
                {'detail': 'Already enrolled in this course'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check prerequisites
        for prereq in course.prerequisites.all():
            if not Enrollment.objects.filter(
                user=request.user,
                course=prereq,
                status='completed'
            ).exists():
                return Response(
                    {'detail': f'Must complete prerequisite course: {prereq.title}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create enrollment
        enrollment = Enrollment.objects.create(user=request.user, course=course)
        
        # Update course enrollment count
        course.enrollment_count = F('enrollment_count') + 1
        course.save()
        course.refresh_from_db()
        
        serializer = EnrollmentSerializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        """Publish a course"""
        course = self.get_object()
        
        if course.instructor != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Only the instructor can publish this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if course.lessons.count() == 0:
            return Response(
                {'detail': 'Cannot publish course without lessons'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        course.publish()
        serializer = self.get_serializer(course)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_courses(self, request):
        """Get courses taught by the current user"""
        courses = self.get_queryset().filter(instructor=request.user)
        page = self.paginate_queryset(courses)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def enrolled(self, request):
        """Get courses the user is enrolled in"""
        enrollments = Enrollment.objects.filter(user=request.user).select_related('course')
        course_ids = enrollments.values_list('course_id', flat=True)
        courses = self.get_queryset().filter(id__in=course_ids)
        
        page = self.paginate_queryset(courses)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def recommended(self, request):
        """Get recommended courses based on user interests"""
        # Get user interests
        interests = UserInterest.objects.filter(user=request.user).order_by('-interest_score')[:5]
        category_ids = interests.values_list('category_id', flat=True)
        
        # Get courses in those categories
        courses = self.get_queryset().filter(
            category_id__in=category_ids,
            status='published'
        ).exclude(
            enrollments__user=request.user
        ).order_by('-average_rating', '-enrollment_count')[:10]
        
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)


class LessonViewSet(viewsets.ModelViewSet):
    """ViewSet for lessons"""
    queryset = Lesson.objects.select_related('course').prefetch_related('resources')
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsInstructorOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['order', 'created_at']
    ordering = ['order']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        """Mark a lesson as completed"""
        lesson = self.get_object()
        
        # Get or create enrollment
        enrollment = Enrollment.objects.filter(
            user=request.user,
            course=lesson.course
        ).first()
        
        if not enrollment:
            return Response(
                {'detail': 'Must be enrolled in the course'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create lesson progress
        progress, created = LessonProgress.objects.get_or_create(
            enrollment=enrollment,
            lesson=lesson
        )
        
        # Mark as completed
        if not progress.is_completed:
            progress.mark_completed()
        
        serializer = LessonProgressSerializer(progress)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def update_progress(self, request, pk=None):
        """Update lesson progress (video position, time spent)"""
        lesson = self.get_object()
        
        enrollment = Enrollment.objects.filter(
            user=request.user,
            course=lesson.course
        ).first()
        
        if not enrollment:
            return Response(
                {'detail': 'Must be enrolled in the course'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        progress, created = LessonProgress.objects.get_or_create(
            enrollment=enrollment,
            lesson=lesson
        )
        
        # Update progress fields
        if 'video_progress' in request.data:
            progress.video_progress = request.data['video_progress']
        if 'time_spent' in request.data:
            progress.time_spent = request.data['time_spent']
        if 'score' in request.data:
            progress.score = request.data['score']
            progress.attempts = F('attempts') + 1
        
        progress.save()
        progress.refresh_from_db()
        
        serializer = LessonProgressSerializer(progress)
        return Response(serializer.data)


class EnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for enrollments"""
    queryset = Enrollment.objects.select_related('user', 'course')
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'course']
    ordering_fields = ['enrolled_at', 'progress_percentage']
    ordering = ['-enrolled_at']

    def get_queryset(self):
        # Users can only see their own enrollments
        return super().get_queryset().filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def drop(self, request, pk=None):
        """Drop a course"""
        enrollment = self.get_object()
        
        if enrollment.status == 'completed':
            return Response(
                {'detail': 'Cannot drop a completed course'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        enrollment.status = 'dropped'
        enrollment.save()
        
        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)


class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for certificates"""
    queryset = Certificate.objects.select_related('enrollment__user', 'enrollment__course')
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['issued_at']
    ordering = ['-issued_at']

    def get_queryset(self):
        # Users can only see their own certificates
        return super().get_queryset().filter(enrollment__user=self.request.user)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def verify(self, request, pk=None):
        """Verify a certificate by certificate number"""
        certificate_number = request.query_params.get('certificate_number')
        
        if not certificate_number:
            return Response(
                {'detail': 'Certificate number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        certificate = get_object_or_404(Certificate, certificate_number=certificate_number)
        serializer = self.get_serializer(certificate)
        return Response(serializer.data)


class CourseReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for course reviews"""
    queryset = CourseReview.objects.select_related('user', 'course', 'enrollment')
    serializer_class = CourseReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['course', 'rating']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Only show approved reviews to non-staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_approved=True)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
        # Update course average rating
        course = serializer.instance.course
        avg_rating = CourseReview.objects.filter(
            course=course,
            is_approved=True
        ).aggregate(Avg('rating'))['rating__avg']
        
        course.average_rating = avg_rating or 0
        course.save()


class QuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for Q&A questions"""
    queryset = Question.objects.select_related('user', 'course', 'lesson').prefetch_related('answers')
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['course', 'lesson', 'is_answered']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'upvotes', 'views']
    ordering = ['-is_pinned', '-created_at']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """Increment view count when retrieving a question"""
        instance = self.get_object()
        instance.views = F('views') + 1
        instance.save()
        instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upvote(self, request, pk=None):
        """Upvote a question"""
        question = self.get_object()
        question.upvotes = F('upvotes') + 1
        question.save()
        question.refresh_from_db()
        
        serializer = self.get_serializer(question)
        return Response(serializer.data)


class AnswerViewSet(viewsets.ModelViewSet):
    """ViewSet for Q&A answers"""
    queryset = Answer.objects.select_related('user', 'question')
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['question']
    ordering_fields = ['created_at', 'upvotes']
    ordering = ['-is_accepted', '-upvotes', '-created_at']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upvote(self, request, pk=None):
        """Upvote an answer"""
        answer = self.get_object()
        answer.upvotes = F('upvotes') + 1
        answer.save()
        answer.refresh_from_db()
        
        serializer = self.get_serializer(answer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept(self, request, pk=None):
        """Accept an answer (only question author or instructor)"""
        answer = self.get_object()
        question = answer.question
        
        # Check if user is question author or course instructor
        is_author = question.user == request.user
        is_instructor = question.course and question.course.instructor == request.user
        
        if not (is_author or is_instructor):
            return Response(
                {'detail': 'Only the question author or instructor can accept answers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        answer.mark_as_accepted()
        serializer = self.get_serializer(answer)
        return Response(serializer.data)
