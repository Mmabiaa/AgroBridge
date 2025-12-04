from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseCategoryViewSet, CourseViewSet, LessonViewSet,
    EnrollmentViewSet, CertificateViewSet, CourseReviewViewSet,
    QuestionViewSet, AnswerViewSet
)

app_name = 'learning'

router = DefaultRouter()
router.register(r'categories', CourseCategoryViewSet, basename='category')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'certificates', CertificateViewSet, basename='certificate')
router.register(r'reviews', CourseReviewViewSet, basename='review')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'answers', AnswerViewSet, basename='answer')

urlpatterns = [
    path('', include(router.urls)),
]
