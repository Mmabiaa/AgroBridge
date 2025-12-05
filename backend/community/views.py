"""
Community Service Views
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Q, Count, Prefetch
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Post, Comment, Like, Bookmark, Follow,
    Conversation, Message, ContentReport
)
from .serializers import (
    PostSerializer, PostDetailSerializer, CommentSerializer,
    LikeSerializer, BookmarkSerializer, FollowSerializer,
    ConversationSerializer, MessageSerializer, ContentReportSerializer,
    FeedPostSerializer
)
from .filters import PostFilter, CommentFilter, MessageFilter
from .permissions import IsAuthorOrReadOnly, IsParticipantOrReadOnly


class PostViewSet(viewsets.ModelViewSet):
    """ViewSet for managing posts."""
    queryset = Post.objects.select_related('author').prefetch_related('comments')
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PostFilter
    search_fields = ['content', 'topics', 'crop_types']
    ordering_fields = ['created_at', 'likes_count', 'comments_count']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'retrieve':
            return PostDetailSerializer
        elif self.action == 'feed':
            return FeedPostSerializer
        return PostSerializer

    def get_queryset(self):
        """Filter queryset based on user permissions."""
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            # Anonymous users see only public posts
            return queryset.filter(visibility='public', moderation_status='approved')

        # Authenticated users see public posts and posts from users they follow
        following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        
        queryset = queryset.filter(
            Q(visibility='public') |
            Q(visibility='followers', author__in=following_ids) |
            Q(author=user)
        ).filter(moderation_status='approved')

        return queryset

    def perform_create(self, serializer):
        """Set the author to the current user."""
        serializer.save(author=self.request.user)

    @action(detail=False, methods=['get'])
    def feed(self, request):
        """Get personalized feed for the current user."""
        user = request.user
        
        # Get posts from followed users
        following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        
        queryset = self.get_queryset().filter(
            Q(author__in=following_ids) | Q(author=user)
        ).order_by('-created_at')

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like a post."""
        post = self.get_object()
        like, created = Like.objects.get_or_create(
            user=request.user,
            content_type='post',
            object_id=post.id
        )
        
        if created:
            post.likes_count += 1
            post.save(update_fields=['likes_count'])
            return Response({'status': 'liked'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already liked'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unlike(self, request, pk=None):
        """Unlike a post."""
        post = self.get_object()
        deleted = Like.objects.filter(
            user=request.user,
            content_type='post',
            object_id=post.id
        ).delete()[0]
        
        if deleted:
            post.likes_count = max(0, post.likes_count - 1)
            post.save(update_fields=['likes_count'])
            return Response({'status': 'unliked'})
        return Response({'status': 'not liked'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def bookmark(self, request, pk=None):
        """Bookmark a post."""
        post = self.get_object()
        bookmark, created = Bookmark.objects.get_or_create(
            user=request.user,
            post=post
        )
        
        if created:
            return Response({'status': 'bookmarked'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already bookmarked'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unbookmark(self, request, pk=None):
        """Remove bookmark from a post."""
        post = self.get_object()
        deleted = Bookmark.objects.filter(user=request.user, post=post).delete()[0]
        
        if deleted:
            return Response({'status': 'unbookmarked'})
        return Response({'status': 'not bookmarked'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share a post (increment share count)."""
        post = self.get_object()
        post.shares_count += 1
        post.save(update_fields=['shares_count'])
        return Response({'status': 'shared', 'shares_count': post.shares_count})


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing comments."""
    queryset = Comment.objects.select_related('author', 'post')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = CommentFilter
    ordering_fields = ['created_at', 'likes_count']
    ordering = ['created_at']

    def perform_create(self, serializer):
        """Set the author and update post comment count."""
        comment = serializer.save(author=self.request.user)
        post = comment.post
        post.comments_count += 1
        post.save(update_fields=['comments_count'])

    def perform_destroy(self, instance):
        """Update post comment count when deleting."""
        post = instance.post
        post.comments_count = max(0, post.comments_count - 1)
        post.save(update_fields=['comments_count'])
        instance.delete()

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like a comment."""
        comment = self.get_object()
        like, created = Like.objects.get_or_create(
            user=request.user,
            content_type='comment',
            object_id=comment.id
        )
        
        if created:
            comment.likes_count += 1
            comment.save(update_fields=['likes_count'])
            return Response({'status': 'liked'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'already liked'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unlike(self, request, pk=None):
        """Unlike a comment."""
        comment = self.get_object()
        deleted = Like.objects.filter(
            user=request.user,
            content_type='comment',
            object_id=comment.id
        ).delete()[0]
        
        if deleted:
            comment.likes_count = max(0, comment.likes_count - 1)
            comment.save(update_fields=['likes_count'])
            return Response({'status': 'unliked'})
        return Response({'status': 'not liked'}, status=status.HTTP_400_BAD_REQUEST)


class FollowViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user follows."""
    queryset = Follow.objects.select_related('follower', 'following')
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        """Filter follows for current user."""
        return super().get_queryset().filter(follower=self.request.user)

    def create(self, request):
        """Follow a user."""
        following_id = request.data.get('following_id')
        if not following_id:
            return Response(
                {'error': 'following_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if int(following_id) == request.user.id:
            return Response(
                {'error': 'Cannot follow yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )

        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following_id=following_id
        )

        if created:
            serializer = self.get_serializer(follow)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'status': 'already following'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def unfollow(self, request):
        """Unfollow a user."""
        following_id = request.data.get('following_id')
        if not following_id:
            return Response(
                {'error': 'following_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted = Follow.objects.filter(
            follower=request.user,
            following_id=following_id
        ).delete()[0]

        if deleted:
            return Response({'status': 'unfollowed'})
        return Response({'status': 'not following'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def followers(self, request):
        """Get list of users following the current user."""
        followers = Follow.objects.filter(following=request.user).select_related('follower')
        serializer = self.get_serializer(followers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def following(self, request):
        """Get list of users the current user is following."""
        following = self.get_queryset()
        serializer = self.get_serializer(following, many=True)
        return Response(serializer.data)


class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing conversations."""
    queryset = Conversation.objects.prefetch_related('participants', 'messages')
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated, IsParticipantOrReadOnly]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        """Filter conversations for current user."""
        return super().get_queryset().filter(participants=self.request.user)

    def create(self, request):
        """Create or get existing conversation."""
        participant_ids = request.data.get('participant_ids', [])
        if not participant_ids:
            return Response(
                {'error': 'participant_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Include current user
        all_participant_ids = set([request.user.id] + participant_ids)

        # Check if conversation already exists
        conversations = Conversation.objects.filter(
            participants__in=all_participant_ids
        ).annotate(
            participant_count=Count('participants')
        ).filter(participant_count=len(all_participant_ids))

        for conv in conversations:
            if set(conv.participants.values_list('id', flat=True)) == all_participant_ids:
                serializer = self.get_serializer(conv)
                return Response(serializer.data, status=status.HTTP_200_OK)

        # Create new conversation
        conversation = Conversation.objects.create()
        conversation.participants.set(all_participant_ids)
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing messages."""
    queryset = Message.objects.select_related('sender', 'conversation')
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = MessageFilter
    ordering = ['created_at']

    def get_queryset(self):
        """Filter messages for conversations user is part of."""
        user_conversations = Conversation.objects.filter(participants=self.request.user)
        return super().get_queryset().filter(conversation__in=user_conversations)

    def perform_create(self, serializer):
        """Set the sender to current user."""
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a message as read."""
        message = self.get_object()
        if message.sender != request.user:
            message.is_read = True
            message.read_at = timezone.now()
            message.save(update_fields=['is_read', 'read_at'])
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all messages in a conversation as read."""
        conversation_id = request.data.get('conversation_id')
        if not conversation_id:
            return Response(
                {'error': 'conversation_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated = Message.objects.filter(
            conversation_id=conversation_id,
            is_read=False
        ).exclude(sender=request.user).update(
            is_read=True,
            read_at=timezone.now()
        )

        return Response({'status': f'{updated} messages marked as read'})


class BookmarkViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing bookmarks."""
    queryset = Bookmark.objects.select_related('post', 'user')
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter bookmarks for current user."""
        return super().get_queryset().filter(user=self.request.user)


class ContentReportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing content reports."""
    queryset = ContentReport.objects.select_related('reporter', 'reviewed_by')
    serializer_class = ContentReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'content_type', 'reason']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter reports based on user role."""
        if self.request.user.is_staff:
            return super().get_queryset()
        return super().get_queryset().filter(reporter=self.request.user)

    def perform_create(self, serializer):
        """Set the reporter to current user."""
        serializer.save(reporter=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def review(self, request, pk=None):
        """Review a content report (admin only)."""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff can review reports'},
                status=status.HTTP_403_FORBIDDEN
            )

        report = self.get_object()
        action = request.data.get('action')  # 'approve', 'dismiss'
        resolution_notes = request.data.get('resolution_notes', '')

        if action not in ['approve', 'dismiss']:
            return Response(
                {'error': 'Invalid action. Use "approve" or "dismiss"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        report.status = 'resolved' if action == 'approve' else 'dismissed'
        report.reviewed_by = request.user
        report.reviewed_at = timezone.now()
        report.resolution_notes = resolution_notes
        report.save()

        # If approved, flag the content
        if action == 'approve':
            if report.content_type == 'post':
                Post.objects.filter(id=report.object_id).update(is_flagged=True)
            elif report.content_type == 'comment':
                Comment.objects.filter(id=report.object_id).update(is_flagged=True)

        serializer = self.get_serializer(report)
        return Response(serializer.data)
