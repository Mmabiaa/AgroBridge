"""
Create a test admin user for comprehensive testing.
"""
import os
import sys
import django

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create or get admin user
username = 'testadmin'
email = 'testadmin@example.com'
password = 'AdminPass123!'

if User.objects.filter(username=username).exists():
    print(f"Admin user '{username}' already exists")
    user = User.objects.get(username=username)
    # Update password in case it changed
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f"Admin user '{username}' updated")
else:
    user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    print(f"Admin user '{username}' created successfully")

print(f"Username: {username}")
print(f"Password: {password}")
print(f"Is staff: {user.is_staff}")
print(f"Is superuser: {user.is_superuser}")
