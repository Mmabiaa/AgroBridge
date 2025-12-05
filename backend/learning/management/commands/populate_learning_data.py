"""
Management command to populate sample learning data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from decimal import Decimal
from learning.models import (
    CourseCategory, Course, Lesson, LessonResource, Enrollment,
    LessonProgress, Question, Answer
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate sample learning data for testing and development'

    def handle(self, *args, **options):
        self.stdout.write('Populating learning data...')

        # Create or get users
        instructor1, _ = User.objects.get_or_create(
            email='instructor1@agrobridge.com',
            defaults={
                'first_name': 'John',
                'last_name': 'Farmer',
                'is_active': True
            }
        )
        if _:
            instructor1.set_password('instructor123')
            instructor1.save()

        instructor2, _ = User.objects.get_or_create(
            email='instructor2@agrobridge.com',
            defaults={
                'first_name': 'Mary',
                'last_name': 'Agro',
                'is_active': True
            }
        )
        if _:
            instructor2.set_password('instructor123')
            instructor2.save()

        student1, _ = User.objects.get_or_create(
            email='student1@agrobridge.com',
            defaults={
                'first_name': 'Alice',
                'last_name': 'Student',
                'is_active': True
            }
        )
        if _:
            student1.set_password('student123')
            student1.save()

        student2, _ = User.objects.get_or_create(
            email='student2@agrobridge.com',
            defaults={
                'first_name': 'Bob',
                'last_name': 'Learner',
                'is_active': True
            }
        )
        if _:
            student2.set_password('student123')
            student2.save()

        self.stdout.write(self.style.SUCCESS('✓ Created users'))

        # Create categories
        categories_data = [
            {
                'name': 'Crop Management',
                'description': 'Learn about managing different types of crops',
                'icon': '🌾'
            },
            {
                'name': 'Soil Health',
                'description': 'Understanding and maintaining soil health',
                'icon': '🌱'
            },
            {
                'name': 'Pest Control',
                'description': 'Effective pest management strategies',
                'icon': '🐛'
            },
            {
                'name': 'Irrigation',
                'description': 'Water management and irrigation techniques',
                'icon': '💧'
            },
            {
                'name': 'Organic Farming',
                'description': 'Sustainable and organic farming practices',
                'icon': '🌿'
            },
            {
                'name': 'Farm Business',
                'description': 'Managing farm finances and business',
                'icon': '💼'
            }
        ]

        categories = {}
        for cat_data in categories_data:
            category, _ = CourseCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'icon': cat_data['icon']
                }
            )
            categories[cat_data['name']] = category

        self.stdout.write(self.style.SUCCESS('✓ Created categories'))

        # Create courses
        courses_data = [
            {
                'title': 'Introduction to Maize Farming',
                'category': 'Crop Management',
                'instructor': instructor1,
                'difficulty': 'beginner',
                'duration_hours': Decimal('8.0'),
                'description': 'Learn the fundamentals of maize cultivation, from seed selection to harvest.',
                'status': 'published'
            },
            {
                'title': 'Advanced Rice Cultivation',
                'category': 'Crop Management',
                'instructor': instructor1,
                'difficulty': 'advanced',
                'duration_hours': Decimal('12.5'),
                'description': 'Master advanced techniques for rice farming including water management and pest control.',
                'status': 'published'
            },
            {
                'title': 'Soil Testing and Analysis',
                'category': 'Soil Health',
                'instructor': instructor2,
                'difficulty': 'intermediate',
                'duration_hours': Decimal('6.0'),
                'description': 'Learn how to test and analyze soil for optimal crop production.',
                'status': 'published'
            },
            {
                'title': 'Integrated Pest Management',
                'category': 'Pest Control',
                'instructor': instructor2,
                'difficulty': 'intermediate',
                'duration_hours': Decimal('10.0'),
                'description': 'Comprehensive guide to managing pests using integrated approaches.',
                'status': 'published'
            },
            {
                'title': 'Drip Irrigation Systems',
                'category': 'Irrigation',
                'instructor': instructor1,
                'difficulty': 'beginner',
                'duration_hours': Decimal('5.0'),
                'description': 'Introduction to drip irrigation installation and maintenance.',
                'status': 'published'
            },
            {
                'title': 'Organic Certification Process',
                'category': 'Organic Farming',
                'instructor': instructor2,
                'difficulty': 'intermediate',
                'duration_hours': Decimal('7.0'),
                'description': 'Navigate the organic certification process for your farm.',
                'status': 'published'
            },
            {
                'title': 'Farm Financial Management',
                'category': 'Farm Business',
                'instructor': instructor1,
                'difficulty': 'beginner',
                'duration_hours': Decimal('9.0'),
                'description': 'Learn to manage farm finances, budgeting, and record keeping.',
                'status': 'published'
            }
        ]

        courses = []
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                title=course_data['title'],
                defaults={
                    'slug': slugify(course_data['title']),
                    'category': categories[course_data['category']],
                    'instructor': course_data['instructor'],
                    'difficulty': course_data['difficulty'],
                    'duration_hours': course_data['duration_hours'],
                    'description': course_data['description'],
                    'status': course_data['status']
                }
            )
            if created and course.status == 'published':
                course.publish()
            courses.append(course)

        self.stdout.write(self.style.SUCCESS('✓ Created courses'))

        # Create lessons for first course
        maize_course = courses[0]
        lessons_data = [
            {
                'title': 'Introduction to Maize',
                'content_type': 'video',
                'content': 'Overview of maize farming and its importance in agriculture.',
                'video_duration': 600,
                'order': 1,
                'is_free': True
            },
            {
                'title': 'Selecting the Right Maize Variety',
                'content_type': 'article',
                'content': 'Detailed guide on choosing maize varieties based on climate and soil conditions.',
                'order': 2,
                'is_free': True
            },
            {
                'title': 'Land Preparation',
                'content_type': 'video',
                'content': 'Step-by-step guide to preparing land for maize planting.',
                'video_duration': 900,
                'order': 3,
                'is_free': False
            },
            {
                'title': 'Planting Techniques',
                'content_type': 'video',
                'content': 'Best practices for planting maize seeds.',
                'video_duration': 720,
                'order': 4,
                'is_free': False
            },
            {
                'title': 'Fertilizer Application',
                'content_type': 'article',
                'content': 'Guide to fertilizer types and application schedules for maize.',
                'order': 5,
                'is_free': False
            },
            {
                'title': 'Weed Management',
                'content_type': 'video',
                'content': 'Effective weed control strategies for maize farms.',
                'video_duration': 540,
                'order': 6,
                'is_free': False
            },
            {
                'title': 'Harvesting and Storage',
                'content_type': 'video',
                'content': 'When and how to harvest maize, plus storage best practices.',
                'video_duration': 780,
                'order': 7,
                'is_free': False
            },
            {
                'title': 'Final Assessment',
                'content_type': 'quiz',
                'content': 'Test your knowledge of maize farming.',
                'order': 8,
                'is_free': False
            }
        ]

        for lesson_data in lessons_data:
            lesson, _ = Lesson.objects.get_or_create(
                course=maize_course,
                title=lesson_data['title'],
                defaults={
                    'slug': slugify(lesson_data['title']),
                    'content_type': lesson_data['content_type'],
                    'content': lesson_data['content'],
                    'video_duration': lesson_data.get('video_duration', 0),
                    'order': lesson_data['order'],
                    'is_free': lesson_data['is_free']
                }
            )

        self.stdout.write(self.style.SUCCESS('✓ Created lessons'))

        # Create enrollments
        enrollment1, _ = Enrollment.objects.get_or_create(
            user=student1,
            course=maize_course
        )

        enrollment2, _ = Enrollment.objects.get_or_create(
            user=student2,
            course=maize_course
        )

        enrollment3, _ = Enrollment.objects.get_or_create(
            user=student1,
            course=courses[2]  # Soil Testing course
        )

        self.stdout.write(self.style.SUCCESS('✓ Created enrollments'))

        # Create lesson progress for student1
        lessons = maize_course.lessons.all()[:3]
        for lesson in lessons:
            progress, _ = LessonProgress.objects.get_or_create(
                enrollment=enrollment1,
                lesson=lesson,
                defaults={
                    'is_completed': True,
                    'time_spent': 300
                }
            )

        self.stdout.write(self.style.SUCCESS('✓ Created lesson progress'))

        # Create questions
        question1, _ = Question.objects.get_or_create(
            course=maize_course,
            user=student1,
            title='What is the best time to plant maize?',
            defaults={
                'content': 'I am in Ghana and want to know the optimal planting season for maize.',
                'upvotes': 5,
                'views': 23
            }
        )

        question2, _ = Question.objects.get_or_create(
            course=maize_course,
            user=student2,
            title='How much fertilizer should I use?',
            defaults={
                'content': 'What is the recommended fertilizer amount per hectare for maize?',
                'upvotes': 3,
                'views': 15
            }
        )

        self.stdout.write(self.style.SUCCESS('✓ Created questions'))

        # Create answers
        answer1, _ = Answer.objects.get_or_create(
            question=question1,
            user=instructor1,
            defaults={
                'content': 'In Ghana, the best time to plant maize is at the beginning of the rainy season, typically between March and April for the major season, and August to September for the minor season.',
                'is_accepted': True,
                'is_expert_answer': True,
                'upvotes': 8
            }
        )

        answer2, _ = Answer.objects.get_or_create(
            question=question2,
            user=instructor1,
            defaults={
                'content': 'For maize, the recommended NPK fertilizer application is typically 250-300 kg per hectare, split into two applications: at planting and 4-6 weeks after planting.',
                'is_accepted': True,
                'is_expert_answer': True,
                'upvotes': 5
            }
        )

        self.stdout.write(self.style.SUCCESS('✓ Created answers'))

        # Update question status
        question1.is_answered = True
        question1.save()
        question2.is_answered = True
        question2.save()

        self.stdout.write(self.style.SUCCESS('\n✅ Successfully populated learning data!'))
        self.stdout.write(f'Created:')
        self.stdout.write(f'  - {CourseCategory.objects.count()} categories')
        self.stdout.write(f'  - {Course.objects.count()} courses')
        self.stdout.write(f'  - {Lesson.objects.count()} lessons')
        self.stdout.write(f'  - {Enrollment.objects.count()} enrollments')
        self.stdout.write(f'  - {Question.objects.count()} questions')
        self.stdout.write(f'  - {Answer.objects.count()} answers')
