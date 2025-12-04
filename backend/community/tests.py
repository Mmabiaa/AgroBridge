"""
Community Service Tests
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Post, Comment, Like, Bookmark, Follow, Conversation, Message, ContentReport

User = get_user_model()


class PostModelTest(TestCase):
    """Test cases for Post model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_post(self):
        """Test creating a post."""
        post = Post.objects.create(
            author=self.user,
            content='Test post content',
            visibility='public'
        )
        self.assertEqual(post.author, self.user)
        self.assertEqual(post.content, 'Test post content')
        self.assertEqual(post.likes_count, 0)
        self.assertEqual(post.comments_count, 0)
    
    def test_post_with_metadata(self):
        """Test creating a post with metadata."""
        post = Post.objects.create(
            author=self.user,
            content='Test post',
            topics=['farming', 'irrigation'],
            region='Ashanti',
            crop_types=['maize', 'cassava']
        )
        self.assertEqual(len(post.topics), 2)
        self.assertEqual(post.region, 'Ashanti')
        self.assertEqual(len(post.crop_types), 2)


class PostAPITest(APITestCase):
    """Test cases for Post API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_post(self):
        """Test creating a post via API."""
        data = {
            'content': 'Test post content',
            'visibility': 'public',
            'topics': ['farming'],
            'region': 'Ashanti'
        }
        response = self.client.post('/api/community/posts/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Test post content')
        self.assertEqual(response.data['author']['id'], self.user.id)
    
    def test_list_posts(self):
        """Test listing posts."""
        Post.objects.create(author=self.user, content='Post 1', visibility='public')
        Post.objects.create(author=self.user, content='Post 2', visibility='public')
        
        response = self.client.get('/api/community/posts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_like_post(self):
        """Test liking a post."""
        post = Post.objects.create(author=self.other_user, content='Test post', visibility='public')
        
        response = self.client.post(f'/api/community/posts/{post.id}/like/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        post.refresh_from_db()
        self.assertEqual(post.likes_count, 1)
    
    def test_unlike_post(self):
        """Test unliking a post."""
        post = Post.objects.create(author=self.other_user, content='Test post', visibility='public')
        Like.objects.create(user=self.user, content_type='post', object_id=post.id)
        post.likes_count = 1
        post.save()
        
        response = self.client.post(f'/api/community/posts/{post.id}/unlike/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        post.refresh_from_db()
        self.assertEqual(post.likes_count, 0)
    
    def test_bookmark_post(self):
        """Test bookmarking a post."""
        post = Post.objects.create(author=self.other_user, content='Test post', visibility='public')
        
        response = self.client.post(f'/api/community/posts/{post.id}/bookmark/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.assertTrue(Bookmark.objects.filter(user=self.user, post=post).exists())


class CommentAPITest(APITestCase):
    """Test cases for Comment API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.post = Post.objects.create(
            author=self.user,
            content='Test post',
            visibility='public'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_comment(self):
        """Test creating a comment."""
        data = {
            'post': self.post.id,
            'content': 'Test comment'
        }
        response = self.client.post('/api/community/comments/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Test comment')
        
        self.post.refresh_from_db()
        self.assertEqual(self.post.comments_count, 1)
    
    def test_reply_to_comment(self):
        """Test replying to a comment."""
        parent_comment = Comment.objects.create(
            post=self.post,
            author=self.user,
            content='Parent comment'
        )
        
        data = {
            'post': self.post.id,
            'content': 'Reply comment',
            'parent': parent_comment.id
        }
        response = self.client.post('/api/community/comments/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['parent'], parent_comment.id)


class FollowAPITest(APITestCase):
    """Test cases for Follow API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_follow_user(self):
        """Test following a user."""
        data = {'following_id': self.other_user.id}
        response = self.client.post('/api/community/follows/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.assertTrue(Follow.objects.filter(
            follower=self.user,
            following=self.other_user
        ).exists())
    
    def test_cannot_follow_self(self):
        """Test that user cannot follow themselves."""
        data = {'following_id': self.user.id}
        response = self.client.post('/api/community/follows/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unfollow_user(self):
        """Test unfollowing a user."""
        Follow.objects.create(follower=self.user, following=self.other_user)
        
        data = {'following_id': self.other_user.id}
        response = self.client.post('/api/community/follows/unfollow/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertFalse(Follow.objects.filter(
            follower=self.user,
            following=self.other_user
        ).exists())


class MessageAPITest(APITestCase):
    """Test cases for Message API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        self.conversation = Conversation.objects.create()
        self.conversation.participants.set([self.user, self.other_user])
        self.client.force_authenticate(user=self.user)
    
    def test_create_message(self):
        """Test creating a message."""
        data = {
            'conversation': self.conversation.id,
            'content': 'Test message'
        }
        response = self.client.post('/api/community/messages/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Test message')
    
    def test_mark_message_read(self):
        """Test marking a message as read."""
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.other_user,
            content='Test message'
        )
        
        response = self.client.post(f'/api/community/messages/{message.id}/mark_read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        message.refresh_from_db()
        self.assertTrue(message.is_read)


class ContentReportAPITest(APITestCase):
    """Test cases for ContentReport API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.staff_user = User.objects.create_user(
            username='staffuser',
            email='staff@example.com',
            password='testpass123',
            is_staff=True
        )
        self.post = Post.objects.create(
            author=self.user,
            content='Test post',
            visibility='public'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_report(self):
        """Test creating a content report."""
        data = {
            'content_type': 'post',
            'object_id': self.post.id,
            'reason': 'spam',
            'description': 'This is spam'
        }
        response = self.client.post('/api/community/reports/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['reason'], 'spam')
    
    def test_review_report_as_staff(self):
        """Test reviewing a report as staff."""
        report = ContentReport.objects.create(
            reporter=self.user,
            content_type='post',
            object_id=self.post.id,
            reason='spam'
        )
        
        self.client.force_authenticate(user=self.staff_user)
        data = {
            'action': 'approve',
            'resolution_notes': 'Confirmed spam'
        }
        response = self.client.post(f'/api/community/reports/{report.id}/review/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        report.refresh_from_db()
        self.assertEqual(report.status, 'resolved')
        self.assertEqual(report.reviewed_by, self.staff_user)
