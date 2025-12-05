import django_filters
from .models import Course


class CourseFilter(django_filters.FilterSet):
    """Filter for courses"""
    category = django_filters.CharFilter(field_name='category__id')
    difficulty = django_filters.ChoiceFilter(choices=Course.DIFFICULTY_CHOICES)
    language = django_filters.CharFilter()
    min_rating = django_filters.NumberFilter(field_name='average_rating', lookup_expr='gte')
    max_duration = django_filters.NumberFilter(field_name='duration_hours', lookup_expr='lte')
    
    class Meta:
        model = Course
        fields = ['category', 'difficulty', 'language', 'status']
