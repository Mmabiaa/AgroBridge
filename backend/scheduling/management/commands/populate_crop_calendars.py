"""
Management command to populate crop calendars with sample data
"""
from django.core.management.base import BaseCommand
from scheduling.models import CropCalendar


class Command(BaseCommand):
    help = 'Populate crop calendars with sample agricultural data'
    
    def handle(self, *args, **options):
        self.stdout.write('Populating crop calendars...')
        
        crop_calendars = [
            {
                'crop_name': 'Tomato',
                'variety': 'Roma',
                'germination_days': 7,
                'vegetative_days': 21,
                'flowering_days': 14,
                'fruiting_days': 21,
                'maturity_days': 7,
                'planting_activities': [
                    {
                        'title': 'Prepare seedbed',
                        'description': 'Prepare soil and create seedbed for tomato planting',
                        'days_offset': -3,
                        'duration': 120,
                        'priority': 'high'
                    },
                    {
                        'title': 'Plant tomato seeds',
                        'description': 'Plant tomato seeds in prepared seedbed',
                        'days_offset': 0,
                        'duration': 60,
                        'priority': 'high'
                    }
                ],
                'growth_activities': [
                    {
                        'title': 'Water plants',
                        'description': 'Water tomato plants regularly',
                        'days_offset': 1,
                        'duration': 30,
                        'priority': 'high',
                        'is_recurring': True,
                        'recurrence_pattern': 'daily',
                        'recurrence_interval': 2
                    },
                    {
                        'title': 'Apply fertilizer',
                        'description': 'Apply balanced fertilizer to tomato plants',
                        'days_offset': 14,
                        'duration': 45,
                        'priority': 'medium',
                        'category': 'fertilizing'
                    },
                    {
                        'title': 'Stake plants',
                        'description': 'Install stakes to support tomato plants',
                        'days_offset': 21,
                        'duration': 60,
                        'priority': 'medium',
                        'category': 'maintenance'
                    }
                ],
                'harvest_activities': [
                    {
                        'title': 'Harvest tomatoes',
                        'description': 'Harvest ripe tomatoes',
                        'days_offset': 0,
                        'duration': 90,
                        'priority': 'high'
                    }
                ],
                'optimal_planting_months': [3, 4, 5, 9, 10],
                'climate_zones': ['tropical', 'subtropical']
            },
            {
                'crop_name': 'Maize',
                'variety': 'Yellow Corn',
                'germination_days': 5,
                'vegetative_days': 35,
                'flowering_days': 14,
                'fruiting_days': 21,
                'maturity_days': 15,
                'planting_activities': [
                    {
                        'title': 'Land preparation',
                        'description': 'Plow and harrow the field',
                        'days_offset': -7,
                        'duration': 240,
                        'priority': 'high'
                    },
                    {
                        'title': 'Plant maize seeds',
                        'description': 'Plant maize seeds at proper spacing',
                        'days_offset': 0,
                        'duration': 120,
                        'priority': 'high'
                    }
                ],
                'growth_activities': [
                    {
                        'title': 'First weeding',
                        'description': 'Remove weeds from maize field',
                        'days_offset': 14,
                        'duration': 180,
                        'priority': 'high',
                        'category': 'weeding'
                    },
                    {
                        'title': 'Apply fertilizer',
                        'description': 'Apply NPK fertilizer',
                        'days_offset': 21,
                        'duration': 60,
                        'priority': 'high',
                        'category': 'fertilizing'
                    },
                    {
                        'title': 'Second weeding',
                        'description': 'Remove weeds from maize field',
                        'days_offset': 35,
                        'duration': 180,
                        'priority': 'medium',
                        'category': 'weeding'
                    }
                ],
                'harvest_activities': [
                    {
                        'title': 'Harvest maize',
                        'description': 'Harvest mature maize cobs',
                        'days_offset': 0,
                        'duration': 240,
                        'priority': 'high'
                    }
                ],
                'optimal_planting_months': [3, 4, 5, 8, 9],
                'climate_zones': ['tropical', 'subtropical', 'temperate']
            },
            {
                'crop_name': 'Cassava',
                'variety': 'TME 419',
                'germination_days': 14,
                'vegetative_days': 90,
                'flowering_days': 30,
                'fruiting_days': 90,
                'maturity_days': 90,
                'planting_activities': [
                    {
                        'title': 'Prepare land',
                        'description': 'Clear and prepare land for cassava planting',
                        'days_offset': -7,
                        'duration': 300,
                        'priority': 'high'
                    },
                    {
                        'title': 'Plant cassava stems',
                        'description': 'Plant cassava stem cuttings',
                        'days_offset': 0,
                        'duration': 180,
                        'priority': 'high'
                    }
                ],
                'growth_activities': [
                    {
                        'title': 'Weeding',
                        'description': 'Remove weeds from cassava field',
                        'days_offset': 30,
                        'duration': 240,
                        'priority': 'high',
                        'category': 'weeding',
                        'is_recurring': True,
                        'recurrence_pattern': 'monthly',
                        'recurrence_interval': 1
                    },
                    {
                        'title': 'Inspect for pests',
                        'description': 'Check for cassava mealybug and other pests',
                        'days_offset': 45,
                        'duration': 60,
                        'priority': 'medium',
                        'category': 'inspection'
                    }
                ],
                'harvest_activities': [
                    {
                        'title': 'Harvest cassava',
                        'description': 'Harvest mature cassava tubers',
                        'days_offset': 0,
                        'duration': 300,
                        'priority': 'high'
                    }
                ],
                'optimal_planting_months': [3, 4, 5, 6, 7, 8, 9],
                'climate_zones': ['tropical']
            },
            {
                'crop_name': 'Rice',
                'variety': 'NERICA',
                'germination_days': 7,
                'vegetative_days': 35,
                'flowering_days': 21,
                'fruiting_days': 21,
                'maturity_days': 14,
                'planting_activities': [
                    {
                        'title': 'Prepare paddy field',
                        'description': 'Plow and level the paddy field',
                        'days_offset': -10,
                        'duration': 360,
                        'priority': 'high'
                    },
                    {
                        'title': 'Transplant rice seedlings',
                        'description': 'Transplant rice seedlings to main field',
                        'days_offset': 0,
                        'duration': 240,
                        'priority': 'high'
                    }
                ],
                'growth_activities': [
                    {
                        'title': 'Maintain water level',
                        'description': 'Ensure proper water level in paddy',
                        'days_offset': 1,
                        'duration': 30,
                        'priority': 'high',
                        'category': 'watering',
                        'is_recurring': True,
                        'recurrence_pattern': 'weekly',
                        'recurrence_interval': 1
                    },
                    {
                        'title': 'Apply fertilizer',
                        'description': 'Apply urea and NPK fertilizer',
                        'days_offset': 21,
                        'duration': 60,
                        'priority': 'high',
                        'category': 'fertilizing'
                    },
                    {
                        'title': 'Weed control',
                        'description': 'Remove weeds from rice field',
                        'days_offset': 28,
                        'duration': 180,
                        'priority': 'medium',
                        'category': 'weeding'
                    }
                ],
                'harvest_activities': [
                    {
                        'title': 'Harvest rice',
                        'description': 'Harvest mature rice grains',
                        'days_offset': 0,
                        'duration': 300,
                        'priority': 'high'
                    }
                ],
                'optimal_planting_months': [4, 5, 6, 7, 8],
                'climate_zones': ['tropical', 'subtropical']
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for calendar_data in crop_calendars:
            crop_name = calendar_data['crop_name']
            variety = calendar_data.get('variety', '')
            
            calendar, created = CropCalendar.objects.update_or_create(
                crop_name=crop_name,
                variety=variety,
                defaults=calendar_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created crop calendar: {crop_name} ({variety})'
                    )
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'Updated crop calendar: {crop_name} ({variety})'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully populated crop calendars: '
                f'{created_count} created, {updated_count} updated'
            )
        )
