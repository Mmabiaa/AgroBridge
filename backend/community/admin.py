"""
Community Service Admin
"""
from django.contrib import admin
from .models import (
    Post, Comment, Like, Bookmark, Follow,
    Conversation, Message, ContentReport
)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """Admin for Post model."""
    list_display = ['id', 'author', 'content_preview', 'visibility', 'likes_count', 'comments_count', 'is_flagged', 'created_at']
    list_filter = ['visibility', 'moderation_status', 'is_flagged', 'is_spam', 'created_at']
    search_fields = ['content', 'author__email', 'topics', 'crop_types']
    readonly_fields = ['created_at', 'updated_at', 'likes_count', 'comments_count', 'shares_count']
    date_hierarchy = 'created_at'

    def content_preview(self, obj):
        """Show preview of content."""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Admin for Comment model."""
    list_display = ['id', 'author', 'post', 'content_preview', 'likes_count', 'is_flagged', 'created_at']
    list_filter = ['is_flagged', 'created_at']
    search_fields = ['content', 'author__email']
    readonly_fields = ['created_at', 'updated_at', 'likes_count']
    date_hierarchy = 'created_at'

    def content_preview(self, obj):
        """Show preview of content."""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    """Admin for Like model."""
    list_display = ['id', 'user', 'content_type', 'object_id', 'created_at']
    list_filter = ['content_type', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    """Admin for Bookmark model."""
    list_display = ['id', 'user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    """Admin for Follow model."""
    list_display = ['id', 'follower', 'following', 'created_at']
    list_filter = ['created_at']
    search_fields = ['follower__email', 'following__email']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    """Admin for Conversation model."""
    list_display = ['id', 'participant_count', 'created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

    def participant_count(self, obj):
        """Show number of participants."""
        return obj.participants.count()
    participant_count.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin for Message model."""
    list_display = ['id', 'sender', 'conversation', 'content_preview', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['content', 'sender__email']
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'

    def content_preview(self, obj):
        """Show preview of content."""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(ContentReport)
class ContentReportAdmin(admin.ModelAdmin):
    """Admin for ContentReport model."""
    list_display = ['id', 'reporter', 'content_type', 'object_id', 'reason', 'status', 'created_at']
    list_filter = ['status', 'content_type', 'reason', 'created_at']
    search_fields = ['reporter__email', 'description']
    readonly_fields = ['created_at', 'reviewed_at']
    date_hierarchy = 'created_at'
    actions = ['mark_as_reviewing', 'mark_as_resolved', 'mark_as_dismissed']

    def mark_as_reviewing(self, request, queryset):
        """Mark reports as under review."""
        queryset.update(status='reviewing')
    mark_as_reviewing.short_description = 'Mark as under review'

    def mark_as_resolved(self, request, queryset):
        """Mark reports as resolved."""
        queryset.update(status='resolved', reviewed_by=request.user)
    mark_as_resolved.short_description = 'Mark as resolved'

    def mark_as_dismissed(self, request, queryset):
        """Mark reports as dismissed."""
        queryset.update(status='dismissed', reviewed_by=request.user)
    mark_as_dismissed.short_description = 'Mark as dismissed'
