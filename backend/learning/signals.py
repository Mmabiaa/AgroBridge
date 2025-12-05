from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Enrollment, LessonProgress, Certificate, CourseReview, UserInterest


@receiver(post_save, sender=Enrollment)
def create_certificate_on_completion(sender, instance, created, **kwargs):
    """
    Automatically create a certificate when a user completes a course
    """
    if not created and instance.status == 'completed' and not hasattr(instance, 'certificate'):
        # Calculate completion time
        if instance.enrolled_at and instance.completed_at:
            time_diff = instance.completed_at - instance.enrolled_at
            completion_hours = time_diff.total_seconds() / 3600
        else:
            completion_hours = None
        
        # Calculate final score (average of all lesson scores)
        lesson_scores = LessonProgress.objects.filter(
            enrollment=instance,
            score__isnull=False
        ).values_list('score', flat=True)
        
        final_score = sum(lesson_scores) / len(lesson_scores) if lesson_scores else None
        
        # Create certificate
        Certificate.objects.create(
            enrollment=instance,
            final_score=final_score,
            completion_time_hours=completion_hours
        )


@receiver(post_save, sender=CourseReview)
def update_course_rating(sender, instance, created, **kwargs):
    """
    Update course average rating when a review is created or updated
    """
    if instance.is_approved:
        course = instance.course
        approved_reviews = CourseReview.objects.filter(
            course=course,
            is_approved=True
        )
        
        if approved_reviews.exists():
            total_rating = sum(review.rating for review in approved_reviews)
            course.average_rating = total_rating / approved_reviews.count()
            course.save(update_fields=['average_rating'])


@receiver(post_save, sender=Enrollment)
def update_user_interests(sender, instance, created, **kwargs):
    """
    Update user interests based on course enrollments
    """
    if created and instance.course.category:
        interest, created = UserInterest.objects.get_or_create(
            user=instance.user,
            category=instance.course.category,
            defaults={'interest_score': 1.0}
        )
        
        if not created:
            # Increase interest score
            interest.interest_score += 0.5
            interest.save()


@receiver(post_save, sender=LessonProgress)
def update_enrollment_time(sender, instance, created, **kwargs):
    """
    Update total time spent in enrollment when lesson progress is updated
    """
    if not created:
        enrollment = instance.enrollment
        total_time = LessonProgress.objects.filter(
            enrollment=enrollment
        ).aggregate(total=sum('time_spent'))['total'] or 0
        
        enrollment.total_time_spent = total_time // 60  # Convert to minutes
        enrollment.save(update_fields=['total_time_spent'])
