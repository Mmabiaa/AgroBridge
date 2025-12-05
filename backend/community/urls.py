"""
Community Service URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostViewSet, CommentViewSet, FollowViewSet,
    ConversationViewSet, MessageViewSet,
    BookmarkViewSet, ContentReportViewSet
)

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'follows', FollowViewSet, basename='follow')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'reports', ContentReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
