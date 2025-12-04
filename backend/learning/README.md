# Learning Platform Service

The Learning Platform Service provides comprehensive educational features for the AgroBridge platform, enabling farmers to access courses, track progress, earn certificates, and engage with a Q&A community.

## Features

### Course Management (Task 11.2)
- Create and manage educational courses
- Support for multiple difficulty levels (beginner, intermediate, advanced)
- Course categorization and tagging
- Multi-language support
- Course prerequisites
- Publishing workflow (draft → published → archived)
- Instructor management

### Lesson Content Delivery (Task 11.3)
- Multiple content types:
  - Video lessons with progress tracking
  - Article-based content
  - Quizzes and assessments
  - Assignments
- Downloadable resources
- Content streaming support
- Lesson ordering and organization

### Course Enrollment (Task 11.4)
- Easy enrollment process
- Prerequisite validation
- Enrollment status tracking (active, completed, dropped)
- Multiple enrollments per user

### Progress Tracking (Task 11.5)
- Lesson completion tracking
- Video progress tracking
- Quiz scores and attempts
- Overall course progress percentage
- Time spent tracking
- Last accessed timestamps

### Certificate Generation (Task 11.6)
- Automatic certificate generation on course completion
- Unique certificate numbers (format: AGRO-YEAR-XXXXXXXX)
- Certificate verification system
- PDF certificate generation support
- Final score calculation
- Completion time tracking

### Content Recommendations (Task 11.7)
- Personalized course recommendations
- Interest-based suggestions
- Category-based recommendations
- Excludes already enrolled courses
- Considers user profile and location

### Q&A Forums (Task 11.8)
- Question posting and answering
- Expert answer designation
- Answer acceptance by question author or instructor
- Voting system for questions and answers
- Question pinning
- View count tracking
- Answer status tracking

## Models

### CourseCategory
- Organizes courses into categories
- Supports icons and descriptions

### Course
- Main course entity
- Includes metadata (difficulty, duration, language)
- Tracks enrollment and completion statistics
- Supports prerequisites
- Publishing workflow

### Lesson
- Individual lessons within courses
- Multiple content types
- Ordered sequence
- Free/premium designation

### LessonResource
- Downloadable resources for lessons
- File metadata tracking

### Enrollment
- Tracks user course enrollments
- Progress tracking
- Status management

### LessonProgress
- Detailed progress for each lesson
- Video position tracking
- Quiz scores and attempts

### Certificate
- Course completion certificates
- Unique certificate numbers
- Verification support

### CourseReview
- User reviews and ratings
- Moderation support
- Impacts course average rating

### Question & Answer
- Q&A forum functionality
- Voting and acceptance
- Expert designation

### UserInterest
- Tracks user interests for recommendations
- Interest scoring system

## API Endpoints

### Categories
- `GET /api/learning/categories/` - List all categories
- `POST /api/learning/categories/` - Create category (admin)
- `GET /api/learning/categories/{id}/` - Get category details
- `PUT /api/learning/categories/{id}/` - Update category (admin)
- `DELETE /api/learning/categories/{id}/` - Delete category (admin)

### Courses
- `GET /api/learning/courses/` - List courses (with filters)
- `POST /api/learning/courses/` - Create course (instructor)
- `GET /api/learning/courses/{id}/` - Get course details
- `PUT /api/learning/courses/{id}/` - Update course (instructor)
- `DELETE /api/learning/courses/{id}/` - Delete course (instructor)
- `POST /api/learning/courses/{id}/enroll/` - Enroll in course
- `POST /api/learning/courses/{id}/publish/` - Publish course (instructor)
- `GET /api/learning/courses/my_courses/` - Get instructor's courses
- `GET /api/learning/courses/enrolled/` - Get enrolled courses
- `GET /api/learning/courses/recommended/` - Get recommended courses

### Lessons
- `GET /api/learning/lessons/` - List lessons (filter by course)
- `POST /api/learning/lessons/` - Create lesson (instructor)
- `GET /api/learning/lessons/{id}/` - Get lesson details
- `PUT /api/learning/lessons/{id}/` - Update lesson (instructor)
- `DELETE /api/learning/lessons/{id}/` - Delete lesson (instructor)
- `POST /api/learning/lessons/{id}/complete/` - Mark lesson complete
- `POST /api/learning/lessons/{id}/update_progress/` - Update progress

