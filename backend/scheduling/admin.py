"""
Admin configuration for scheduling service
"""
from django.contrib import admin
from .models import Task, TaskTemplate, CropCalendar


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin interface for Task model"""
    list_display = [
        'title', 'user', 'category', 'priority', 'status',
        'due_date', 'is_recurring', 'is_overdue', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'category', 'is_recurring',
        'recurrence_pattern', 'created_at', 'due_date'
    ]
    search_fields = ['title', 'description', 'user__username', 'tags']
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'completed_at',
        'is_overdue', 'days_until_due', 'is_due_soon'
    ]
    filter_horizontal = ['assigned_to']
    date_hierarchy = 'due_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'title', 'description', 'category', 'priority', 'status')
        }),
        ('Farm & Field', {
            'fields': ('farm', 'field')
        }),
        ('Scheduling', {
            'fields': ('due_date', 'estimated_duration', 'is_overdue', 'days_until_due', 'is_due_soon')
        }),
        ('Recurrence', {
            'fields': (
                'is_recurring', 'recurrence_pattern', 'recurrence_interval',
                'recurrence_end_date', 'parent_task'
            ),
            'classes': ('collapse',)
        }),
        ('Completion', {
            'fields': ('completed_at', 'completed_by', 'completion_notes'),
            'classes': ('collapse',)
        }),
        ('Reminders', {
            'fields': ('reminder_enabled', 'reminder_time', 'reminder_sent'),
            'classes': ('collapse',)
        }),
        ('Additional', {
            'fields': ('tags', 'attachments', 'assigned_to'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_overdue(self, obj):
        """Display overdue status"""
        return obj.is_overdue
    is_overdue.boolean = True
    is_overdue.short_description = 'Overdue'


@admin.register(TaskTemplate)
class TaskTemplateAdmin(admin.ModelAdmin):
    """Admin interface for TaskTemplate model"""
    list_display = [
        'name', 'user', 'category', 'priority',
        'is_public', 'usage_count', 'created_at'
    ]
    list_filter = ['category', 'priority', 'is_public', 'created_at']
    search_fields = ['name', 'description', 'user__username', 'tags']
    readonly_fields = ['id', 'usage_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'name', 'description', 'category', 'priority')
        }),
        ('Defaults', {
            'fields': ('estimated_duration', 'default_reminder_time')
        }),
        ('Visibility', {
            'fields': ('is_public',)
        }),
        ('Additional', {
            'fields': ('tags', 'checklist'),
            'classes': ('collapse',)
        }),
        ('Usage', {
            'fields': ('usage_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CropCalendar)
class CropCalendarAdmin(admin.ModelAdmin):
    """Admin interface for CropCalendar model"""
    list_display = [
        'crop_name', 'variety', 'total_days_to_harvest',
        'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['crop_name', 'variety', 'climate_zones']
    readonly_fields = ['id', 'total_days_to_harvest', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'crop_name', 'variety', 'is_active')
        }),
        ('Growth Stages (Days)', {
            'fields': (
                'germination_days', 'vegetative_days', 'flowering_days',
                'fruiting_days', 'maturity_days', 'total_days_to_harvest'
            )
        }),
        ('Activities', {
            'fields': ('planting_activities', 'growth_activities', 'harvest_activities'),
            'classes': ('collapse',)
        }),
        ('Climate & Season', {
            'fields': ('optimal_planting_months', 'climate_zones'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
