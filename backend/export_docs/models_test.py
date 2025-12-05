"""Test models file."""

from django.db import models

class TestModel(models.Model):
    name = models.CharField(max_length=100)
    
    class Meta:
        app_label = 'export_docs'
