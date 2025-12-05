from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from .models import (
    CourseCategory, Course, Lesson, LessonResource, Enrollment,
    LessonProgress, Certificate, CourseReview, Question, Answer, UserInterest
)

User = get_user_model()


class CourseCategoryModelTest(TestCase):
    """Test CourseCategory model"""
    
    def setUp(self):
        self.category = CourseCategory.objects.create(
            name="Crop Management",
            description="Learn about crop management techniques"
        )
    
    def test_category_creation(self):
        """Test category is created correctly"""
        self.assertEqual(self.category.name, "Crop Management")
        self.assertIsNotNone(self.category.created_at)
    
    def test_category_str(self):
        """Test category string representation"""
        self.assertEqual(str(self.category), "Crop Management")


class CourseModelTest(TestCase):
    """Test Course model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='instructor@test.com',
            password='testpass123'
        )
        self.category = CourseCategory.objects.create(name="Farming")
        self.course = Course.objects.create(
            title="Introduction to Farming",
            slug="intro-farming",
            description="Learn the basics of farming",
            category=self.category,
            instructor=self.user,
            difficulty='beginner',
            duration_hours=Decimal('10.5')
        )
    
    def test_course_creation(self):
        """Test course is created correctly"""
        self.assertEqual(self.course.title, "Introduction to Farming")
        self.assertEqual(self.course.status, 'draft')
        self.assertEqual(self.course.enrollment_count, 0)
    
    def test_course_publish(self):
        """Test course publishing"""
        self.assertIsNone(self.course.published_at)
        self.course.publish()
        self.assertEqual(self.course.status, 'published')
        self.assertIsNotNone(self.course.published_at)


class EnrollmentModelTest(TestCase):
    """Test Enrollment model"""
    
    def setUp(self):
        self.instructor = User.objects.create_user(
            email='instructor@test.com',
            password='testpass123'
        )
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123'
        )
        self.category = CourseCategory.objects.create(name="Farming")
        self.course = Course.objects.create(
            title="Test Course",
            slug="test-course",
            description="Test",
            category=self.category,
            instructor=self.instructor,
            difficulty='beginner',
            duration_hours=Decimal('5.0')
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            course=self.course
        )
    
    def test_enrollment_creation(self):
        """Test enrollment is created correctly"""
        self.assertEqual(self.enrollment.status, 'active')
        self.assertEqual(self.enrollment.progress_percentage, 0)
    
    def test_mark_completed(self):
        """Test marking enrollment as completed"""
        self.enrollment.mark_completed()
        self.assertEqual(self.enrollment.status, 'completed')
        self.assertEqual(self.enrollment.progress_percentage, 100)
        self.assertIsNotNone(self.enrollment.completed_at)


class LessonProgressModelTest(TestCase):
    """Test LessonProgress model"""
    
    def setUp(self):
        self.instructor = User.objects.create_user(
            email='instructor@test.com',
            password='testpass123'
        )
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123'
        )
        self.category = CourseCategory.objects.create(name="Farming")
        self.course = Course.objects.create(
            title="Test Course",
            slug="test-course",
            description="Test",
            category=self.category,
            instructor=self.instructor,
            difficulty='beginner',
            duration_hours=Decimal('5.0')
        )
        self.lesson = Lesson.objects.create(
            course=self.course,
            title="Lesson 1",
            slug="lesson-1",
            content_type='video',
            content="Test content",
            order=1
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            course=self.course
        )
        self.progress = LessonProgress.objects.create(
            enrollment=self.enrollment,
            lesson=self.lesson
        )
    
    def test_progress_creation(self):
        """Test lesson progress is created correctly"""
        self.assertFalse(self.progress.is_completed)
        self.assertEqual(self.progress.time_spent, 0)
    
    def test_mark_completed(self):
        """Test marking lesson as completed"""
        self.progress.mark_completed()
        self.assertTrue(self.progress.is_completed)
        self.assertIsNotNone(self.progress.completed_at)


class CertificateModelTest(TestCase):
    """Test Certificate model"""
    
    def setUp(self):
        self.instructor = User.objects.create_user(
            email='instructor@test.com',
            password='testpass123'
        )
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123'
        )
        self.category = CourseCategory.objects.create(name="Farming")
        self.course = Course.objects.create(
            title="Test Course",
            slug="test-course",
            description="Test",
            category=self.category,
            instructor=self.instructor,
            difficulty='beginner',
            duration_hours=Decimal('5.0')
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            course=self.course,
            status='completed'
        )
        self.certificate = Certificate.objects.create(
            enrollment=self.enrollment
        )
    
    def test_certificate_creation(self):
        """Test certificate is created with unique number"""
        self.assertIsNotNone(self.certificate.certificate_number)
        self.assertTrue(self.certificate.certificate_number.startswith('AGRO-'))


class CourseAPITest(APITestCase):
    """Test Course API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email='instructor@test.com',
            password='testpass123'
        )
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123'
        )
        self.category = CourseCategory.objects.create(name="Farming")
        self.course = Course.objects.create(
            title="Test Course",
            slug="test-course",
            description="Test description",
            category=self.category,
            instructor=self.instructor,
            difficulty='beginner',
            duration_hours=Decimal('5.0'),
            status='published'
        )
    
    def test_list_courses(self):
        """Test listing courses"""
        response = self.client.get('/api/learning/courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_retrieve_course(self):
        """Test retrieving a single course"""
        response = self.client.get(f'/api/learning/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Course')
    
    def test_enroll_in_course(self):
        """Test enrolling in a course"""
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f'/api/learning/courses/{self.course.id}/enroll/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Enrollment.objects.filter(user=self.student, course=self.course).exists())
    
    def test_enroll_twice_fails(self):
        """Test enrolling twice in same course fails"""
        self.client.force_authenticate(user=self.student)
        self.client.post(f'/api/learning/courses/{self.course.id}/enroll/')
        response = self.client.post(f'/api/learning/courses/{self.course.id}/enroll/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_publish_course(self):
        """Test publishing a course"""
        draft_course = Course.objects.create(
            title="Draft Course",
            slug="draft-course",
            description="Test",
            category=self.category,
            instructor=self.instructor,
            difficulty='beginner',
            duration_hours=Decimal('5.0'),
            status='draft'
        )
        Lesson.objects.create(
            course=draft_course,
            title="Lesson 1",
            slug="lesson-1",
            content_type='video',
            content="Test",
            order=1
        )
        
        self.client.force_authenticate(user=self.instructor)
        response = self.client.post(f'/api/learning/courses/{draft_course.id}/publish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        draft_course.refresh_from_db()
        self.assertEqual(draft_course.status, 'published')


class EnrollmentAPITest(APITestCase):
    """Test Enrollment API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email='instructor@test.com',
            password='testpass123'
        )
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123'
        )
        self.category = CourseCategory.objects.create(name="Farming")
        self.course = Course.objects.create(
            title="Test Course",
            slug="test-course",
            description="Test",
            category=self.category,
            instructor=self.instructor,
            difficulty='beginner',
            duration_hours=Decimal('5.0'),
            status='published'
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            course=self.course
        )
    
    def test_list_enrollments(self):
        """Test listing user's enrollments"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/learning/enrollments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_drop_course(self):
        """Test dropping a course"""
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f'/api/learning/enrollments/{self.enrollment.id}/drop/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, 'dropped')


class QuestionAnswerAPITest(APITestCase):
    """Test Q&A API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email='instructor@test.com',
            password='testpass123'
        )
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123'
        )
        self.category = CourseCategory.objects.create(name="Farming")
        self.course = Course.objects.create(
            title="Test Course",
            slug="test-course",
            description="Test",
            category=self.category,
            instructor=self.instructor,
            difficulty='beginner',
            duration_hours=Decimal('5.0'),
            status='published'
        )
        self.question = Question.objects.create(
            course=self.course,
            user=self.student,
            title="How to plant?",
            content="I need help with planting"
        )
    
    def test_create_question(self):
        """Test creating a question"""
        self.client.force_authenticate(user=self.student)
        data = {
            'course': str(self.course.id),
            'title': 'New Question',
            'content': 'Question content'
        }
        response = self.client.post('/api/learning/questions/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_create_answer(self):
        """Test creating an answer"""
        self.client.force_authenticate(user=self.instructor)
        data = {
            'question': str(self.question.id),
            'content': 'Here is the answer'
        }
        response = self.client.post('/api/learning/answers/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_accept_answer(self):
        """Test accepting an answer"""
        answer = Answer.objects.create(
            question=self.question,
            user=self.instructor,
            content="Answer content"
        )
        
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f'/api/learning/answers/{answer.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        answer.refresh_from_db()
        self.assertTrue(answer.is_accepted)
        self.question.refresh_from_db()
        self.assertTrue(self.question.is_answered)
