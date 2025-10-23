from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid
import json

User = get_user_model()


class ChatConversation(models.Model):
    """
    Chat conversations with the AI assistant
    """
    CONVERSATION_TYPE_CHOICES = [
        ('general', 'General Chat'),
        ('farming_advice', 'Farming Advice'),
        ('crop_diagnosis', 'Crop Diagnosis'),
        ('market_info', 'Market Information'),
        ('weather', 'Weather Inquiry'),
        ('pest_control', 'Pest Control'),
        ('fertilizer', 'Fertilizer Advice'),
        ('irrigation', 'Irrigation Guidance'),
        ('livestock', 'Livestock Care'),
        ('financial', 'Financial Planning'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('archived', 'Archived'),
        ('deleted', 'Deleted'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_conversations')
    
    # Conversation metadata
    title = models.CharField(max_length=200, blank=True)
    conversation_type = models.CharField(max_length=20, choices=CONVERSATION_TYPE_CHOICES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Context information
    context_data = models.JSONField(default=dict, help_text="Additional context for the conversation")
    language = models.CharField(max_length=10, default='en')
    
    # Statistics
    message_count = models.IntegerField(default=0)
    total_tokens_used = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['conversation_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['last_message_at']),
        ]
    
    def __str__(self):
        return f"{self.title or f'Conversation {self.id}'} - {self.user.username}"
    
    def save(self, *args, **kwargs):
        """Generate title if not provided"""
        if not self.title:
            self.title = f"{self.get_conversation_type_display()} - {timezone.now().strftime('%Y-%m-%d %H:%M')}"
        super().save(*args, **kwargs)
    
    @property
    def is_active(self):
        """Check if conversation is active"""
        return self.status == 'active'
    
    def increment_message_count(self):
        """Increment message count and update last message time"""
        self.message_count += 1
        self.last_message_at = timezone.now()
        self.save(update_fields=['message_count', 'last_message_at', 'updated_at'])
    
    def add_tokens_used(self, tokens):
        """Add to total tokens used"""
        self.total_tokens_used += tokens
        self.save(update_fields=['total_tokens_used'])


class ChatMessage(models.Model):
    """
    Individual messages in a chat conversation
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'AI Assistant'),
        ('system', 'System'),
    ]
    
    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text Message'),
        ('image', 'Image Message'),
        ('voice', 'Voice Message'),
        ('file', 'File Attachment'),
        ('location', 'Location Share'),
        ('recommendation', 'AI Recommendation'),
        ('error', 'Error Message'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
    
    # Message content
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, default='text')
    content = models.TextField()
    
    # Metadata
    metadata = models.JSONField(default=dict, help_text="Additional message metadata")
    tokens_used = models.IntegerField(default=0)
    processing_time_ms = models.IntegerField(null=True, blank=True)
    
    # Attachments
    image = models.ImageField(upload_to='chat_images/', null=True, blank=True)
    voice_file = models.FileField(upload_to='chat_voice/', null=True, blank=True)
    attachment = models.FileField(upload_to='chat_attachments/', null=True, blank=True)
    
    # AI response metadata
    model_used = models.CharField(max_length=100, blank=True)
    confidence_score = models.FloatField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    
    # User feedback
    is_helpful = models.BooleanField(null=True, blank=True)
    user_rating = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation']),
            models.Index(fields=['role']),
            models.Index(fields=['message_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
    
    def save(self, *args, **kwargs):
        """Update conversation when message is saved"""
        super().save(*args, **kwargs)
        
        # Update conversation statistics
        if self._state.adding:  # Only for new messages
            self.conversation.increment_message_count()
            if self.tokens_used:
                self.conversation.add_tokens_used(self.tokens_used)


class AIRecommendation(models.Model):
    """
    AI-generated recommendations for users
    """
    RECOMMENDATION_TYPE_CHOICES = [
        ('crop_selection', 'Crop Selection'),
        ('planting_schedule', 'Planting Schedule'),
        ('fertilizer', 'Fertilizer Recommendation'),
        ('pest_control', 'Pest Control'),
        ('irrigation', 'Irrigation Schedule'),
        ('harvest_timing', 'Harvest Timing'),
        ('market_opportunity', 'Market Opportunity'),
        ('weather_action', 'Weather-based Action'),
        ('financial_advice', 'Financial Advice'),
        ('equipment', 'Equipment Recommendation'),
        ('general_farming', 'General Farming Tip'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('implemented', 'Implemented'),
        ('dismissed', 'Dismissed'),
        ('expired', 'Expired'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_recommendations')
    
    # Recommendation details
    recommendation_type = models.CharField(max_length=30, choices=RECOMMENDATION_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    detailed_content = models.JSONField(default=dict, help_text="Detailed recommendation data")
    
    # Priority and timing
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # AI metadata
    confidence_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    model_used = models.CharField(max_length=100, blank=True)
    reasoning = models.TextField(blank=True, help_text="AI reasoning for this recommendation")
    
    # Context and triggers
    trigger_data = models.JSONField(default=dict, help_text="Data that triggered this recommendation")
    context_farm = models.ForeignKey(
        'farms.Farm', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='ai_recommendations'
    )
    context_crop = models.ForeignKey(
        'farms.Crop', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='ai_recommendations'
    )
    
    # Timing
    valid_until = models.DateTimeField(null=True, blank=True)
    best_implementation_date = models.DateField(null=True, blank=True)
    
    # User interaction
    viewed_at = models.DateTimeField(null=True, blank=True)
    user_feedback = models.TextField(blank=True)
    user_rating = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['recommendation_type']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['created_at']),
            models.Index(fields=['valid_until']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    @property
    def is_valid(self):
        """Check if recommendation is still valid"""
        if self.valid_until:
            return timezone.now() <= self.valid_until
        return True
    
    @property
    def is_urgent(self):
        """Check if recommendation is urgent"""
        return self.priority == 'urgent'
    
    def mark_as_viewed(self):
        """Mark recommendation as viewed"""
        if not self.viewed_at:
            self.viewed_at = timezone.now()
            self.save(update_fields=['viewed_at'])
    
    def mark_as_implemented(self, feedback=None):
        """Mark recommendation as implemented"""
        self.status = 'implemented'
        if feedback:
            self.user_feedback = feedback
        self.save(update_fields=['status', 'user_feedback', 'updated_at'])
    
    def dismiss(self, feedback=None):
        """Dismiss recommendation"""
        self.status = 'dismissed'
        if feedback:
            self.user_feedback = feedback
        self.save(update_fields=['status', 'user_feedback', 'updated_at'])


class KnowledgeBase(models.Model):
    """
    Knowledge base articles for the AI assistant
    """
    CATEGORY_CHOICES = [
        ('crops', 'Crop Information'),
        ('pests', 'Pest Management'),
        ('diseases', 'Disease Management'),
        ('fertilizers', 'Fertilizers'),
        ('irrigation', 'Irrigation'),
        ('weather', 'Weather Patterns'),
        ('market', 'Market Information'),
        ('equipment', 'Farm Equipment'),
        ('livestock', 'Livestock Care'),
        ('financial', 'Financial Planning'),
        ('general', 'General Farming'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Content
    title = models.CharField(max_length=200)
    content = models.TextField()
    summary = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    tags = models.JSONField(default=list, help_text="Search tags")
    
    # Metadata
    language = models.CharField(max_length=10, default='en')
    region_specific = models.CharField(max_length=100, blank=True, help_text="Specific to a region/country")
    
    # Versioning and quality
    version = models.CharField(max_length=20, default='1.0')
    accuracy_score = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    
    # Usage statistics
    usage_count = models.IntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['language']),
            models.Index(fields=['is_active']),
            models.Index(fields=['tags']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.category})"
    
    def increment_usage(self):
        """Increment usage count"""
        self.usage_count += 1
        self.last_used = timezone.now()
        self.save(update_fields=['usage_count', 'last_used'])


class VoiceInteraction(models.Model):
    """
    Voice interactions with the AI assistant
    """
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='voice_interactions')
    conversation = models.ForeignKey(
        ChatConversation, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='voice_interactions'
    )
    
    # Audio files
    input_audio = models.FileField(upload_to='voice_input/')
    output_audio = models.FileField(upload_to='voice_output/', null=True, blank=True)
    
    # Transcription
    transcribed_text = models.TextField(blank=True)
    response_text = models.TextField(blank=True)
    
    # Processing metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    language_detected = models.CharField(max_length=10, blank=True)
    confidence_score = models.FloatField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    
    # Performance metrics
    transcription_time_ms = models.IntegerField(null=True, blank=True)
    response_generation_time_ms = models.IntegerField(null=True, blank=True)
    synthesis_time_ms = models.IntegerField(null=True, blank=True)
    
    # Error handling
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['conversation']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Voice interaction - {self.user.username} - {self.created_at}"
    
    def mark_completed(self):
        """Mark voice interaction as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])
    
    def mark_failed(self, error_message):
        """Mark voice interaction as failed"""
        self.status = 'failed'
        self.error_message = error_message
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'error_message', 'completed_at'])


class AIUsageStatistics(models.Model):
    """
    Track AI assistant usage statistics
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_usage_stats')
    date = models.DateField()
    
    # Usage counts
    conversations_started = models.IntegerField(default=0)
    messages_sent = models.IntegerField(default=0)
    voice_interactions = models.IntegerField(default=0)
    recommendations_received = models.IntegerField(default=0)
    recommendations_implemented = models.IntegerField(default=0)
    
    # Token usage
    total_tokens_used = models.IntegerField(default=0)
    
    # Feature usage
    crop_diagnosis_queries = models.IntegerField(default=0)
    market_info_queries = models.IntegerField(default=0)
    weather_queries = models.IntegerField(default=0)
    farming_advice_queries = models.IntegerField(default=0)
    
    # Performance metrics
    average_response_time_ms = models.FloatField(null=True, blank=True)
    user_satisfaction_score = models.FloatField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)]
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"
