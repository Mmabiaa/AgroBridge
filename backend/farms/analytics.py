"""
Farm analytics and monitoring utilities
"""
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
from collections import defaultdict
import calendar

from .models import Farm, Crop, Livestock, FarmActivity, Equipment


class FarmAnalytics:
    """
    Class for generating farm analytics and insights
    """
    
    def __init__(self, user=None, farm=None):
        self.user = user
        self.farm = farm
    
    def get_farm_overview(self):
        """Get overview statistics for farms"""
        if self.farm:
            farms = Farm.objects.filter(id=self.farm.id)
        elif self.user:
            farms = Farm.objects.filter(owner=self.user)
        else:
            farms = Farm.objects.all()
        
        return {
            'total_farms': farms.count(),
            'total_area': farms.aggregate(total=Sum('size_hectares'))['total'] or 0,
            'active_farms': farms.filter(is_active=True).count(),
            'farm_types': farms.values('farm_type').annotate(count=Count('id')),
            'certifications': farms.values('certification').annotate(count=Count('id'))
        }
    
    def get_crop_analytics(self):
        """Get crop-related analytics"""
        if self.farm:
            crops = Crop.objects.filter(farm=self.farm)
        elif self.user:
            crops = Crop.objects.filter(farm__owner=self.user)
        else:
            crops = Crop.objects.all()
        
        # Status breakdown
        status_breakdown = crops.values('status').annotate(count=Count('id'))
        
        # Yield efficiency
        completed_crops = crops.filter(
            status='harvested',
            actual_yield_kg__isnull=False,
            expected_yield_kg__isnull=False
        )
        
        yield_efficiency = None
        if completed_crops.exists():
            total_expected = completed_crops.aggregate(
                total=Sum('expected_yield_kg')
            )['total']
            total_actual = completed_crops.aggregate(
                total=Sum('actual_yield_kg')
            )['total']
            
            if total_expected and total_expected > 0:
                yield_efficiency = (total_actual / total_expected) * 100
        
        # Seasonal distribution
        seasonal_distribution = crops.values('season').annotate(count=Count('id'))
        
        # Monthly planting trends
        monthly_planting = self._get_monthly_trends(
            crops, 'planting_date', months=12
        )
        
        return {
            'total_crops': crops.count(),
            'total_area': crops.aggregate(total=Sum('area_hectares'))['total'] or 0,
            'status_breakdown': {item['status']: item['count'] for item in status_breakdown},
            'yield_efficiency': yield_efficiency,
            'seasonal_distribution': {item['season']: item['count'] for item in seasonal_distribution},
            'monthly_planting_trends': monthly_planting,
            'crops_ready_for_harvest': crops.filter(
                expected_harvest_date__lte=timezone.now().date() + timedelta(days=7),
                status__in=['growing', 'flowering', 'fruiting']
            ).count()
        }
    
    def get_livestock_analytics(self):
        """Get livestock-related analytics"""
        if self.farm:
            livestock = Livestock.objects.filter(farm=self.farm)
        elif self.user:
            livestock = Livestock.objects.filter(farm__owner=self.user)
        else:
            livestock = Livestock.objects.all()
        
        # Type breakdown
        type_breakdown = livestock.values('animal_type').annotate(
            total_count=Sum('count')
        )
        
        # Health status
        health_status = livestock.values('health_status').annotate(
            group_count=Count('id'),
            total_animals=Sum('count')
        )
        
        # Purpose breakdown
        purpose_breakdown = livestock.values('purpose').annotate(
            total_count=Sum('count')
        )
        
        # Total value
        total_value = livestock.aggregate(
            total=Sum(F('acquisition_cost') * F('count'))
        )['total'] or 0
        
        return {
            'total_livestock_groups': livestock.count(),
            'total_animals': livestock.aggregate(total=Sum('count'))['total'] or 0,
            'type_breakdown': {item['animal_type']: item['total_count'] for item in type_breakdown},
            'health_status': {item['health_status']: item['total_animals'] for item in health_status},
            'purpose_breakdown': {item['purpose']: item['total_count'] for item in purpose_breakdown},
            'total_estimated_value': total_value,
            'animals_needing_attention': livestock.filter(
                health_status__in=['poor', 'sick', 'quarantine']
            ).aggregate(total=Sum('count'))['total'] or 0
        }
    
    def get_activity_analytics(self):
        """Get farm activity analytics"""
        if self.farm:
            activities = FarmActivity.objects.filter(farm=self.farm)
        elif self.user:
            activities = FarmActivity.objects.filter(farm__owner=self.user)
        else:
            activities = FarmActivity.objects.all()
        
        # Status breakdown
        status_breakdown = activities.values('status').annotate(count=Count('id'))
        
        # Priority breakdown
        priority_breakdown = activities.values('priority').annotate(count=Count('id'))
        
        # Activity type breakdown
        type_breakdown = activities.values('activity_type').annotate(count=Count('id'))
        
        # Overdue activities
        overdue_count = activities.filter(
            status__in=['planned', 'in_progress'],
            scheduled_date__lt=timezone.now()
        ).count()
        
        # Upcoming activities (next 7 days)
        upcoming_count = activities.filter(
            status__in=['planned', 'in_progress'],
            scheduled_date__gte=timezone.now(),
            scheduled_date__lte=timezone.now() + timedelta(days=7)
        ).count()
        
        # Monthly activity trends
        monthly_activities = self._get_monthly_trends(
            activities, 'scheduled_date', months=6
        )
        
        # Completion rate
        total_activities = activities.count()
        completed_activities = activities.filter(status='completed').count()
        completion_rate = (completed_activities / total_activities * 100) if total_activities > 0 else 0
        
        return {
            'total_activities': total_activities,
            'status_breakdown': {item['status']: item['count'] for item in status_breakdown},
            'priority_breakdown': {item['priority']: item['count'] for item in priority_breakdown},
            'type_breakdown': {item['activity_type']: item['count'] for item in type_breakdown},
            'overdue_activities': overdue_count,
            'upcoming_activities': upcoming_count,
            'monthly_trends': monthly_activities,
            'completion_rate': completion_rate
        }
    
    def get_equipment_analytics(self):
        """Get equipment analytics"""
        if self.farm:
            equipment = Equipment.objects.filter(farm=self.farm)
        elif self.user:
            equipment = Equipment.objects.filter(farm__owner=self.user)
        else:
            equipment = Equipment.objects.all()
        
        # Type breakdown
        type_breakdown = equipment.values('equipment_type').annotate(count=Count('id'))
        
        # Condition breakdown
        condition_breakdown = equipment.values('condition').annotate(count=Count('id'))
        
        # Maintenance needs
        needs_maintenance = equipment.filter(
            next_maintenance_date__lte=timezone.now().date(),
            is_operational=True
        ).count()
        
        # Total value
        total_purchase_value = equipment.aggregate(
            total=Sum('purchase_price')
        )['total'] or 0
        
        total_current_value = equipment.aggregate(
            total=Sum('current_value')
        )['total'] or 0
        
        return {
            'total_equipment': equipment.count(),
            'operational_equipment': equipment.filter(is_operational=True).count(),
            'type_breakdown': {item['equipment_type']: item['count'] for item in type_breakdown},
            'condition_breakdown': {item['condition']: item['count'] for item in condition_breakdown},
            'needs_maintenance': needs_maintenance,
            'total_purchase_value': total_purchase_value,
            'total_current_value': total_current_value,
            'depreciation_amount': total_purchase_value - total_current_value
        }
    
    def _get_monthly_trends(self, queryset, date_field, months=12):
        """Get monthly trends for a given queryset and date field"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30 * months)
        
        # Filter queryset by date range
        filter_kwargs = {f'{date_field}__gte': start_date, f'{date_field}__lte': end_date}
        filtered_queryset = queryset.filter(**filter_kwargs)
        
        # Group by month
        monthly_data = defaultdict(int)
        
        for item in filtered_queryset:
            date_value = getattr(item, date_field)
            if hasattr(date_value, 'date'):
                date_value = date_value.date()
            
            month_key = f"{date_value.year}-{date_value.month:02d}"
            monthly_data[month_key] += 1
        
        # Fill in missing months with 0
        result = []
        current_date = start_date.replace(day=1)
        
        while current_date <= end_date:
            month_key = f"{current_date.year}-{current_date.month:02d}"
            result.append({
                'month': month_key,
                'month_name': calendar.month_name[current_date.month],
                'year': current_date.year,
                'count': monthly_data.get(month_key, 0)
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return result


class FarmPerformanceMonitor:
    """
    Monitor farm performance and generate alerts
    """
    
    def __init__(self, farm):
        self.farm = farm
    
    def get_performance_alerts(self):
        """Get performance alerts for the farm"""
        alerts = []
        
        # Check for overdue activities
        overdue_activities = self.farm.activities.filter(
            status__in=['planned', 'in_progress'],
            scheduled_date__lt=timezone.now()
        ).count()
        
        if overdue_activities > 0:
            alerts.append({
                'type': 'warning',
                'category': 'activities',
                'message': f"You have {overdue_activities} overdue activities",
                'count': overdue_activities
            })
        
        # Check for crops ready for harvest
        ready_for_harvest = self.farm.crops.filter(
            expected_harvest_date__lte=timezone.now().date() + timedelta(days=3),
            status__in=['growing', 'flowering', 'fruiting']
        ).count()
        
        if ready_for_harvest > 0:
            alerts.append({
                'type': 'info',
                'category': 'crops',
                'message': f"{ready_for_harvest} crops are ready for harvest",
                'count': ready_for_harvest
            })
        
        # Check for equipment needing maintenance
        maintenance_needed = self.farm.equipment.filter(
            next_maintenance_date__lte=timezone.now().date(),
            is_operational=True
        ).count()
        
        if maintenance_needed > 0:
            alerts.append({
                'type': 'warning',
                'category': 'equipment',
                'message': f"{maintenance_needed} equipment items need maintenance",
                'count': maintenance_needed
            })
        
        # Check for livestock health issues
        sick_animals = self.farm.livestock.filter(
            health_status__in=['poor', 'sick', 'quarantine']
        ).aggregate(total=Sum('count'))['total'] or 0
        
        if sick_animals > 0:
            alerts.append({
                'type': 'error',
                'category': 'livestock',
                'message': f"{sick_animals} animals need health attention",
                'count': sick_animals
            })
        
        return alerts
    
    def get_productivity_metrics(self):
        """Calculate productivity metrics"""
        # Crop yield efficiency
        completed_crops = self.farm.crops.filter(
            status='harvested',
            actual_yield_kg__isnull=False,
            expected_yield_kg__isnull=False
        )
        
        yield_efficiency = None
        if completed_crops.exists():
            efficiencies = []
            for crop in completed_crops:
                if crop.expected_yield_kg > 0:
                    efficiency = (crop.actual_yield_kg / crop.expected_yield_kg) * 100
                    efficiencies.append(efficiency)
            
            if efficiencies:
                yield_efficiency = sum(efficiencies) / len(efficiencies)
        
        # Activity completion rate
        total_activities = self.farm.activities.count()
        completed_activities = self.farm.activities.filter(status='completed').count()
        activity_completion_rate = (completed_activities / total_activities * 100) if total_activities > 0 else 0
        
        # Equipment utilization
        operational_equipment = self.farm.equipment.filter(is_operational=True).count()
        total_equipment = self.farm.equipment.count()
        equipment_utilization = (operational_equipment / total_equipment * 100) if total_equipment > 0 else 0
        
        return {
            'yield_efficiency': yield_efficiency,
            'activity_completion_rate': activity_completion_rate,
            'equipment_utilization': equipment_utilization,
            'total_farm_area': self.farm.size_hectares,
            'cultivated_area': self.farm.crops.aggregate(
                total=Sum('area_hectares')
            )['total'] or 0
        }