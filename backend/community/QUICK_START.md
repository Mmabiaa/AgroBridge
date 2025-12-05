# Community Service - Quick Start Guide

## Installation

The Community Service is already integrated into the AgroBridge backend. No additional installation required.

## Database Setup

1. Run migrations:
```bash
python manage.py migrate community
```

2. (Optional) Populate with sample data:
```bash
python manage.py populate_community_data --users 10 --posts 50
```

## API Access

All endpoints are available at: `http://localhost:8000/api/v1/community/`

### Authentication

Most endpoints require authentication. Include JWT token in headers:
```
Authorization: Bearer <your_jwt_token>
```

## Quick Examples

### 1. Create a Post

```bash
curl -X POST http://localhost:8000/api/v1/community/posts/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Just harvested my maize crop! Great yield this season.",
    "visibility": "public",
    "topics": ["harvest", "maize"],
    "region": "Ashanti",
    "crop_types": ["maize"]
  }'
```

### 2. Get Personalized Feed

```bash
curl -X GET http://localhost:8000/api/v1/community/posts/feed/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Like a Post

```bash
curl -X POST http://localhost:8000/api/v1/community/posts/1/like/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Comment on a Post

```bash
curl -X POST http://localhost:8000/api/v1/community/comments/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "post": 1,
    "content": "Great harvest! What variety did you plant?"
  }'
```

### 5. Follow a User

```bash
curl -X POST http://localhost:8000/api/v1/community/follows/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "following_id": 2
  }'
```

### 6. Send a Message

First, create or get a conversation:
```bash
curl -X POST http://localhost:8000/api/v1/community/conversations/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participant_ids": [2]
  }'
```

Then send a message:
```bash
curl -X POST http://localhost:8000/api/v1/community/messages/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": 1,
    "content": "Hello! I saw your post about irrigation systems."
  }'
```

### 7. Report Content

```bash
curl -X POST http://localhost:8000/api/v1/community/reports/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content_type": "post",
    "object_id": 5,
    "reason": "spam",
    "description": "This post contains spam content"
  }'
```

## Filtering and Search

### Filter Posts by Region
```bash
GET /api/v1/community/posts/?region=Ashanti
```

### Filter Posts by Topic
```bash
GET /api/v1/community/posts/?topic=irrigation
```

### Filter Posts by Crop Type
```bash
GET /api/v1/community/posts/?crop_type=maize
```

### Search Posts
```bash
GET /api/v1/community/posts/?search=harvest
```

### Filter by Date Range
```bash
GET /api/v1/community/posts/?created_after=2025-01-01&created_before=2025-12-31
```

## Admin Access

Access the admin interface at: `http://localhost:8000/admin/`

Admin features:
- View and moderate all posts
- Review content reports
- Manage user follows
- View conversations and messages
- Bulk moderation actions

## Testing

Run the test suite:
```bash
python manage.py test community
```

Run specific test class:
```bash
python manage.py test community.tests.PostAPITest
```

## API Documentation

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`

## Common Use Cases

### 1. Building a Social Feed
```python
# Get personalized feed
GET /api/v1/community/posts/feed/

# Response includes:
# - Posts from followed users
# - User's own posts
# - Engagement data (likes, comments, shares)
# - Whether current user has liked/bookmarked
```

### 2. Implementing Comments Section
```python
# Get comments for a post
GET /api/v1/community/comments/?post=1

# Create a comment
POST /api/v1/community/comments/
{
    "post": 1,
    "content": "Great post!"
}

# Reply to a comment
POST /api/v1/community/comments/
{
    "post": 1,
    "parent": 5,
    "content": "I agree!"
}
```

### 3. Building a Messaging Interface
```python
# Get user's conversations
GET /api/v1/community/conversations/

# Get messages in a conversation
GET /api/v1/community/messages/?conversation=1

# Mark all messages as read
POST /api/v1/community/messages/mark_all_read/
{
    "conversation_id": 1
}
```

### 4. Content Moderation Dashboard
```python
# Get pending reports (staff only)
GET /api/v1/community/reports/?status=pending

# Review a report (staff only)
POST /api/v1/community/reports/1/review/
{
    "action": "approve",
    "resolution_notes": "Content removed for violating community guidelines"
}
```

## Notifications

The service automatically sends notifications for:
- New posts from followed users
- Comments on your posts
- Likes on your posts/comments
- New followers
- New messages
- Content reports (to staff)

Notifications are sent via:
- WebSocket (real-time)
- Push notifications (mobile)
- Email (configurable)

## Performance Tips

1. Use pagination for large result sets
2. Use the feed endpoint for personalized content
3. Filter by region/topic to reduce data transfer
4. Use the optimized FeedPostSerializer for list views
5. Implement caching for frequently accessed data

## Troubleshooting

### Issue: "Authentication credentials were not provided"
**Solution**: Include JWT token in Authorization header

### Issue: "You do not have permission to perform this action"
**Solution**: Ensure you're the author of the content you're trying to modify

### Issue: "Cannot follow yourself"
**Solution**: You can only follow other users, not yourself

### Issue: Posts not appearing in feed
**Solution**: Make sure you're following users and they have public posts

## Support

For more information, see:
- Full documentation: `backend/community/README.md`
- Implementation details: `backend/community/IMPLEMENTATION_SUMMARY.md`
- Completion report: `backend/docs/tasks/TASK_12_COMPLETION.md`
