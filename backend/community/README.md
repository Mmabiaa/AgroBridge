# Community Service

The Community Service provides social networking and community features for farmers on the AgroBridge platform.

## Features

### 1. Post Management
- Create, read, update, and delete posts
- Support for text, images, and location tags
- Visibility controls (public, followers only, private)
- Organization by topics, regions, and crop types
- Post engagement metrics (likes, comments, shares)

### 2. Social Interactions
- Like posts and comments
- Comment on posts with nested replies
- Share posts
- Bookmark posts for later viewing

### 3. User Connections
- Follow/unfollow other users
- View followers and following lists
- Personalized feed based on followed users

### 4. Private Messaging
- Direct messaging between users
- Support for text and image messages
- Conversation threads
- Read/unread status tracking
- Mark messages as read

### 5. Content Moderation
- Report inappropriate content
- Automated spam detection
- Admin review and moderation tools
- Content flagging system
- 24-hour response time for reports

## API Endpoints

### Posts
- `GET /api/community/posts/` - List all posts
- `POST /api/community/posts/` - Create a new post
- `GET /api/community/posts/{id}/` - Get post details
- `PUT /api/community/posts/{id}/` - Update a post
- `DELETE /api/community/posts/{id}/` - Delete a post
- `GET /api/community/posts/feed/` - Get personalized feed
- `POST /api/community/posts/{id}/like/` - Like a post
- `POST /api/community/posts/{id}/unlike/` - Unlike a post
- `POST /api/community/posts/{id}/bookmark/` - Bookmark a post
- `POST /api/community/posts/{id}/unbookmark/` - Remove bookmark
- `POST /api/community/posts/{id}/share/` - Share a post

### Comments
- `GET /api/community/comments/` - List comments
- `POST /api/community/comments/` - Create a comment
- `GET /api/community/comments/{id}/` - Get comment details
- `PUT /api/community/comments/{id}/` - Update a comment
- `DELETE /api/community/comments/{id}/` - Delete a comment
- `POST /api/community/comments/{id}/like/` - Like a comment
- `POST /api/community/comments/{id}/unlike/` - Unlike a comment

### Follows
- `GET /api/community/follows/` - List user's follows
- `POST /api/community/follows/` - Follow a user
- `POST /api/community/follows/unfollow/` - Unfollow a user
- `GET /api/community/follows/followers/` - Get followers list
- `GET /api/community/follows/following/` - Get following list

### Conversations & Messages
- `GET /api/community/conversations/` - List conversations
- `POST /api/community/conversations/` - Create/get conversation
- `GET /api/community/messages/` - List messages
- `POST /api/community/messages/` - Send a message
- `POST /api/community/messages/{id}/mark_read/` - Mark message as read
- `POST /api/community/messages/mark_all_read/` - Mark all messages in conversation as read

### Bookmarks
- `GET /api/community/bookmarks/` - List user's bookmarks

### Content Reports
- `GET /api/community/reports/` - List reports
- `POST /api/community/reports/` - Create a report
- `POST /api/community/reports/{id}/review/` - Review a report (staff only)

## Models

### Post
- Author, content, images, location
- Visibility settings
- Topics, region, crop types
- Engagement metrics
- Moderation status

### Comment
- Post reference, author, content
- Parent comment for nested replies
- Like count

### Like
- User, content type, object ID
- Generic like system for posts and comments

### Bookmark
- User, post reference

### Follow
- Follower, following users

### Conversation
- Participants (many-to-many)

### Message
- Conversation, sender, content, image
- Read status and timestamp

### ContentReport
- Reporter, content type, object ID
- Reason, description
- Status, reviewer, resolution notes

## Filters

### PostFilter
- Filter by author, region, visibility, moderation status
- Filter by topic and crop type
- Date range filtering

### CommentFilter
- Filter by post, author, parent comment
- Date range filtering

### MessageFilter
- Filter by conversation, sender, read status
- Date range filtering

## Permissions

### IsAuthorOrReadOnly
- Read access for everyone
- Write access only for content author

### IsParticipantOrReadOnly
- Access only for conversation participants

### IsStaffOrReadOnly
- Read access for everyone
- Write access only for staff

## Signals

The service automatically sends notifications for:
- New posts from followed users
- New comments on user's posts
- New likes on posts and comments
- New followers
- New messages
- New content reports (to staff)

## Testing

Run tests with:
```bash
python manage.py test community
```

Test coverage includes:
- Model creation and validation
- API endpoint functionality
- Social interactions (likes, comments, follows)
- Messaging system
- Content moderation

## Service Registration

The service automatically registers with Consul on startup for service discovery.

## Usage Examples

### Create a Post
```python
POST /api/community/posts/
{
    "content": "Just harvested my maize crop!",
    "images": ["https://example.com/image1.jpg"],
    "location": {"lat": 6.6666, "lng": -1.6163, "name": "Kumasi"},
    "visibility": "public",
    "topics": ["harvest", "maize"],
    "region": "Ashanti",
    "crop_types": ["maize"]
}
```

### Follow a User
```python
POST /api/community/follows/
{
    "following_id": 123
}
```

### Send a Message
```python
# First, create or get conversation
POST /api/community/conversations/
{
    "participant_ids": [123]
}

# Then send message
POST /api/community/messages/
{
    "conversation": 1,
    "content": "Hello, how is your farm doing?"
}
```

### Report Content
```python
POST /api/community/reports/
{
    "content_type": "post",
    "object_id": 456,
    "reason": "spam",
    "description": "This post contains spam content"
}
```

## Integration

The Community Service integrates with:
- **Notification Service**: Sends real-time notifications for social interactions
- **User Service**: Retrieves user profile information
- **Consul**: Service discovery and health checks

## Performance Considerations

- Database indexes on frequently queried fields
- Prefetch related data to reduce queries
- Pagination for list endpoints
- Optimized serializers for feed views
- Caching for frequently accessed data (recommended)

## Security

- Authentication required for most endpoints
- Permission checks for content modification
- Content moderation system
- Rate limiting on API endpoints
- Input validation and sanitization

## Future Enhancements

- Real-time updates via WebSockets
- Advanced content recommendation algorithm
- Hashtag support
- Trending topics
- User mentions and tagging
- Post scheduling
- Analytics dashboard
- Content translation
