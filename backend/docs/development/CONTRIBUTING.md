# Contributing to AgroBridge

Thank you for your interest in contributing to AgroBridge! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Documentation](#documentation)
7. [Pull Request Process](#pull-request-process)
8. [Review Process](#review-process)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for mistakes
- Prioritize the community's best interests

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Unprofessional conduct

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose
- Git
- PostgreSQL 14+
- Redis 7+
- RabbitMQ 3.11+

### Setting Up Development Environment

1. **Fork and Clone**

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/agrobridge.git
cd agrobridge

# Add upstream remote
git remote add upstream https://github.com/agrobridge/agrobridge.git
```

2. **Backend Setup**

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Copy environment file
cp .env.example .env

# Start infrastructure
docker-compose -f docker-compose.infrastructure.yml up -d

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

3. **Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

4. **Verify Setup**

```bash
# Backend health check
curl http://localhost:8000/health

# Frontend
# Open http://localhost:3000 in browser
```

## Development Workflow

### Branch Strategy

We use Git Flow:

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent production fixes
- `release/*`: Release preparation

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to your fork
git push origin feature/your-feature-name
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**

```bash
# Feature
git commit -m "feat(auth): add two-factor authentication"

# Bug fix
git commit -m "fix(marketplace): resolve product search issue"

# Documentation
git commit -m "docs(api): update authentication endpoints"

# Breaking change
git commit -m "feat(api)!: change authentication response format

BREAKING CHANGE: Authentication response now includes user object"
```

## Coding Standards

### Python Style Guide

We follow [PEP 8](https://pep8.org/) with some modifications:

**Formatting:**
- Line length: 100 characters
- Indentation: 4 spaces
- Use double quotes for strings
- Use trailing commas in multi-line structures

**Tools:**
```bash
# Format code
black backend/

# Sort imports
isort backend/

# Lint code
flake8 backend/
pylint backend/

# Type checking
mypy backend/
```

**Example:**

```python
"""Module docstring describing the module."""

from typing import List, Optional

from django.db import models
from django.contrib.auth.models import User


class Farm(models.Model):
    """Farm model representing a farm entity.
    
    Attributes:
        name: Farm name
        owner: Farm owner (User)
        location: Geographic location
        area: Farm area in hectares
    """
    
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    location = models.JSONField()
    area = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        """Meta options for Farm model."""
        
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "-created_at"]),
        ]
    
    def __str__(self) -> str:
        """Return string representation of farm."""
        return f"{self.name} ({self.owner.username})"
    
    def calculate_total_area(self) -> float:
        """Calculate total area of all fields.
        
        Returns:
            Total area in hectares
        """
        return sum(field.area for field in self.fields.all())
```

### JavaScript/TypeScript Style Guide

We follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript):

**Formatting:**
- Line length: 100 characters
- Indentation: 2 spaces
- Use single quotes for strings
- Use semicolons
- Use trailing commas

**Tools:**
```bash
# Format code
npm run format

# Lint code
npm run lint

# Type checking
npm run type-check
```

**Example:**

```typescript
/**
 * Farm interface representing a farm entity
 */
interface Farm {
  id: string;
  name: string;
  owner: User;
  location: Location;
  area: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Calculate total area of all fields
 * @param farm - Farm object
 * @returns Total area in hectares
 */
export const calculateTotalArea = (farm: Farm): number => {
  return farm.fields.reduce((total, field) => total + field.area, 0);
};

/**
 * Farm component
 */
export const FarmCard: React.FC<FarmCardProps> = ({ farm, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    onEdit(farm);
  }, [farm, onEdit]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{farm.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Area: {farm.area} hectares</p>
        <Button onClick={handleEdit}>Edit</Button>
      </CardContent>
    </Card>
  );
};
```

### Database Guidelines

**Naming Conventions:**
- Tables: Plural, snake_case (e.g., `user_profiles`)
- Columns: snake_case (e.g., `created_at`)
- Indexes: `idx_<table>_<columns>` (e.g., `idx_farms_owner_created`)
- Foreign keys: `fk_<table>_<column>` (e.g., `fk_farms_owner`)

**Best Practices:**
- Always add indexes for foreign keys
- Use appropriate field types
- Add database constraints
- Document complex queries
- Use transactions for related operations

**Example:**

```python
class Field(models.Model):
    """Field model representing a farm field."""
    
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="fields",
        db_index=True,
    )
    name = models.CharField(max_length=200, db_index=True)
    boundary = models.JSONField(help_text="GeoJSON boundary")
    area = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    
    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["farm", "name"]),
            models.Index(fields=["farm", "-area"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(area__gt=0),
                name="field_area_positive",
            ),
        ]
```

### API Design Guidelines

**RESTful Principles:**
- Use nouns for resources (e.g., `/farms`, not `/getFarms`)
- Use HTTP methods correctly (GET, POST, PUT, PATCH, DELETE)
- Use proper status codes
- Version your APIs (e.g., `/api/v1/`)
- Use pagination for lists
- Support filtering and sorting

**Example:**

```python
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend


class FarmViewSet(viewsets.ModelViewSet):
    """ViewSet for Farm model.
    
    Provides CRUD operations for farms.
    
    Endpoints:
        GET /api/v1/farms/ - List farms
        POST /api/v1/farms/ - Create farm
        GET /api/v1/farms/{id}/ - Retrieve farm
        PUT /api/v1/farms/{id}/ - Update farm
        PATCH /api/v1/farms/{id}/ - Partial update
        DELETE /api/v1/farms/{id}/ - Delete farm
        GET /api/v1/farms/{id}/statistics/ - Get farm statistics
    """
    
    queryset = Farm.objects.all()
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["owner", "area"]
    search_fields = ["name", "location"]
    ordering_fields = ["name", "area", "created_at"]
    
    def get_queryset(self):
        """Filter queryset to user's farms."""
        return self.queryset.filter(owner=self.request.user)
    
    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        """Get farm statistics.
        
        Returns:
            Farm statistics including total area, crop count, etc.
        """
        farm = self.get_object()
        stats = {
            "total_area": farm.calculate_total_area(),
            "field_count": farm.fields.count(),
            "crop_count": farm.crops.count(),
        }
        return Response(stats)
```

## Testing Guidelines

### Test Structure

```
backend/tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test fixtures
```

### Writing Tests

**Unit Tests:**

```python
from django.test import TestCase
from farms.models import Farm


class FarmModelTest(TestCase):
    """Test cases for Farm model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.farm = Farm.objects.create(
            name="Test Farm",
            owner=self.user,
            location={"lat": 5.6037, "lng": -0.1870},
            area=10.5,
        )
    
    def test_farm_creation(self):
        """Test farm is created correctly."""
        self.assertEqual(self.farm.name, "Test Farm")
        self.assertEqual(self.farm.owner, self.user)
        self.assertEqual(self.farm.area, 10.5)
    
    def test_farm_str_representation(self):
        """Test farm string representation."""
        expected = f"Test Farm ({self.user.username})"
        self.assertEqual(str(self.farm), expected)
    
    def test_calculate_total_area(self):
        """Test total area calculation."""
        # Create fields
        Field.objects.create(farm=self.farm, name="Field 1", area=5.0)
        Field.objects.create(farm=self.farm, name="Field 2", area=3.5)
        
        total_area = self.farm.calculate_total_area()
        self.assertEqual(total_area, 8.5)
```

**Integration Tests:**

```python
from rest_framework.test import APITestCase
from rest_framework import status


class FarmAPITest(APITestCase):
    """Test cases for Farm API."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_farm(self):
        """Test creating a farm via API."""
        data = {
            "name": "New Farm",
            "location": {"lat": 5.6037, "lng": -0.1870},
            "area": 15.0,
        }
        response = self.client.post("/api/v1/farms/", data, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Farm")
        self.assertEqual(Farm.objects.count(), 1)
    
    def test_list_farms(self):
        """Test listing farms via API."""
        Farm.objects.create(
            name="Farm 1",
            owner=self.user,
            location={"lat": 5.6037, "lng": -0.1870},
            area=10.0,
        )
        
        response = self.client.get("/api/v1/farms/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest backend/tests/unit/test_farms.py

# Run specific test
pytest backend/tests/unit/test_farms.py::FarmModelTest::test_farm_creation

# Run with coverage
pytest --cov=backend/ --cov-report=html

# Run integration tests
pytest backend/tests/integration/

# Run with specific markers
pytest -m "slow"
```

### Test Coverage

- Minimum coverage: 80%
- Critical paths: 90%
- New code: 100%

## Documentation

### Code Documentation

**Python:**
- Use docstrings for modules, classes, and functions
- Follow Google or NumPy docstring format
- Include type hints

**JavaScript/TypeScript:**
- Use JSDoc comments
- Document complex logic
- Include examples for public APIs

### API Documentation

- Document all endpoints
- Include request/response examples
- Document error codes
- Provide code examples

### Architecture Documentation

- Update architecture diagrams
- Document design decisions
- Explain complex systems
- Keep documentation up-to-date

## Pull Request Process

### Before Submitting

1. **Update your branch**

```bash
git checkout develop
git pull upstream develop
git checkout feature/your-feature
git rebase develop
```

2. **Run tests**

```bash
pytest
npm test
```

3. **Run linters**

```bash
black backend/
flake8 backend/
npm run lint
```

4. **Update documentation**

### Submitting Pull Request

1. **Push your changes**

```bash
git push origin feature/your-feature
```

2. **Create pull request on GitHub**

3. **Fill out PR template**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No new warnings
```

4. **Link related issues**

### PR Requirements

- All tests must pass
- Code coverage must meet threshold
- No merge conflicts
- At least one approval required
- All comments addressed

## Review Process

### For Authors

- Respond to feedback promptly
- Make requested changes
- Ask questions if unclear
- Be open to suggestions

### For Reviewers

- Review within 24-48 hours
- Be constructive and respectful
- Explain reasoning for changes
- Approve when satisfied

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] No security issues
- [ ] Performance is acceptable
- [ ] Error handling is proper

## Getting Help

### Resources

- **Documentation**: https://docs.agrobridge.com
- **API Reference**: https://api.agrobridge.com/docs
- **Discord**: https://discord.gg/agrobridge
- **Forum**: https://forum.agrobridge.com

### Asking Questions

- Check existing issues first
- Provide context and examples
- Include error messages
- Describe what you've tried

### Reporting Bugs

Use the bug report template:

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Python: [e.g., 3.11]
- Browser: [e.g., Chrome 120]
```

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Thank You!

Thank you for contributing to AgroBridge! Your efforts help make agriculture more accessible and efficient across Africa.
