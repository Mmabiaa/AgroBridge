# Scheduling Service

The Scheduling Service provides comprehensive task management, recurring tasks, reminders, and smart scheduling for agricultural activities in the AgroBridge platform.

## Features

### Task Management (Requirement 11.1, 11.4)
- Create, update, and delete agricultural tasks
- Categorize tasks (planting, watering, fertilizing, pest control, etc.)
- Set priority levels (low, medium, high, urgent)
- Track task status (pending, in progress, completed, cancelled, overdue)
- Assign tasks to multiple users
- Add attachments and tags to tasks
- Link tasks to specific farms and fields

### Recurring Tasks (Requirement 11.3)
- Support for daily, weekly, bi-weekly, monthly, and seasonal recurrence
- Custom recurrence intervals
- Automatic generation of next task instance upon completion
- Set recurrence end dates
- Parent-child relationship tracking for recurring tasks

### Task Reminders (Requirement 11.2, 11.7)
- Configurable reminder times (minutes before due date)
- Automatic reminder notifications
- Integration with notification service
- Escalation for overdue tasks

### Smart Scheduling (Requirement 11.5)
- Suggest optimal task timing based on crop growth stages
- Consider weather forecasts (integration ready)
- Align with crop calendars
- Detect and flag overdue tasks
- Identify tasks due soon (within 24 hours)

### Crop Calendar Integration (Requirement 11.6)
- Pre-defined crop calendars with growth stages
- Automatic task generation based on planting date
- Crop-specific activity recommendations
- Seasonal planting suggestions
- Support for multiple crop varieties

### Task Templates
- Reusable task templates for common activities
- Public and private templates
- Usage tracking
- Quick task creation from templates

## API Endpoints

### Tasks
- `GET /api/v1/scheduling/tasks/` - List all tasks
- `POST /api/v1/scheduling/tasks/` - Create a new task
- `GET /api/v1/scheduling/tasks/{id}/` - Get task details
- `PUT /api/v1/scheduling/tasks/{id}/` - Update task
- `DELETE /api/v1/scheduling/tasks/{id}/` - Delete task
- `POST /api/v1/scheduling/tasks/{id}/complete/` - Mark task as complete
- `POST /api/v1/scheduling/tasks/{id}/reopen/` - Reopen completed/cancelled task
- `GET /api/v1/scheduling/tasks/upcoming/` - Get upcoming tasks (next 7 days)
- `GET /api/v1/scheduling/tasks/overdue/` - Get overdue tasks
- `GET /api/v1/scheduling/tasks/today/` - Get tasks due today
- `GET /api/v1/scheduling/tasks/statistics/` - Get task statistics
- `GET /api/v1/scheduling/tasks/by_category/` - Get tasks grouped by category

### Task Templates
- `GET /api/v1/scheduling/templates/` - List all templates
- `POST /api/v1/scheduling/templates/` - Create a new template
- `GET /api/v1/scheduling/templates/{id}/` - Get template details
- `PUT /api/v1/scheduling/templates/{id}/` - Update template
- `DELETE /api/v1/scheduling/templates/{id}/` - Delete template
- `POST /api/v1/scheduling/templates/{id}/create_task/` - Create task from template
- `GET /api/v1/scheduling/templates/popular/` - Get most popular templates

### Crop Calendars
- `GET /api/v1/scheduling/crop-calendars/` - List all crop calendars
- `GET /api/v1/scheduling/crop-calendars/{id}/` - Get calendar details
- `POST /api/v1/scheduling/crop-calendars/{id}/generate_tasks/` - Generate tasks from calendar
- `GET /api/v1/scheduling/crop-calendars/by_season/` - Get calendars for current season

## Models

### Task
- **id**: UUID (Primary Key)
- **user**: ForeignKey to User (task owner)
- **farm**: ForeignKey to Farm (optional)
- **field**: ForeignKey to Field (optional)
- **title**: CharField (max 200)
- **description**: TextField
- **category**: CharField (choices: planting, watering, fertilizing, etc.)
- **priority**: CharField (choices: low, medium, high, urgent)
- **status**: CharField (choices: pending, in_progress, completed, cancelled, overdue)
- **due_date**: DateTimeField
- **estimated_duration**: IntegerField (minutes)
- **is_recurring**: BooleanField
- **recurrence_pattern**: CharField (choices: none, daily, weekly, monthly, etc.)
- **recurrence_interval**: IntegerField
- **recurrence_end_date**: DateTimeField (optional)
- **parent_task**: ForeignKey to self (for recurring tasks)
- **completed_at**: DateTimeField (optional)
- **completed_by**: ForeignKey to User (optional)
- **completion_notes**: TextField
- **reminder_enabled**: BooleanField
- **reminder_time**: IntegerField (minutes before due date)
- **reminder_sent**: BooleanField
- **tags**: JSONField
- **attachments**: JSONField
- **assigned_to**: ManyToManyField to User

