"""
Scheduling models for task management
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone
from datetime import timedelta
import uuid

User = get_user_model()


class Task(models.Model):
    """
    Agricultural tasks and activities
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('overdue', 'Overdue'),
    ]
    
    CATEGORY_CHOICES = [
        ('planting', 'Planting'),
        ('watering', 'Watering'),
        ('fertilizing', 'Fertilizing'),
        ('pest_control', 'Pest Control'),
        ('weeding', 'Weeding'),
        ('harvesting', 'Harvesting'),
        ('maintenance', 'Maintenance'),
        ('inspection', 'Inspection'),
        ('other', 'Other'),
    ]
    
    RECURRENCE_CHOICES = [
        ('none', 'None'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
        ('seasonal', 'Seasonal'),
        ('custom', 'Custom'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    farm = models.ForeignKey('farms.Farm', on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    field = models.ForeignKey('farms.Field', on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    
    # Task details
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Scheduling
    due_date = models.DateTimeField()
    estimated_duration = models.IntegerField(
        help_text="Estimated duration in minutes",
        validators=[MinValueValidator(1)],
        null=True,
        blank=True
    )
    
    # Recurrence
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=20, choices=RECURRENCE_CHOICES, default='none')
    recurrence_interval = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Interval for recurrence (e.g., every 2 weeks)"
    )
    recurrence_end_date = models.DateTimeField(null=True, blank=True)
    parent_task = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='recurring_instances'
    )
    
    # Completion tracking
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_tasks'
    )
    completion_notes = models.TextField(blank=True)
    
    # Reminders
    reminder_enabled = models.BooleanField(default=True)
    reminder_time = models.IntegerField(
        default=60,
        help_text="Minutes before due date to send reminder",
        validators=[MinValueValidator(0)]
    )
    reminder_sent = models.BooleanField(default=False)
    
    # Additional metadata
    tags = models.JSONField(default=list, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    assigned_to = models.ManyToManyField(User, related_name='assigned_tasks', blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['due_date', '-priority']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['status']),
            models.Index(fields=['farm']),
            models.Index(fields=['field']),
            models.Index(fields=['is_recurring']),
            models.Index(fields=['reminder_sent', 'due_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.due_date.strftime('%Y-%m-%d')}"
    
    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.status in ['completed', 'cancelled']:
            return False
        return timezone.now() > self.due_date
    
    @property
    def days_until_due(self):
        """Calculate days until due date"""
        if self.status in ['completed', 'cancelled']:
            return None
        delta = self.due_date - timezone.now()
        return delta.days
    
    @property
    def is_due_soon(self):
        """Check if task is due within 24 hours"""
        if self.status in ['completed', 'cancelled']:
            return False
        delta = self.due_date - timezone.now()
        return timedelta(0) <= delta <= timedelta(hours=24)
    
    def mark_complete(self, user=None, notes=''):
        """Mark task as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.completed_by = user
        self.completion_notes = notes
        self.save()
        
        # Generate next recurring instance if applicable
        if self.is_recurring and not self.parent_task:
            self.generate_next_instance()
    
    def generate_next_instance(self):
        """Generate next recurring task instance"""
        if not self.is_recurring or self.recurrence_pattern == 'none':
            return None
        
        # Calculate next due date
        next_due_date = self._calculate_next_due_date()
        
        # Check if we've reached the end date
        if self.recurrence_end_date and next_due_date > self.recurrence_end_date:
            return None
        
        # Create new task instance
        next_task = Task.objects.create(
            user=self.user,
            farm=self.farm,
            field=self.field,
            title=self.title,
            description=self.description,
            category=self.category,
            priority=self.priority,
            status='pending',
            due_date=next_due_date,
            estimated_duration=self.estimated_duration,
            is_recurring=True,
            recurrence_pattern=self.recurrence_pattern,
            recurrence_interval=self.recurrence_interval,
            recurrence_end_date=self.recurrence_end_date,
            parent_task=self if not self.parent_task else self.parent_task,
            reminder_enabled=self.reminder_enabled,
            reminder_time=self.reminder_time,
            tags=self.tags.copy() if self.tags else []
        )
        
        # Copy assigned users
        next_task.assigned_to.set(self.assigned_to.all())
        
        return next_task
    
    def _calculate_next_due_date(self):
        """Calculate next due date based on recurrence pattern"""
        current_due = self.due_date
        interval = self.recurrence_interval
        
        if self.recurrence_pattern == 'daily':
            return current_due + timedelta(days=interval)
        elif self.recurrence_pattern == 'weekly':
            return current_due + timedelta(weeks=interval)
        elif self.recurrence_pattern == 'biweekly':
            return current_due + timedelta(weeks=2 * interval)
        elif self.recurrence_pattern == 'monthly':
            # Approximate month as 30 days
            return current_due + timedelta(days=30 * interval)
        elif self.recurrence_pattern == 'seasonal':
            # Seasonal is approximately 3 months
            return current_due + timedelta(days=90 * interval)
        else:
            return current_due + timedelta(days=interval)
    
    def send_reminder(self):
        """Send reminder notification for this task"""
        if not self.reminder_enabled or self.reminder_sent:
            return False
        
        # Check if it's time to send reminder
        reminder_time = self.due_date - timedelta(minutes=self.reminder_time)
        if timezone.now() < reminder_time:
            return False
        
        # Send notification
        from notifications.services import NotificationService
        
        NotificationService.create_notification(
            recipient=self.user,
            title=f"Task Reminder: {self.title}",
            message=f"Your task '{self.title}' is due on {self.due_date.strftime('%Y-%m-%d %H:%M')}",
            notification_type='task_reminder',
            priority=self.priority,
            data={
                'task_id': str(self.id),
                'due_date': self.due_date.isoformat(),
                'category': self.category
            }
        )
        
        self.reminder_sent = True
        self.save(update_fields=['reminder_sent'])
        
        return True


class TaskTemplate(models.Model):
    """
    Reusable task templates for common agricultural activities
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_templates', null=True, blank=True)
    
    # Template details
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=Task.CATEGORY_CHOICES)
    priority = models.CharField(max_length=20, choices=Task.PRIORITY_CHOICES, default='medium')
    
    # Default values
    estimated_duration = models.IntegerField(
        help_text="Estimated duration in minutes",
        validators=[MinValueValidator(1)],
        null=True,
        blank=True
    )
    default_reminder_time = models.IntegerField(
        default=60,
        help_text="Default minutes before due date to send reminder"
    )
    
    # Template metadata
    is_public = models.BooleanField(default=False, help_text="Available to all users")
    tags = models.JSONField(default=list, blank=True)
    checklist = models.JSONField(default=list, blank=True, help_text="List of subtasks")
    
    # Usage tracking
    usage_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-usage_count', 'name']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['category']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return self.name
    
    def create_task_from_template(self, user, due_date, **kwargs):
        """Create a task from this template"""
        task = Task.objects.create(
            user=user,
            title=kwargs.get('title', self.name),
            description=kwargs.get('description', self.description),
            category=self.category,
            priority=kwargs.get('priority', self.priority),
            due_date=due_date,
            estimated_duration=kwargs.get('estimated_duration', self.estimated_duration),
            reminder_time=kwargs.get('reminder_time', self.default_reminder_time),
            tags=self.tags.copy() if self.tags else [],
            **{k: v for k, v in kwargs.items() if k not in ['title', 'description', 'priority', 'estimated_duration', 'reminder_time']}
        )
        
        # Increment usage count
        self.usage_count += 1
        self.save(update_fields=['usage_count'])
        
        return task


class CropCalendar(models.Model):
    """
    Crop-specific calendar with recommended activities
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    crop_name = models.CharField(max_length=100)
    variety = models.CharField(max_length=100, blank=True)
    
    # Growth stages and durations (in days)
    germination_days = models.IntegerField(validators=[MinValueValidator(1)])
    vegetative_days = models.IntegerField(validators=[MinValueValidator(1)])
    flowering_days = models.IntegerField(validators=[MinValueValidator(1)])
    fruiting_days = models.IntegerField(validators=[MinValueValidator(1)])
    maturity_days = models.IntegerField(validators=[MinValueValidator(1)])
    
    # Recommended activities (JSON format)
    planting_activities = models.JSONField(default=list)
    growth_activities = models.JSONField(default=list)
    harvest_activities = models.JSONField(default=list)
    
    # Climate and season info
    optimal_planting_months = models.JSONField(default=list, help_text="List of month numbers (1-12)")
    climate_zones = models.JSONField(default=list)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['crop_name', 'variety']
        indexes = [
            models.Index(fields=['crop_name']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        if self.variety:
            return f"{self.crop_name} ({self.variety})"
        return self.crop_name
    
    @property
    def total_days_to_harvest(self):
        """Calculate total days from planting to harvest"""
        return (
            self.germination_days +
            self.vegetative_days +
            self.flowering_days +
            self.fruiting_days +
            self.maturity_days
        )
    
    def generate_tasks_for_crop(self, user, field, planting_date):
        """Generate tasks based on crop calendar"""
        tasks = []
        current_date = planting_date
        
        # Planting tasks
        for activity in self.planting_activities:
            task = Task.objects.create(
                user=user,
                field=field,
                title=activity.get('title', 'Planting Activity'),
                description=activity.get('description', ''),
                category='planting',
                priority=activity.get('priority', 'medium'),
                due_date=current_date + timedelta(days=activity.get('days_offset', 0)),
                estimated_duration=activity.get('duration', 60)
            )
            tasks.append(task)
        
        # Growth stage tasks
        growth_start = current_date + timedelta(days=self.germination_days)
        for activity in self.growth_activities:
            task = Task.objects.create(
                user=user,
                field=field,
                title=activity.get('title', 'Growth Activity'),
                description=activity.get('description', ''),
                category=activity.get('category', 'maintenance'),
                priority=activity.get('priority', 'medium'),
                due_date=growth_start + timedelta(days=activity.get('days_offset', 0)),
                estimated_duration=activity.get('duration', 60),
                is_recurring=activity.get('is_recurring', False),
                recurrence_pattern=activity.get('recurrence_pattern', 'none'),
                recurrence_interval=activity.get('recurrence_interval', 1)
            )
            tasks.append(task)
        
        # Harvest tasks
        harvest_date = current_date + timedelta(days=self.total_days_to_harvest)
        for activity in self.harvest_activities:
            task = Task.objects.create(
                user=user,
                field=field,
                title=activity.get('title', 'Harvest Activity'),
                description=activity.get('description', ''),
                category='harvesting',
                priority=activity.get('priority', 'high'),
                due_date=harvest_date + timedelta(days=activity.get('days_offset', 0)),
                estimated_duration=activity.get('duration', 120)
            )
            tasks.append(task)
        
        return tasks
