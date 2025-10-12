from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('farmer', 'Farmer'),
        ('buyer', 'Buyer'),
        ('expert', 'Agricultural Expert'),
        ('admin', 'Administrator'),
    ]
    
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='farmer')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.role})"