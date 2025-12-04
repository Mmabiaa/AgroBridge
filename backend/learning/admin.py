from django.contrib import admin
from .models import (
    CourseCategory, Course, Lesson, LessonResource, Enrollment,
    LessonProgress, Certificate, CourseReview, Question, Answer, UserInterest
)


@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name', 'description']


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ['title', 'content_type', 'order', 'is_free']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'instructor', 'difficulty', 'status', 'enrollment_count', 'average_rating', 'published_at']
    list_filter = ['status', 'difficulty', 'category', 'language']
    search_fields = ['title', 'description', 'instructor__email']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [LessonInline]
    readonly_fields = ['enrollment_count', 'completion_count', 'average_rating', 'published_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'category', 'instructor')
        }),
        ('Course Details', {
            'fields': ('difficulty', 'duration_hours', 'language', 'prerequisites')
        }),
        ('Media', {
            'fields': ('thumbnail', 'preview_video')
        }),
        ('Status', {
            'fields': ('status', 'published_at')
        }),
        ('Statistics', {
            'fields': ('enrollment_count', 'completion_count', 'average_rating')
        }),
    )


class LessonResourceInline(admin.TabularInline):
    model = LessonResource
    extra = 0


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'content_type', 'order', 'is_free']
    list_filter = ['content_type', 'is_free', 'course']
    search_fields = ['title', 'description', 'course__title']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [LessonResourceInline]


@admin.register(LessonResource)
class LessonResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'lesson', 'file_type', 'file_size', 'created_at']
    list_filter = ['file_type']
    search_fields = ['title', 'lesson__title']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'status', 'progress_percentage', 'enrolled_at', 'completed_at']
    list_filter = ['status', 'enrolled_at', 'completed_at']
    search_fields = ['user__email', 'course__title']
    readonly_fields = ['progress_percentage', 'completed_lessons', 'total_time_spent', 'enrolled_at', 'completed_at']


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'lesson', 'is_completed', 'score', 'completed_at']
    list_filter = ['is_completed', 'completed_at']
    search_fields = ['enrollment__user__email', 'lesson__title']
    readonly_fields = ['started_at', 'completed_at']


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_number', 'enrollment', 'issued_at', 'final_score']
    search_fields = ['certificate_number', 'enrollment__user__email', 'enrollment__course__title']
    readonly_fields = ['certificate_number', 'issued_at']


@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ['course', 'user', 'rating', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_approved', 'created_at']
    search_fields = ['course__title', 'user__email', 'title', 'comment']
    actions = ['approve_reviews', 'reject_reviews']
    
    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
    approve_reviews.short_description = "Approve selected reviews"
    
    def reject_reviews(self, request, queryset):
        queryset.update(is_approved=False)
    reject_reviews.short_description = "Reject selected reviews"


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0
    fields = ['user', 'content', 'is_accepted', 'is_expert_answer', 'upvotes']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'course', 'is_answered', 'is_pinned', 'upvotes', 'views', 'created_at']
    list_filter = ['is_answered', 'is_pinned', 'created_at']
    search_fields = ['title', 'content', 'user__email', 'course__title']
    inlines = [AnswerInline]
    actions = ['pin_questions', 'unpin_questions']
    
    def pin_questions(self, request, queryset):
        queryset.update(is_pinned=True)
    pin_questions.short_description = "Pin selected questions"
    
    def unpin_questions(self, request, queryset):
        queryset.update(is_pinned=False)
    unpin_questions.short_description = "Unpin selected questions"


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['question', 'user', 'is_accepted', 'is_expert_answer', 'upvotes', 'created_at']
    list_filter = ['is_accepted', 'is_expert_answer', 'created_at']
    search_fields = ['content', 'user__email', 'question__title']
    actions = ['mark_as_expert']
    
    def mark_as_expert(self, request, queryset):
        queryset.update(is_expert_answer=True)
    mark_as_expert.short_description = "Mark as expert answer"


@admin.register(UserInterest)
class UserInterestAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'interest_score', 'last_updated']
    list_filter = ['category', 'last_updated']
    search_fields = ['user__email', 'category__name']
