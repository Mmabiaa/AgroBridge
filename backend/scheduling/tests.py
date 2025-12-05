"""
Tests for scheduling service
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta

from .models import Task, TaskTemplate, CropCalendar
from farms.models import Farm, Field

User = get_user_model()


class TaskModelTest(TestCase):
    """Test Task model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123',
            role='farmer'
        )
        
        self.farm = Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            location={'city': 'Accra', 'region': 'Greater Accra'},
            size_hectares=10.0,
            farm_type='crop',
            established_date=timezone.now().date()
        )
        
        self.field = Field.objects.create(
            farm=self.farm,
            name='Field 1',
            area_hectares=2.5,
            boundary_geojson={'type': 'Polygon', 'coordinates': [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]}
        )
    
    def test_create_task(self):
        """Test task creation"""
        due_date = timezone.now() + timedelta(days=7)
        
        task = Task.objects.create(
            user=self.user,
            farm=self.farm,
            field=self.field,
            title='Water crops',
            description='Water all crops in Field 1',
            category='watering',
            priority='high',
            due_date=due_date,
            estimated_duration=60
        )
        
        self.assertEqual(task.title, 'Water crops')
        self.assertEqual(task.user, self.user)
        self.assertEqual(task.status, 'pending')
        self.assertFalse(task.is_overdue)
    
    def test_task_overdue_status(self):
        """Test task overdue detection"""
        past_date = timezone.now() - timedelta(days=1)
        
        task = Task.objects.create(
            user=self.user,
            title='Overdue task',
            due_date=past_date
        )
        
        self.assertTrue(task.is_overdue)
    
    def test_task_due_soon(self):
        """Test task due soon detection"""
        soon_date = timezone.now() + timedelta(hours=12)
        
        task = Task.objects.create(
            user=self.user,
            title='Due soon task',
            due_date=soon_date
        )
        
        self.assertTrue(task.is_due_soon)
    
    def test_task_completion(self):
        """Test task completion"""
        task = Task.objects.create(
            user=self.user,
            title='Test task',
            due_date=timezone.now() + timedelta(days=1)
        )
        
        task.mark_complete(user=self.user, notes='Task completed successfully')
        
        self.assertEqual(task.status, 'completed')
        self.assertIsNotNone(task.completed_at)
        self.assertEqual(task.completed_by, self.user)
        self.assertEqual(task.completion_notes, 'Task completed successfully')
    
    def test_recurring_task_generation(self):
        """Test recurring task instance generation"""
        due_date = timezone.now() + timedelta(days=7)
        
        task = Task.objects.create(
            user=self.user,
            title='Weekly watering',
            due_date=due_date,
            is_recurring=True,
            recurrence_pattern='weekly',
            recurrence_interval=1
        )
        
        # Complete the task
        task.mark_complete(user=self.user)
        
        # Check if next instance was created
        next_tasks = Task.objects.filter(parent_task=task)
        self.assertEqual(next_tasks.count(), 1)
        
        next_task = next_tasks.first()
        self.assertEqual(next_task.title, task.title)
        self.assertGreater(next_task.due_date, task.due_date)