### Enrollments
- `GET /api/learning/enrollments/` - List user's enrollments
- `GET /api/learning/enrollments/{id}/` - Get enrollment details
- `POST /api/learning/enrollments/{id}/drop/` - Drop course

### Certificates
- `GET /api/learning/certificates/` - List user's certificates
- `GET /api/learning/certificates/{id}/` - Get certificate details
- `GET /api/learning/certificates/{id}/verify/` - Verify certificate

### Reviews
- `GET /api/learning/reviews/` - List reviews (filter by course)
- `POST /api/learning/reviews/` - Create review
- `GET /api/learning/reviews/{id}/` - Get review details
- `PUT /api/learning/reviews/{id}/` - Update review
- `DELETE /api/learning/reviews/{id}/` - Delete review

### Questions
- `GET /api/learning/questions/` - List questions (filter by course/lesson)
- `POST /api/learning/questions/` - Create question
- `GET /api/learning/questions/{id}/` - Get question details
- `PUT /api/learning/questions/{id}/` - Update question
- `DELETE /api/learning/questions/{id}/` - Delete question
- `POST /api/learning/questions/{id}/upvote/` - Upvote question

### Answers
- `GET /api/learning/answers/` - List answers (filter by question)
- `POST /api/learning/answers/` - Create answer
- `GET /api/learning/answers/{id}/` - Get answer details
- `PUT /api/learning/answers/{id}/` - Update answer
- `DELETE /api/learning/answers/{id}/` - Delete answer
- `POST /api/learning/answers/{id}/upvote/` - Upvote answer
- `POST /api/learning/answers/{id}/accept/` - Accept answer

## Filters

### Course Filters
- `category` - Filter by category ID
- `difficulty` - Filter by difficulty level
- `language` - Filter by language
- `min_rating` - Minimum average rating
- `max_duration` - Maximum duration in hours
- `status` - Filter by status (published, draft, archived)

## Permissions

### IsInstructorOrReadOnly
- Allows read access to all
- Write access only to course instructor or staff

### IsEnrolledOrInstructor
- Allows access to enrolled users or course instructor
- Staff have full access

### IsOwnerOrReadOnly
- Allows read access to all
- Write access only to object owner or staff

## Signals

### Certificate Generation
- Automatically creates certificate when enrollment is completed
- Calculates final score from lesson scores
- Tracks completion time

### Course Rating Updates
- Updates course average rating when reviews are created/updated
- Only considers approved reviews

### User Interest Tracking
- Updates user interests based on enrollments
- Increases interest score for enrolled categories

### Time Tracking
- Updates total time spent in enrollment from lesson progress

## Service Registration

The service automatically registers with Consul in production/staging environments:
- Service name: `learning-service`
- Health check endpoint: `/health/`
- Tags: learning, education, courses, django

## Testing

Run tests with:
```bash
python manage.py test learning
```

Test coverage includes:
- Model tests for all entities
- API endpoint tests
- Enrollment workflow tests
- Progress tracking tests
- Certificate generation tests
- Q&A functionality tests

## Management Commands

### Populate Sample Data
```bash
python manage.py populate_learning_data
```

Creates sample:
- Course categories
- Courses with lessons
- Enrollments
- Questions and answers

## Requirements Met

- ✅ 9.1 - Course management with categorization and metadata
- ✅ 9.2 - Multiple content types (video, article, quiz, assignment)
- ✅ 9.3 - Enrollment and progress tracking
- ✅ 9.4 - Certificate generation with unique IDs
- ✅ 9.5 - Content recommendations based on interests
- ✅ 9.6 - Q&A forums with voting and expert answers
- ✅ 30.1 - Comprehensive unit tests
- ✅ 30.3 - Test coverage for all features

## Integration Points

- **User Service**: User profiles and authentication
- **Notification Service**: Course updates, new answers, certificates
- **File Storage Service**: Video content, resources, certificates
- **Analytics Service**: Course performance, user engagement

## Future Enhancements

- Live streaming support
- Interactive quizzes with immediate feedback
- Peer review assignments
- Course bundles and learning paths
- Gamification (badges, leaderboards)
- Discussion forums per lesson
- Collaborative learning features