### TaskTemplate
- **id**: UUID (Primary Key)
- **user**: ForeignKey to User (template owner)
- **name**: CharField (max 200)
- **description**: TextField
- **category**: CharField
- **priority**: CharField
- **estimated_duration**: IntegerField (minutes)
- **default_reminder_time**: IntegerField
- **is_public**: BooleanField
- **tags**: JSONField
- **checklist**: JSONField
- **usage_count**: IntegerField

### CropCalendar
- **id**: UUID (Primary Key)
- **crop_name**: CharField (max 100)
- **variety**: CharField (max 100)
- **germination_days**: IntegerField
- **vegetative_days**: IntegerField
- **flowering_days**: IntegerField
- **fruiting_days**: IntegerField
- **maturity_days**: IntegerField
- **planting_activities**: JSONField
- **growth_activities**: JSONField
- **harvest_activities**: JSONField
- **optimal_planting_months**: JSONField (list of month numbers)
- **climate_zones**: JSONField
- **is_active**: BooleanField

## Filters

### Task Filters
- `status` - Filter by task status
- `priority` - Filter by priority level
- `category` - Filter by task category
- `farm` - Filter by farm ID
- `field` - Filter by field ID
- `due_date_after` - Tasks due after date
- `due_date_before` - Tasks due before date
- `is_recurring` - Filter recurring tasks
- `is_overdue` - Filter overdue tasks
- `is_due_soon` - Filter tasks due within 24 hours
- `assigned_to_me` - Filter tasks assigned to current user

## Management Commands

### Send Task Reminders
```bash
python manage.py send_task_reminders
```
Sends reminder notifications for tasks that are due soon. Should be run periodically (e.g., via cron job).

Options:
- `--dry-run` - Run without actually sending reminders

### Populate Crop Calendars
```bash
python manage.py populate_crop_calendars
```
Populates the database with sample crop calendars for common crops (tomato, maize, cassava, rice).

## Permissions

### IsTaskOwnerOrAssigned
- Task owners have full access (read, write, delete)
- Assigned users can view and update tasks (but not delete)
- Staff users have full access to all tasks

### IsTemplateOwner
- All authenticated users can view public templates
- Template owners can edit their own templates
- Staff users have full access to all templates

## Integration with Other Services

### Notification Service
- Sends notifications when tasks are created
- Sends notifications when tasks are assigned
- Sends reminder notifications before due date
- Sends notifications when tasks are completed

### Farm Service
- Links tasks to specific farms and fields
- Validates farm and field ownership

### User Service
- Assigns tasks to users
- Tracks task completion by users

## Usage Examples

### Create a Simple Task
```python
POST /api/v1/scheduling/tasks/
{
    "title": "Water tomato plants",
    "description": "Water all tomato plants in Field 1",
    "category": "watering",
    "priority": "high",
    "due_date": "2024-12-10T08:00:00Z",
    "estimated_duration": 60,
    "farm": "farm-uuid",
    "field": "field-uuid"
}
```

### Create a Recurring Task
```python
POST /api/v1/scheduling/tasks/
{
    "title": "Weekly weeding",
    "category": "weeding",
    "priority": "medium",
    "due_date": "2024-12-10T10:00:00Z",
    "is_recurring": true,
    "recurrence_pattern": "weekly",
    "recurrence_interval": 1,
    "recurrence_end_date": "2025-03-10T10:00:00Z"
}
```

### Generate Tasks from Crop Calendar
```python
POST /api/v1/scheduling/crop-calendars/{calendar-id}/generate_tasks/
{
    "field_id": "field-uuid",
    "planting_date": "2024-12-15T00:00:00Z"
}
```

### Create Task from Template
```python
POST /api/v1/scheduling/templates/{template-id}/create_task/
{
    "due_date": "2024-12-12T09:00:00Z",
    "farm": "farm-uuid",
    "field": "field-uuid"
}
```

## Testing

Run tests with:
```bash
python manage.py test scheduling
```

Test coverage includes:
- Task CRUD operations
- Recurring task generation
- Task completion workflow
- Template creation and usage
- Crop calendar task generation
- API endpoint functionality
- Permission checks

## Service Registration

The scheduling service automatically registers with Consul for service discovery:
- Service name: `scheduling-service`
- Health check endpoint: `/health/`
- Tags: `scheduling`, `tasks`, `calendar`, `django`

## Future Enhancements

1. **Weather Integration** - Adjust task scheduling based on weather forecasts
2. **AI-Powered Scheduling** - Use machine learning to optimize task timing
3. **Resource Allocation** - Track and allocate resources (equipment, labor) to tasks
4. **Task Dependencies** - Define task dependencies and prerequisites
5. **Mobile Offline Support** - Sync tasks when device comes online
6. **Voice Task Creation** - Create tasks via voice commands
7. **Task Analytics** - Detailed analytics on task completion rates and patterns
8. **Collaborative Tasks** - Real-time collaboration on shared tasks
9. **Task Automation** - Trigger tasks automatically based on IoT sensor data
10. **Integration with Calendar Apps** - Sync with Google Calendar, Outlook, etc.