class TaskTemplateModelTest(TestCase):
    """Test TaskTemplate model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123'
        )
    
    def test_create_template(self):
        """Test template creation"""
        template = TaskTemplate.objects.create(
            user=self.user,
            name='Watering Template',
            description='Template for watering tasks',
            category='watering',
            priority='high',
            estimated_duration=60
        )
        
        self.assertEqual(template.name, 'Watering Template')
        self.assertEqual(template.usage_count, 0)
    
    def test_create_task_from_template(self):
        """Test creating task from template"""
        template = TaskTemplate.objects.create(
            user=self.user,
            name='Fertilizing Template',
            description='Apply fertilizer',
            category='fertilizing',
            priority='medium',
            estimated_duration=90
        )
        
        due_date = timezone.now() + timedelta(days=3)
        task = template.create_task_from_template(self.user, due_date)
        
        self.assertEqual(task.title, template.name)
        self.assertEqual(task.category, template.category)
        self.assertEqual(task.priority, template.priority)
        self.assertEqual(task.estimated_duration, template.estimated_duration)
        
        # Check usage count incremented
        template.refresh_from_db()
        self.assertEqual(template.usage_count, 1)


class CropCalendarModelTest(TestCase):
    """Test CropCalendar model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123'
        )
        
        self.farm = Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            size_hectares=5.0,
            farm_type='crop',
            established_date=timezone.now().date()
        )
        
        self.field = Field.objects.create(
            farm=self.farm,
            name='Field 1',
            area_hectares=1.0,
            boundary_geojson={'type': 'Polygon', 'coordinates': [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]}
        )
    
    def test_create_crop_calendar(self):
        """Test crop calendar creation"""
        calendar = CropCalendar.objects.create(
            crop_name='Tomato',
            variety='Roma',
            germination_days=7,
            vegetative_days=21,
            flowering_days=14,
            fruiting_days=21,
            maturity_days=7
        )
        
        self.assertEqual(calendar.crop_name, 'Tomato')
        self.assertEqual(calendar.total_days_to_harvest, 70)
    
    def test_generate_tasks_from_calendar(self):
        """Test task generation from crop calendar"""
        calendar = CropCalendar.objects.create(
            crop_name='Maize',
            germination_days=5,
            vegetative_days=35,
            flowering_days=14,
            fruiting_days=21,
            maturity_days=15,
            planting_activities=[
                {
                    'title': 'Plant seeds',
                    'description': 'Plant maize seeds',
                    'days_offset': 0,
                    'duration': 120,
                    'priority': 'high'
                }
            ],
            growth_activities=[
                {
                    'title': 'Apply fertilizer',
                    'description': 'Apply NPK fertilizer',
                    'days_offset': 21,
                    'duration': 60,
                    'priority': 'high',
                    'category': 'fertilizing'
                }
            ],
            harvest_activities=[
                {
                    'title': 'Harvest',
                    'description': 'Harvest maize',
                    'days_offset': 0,
                    'duration': 240,
                    'priority': 'high'
                }
            ]
        )
        
        planting_date = timezone.now()
        tasks = calendar.generate_tasks_for_crop(self.user, self.field, planting_date)
        
        self.assertGreater(len(tasks), 0)
        self.assertEqual(tasks[0].user, self.user)
        self.assertEqual(tasks[0].field, self.field)


