"""
Pytest configuration and shared fixtures for AgroBridge testing.
"""
import os
import pytest
import django
from django.conf import settings
from django.test import Client
from rest_framework.test import APIClient
from faker import Faker

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

fake = Faker()


@pytest.fixture(scope='session')
def django_db_setup():
    """Set up test database configuration."""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('TEST_DB_NAME', 'test_agrobridge'),
        'USER': os.getenv('TEST_DB_USER', 'test'),
        'PASSWORD': os.getenv('TEST_DB_PASSWORD', 'test'),
        'HOST': os.getenv('TEST_DB_HOST', 'localhost'),
        'PORT': os.getenv('TEST_DB_PORT', '5432'),
    }


@pytest.fixture
def api_client():
    """Provide DRF API client for testing."""
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, test_user):
    """Provide authenticated API client."""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(test_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def test_user(db):
    """Create a test user."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    user = User.objects.create_user(
        username=fake.user_name(),
        email=fake.email(),
        password='testpass123',
        first_name=fake.first_name(),
        last_name=fake.last_name()
    )
    return user


@pytest.fixture
def test_farmer(db):
    """Create a test farmer user."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    user = User.objects.create_user(
        username=f'farmer_{fake.user_name()}',
        email=fake.email(),
        password='testpass123',
        role='farmer'
    )
    return user


@pytest.fixture
def test_buyer(db):
    """Create a test buyer user."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    user = User.objects.create_user(
        username=f'buyer_{fake.user_name()}',
        email=fake.email(),
        password='testpass123',
        role='buyer'
    )
    return user


@pytest.fixture
def test_admin(db):
    """Create a test admin user."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    user = User.objects.create_superuser(
        username='admin',
        email='admin@test.com',
        password='adminpass123'
    )
    return user


@pytest.fixture
def mock_redis(monkeypatch):
    """Mock Redis for testing."""
    from unittest.mock import MagicMock
    mock = MagicMock()
    monkeypatch.setattr('redis.Redis', lambda **kwargs: mock)
    return mock


@pytest.fixture
def mock_celery(monkeypatch):
    """Mock Celery for testing."""
    from unittest.mock import MagicMock
    mock = MagicMock()
    monkeypatch.setattr('celery.app.task.Task.apply_async', mock)
    return mock


@pytest.fixture
def mock_rabbitmq(monkeypatch):
    """Mock RabbitMQ for testing."""
    from unittest.mock import MagicMock
    mock = MagicMock()
    return mock
