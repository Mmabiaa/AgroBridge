"""
Serializers for scheduling models
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Task, TaskTemplate, CropCalendar

User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    field_name = serializers.CharField(source='field.name', read_only=True)
    completed_by_name = serializers.CharField(source='completed_by.username', read_only=True)
    assigned_to_names = serializers.SerializerMethodField()
    
    # Computed fields
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    is_due_soon = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'user', 'user_name', 'farm', 'farm_name', 'field', 'field_name',
            'title', 'description', 'category', 'priority', 'status',
            'due_date', 'estimated_duration',
            'is_recurring', 'recurrence_pattern', 'recurrence_interval', 'recurrence_end_date',
            'parent_task', 'completed_at', 'completed_by', 'completed_by_name',
            'completion_notes', 'reminder_enabled', 'reminder_time', 'reminder_sent',
            'tags', 'attachments', 'assigned_to', 'assigned_to_names',
            'created_at', 'updated_at',
            'is_overdue', 'days_until_due', 'is_due_soon'
        ]
        read_only_fields = [
            'id', 'user', 'completed_at', 'completed_by', 'reminder_sent',
            'created_at', 'updated_at'
        ]
    
    def get_assigned_to_names(self, obj):
        """Get names of assigned users"""
        return [user.username for user in obj.assigned_to.all()]
    
    def validate_due_date(self, value):
        """Validate due date is not in the past"""
        if value < timezone.now() and not self.instance:
            raise serializers.ValidationError("Due date cannot be in the past")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Validate recurrence settings
        if data.get('is_recurring'):
            if data.get('recurrence_pattern') == 'none':
                raise serializers.ValidationError(
                    "Recurrence pattern must be specified for recurring tasks"
                )
            
            if data.get('recurrence_end_date'):
                if data['recurrence_end_date'] <= data.get('due_date', self.instance.due_date if self.instance else timezone.now()):
                    raise serializers.ValidationError(
                        "Recurrence end date must be after due date"
                    )
        
        return data
    
    def create(self, validated_data):
        """Create task with current user"""
        validated_data['user'] = self.context['request'].user
        assigned_to = validated_data.pop('assigned_to', [])
        
        task = Task.objects.create(**validated_data)
        
        if assigned_to:
            task.assigned_to.set(assigned_to)
        
        return task


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for task listings"""
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    field_name = serializers.CharField(source='field.name', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    is_due_soon = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'category', 'priority', 'status', 'due_date',
            'farm', 'farm_name', 'field', 'field_name',
            'is_recurring', 'is_overdue', 'is_due_soon', 'created_at'
        ]


class TaskCompleteSerializer(serializers.Serializer):
    """Serializer for completing tasks"""
    completion_notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    
    def update(self, instance, validated_data):
        """Mark task as complete"""
        instance.mark_complete(
            user=self.context['request'].user,
            notes=validated_data.get('completion_notes', '')
        )
        return instance


class TaskTemplateSerializer(serializers.ModelSerializer):
    """Serializer for TaskTemplate model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TaskTemplate
        fields = [
            'id', 'user', 'user_name', 'name', 'description', 'category',
            'priority', 'estimated_duration', 'default_reminder_time',
            'is_public', 'tags', 'checklist', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'usage_count', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create template with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskFromTemplateSerializer(serializers.Serializer):
    """Serializer for creating tasks from templates"""
    template_id = serializers.UUIDField()
    due_date = serializers.DateTimeField()
    title = serializers.CharField(max_length=200, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    farm = serializers.UUIDField(required=False, allow_null=True)
    field = serializers.UUIDField(required=False, allow_null=True)
    priority = serializers.ChoiceField(choices=Task.PRIORITY_CHOICES, required=False)
    
    def validate_template_id(self, value):
        """Validate template exists"""
        try:
            template = TaskTemplate.objects.get(id=value)
            # Check if user has access to template
            user = self.context['request'].user
            if not template.is_public and template.user != user:
                raise serializers.ValidationError("You don't have access to this template")
            return value
        except TaskTemplate.DoesNotExist:
            raise serializers.ValidationError("Template not found")
    
    def validate_due_date(self, value):
        """Validate due date is not in the past"""
        if value < timezone.now():
            raise serializers.ValidationError("Due date cannot be in the past")
        return value
    
    def create(self, validated_data):
        """Create task from template"""
        template_id = validated_data.pop('template_id')
        template = TaskTemplate.objects.get(id=template_id)
        
        user = self.context['request'].user
        due_date = validated_data.pop('due_date')
        
        task = template.create_task_from_template(user, due_date, **validated_data)
        return task


class CropCalendarSerializer(serializers.ModelSerializer):
    """Serializer for CropCalendar model"""
    total_days_to_harvest = serializers.ReadOnlyField()
    
    class Meta:
        model = CropCalendar
        fields = [
            'id', 'crop_name', 'variety',
            'germination_days', 'vegetative_days', 'flowering_days',
            'fruiting_days', 'maturity_days', 'total_days_to_harvest',
            'planting_activities', 'growth_activities', 'harvest_activities',
            'optimal_planting_months', 'climate_zones',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GenerateTasksFromCalendarSerializer(serializers.Serializer):
    """Serializer for generating tasks from crop calendar"""
    crop_calendar_id = serializers.UUIDField()
    field_id = serializers.UUIDField()
    planting_date = serializers.DateTimeField()
    
    def validate_crop_calendar_id(self, value):
        """Validate crop calendar exists"""
        try:
            CropCalendar.objects.get(id=value, is_active=True)
            return value
        except CropCalendar.DoesNotExist:
            raise serializers.ValidationError("Crop calendar not found")
    
    def validate_field_id(self, value):
        """Validate field exists and user has access"""
        from farms.models import Field
        try:
            field = Field.objects.get(id=value)
            user = self.context['request'].user
            if field.farm.owner != user:
                raise serializers.ValidationError("You don't have access to this field")
            return value
        except Field.DoesNotExist:
            raise serializers.ValidationError("Field not found")
    
    def validate_planting_date(self, value):
        """Validate planting date"""
        if value < timezone.now():
            raise serializers.ValidationError("Planting date cannot be in the past")
        return value
    
    def create(self, validated_data):
        """Generate tasks from crop calendar"""
        from farms.models import Field
        
        crop_calendar = CropCalendar.objects.get(id=validated_data['crop_calendar_id'])
        field = Field.objects.get(id=validated_data['field_id'])
        user = self.context['request'].user
        planting_date = validated_data['planting_date']
        
        tasks = crop_calendar.generate_tasks_for_crop(user, field, planting_date)
        
        return {
            'tasks': tasks,
            'count': len(tasks),
            'crop': crop_calendar.crop_name,
            'field': field.name
        }
