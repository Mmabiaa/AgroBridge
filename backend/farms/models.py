from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
import uuid

User = get_user_model()


class Farm(models.Model):
    """
    Farm model representing a user's farm
    """
    FARM_TYPE_CHOICES = [
        ('crop', 'Crop Farming'),
        ('livestock', 'Livestock Farming'),
        ('poultry', 'Poultry Farming'),
        ('mixed', 'Mixed Farming'),
        ('organic', 'Organic Farming'),
        ('greenhouse', 'Greenhouse Farming'),
        ('aquaculture', 'Aquaculture'),
    ]
    
    CERTIFICATION_CHOICES = [
        ('none', 'No Certification'),
        ('organic', 'Organic Certified'),
        ('gap', 'Good Agricultural Practices'),
        ('fair_trade', 'Fair Trade'),
        ('rainforest', 'Rainforest Alliance'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Location information (stored as JSON for flexibility)
    location = models.JSONField(default=dict, help_text="Coordinates, address, and location details")
    
    # Farm details
    size_hectares = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    farm_type = models.CharField(max_length=20, choices=FARM_TYPE_CHOICES)
    established_date = models.DateField()
    certification = models.CharField(max_length=20, choices=CERTIFICATION_CHOICES, default='none')
    
    # Contact and operational info
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # Status and settings
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False, help_text="Allow public visibility")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['farm_type']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.owner.username})"
    
    @property
    def total_crops(self):
        """Get total number of crops on this farm"""
        return self.crops.filter(status__in=['planted', 'growing', 'flowering']).count()
    
    @property
    def total_livestock(self):
        """Get total number of livestock on this farm"""
        return self.livestock.aggregate(total=models.Sum('count'))['total'] or 0
    
    @property
    def farm_age_years(self):
        """Calculate farm age in years"""
        return (timezone.now().date() - self.established_date).days // 365


class Crop(models.Model):
    """
    Crop model for tracking individual crops on a farm
    """
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('planted', 'Planted'),
        ('growing', 'Growing'),
        ('flowering', 'Flowering'),
        ('fruiting', 'Fruiting'),
        ('harvesting', 'Harvesting'),
        ('harvested', 'Harvested'),
        ('failed', 'Failed'),
    ]
    
    SEASON_CHOICES = [
        ('dry', 'Dry Season'),
        ('wet', 'Wet Season'),
        ('year_round', 'Year Round'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='crops')
    name = models.CharField(max_length=100)
    variety = models.CharField(max_length=100, blank=True)
    scientific_name = models.CharField(max_length=150, blank=True)
    
    # Planting information
    planting_date = models.DateField()
    expected_harvest_date = models.DateField()
    actual_harvest_date = models.DateField(null=True, blank=True)
    
    # Area and quantity
    area_hectares = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    plants_per_hectare = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1)]
    )
    
    # Status and season
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    season = models.CharField(max_length=20, choices=SEASON_CHOICES)
    
    # Yield information
    expected_yield_kg = models.DecimalField(
        max_digits=10, decimal_places=2, 
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    actual_yield_kg = models.DecimalField(
        max_digits=10, decimal_places=2, 
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Additional information
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-planting_date']
        indexes = [
            models.Index(fields=['farm']),
            models.Index(fields=['status']),
            models.Index(fields=['planting_date']),
            models.Index(fields=['expected_harvest_date']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.farm.name}"
    
    @property
    def days_to_harvest(self):
        """Calculate days until expected harvest"""
        if self.status == 'harvested':
            return 0
        return (self.expected_harvest_date - timezone.now().date()).days
    
    @property
    def growth_stage_percentage(self):
        """Calculate growth stage as percentage"""
        if self.status == 'harvested':
            return 100
        
        total_days = (self.expected_harvest_date - self.planting_date).days
        elapsed_days = (timezone.now().date() - self.planting_date).days
        
        if total_days <= 0:
            return 0
        
        return min(100, max(0, (elapsed_days / total_days) * 100))
    
    @property
    def yield_efficiency(self):
        """Calculate yield efficiency percentage"""
        if not self.expected_yield_kg or not self.actual_yield_kg:
            return None
        return (self.actual_yield_kg / self.expected_yield_kg) * 100


class Livestock(models.Model):
    """
    Livestock model for tracking animals on a farm
    """
    ANIMAL_TYPE_CHOICES = [
        ('cattle', 'Cattle'),
        ('goats', 'Goats'),
        ('sheep', 'Sheep'),
        ('pigs', 'Pigs'),
        ('chickens', 'Chickens'),
        ('ducks', 'Ducks'),
        ('turkeys', 'Turkeys'),
        ('rabbits', 'Rabbits'),
        ('fish', 'Fish'),
        ('other', 'Other'),
    ]
    
    HEALTH_STATUS_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('sick', 'Sick'),
        ('quarantine', 'Quarantine'),
    ]
    
    PURPOSE_CHOICES = [
        ('meat', 'Meat Production'),
        ('dairy', 'Dairy Production'),
        ('eggs', 'Egg Production'),
        ('breeding', 'Breeding'),
        ('draft', 'Draft Work'),
        ('pets', 'Pets/Companion'),
        ('mixed', 'Mixed Purpose'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='livestock')
    animal_type = models.CharField(max_length=20, choices=ANIMAL_TYPE_CHOICES)
    breed = models.CharField(max_length=100)
    
    # Quantity and identification
    count = models.IntegerField(validators=[MinValueValidator(1)])
    tag_numbers = models.TextField(blank=True, help_text="Comma-separated tag numbers")
    
    # Age and characteristics
    average_age_months = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(300)]
    )
    average_weight_kg = models.DecimalField(
        max_digits=8, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.1'))]
    )
    
    # Purpose and status
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    health_status = models.CharField(max_length=20, choices=HEALTH_STATUS_CHOICES, default='good')
    
    # Acquisition information
    acquisition_date = models.DateField()
    acquisition_cost = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Production tracking
    monthly_production = models.JSONField(
        default=dict, 
        help_text="Monthly production data (milk, eggs, etc.)"
    )
    
    # Additional information
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['farm']),
            models.Index(fields=['animal_type']),
            models.Index(fields=['health_status']),
            models.Index(fields=['acquisition_date']),
        ]
    
    def __str__(self):
        return f"{self.count} {self.breed} {self.animal_type} - {self.farm.name}"
    
    @property
    def total_value(self):
        """Calculate estimated total value"""
        if self.acquisition_cost:
            return self.acquisition_cost * self.count
        return None
    
    @property
    def age_category(self):
        """Categorize animals by age"""
        if not self.average_age_months:
            return 'unknown'
        
        if self.average_age_months < 6:
            return 'young'
        elif self.average_age_months < 24:
            return 'adult'
        else:
            return 'mature'


