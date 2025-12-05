from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    CourseCategory, Course, Lesson, LessonResource, Enrollment,
    LessonProgress, Certificate, CourseReview, Question, Answer, UserInterest
)

User = get_user_model()


class CourseCategorySerializer(serializers.ModelSerializer):
    """Serializer for course categories"""
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = CourseCategory
        fields = ['id', 'name', 'description', 'icon', 'course_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_course_count(self, obj):
        return obj.courses.filter(status='published').count()


class LessonResourceSerializer(serializers.ModelSerializer):
    """Serializer for lesson resources"""
    class Meta:
        model = LessonResource
        fields = ['id', 'title', 'description', 'file_url', 'file_type', 'file_size', 'created_at']
        read_only_fields = ['id', 'created_at']


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for lessons"""
    resources = LessonResourceSerializer(many=True, read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'course', 'title', 'slug', 'description', 'content_type',
            'content', 'video_url', 'video_duration', 'order', 'is_free',
            'resources', 'is_completed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_is_completed(self, obj):
        """Check if lesson is completed by current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = Enrollment.objects.filter(
                user=request.user,
                course=obj.course
            ).first()
            if enrollment:
                progress = LessonProgress.objects.filter(
                    enrollment=enrollment,
                    lesson=obj
                ).first()
                return progress.is_completed if progress else False
        return False


class CourseListSerializer(serializers.ModelSerializer):
    """Serializer for course list view"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    instructor_name = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'category', 'category_name',
            'instructor', 'instructor_name', 'difficulty', 'duration_hours',
            'language', 'thumbnail', 'status', 'enrollment_count',
            'average_rating', 'lesson_count', 'is_enrolled', 'published_at'
        ]
        read_only_fields = ['id', 'enrollment_count', 'average_rating', 'published_at']

    def get_instructor_name(self, obj):
        return f"{obj.instructor.first_name} {obj.instructor.last_name}".strip() or obj.instructor.email

    def get_lesson_count(self, obj):
        return obj.lessons.count()

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(user=request.user, course=obj).exists()
        return False


class CourseDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for course"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    instructor_name = serializers.SerializerMethodField()
    lessons = LessonSerializer(many=True, read_only=True)
    prerequisites = CourseListSerializer(many=True, read_only=True)
    enrollment_status = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'category', 'category_name',
            'instructor', 'instructor_name', 'difficulty', 'duration_hours',
            'language', 'thumbnail', 'preview_video', 'status', 'prerequisites',
            'enrollment_count', 'completion_count', 'average_rating',
            'lessons', 'enrollment_status', 'user_progress',
            'published_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'enrollment_count', 'completion_count', 'average_rating', 'published_at', 'created_at', 'updated_at']

    def get_instructor_name(self, obj):
        return f"{obj.instructor.first_name} {obj.instructor.last_name}".strip() or obj.instructor.email

    def get_enrollment_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = Enrollment.objects.filter(user=request.user, course=obj).first()
            if enrollment:
                return {
                    'enrolled': True,
                    'status': enrollment.status,
                    'enrolled_at': enrollment.enrolled_at
                }
        return {'enrolled': False}

    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = Enrollment.objects.filter(user=request.user, course=obj).first()
            if enrollment:
                return {
                    'progress_percentage': float(enrollment.progress_percentage),
                    'completed_lessons': enrollment.completed_lessons,
                    'total_time_spent': enrollment.total_time_spent,
                    'last_accessed': enrollment.last_accessed
                }
        return None


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for enrollments"""
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_thumbnail = serializers.URLField(source='course.thumbnail', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'user', 'user_email', 'course', 'course_title', 'course_thumbnail',
            'status', 'progress_percentage', 'completed_lessons', 'total_time_spent',
            'enrolled_at', 'completed_at', 'last_accessed'
        ]
        read_only_fields = ['id', 'progress_percentage', 'completed_lessons', 'total_time_spent', 'enrolled_at', 'completed_at', 'last_accessed']


class LessonProgressSerializer(serializers.ModelSerializer):
    """Serializer for lesson progress"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id', 'enrollment', 'lesson', 'lesson_title', 'is_completed',
            'time_spent', 'video_progress', 'score', 'attempts',
            'started_at', 'completed_at', 'last_accessed'
        ]
        read_only_fields = ['id', 'started_at', 'completed_at', 'last_accessed']


class CertificateSerializer(serializers.ModelSerializer):
    """Serializer for certificates"""
    user_name = serializers.SerializerMethodField()
    course_title = serializers.CharField(source='enrollment.course.title', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id', 'enrollment', 'certificate_number', 'user_name', 'course_title',
            'issued_at', 'pdf_url', 'verification_url', 'final_score', 'completion_time_hours'
        ]
        read_only_fields = ['id', 'certificate_number', 'issued_at']

    def get_user_name(self, obj):
        user = obj.enrollment.user
        return f"{user.first_name} {user.last_name}".strip() or user.email


class CourseReviewSerializer(serializers.ModelSerializer):
    """Serializer for course reviews"""
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = CourseReview
        fields = [
            'id', 'course', 'user', 'user_name', 'user_avatar', 'enrollment',
            'rating', 'title', 'comment', 'is_approved',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'enrollment', 'is_approved', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_user_avatar(self, obj):
        # Assuming user profile has avatar field
        if hasattr(obj.user, 'profile') and obj.user.profile.avatar:
            return obj.user.profile.avatar
        return None

    def validate(self, data):
        """Ensure user has completed the course before reviewing"""
        request = self.context.get('request')
        course = data.get('course')
        
        if request and course:
            enrollment = Enrollment.objects.filter(
                user=request.user,
                course=course,
                status='completed'
            ).first()
            
            if not enrollment:
                raise serializers.ValidationError("You must complete the course before reviewing it.")
            
            data['enrollment'] = enrollment
        
        return data


class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for answers"""
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = [
            'id', 'question', 'user', 'user_name', 'user_avatar',
            'content', 'is_accepted', 'is_expert_answer', 'upvotes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'is_accepted', 'is_expert_answer', 'upvotes', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_user_avatar(self, obj):
        if hasattr(obj.user, 'profile') and obj.user.profile.avatar:
            return obj.user.profile.avatar
        return None


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for questions"""
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()
    answers = AnswerSerializer(many=True, read_only=True)
    answer_count = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'course', 'lesson', 'user', 'user_name', 'user_avatar',
            'title', 'content', 'is_answered', 'is_pinned', 'upvotes', 'views',
            'answers', 'answer_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'is_answered', 'is_pinned', 'upvotes', 'views', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_user_avatar(self, obj):
        if hasattr(obj.user, 'profile') and obj.user.profile.avatar:
            return obj.user.profile.avatar
        return None

    def get_answer_count(self, obj):
        return obj.answers.count()


class UserInterestSerializer(serializers.ModelSerializer):
    """Serializer for user interests"""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = UserInterest
        fields = ['id', 'user', 'category', 'category_name', 'interest_score', 'last_updated']
        read_only_fields = ['id', 'interest_score', 'last_updated']
