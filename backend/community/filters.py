"""
Community Service Filters
"""
import django_filters
from .models import Post, Comment, Message


class PostFilter(django_filters.FilterSet):
    """Filter for posts."""
    author = django_filters.NumberFilter(field_name='author__id')
    region = django_filters.CharFilter(field_name='region', lookup_expr='icontains')
    topic = django_filters.CharFilter(method='filter_topic')
    crop_type = django_filters.CharFilter(method='filter_crop_type')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Post
        fields = ['author', 'region', 'visibility', 'moderation_status']

    def filter_topic(self, queryset, name, value):
        """Filter posts by topic."""
        return queryset.filter(topics__contains=[value])

    def filter_crop_type(self, queryset, name, value):
        """Filter posts by crop type."""
        return queryset.filter(crop_types__contains=[value])


class CommentFilter(django_filters.FilterSet):
    """Filter for comments."""
    post = django_filters.NumberFilter(field_name='post__id')
    author = django_filters.NumberFilter(field_name='author__id')
    parent = django_filters.NumberFilter(field_name='parent__id')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Comment
        fields = ['post', 'author', 'parent']


class MessageFilter(django_filters.FilterSet):
    """Filter for messages."""
    conversation = django_filters.NumberFilter(field_name='conversation__id')
    sender = django_filters.NumberFilter(field_name='sender__id')
    is_read = django_filters.BooleanFilter(field_name='is_read')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Message
        fields = ['conversation', 'sender', 'is_read']