class FarmActivity(models.Model):
    """
    Model for tracking farm activities and operations
    """
    ACTIVITY_TYPE_CHOICES = [
        ('planting', 'Planting'),
        ('watering', 'Watering'),
        ('fertilizing', 'Fertilizing'),
        ('pest_control', 'Pest Control'),
        ('weeding', 'Weeding'),
        ('pruning', 'Pruning'),
        ('harvesting', 'Harvesting'),
        ('feeding', 'Animal Feeding'),
        ('vaccination', 'Vaccination'),
        ('breeding', 'Breeding'),
        ('maintenance', 'Equipment Maintenance'),
        ('inspection', 'Inspection'),
        ('treatment', 'Treatment'),
        ('other', 'Other'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('overdue', 'Overdue'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='activities')
    
    # Activity details
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Related objects (optional)
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, null=True, blank=True, related_name='activities')
    livestock = models.ForeignKey(Livestock, on_delete=models.CASCADE, null=True, blank=True, related_name='activities')
    
    # Scheduling
    scheduled_date = models.DateTimeField()
    completed_date = models.DateTimeField(null=True, blank=True)
    estimated_duration_hours = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.1'))]
    )
    actual_duration_hours = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.1'))]
    )
    
    # Status and priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Resources and costs
    materials_used = models.JSONField(default=list, help_text="List of materials and quantities")
    labor_hours = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    cost = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Results and notes
    results = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Assignment
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='assigned_activities'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_date']
        verbose_name_plural = 'Farm Activities'
        indexes = [
            models.Index(fields=['farm']),
            models.Index(fields=['activity_type']),
            models.Index(fields=['status']),
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['priority']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.farm.name}"
    
    @property
    def is_overdue(self):
        """Check if activity is overdue"""
        if self.status in ['completed', 'cancelled']:
            return False
        return timezone.now() > self.scheduled_date
    
    @property
    def days_until_due(self):
        """Calculate days until activity is due"""
        if self.status in ['completed', 'cancelled']:
            return None
        return (self.scheduled_date.date() - timezone.now().date()).days
    
    def mark_completed(self, results=None, actual_duration=None, cost=None):
        """Mark activity as completed with optional results"""
        self.status = 'completed'
        self.completed_date = timezone.now()
        if results:
            self.results = results
        if actual_duration:
            self.actual_duration_hours = actual_duration
        if cost:
            self.cost = cost
        self.save()


class Equipment(models.Model):
    """
    Model for tracking farm equipment and machinery
    """
    EQUIPMENT_TYPE_CHOICES = [
        ('tractor', 'Tractor'),
        ('plow', 'Plow'),
        ('harrow', 'Harrow'),
        ('seeder', 'Seeder'),
        ('sprayer', 'Sprayer'),
        ('harvester', 'Harvester'),
        ('irrigation', 'Irrigation System'),
        ('generator', 'Generator'),
        ('tools', 'Hand Tools'),
        ('vehicle', 'Vehicle'),
        ('other', 'Other'),
    ]
    
    CONDITION_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('broken', 'Broken'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='equipment')
    
    # Equipment details
    name = models.CharField(max_length=200)
    equipment_type = models.CharField(max_length=20, choices=EQUIPMENT_TYPE_CHOICES)
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    
    # Acquisition and value
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    current_value = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Status and condition
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good')
    is_operational = models.BooleanField(default=True)
    
    # Maintenance tracking
    last_maintenance_date = models.DateField(null=True, blank=True)
    next_maintenance_date = models.DateField(null=True, blank=True)
    maintenance_interval_days = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1)]
    )
    
    # Usage tracking
    hours_used = models.DecimalField(
        max_digits=8, decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Additional information
    specifications = models.JSONField(default=dict, help_text="Technical specifications")
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['farm']),
            models.Index(fields=['equipment_type']),
            models.Index(fields=['condition']),
            models.Index(fields=['is_operational']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.farm.name}"
    
    @property
    def needs_maintenance(self):
        """Check if equipment needs maintenance"""
        if not self.next_maintenance_date:
            return False
        return timezone.now().date() >= self.next_maintenance_date
    
    @property
    def depreciation_rate(self):
        """Calculate annual depreciation rate"""
        if not self.purchase_price or not self.current_value or not self.purchase_date:
            return None
        
        years_owned = (timezone.now().date() - self.purchase_date).days / 365.25
        if years_owned <= 0:
            return 0
        
        total_depreciation = self.purchase_price - self.current_value
        return (total_depreciation / self.purchase_price / years_owned) * 100
