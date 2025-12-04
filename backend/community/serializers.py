"""
Community Service Serializers
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Post, Comment, Like, Bookmark, Follow,
    Conversation, Message, ContentReport
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for nested serialization."""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        read_only_fields = fields


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments."""
    author = UserBasicSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'content', 'parent',
            'likes_count', 'is_liked', 'replies_count',
            'is_flagged', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'likes_count', 'is_flagged', 'created_at', 'updated_at']

    def get_is_liked(self, obj):
        """Check if current user has liked this comment."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(
                user=request.user,
                content_type='comment',
                object_id=obj.id
            ).exists()
        return False

    def get_replies_count(self, obj):
        """Get count of replies to this comment."""
        return obj.replies.count()


class PostSerializer(serializers.ModelSerializer):
    """Serializer for posts."""
    author = UserBasicSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    is_following_author = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'content', 'images', 'location',
            'visibility', 'topics', 'region', 'crop_types',
            'likes_count', 'comments_count', 'shares_count',
            'is_liked', 'is_bookmarked', 'is_following_author',
            'is_flagged', 'is_spam', 'moderation_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'likes_count', 'comments_count', 'shares_count',
            'is_flagged', 'is_spam', 'moderation_status', 'created_at', 'updated_at'
        ]

    def get_is_liked(self, obj):
        """Check if current user has liked this post."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(
                user=request.user,
                content_type='post',
                object_id=obj.id
            ).exists()
        return False

    def get_is_bookmarked(self, obj):
        """Check if current user has bookmarked this post."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Bookmark.objects.filter(user=request.user, post=obj).exists()
        return False

    def get_is_following_author(self, obj):
        """Check if current user is following the post author."""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj.author:
            return Follow.objects.filter(follower=request.user, following=obj.author).exists()
        return False

    def validate_images(self, value):
        """Validate images list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Images must be a list")
        if len(value) > 10:
            raise serializers.ValidationError("Maximum 10 images allowed per post")
        return value


class PostDetailSerializer(PostSerializer):
    """Detailed post serializer with comments."""
    recent_comments = serializers.SerializerMethodField()

    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['recent_comments']

    def get_recent_comments(self, obj):
        """Get recent comments on this post."""
        comments = obj.comments.filter(parent__isnull=True)[:5]
        return CommentSerializer(comments, many=True, context=self.context).data


class LikeSerializer(serializers.ModelSerializer):
    """Serializer for likes."""
    user = UserBasicSerializer(read_only=True)

    class Meta:
        model = Like
        fields = ['id', 'user', 'content_type', 'object_id', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class BookmarkSerializer(serializers.ModelSerializer):
    """Serializer for bookmarks."""
    post = PostSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'post', 'created_at']
        read_only_fields = ['id', 'created_at']


class FollowSerializer(serializers.ModelSerializer):
    """Serializer for follows."""
    follower = UserBasicSerializer(read_only=True)
    following = UserBasicSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = ['id', 'follower', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages."""
    sender = UserBasicSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'content', 'image',
            'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'is_read', 'read_at', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations."""
    participants = UserBasicSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'last_message', 'unread_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        """Get the last message in the conversation."""
        last_message = obj.messages.last()
        if last_message:
            return MessageSerializer(last_message).data
        return None

    def get_unread_count(self, obj):
        """Get count of unread messages for current user."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


class ContentReportSerializer(serializers.ModelSerializer):
    """Serializer for content reports."""
    reporter = UserBasicSerializer(read_only=True)
    reviewed_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = ContentReport
        fields = [
            'id', 'reporter', 'content_type', 'object_id',
            'reason', 'description', 'status',
            'reviewed_by', 'reviewed_at', 'resolution_notes',
            'created_at'
        ]
        read_only_fields = [
            'id', 'reporter', 'status', 'reviewed_by',
            'reviewed_at', 'resolution_notes', 'created_at'
        ]


class FeedPostSerializer(PostSerializer):
    """Optimized serializer for feed posts."""
    class Meta(PostSerializer.Meta):
        fields = [
            'id', 'author', 'content', 'images', 'location',
            'topics', 'region', 'crop_types',
            'likes_count', 'comments_count', 'shares_count',
            'is_liked', 'is_bookmarked',
            'created_at'
        ]
