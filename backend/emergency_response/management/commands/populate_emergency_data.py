"""Management command to populate emergency response data."""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from emergency_response.models import EmergencyGuideline

User = get_user_model()


class Command(BaseCommand):
    """Populate emergency response data for testing."""
    
    help = 'Populate emergency response data for testing'
    
    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write('Populating emergency response data...')
        
        # Create emergency guidelines
        self.create_guidelines()
        
        self.stdout.write(self.style.SUCCESS('Successfully populated emergency response data'))
    
    def create_guidelines(self):
        """Create emergency guidelines."""
        guidelines = [
            {
                'guideline_type': 'WEATHER',
                'title': 'Severe Weather Response',
                'description': 'Guidelines for responding to severe weather events',
                'immediate_actions': [
                    'Monitor weather updates from meteorological services',
                    'Secure loose items and equipment',
                    'Move livestock to safe areas',
                    'Prepare emergency supplies'
                ],
                'safety_measures': [
                    'Stay indoors during severe weather',
                    'Avoid low-lying areas during floods',
                    'Keep emergency contacts readily available',
                    'Have flashlights and batteries ready'
                ],
                'resources_needed': ['Emergency kit', 'First aid supplies', 'Radio', 'Flashlights'],
                'emergency_contacts': {
                    'meteorological_service': '0302-123456',
                    'emergency_services': '191',
                    'disaster_management': '0302-789012'
                },
                'support_services': [
                    {'name': 'National Disaster Management', 'contact': '0302-789012'},
                    {'name': 'Ghana Meteorological Agency', 'contact': '0302-123456'}
                ]
            },
            {
                'guideline_type': 'PEST',
                'title': 'Pest Outbreak Management',
                'description': 'Guidelines for managing pest outbreaks',
                'immediate_actions': [
                    'Identify the pest species',
                    'Assess the extent of infestation',
                    'Isolate affected areas if possible',
                    'Contact agricultural extension officers'
                ],
                'safety_measures': [
                    'Use protective equipment when applying pesticides',
                    'Follow recommended application rates',
                    'Keep pesticides away from water sources',
                    'Store chemicals safely'
                ],
                'resources_needed': ['Pesticides', 'Spraying equipment', 'Protective gear'],
                'emergency_contacts': {
                    'agricultural_extension': '0302-234567',
                    'plant_protection': '0302-345678'
                },
                'support_services': [
                    {'name': 'Ministry of Agriculture', 'contact': '0302-234567'},
                    {'name': 'Plant Protection Services', 'contact': '0302-345678'}
                ]
            },
            {
                'guideline_type': 'DISEASE',
                'title': 'Disease Outbreak Control',
                'description': 'Guidelines for controlling disease outbreaks',
                'immediate_actions': [
                    'Isolate affected plants or animals',
                    'Contact veterinary or plant health services',
                    'Implement biosecurity measures',
                    'Document symptoms and spread'
                ],
                'safety_measures': [
                    'Wear protective equipment',
                    'Disinfect tools and equipment',
                    'Limit movement between areas',
                    'Follow quarantine procedures'
                ],
                'resources_needed': ['Disinfectants', 'Protective equipment', 'Isolation materials'],
                'emergency_contacts': {
                    'veterinary_services': '0302-456789',
                    'plant_health': '0302-567890'
                },
                'support_services': [
                    {'name': 'Veterinary Services', 'contact': '0302-456789'},
                    {'name': 'Plant Health Division', 'contact': '0302-567890'}
                ]
            },
            {
                'guideline_type': 'FLOOD',
                'title': 'Flood Response Protocol',
                'description': 'Guidelines for responding to flooding',
                'immediate_actions': [
                    'Move to higher ground immediately',
                    'Evacuate livestock and valuable equipment',
                    'Turn off electrical equipment',
                    'Monitor water levels'
                ],
                'safety_measures': [
                    'Never walk or drive through flood waters',
                    'Avoid contact with flood water',
                    'Stay away from power lines',
                    'Wait for official all-clear before returning'
                ],
                'resources_needed': ['Life jackets', 'Rope', 'Emergency supplies', 'First aid kit'],
                'emergency_contacts': {
                    'emergency_services': '191',
                    'disaster_management': '0302-789012',
                    'water_resources': '0302-890123'
                },
                'support_services': [
                    {'name': 'National Disaster Management', 'contact': '0302-789012'},
                    {'name': 'Ghana Water Resources', 'contact': '0302-890123'}
                ]
            },
            {
                'guideline_type': 'DROUGHT',
                'title': 'Drought Management',
                'description': 'Guidelines for managing drought conditions',
                'immediate_actions': [
                    'Implement water conservation measures',
                    'Prioritize critical water needs',
                    'Monitor crop and livestock condition',
                    'Seek alternative water sources'
                ],
                'safety_measures': [
                    'Conserve water for essential uses',
                    'Protect water sources from contamination',
                    'Monitor livestock health closely',
                    'Adjust planting schedules'
                ],
                'resources_needed': ['Water storage containers', 'Irrigation equipment', 'Drought-resistant seeds'],
                'emergency_contacts': {
                    'water_resources': '0302-890123',
                    'agricultural_extension': '0302-234567'
                },
                'support_services': [
                    {'name': 'Ghana Water Resources', 'contact': '0302-890123'},
                    {'name': 'Agricultural Extension', 'contact': '0302-234567'}
                ]
            },
            {
                'guideline_type': 'FIRE',
                'title': 'Fire Safety and Response',
                'description': 'Guidelines for fire prevention and response',
                'immediate_actions': [
                    'Call fire services immediately',
                    'Evacuate people and animals',
                    'Use fire extinguishers if safe to do so',
                    'Create firebreaks if possible'
                ],
                'safety_measures': [
                    'Never return to burning buildings',
                    'Stay low to avoid smoke',
                    'Have multiple escape routes',
                    'Keep fire extinguishers accessible'
                ],
                'resources_needed': ['Fire extinguishers', 'Water supply', 'Firebreaks', 'Emergency exits'],
                'emergency_contacts': {
                    'fire_service': '192',
                    'emergency_services': '191'
                },
                'support_services': [
                    {'name': 'Ghana National Fire Service', 'contact': '192'},
                    {'name': 'Emergency Services', 'contact': '191'}
                ]
            },
            {
                'guideline_type': 'SECURITY',
                'title': 'Security Threat Response',
                'description': 'Guidelines for responding to security threats',
                'immediate_actions': [
                    'Contact police immediately',
                    'Secure property and valuables',
                    'Document incidents with photos if safe',
                    'Inform neighbors and community'
                ],
                'safety_measures': [
                    'Do not confront intruders',
                    'Install security measures',
                    'Keep emergency contacts accessible',
                    'Participate in community watch programs'
                ],
                'resources_needed': ['Security systems', 'Locks', 'Lighting', 'Communication devices'],
                'emergency_contacts': {
                    'police': '191',
                    'community_police': '0302-901234'
                },
                'support_services': [
                    {'name': 'Ghana Police Service', 'contact': '191'},
                    {'name': 'Community Policing', 'contact': '0302-901234'}
                ]
            },
        ]
        
        for guideline_data in guidelines:
            guideline, created = EmergencyGuideline.objects.get_or_create(
                guideline_type=guideline_data['guideline_type'],
                title=guideline_data['title'],
                defaults=guideline_data
            )
            if created:
                self.stdout.write(f"  Created guideline: {guideline.title}")
