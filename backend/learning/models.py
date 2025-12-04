from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

User = get_user_model()


class CourseCategory(models.Model):
    """Categories for organizing courses"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Course Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Course(models.Model):
    """Educational courses for farmers"""
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField()
    category = models.ForeignKey(CourseCategory, on_delete=models.SET_NULL, null=True, related_name='courses')
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses_taught')
    
    # Course metadata
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    duration_hours = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    language = models.CharField(max_length=10, default='en')
    
    # Media
    thumbnail = models.URLField(blank=True)
    preview_video = models.URLField(blank=True)
    
    # Status and publishing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Prerequisites
    prerequisites = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='required_for')
    
    # Tracking
    enrollment_count = models.IntegerField(default=0)
    completion_count = models.IntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['difficulty']),
        ]

    def __str__(self):
        return self.title

    def publish(self):
        """Publish the course"""
        if self.status != 'published':
            self.status = 'published'
            self.published_at = timezone.now()
            self.save()


class Lesson(models.Model):
    """Individual lessons within a course"""
    CONTENT_TYPE_CHOICES = [
        ('video', 'Video'),
        ('article', 'Article'),
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    description = models.TextField(blank=True)
    
    # Content
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    content = models.TextField(help_text="Article content or video description")
    video_url = models.URLField(blank=True)
    video_duration = models.IntegerField(default=0, help_text="Duration in seconds")
    
    # Ordering
    order = models.IntegerField(default=0)
    
    # Resources
    is_free = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['course', 'order']
        unique_together = [['course', 'slug']]
        indexes = [
            models.Index(fields=['course', 'order']),
        ]

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class LessonResource(models.Model):
    """Downloadable resources for lessons"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file_url = models.URLField()
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField(help_text="Size in bytes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['lesson', 'title']

    def __str__(self):
        return f"{self.lesson.title} - {self.title}"


class Enrollment(models.Model):
    """Track user enrollments in courses"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Progress tracking
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    completed_lessons = models.IntegerField(default=0)
    total_time_spent = models.IntegerField(default=0, help_text="Time in minutes")
    
    # Dates
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['user', 'course']]
        ordering = ['-enrolled_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['course', 'status']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.course.title}"

    def mark_completed(self):
        """Mark enrollment as completed"""
        if self.status != 'completed':
            self.status = 'completed'
            self.completed_at = timezone.now()
            self.progress_percentage = 100
            self.save()
            
            # Update course completion count
            self.course.completion_count += 1
            self.course.save()


class LessonProgress(models.Model):
    """Track progress on individual lessons"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress_records')
    
    # Progress
    is_completed = models.BooleanField(default=False)
    time_spent = models.IntegerField(default=0, help_text="Time in seconds")
    video_progress = models.IntegerField(default=0, help_text="Video progress in seconds")
    
    # Quiz/Assignment scores
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    attempts = models.IntegerField(default=0)
    
    # Dates
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['enrollment', 'lesson']]
        ordering = ['enrollment', 'lesson__order']
        indexes = [
            models.Index(fields=['enrollment', 'is_completed']),
        ]

    def __str__(self):
        return f"{self.enrollment.user.email} - {self.lesson.title}"

    def mark_completed(self):
        """Mark lesson as completed"""
        if not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save()
            
            # Update enrollment progress
            enrollment = self.enrollment
            enrollment.completed_lessons += 1
            total_lessons = enrollment.course.lessons.count()
            if total_lessons > 0:
                enrollment.progress_percentage = (enrollment.completed_lessons / total_lessons) * 100
            enrollment.save()
            
            # Check if course is completed
            if enrollment.progress_percentage >= 100:
                enrollment.mark_completed()


class Certificate(models.Model):
    """Certificates issued upon course completion"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='certificate')
    certificate_number = models.CharField(max_length=50, unique=True)
    
    # Certificate data
    issued_at = models.DateTimeField(auto_now_add=True)
    pdf_url = models.URLField(blank=True)
    verification_url = models.URLField(blank=True)
    
    # Metadata
    final_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    completion_time_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    class Meta:
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['certificate_number']),
            models.Index(fields=['enrollment']),
        ]

    def __str__(self):
        return f"Certificate {self.certificate_number} - {self.enrollment.user.email}"

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            # Generate unique certificate number
            self.certificate_number = f"AGRO-{timezone.now().year}-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class CourseReview(models.Model):
    """User reviews and ratings for courses"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_reviews')
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='review')
    
    # Review content
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField(blank=True)
    
    # Moderation
    is_approved = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['course', 'user']]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course', 'is_approved']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.course.title} ({self.rating}★)"


class Question(models.Model):
    """Q&A forum questions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='questions', null=True, blank=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='questions', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='questions')
    
    # Question content
    title = models.CharField(max_length=300)
    content = models.TextField()
    
    # Status
    is_answered = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    
    # Engagement
    upvotes = models.IntegerField(default=0)
    views = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']
        indexes = [
            models.Index(fields=['course', '-created_at']),
            models.Index(fields=['is_answered']),
        ]

    def __str__(self):
        return self.title


class Answer(models.Model):
    """Answers to forum questions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='answers')
    
    # Answer content
    content = models.TextField()
    
    # Status
    is_accepted = models.BooleanField(default=False)
    is_expert_answer = models.BooleanField(default=False)
    
    # Engagement
    upvotes = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_accepted', '-upvotes', '-created_at']
        indexes = [
            models.Index(fields=['question', '-created_at']),
        ]

    def __str__(self):
        return f"Answer to: {self.question.title}"

    def mark_as_accepted(self):
        """Mark this answer as accepted"""
        # Unmark other answers
        Answer.objects.filter(question=self.question).update(is_accepted=False)
        self.is_accepted = True
        self.save()
        
        # Mark question as answered
        self.question.is_answered = True
        self.question.save()


class UserInterest(models.Model):
    """Track user interests for recommendations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_interests')
    category = models.ForeignKey(CourseCategory, on_delete=models.CASCADE, related_name='interested_users')
    interest_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['user', 'category']]
        ordering = ['-interest_score']

    def __str__(self):
        return f"{self.user.email} - {self.category.name}"
