"""
Management command to populate community service with sample data.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from community.models import Post, Comment, Like, Follow, Conversation, Message
import random

User = get_user_model()


class Command(BaseCommand):
    """Command to populate community data."""
    help = 'Populate community service with sample data'

    def add_arguments(self, parser):
        """Add command arguments."""
        parser.add_argument(
            '--users',
            type=int,
            default=10,
            help='Number of users to create'
        )
        parser.add_argument(
            '--posts',
            type=int,
            default=50,
            help='Number of posts to create'
        )

    def handle(self, *args, **options):
        """Handle the command."""
        num_users = options['users']
        num_posts = options['posts']

        self.stdout.write('Creating users...')
        users = self.create_users(num_users)

        self.stdout.write('Creating follows...')
        self.create_follows(users)

        self.stdout.write('Creating posts...')
        posts = self.create_posts(users, num_posts)

        self.stdout.write('Creating comments...')
        self.create_comments(users, posts)

        self.stdout.write('Creating likes...')
        self.create_likes(users, posts)

        self.stdout.write('Creating conversations and messages...')
        self.create_messages(users)

        self.stdout.write(self.style.SUCCESS('Successfully populated community data!'))

    def create_users(self, count):
        """Create sample users."""
        users = []
        for i in range(count):
            username = f'farmer{i+1}'
            email = f'farmer{i+1}@agrobridge.com'
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password='password123',
                    first_name=f'Farmer{i+1}',
                    last_name=f'User{i+1}'
                )
                users.append(user)
            else:
                users.append(User.objects.get(username=username))
        return users

    def create_follows(self, users):
        """Create follow relationships."""
        for user in users:
            # Each user follows 3-5 random other users
            num_follows = random.randint(3, min(5, len(users) - 1))
            potential_follows = [u for u in users if u != user]
            to_follow = random.sample(potential_follows, num_follows)
            
            for follow_user in to_follow:
                Follow.objects.get_or_create(
                    follower=user,
                    following=follow_user
                )

    def create_posts(self, users, count):
        """Create sample posts."""
        topics = ['farming', 'irrigation', 'harvest', 'planting', 'pest-control', 'fertilizer']
        regions = ['Ashanti', 'Greater Accra', 'Northern', 'Western', 'Eastern']
        crop_types = ['maize', 'cassava', 'rice', 'cocoa', 'tomatoes', 'yam']
        
        post_contents = [
            "Just finished planting this season's crops. Looking forward to a good harvest!",
            "Does anyone have experience with drip irrigation systems?",
            "My maize crop is doing really well this year. Happy to share tips!",
            "Looking for advice on dealing with fall armyworm.",
            "Harvested 5 tons of cassava today. Great yield!",
            "What's the best time to apply fertilizer for cocoa?",
            "Sharing some photos from my farm. The crops are thriving!",
            "Anyone interested in buying fresh tomatoes? Good prices!",
            "Just attended a training on sustainable farming practices.",
            "Weather forecast looks good for the next week. Time to plant!",
        ]
        
        posts = []
        for i in range(count):
            author = random.choice(users)
            content = random.choice(post_contents)
            
            post = Post.objects.create(
                author=author,
                content=content,
                visibility=random.choice(['public', 'public', 'public', 'followers']),
                topics=random.sample(topics, random.randint(1, 3)),
                region=random.choice(regions),
                crop_types=random.sample(crop_types, random.randint(1, 2))
            )
            posts.append(post)
        
        return posts

    def create_comments(self, users, posts):
        """Create sample comments."""
        comment_contents = [
            "Great post! Thanks for sharing.",
            "I have the same question. Anyone know?",
            "This is really helpful information.",
            "I'd love to learn more about this.",
            "Congratulations on your harvest!",
            "Have you tried organic methods?",
            "I'm interested! How can I contact you?",
            "This worked well for me too.",
            "Thanks for the advice!",
            "Keep up the good work!",
        ]
        
        for post in posts:
            # Each post gets 0-5 comments
            num_comments = random.randint(0, 5)
            for _ in range(num_comments):
                commenter = random.choice([u for u in users if u != post.author])
                Comment.objects.create(
                    post=post,
                    author=commenter,
                    content=random.choice(comment_contents)
                )
                post.comments_count += 1
            post.save()

    def create_likes(self, users, posts):
        """Create sample likes."""
        for post in posts:
            # Each post gets likes from 0-8 users
            num_likes = random.randint(0, min(8, len(users) - 1))
            likers = random.sample([u for u in users if u != post.author], num_likes)
            
            for liker in likers:
                Like.objects.get_or_create(
                    user=liker,
                    content_type='post',
                    object_id=post.id
                )
                post.likes_count += 1
            post.save()

    def create_messages(self, users):
        """Create sample conversations and messages."""
        message_contents = [
            "Hi! I saw your post about irrigation. Can you share more details?",
            "Hello! Are you still selling those tomatoes?",
            "Thanks for the farming tips. Very helpful!",
            "I'd like to visit your farm sometime. Is that possible?",
            "Do you have any seeds available for sale?",
            "Great to connect with you!",
            "Let's collaborate on the next harvest season.",
            "I have some equipment you might be interested in.",
        ]
        
        # Create 5-10 conversations
        num_conversations = random.randint(5, min(10, len(users) // 2))
        
        for _ in range(num_conversations):
            # Pick 2 random users
            participants = random.sample(users, 2)
            
            conversation = Conversation.objects.create()
            conversation.participants.set(participants)
            
            # Add 2-5 messages to each conversation
            num_messages = random.randint(2, 5)
            for i in range(num_messages):
                sender = participants[i % 2]
                Message.objects.create(
                    conversation=conversation,
                    sender=sender,
                    content=random.choice(message_contents),
                    is_read=random.choice([True, False])
                )