class TaskAPITest(APITestCase):
    """Test Task API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123',
            role='farmer'
        )
        
        self.farm = Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            size_hectares=5.0,
            farm_type='crop',
            established_date=timezone.now().date()
        )
        
        self.field = Field.objects.create(
            farm=self.farm,
            name='Field 1',
            area_hectares=2.0,
            boundary_geojson={'type': 'Polygon', 'coordinates': [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]}
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_task(self):
        """Test task creation via API"""
        due_date = (timezone.now() + timedelta(days=7)).isoformat()
        
        data = {
            'title': 'Water crops',
            'description': 'Water all crops',
            'category': 'watering',
            'priority': 'high',
            'due_date': due_date,
            'farm': str(self.farm.id),
            'field': str(self.field.id),
            'estimated_duration': 60
        }
        
        url = reverse('task-list')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        
        task = Task.objects.first()
        self.assertEqual(task.title, 'Water crops')
        self.assertEqual(task.user, self.user)
    
    def test_list_tasks(self):
        """Test listing tasks"""
        Task.objects.create(
            user=self.user,
            title='Task 1',
            due_date=timezone.now() + timedelta(days=1)
        )
        Task.objects.create(
            user=self.user,
            title='Task 2',
            due_date=timezone.now() + timedelta(days=2)
        )
        
        url = reverse('task-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_complete_task(self):
        """Test completing a task"""
        task = Task.objects.create(
            user=self.user,
            title='Test task',
            due_date=timezone.now() + timedelta(days=1)
        )
        
        url = reverse('task-complete', kwargs={'pk': task.id})
        response = self.client.post(url, {'completion_notes': 'Done'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        task.refresh_from_db()
        self.assertEqual(task.status, 'completed')
        self.assertIsNotNone(task.completed_at)
    
    def test_get_upcoming_tasks(self):
        """Test getting upcoming tasks"""
        # Create tasks
        Task.objects.create(
            user=self.user,
            title='Soon',
            due_date=timezone.now() + timedelta(days=3)
        )
        Task.objects.create(
            user=self.user,
            title='Later',
            due_date=timezone.now() + timedelta(days=10)
        )
        
        url = reverse('task-upcoming')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return tasks within 7 days
        self.assertEqual(len(response.data), 1)
    
    def test_get_overdue_tasks(self):
        """Test getting overdue tasks"""
        Task.objects.create(
            user=self.user,
            title='Overdue',
            due_date=timezone.now() - timedelta(days=1)
        )
        Task.objects.create(
            user=self.user,
            title='Future',
            due_date=timezone.now() + timedelta(days=1)
        )
        
        url = reverse('task-overdue')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Overdue')
    
    def test_task_statistics(self):
        """Test task statistics endpoint"""
        Task.objects.create(
            user=self.user,
            title='Pending',
            status='pending',
            due_date=timezone.now() + timedelta(days=1)
        )
        Task.objects.create(
            user=self.user,
            title='Completed',
            status='completed',
            due_date=timezone.now() - timedelta(days=1),
            completed_at=timezone.now()
        )
        
        url = reverse('task-statistics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status_counts', response.data)
        self.assertIn('overdue_count', response.data)
        self.assertIn('completion_rate', response.data)


class TaskTemplateAPITest(APITestCase):
    """Test TaskTemplate API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_template(self):
        """Test template creation via API"""
        data = {
            'name': 'Watering Template',
            'description': 'Template for watering',
            'category': 'watering',
            'priority': 'high',
            'estimated_duration': 60
        }
        
        url = reverse('tasktemplate-list')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TaskTemplate.objects.count(), 1)
    
    def test_create_task_from_template(self):
        """Test creating task from template via API"""
        template = TaskTemplate.objects.create(
            user=self.user,
            name='Test Template',
            category='planting',
            priority='medium'
        )
        
        due_date = (timezone.now() + timedelta(days=5)).isoformat()
        
        url = reverse('tasktemplate-create-task', kwargs={'pk': template.id})
        response = self.client.post(url, {'due_date': due_date}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        
        task = Task.objects.first()
        self.assertEqual(task.title, template.name)


class CropCalendarAPITest(APITestCase):
    """Test CropCalendar API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123'
        )
        
        self.farm = Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            size_hectares=5.0,
            farm_type='crop',
            established_date=timezone.now().date()
        )
        
        self.field = Field.objects.create(
            farm=self.farm,
            name='Field 1',
            area_hectares=1.0,
            boundary_geojson={'type': 'Polygon', 'coordinates': [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]}
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_list_crop_calendars(self):
        """Test listing crop calendars"""
        CropCalendar.objects.create(
            crop_name='Tomato',
            germination_days=7,
            vegetative_days=21,
            flowering_days=14,
            fruiting_days=21,
            maturity_days=7
        )
        
        url = reverse('cropcalendar-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_generate_tasks_from_calendar(self):
        """Test generating tasks from crop calendar via API"""
        calendar = CropCalendar.objects.create(
            crop_name='Maize',
            germination_days=5,
            vegetative_days=35,
            flowering_days=14,
            fruiting_days=21,
            maturity_days=15,
            planting_activities=[
                {
                    'title': 'Plant seeds',
                    'days_offset': 0,
                    'duration': 120,
                    'priority': 'high'
                }
            ],
            growth_activities=[],
            harvest_activities=[]
        )
        
        planting_date = (timezone.now() + timedelta(days=1)).isoformat()
        
        url = reverse('cropcalendar-generate-tasks', kwargs={'pk': calendar.id})
        response = self.client.post(url, {
            'field_id': str(self.field.id),
            'planting_date': planting_date
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertGreater(response.data['count'], 0)
        self.assertGreater(Task.objects.count(), 0)


