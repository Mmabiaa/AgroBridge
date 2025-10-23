"""
Management command to populate initial disease and treatment data
"""
from django.core.management.base import BaseCommand
from crop_detection.models import Disease, Treatment


class Command(BaseCommand):
    help = 'Populate initial disease and treatment data'
    
    def handle(self, *args, **options):
        self.stdout.write('Populating disease and treatment data...')
        
        # Create diseases
        diseases_data = [
            {
                'name': 'Tomato Late Blight',
                'scientific_name': 'Phytophthora infestans',
                'common_names': ['Late Blight', 'Potato Blight'],
                'category': 'fungal',
                'description': 'A devastating fungal disease that affects tomatoes and potatoes, causing rapid plant death.',
                'symptoms': 'Dark, water-soaked lesions on leaves, stems, and fruits. White fuzzy growth on leaf undersides.',
                'visual_indicators': [
                    'Dark brown or black lesions with irregular borders',
                    'White fuzzy sporulation on leaf undersides',
                    'Rapid wilting and death of affected plant parts',
                    'Brown, firm rot on fruits'
                ],
                'affected_crops': ['tomato', 'potato'],
                'typical_severity': 'high',
                'spread_rate': 'Very rapid in humid conditions',
                'seasonal_pattern': 'Most common in cool, wet weather',
                'favorable_conditions': {
                    'temperature': '15-20°C',
                    'humidity': '>90%',
                    'weather': 'Cool and wet'
                },
                'prevention_methods': 'Use resistant varieties, ensure good air circulation, avoid overhead watering',
                'organic_treatments': 'Copper-based fungicides, baking soda spray',
                'chemical_treatments': 'Chlorothalonil, Mancozeb, Metalaxyl',
                'confidence_threshold': 0.8
            },
            {
                'name': 'Tomato Early Blight',
                'scientific_name': 'Alternaria solani',
                'common_names': ['Early Blight', 'Target Spot'],
                'category': 'fungal',
                'description': 'A common fungal disease causing characteristic target-like spots on tomato leaves.',
                'symptoms': 'Circular brown spots with concentric rings on older leaves, yellowing and defoliation.',
                'visual_indicators': [
                    'Circular brown spots with target-like concentric rings',
                    'Yellowing of affected leaves',
                    'Defoliation starting from bottom leaves',
                    'Dark lesions on stems and fruits'
                ],
                'affected_crops': ['tomato', 'potato', 'pepper'],
                'typical_severity': 'medium',
                'spread_rate': 'Moderate',
                'seasonal_pattern': 'Warm, humid conditions',
                'favorable_conditions': {
                    'temperature': '24-29°C',
                    'humidity': '90%+',
                    'weather': 'Warm and humid'
                },
                'prevention_methods': 'Crop rotation, mulching, proper spacing for air circulation',
                'organic_treatments': 'Neem oil, copper fungicides, compost tea',
                'chemical_treatments': 'Chlorothalonil, Azoxystrobin, Boscalid',
                'confidence_threshold': 0.75
            },
            {
                'name': 'Powdery Mildew',
                'scientific_name': 'Erysiphe cichoracearum',
                'common_names': ['Powdery Mildew', 'White Mold'],
                'category': 'fungal',
                'description': 'A fungal disease that creates white powdery coating on plant surfaces.',
                'symptoms': 'White powdery coating on leaves, stems, and sometimes fruits.',
                'visual_indicators': [
                    'White or gray powdery coating on leaf surfaces',
                    'Yellowing and curling of affected leaves',
                    'Stunted growth',
                    'Premature leaf drop'
                ],
                'affected_crops': ['tomato', 'cucumber', 'pepper', 'lettuce'],
                'typical_severity': 'medium',
                'spread_rate': 'Moderate to fast',
                'seasonal_pattern': 'Dry conditions with high humidity',
                'favorable_conditions': {
                    'temperature': '20-30°C',
                    'humidity': '50-70%',
                    'weather': 'Dry with high humidity'
                },
                'prevention_methods': 'Good air circulation, avoid overhead watering, resistant varieties',
                'organic_treatments': 'Baking soda spray, milk spray, neem oil',
                'chemical_treatments': 'Sulfur, Myclobutanil, Propiconazole',
                'confidence_threshold': 0.7
            },
            {
                'name': 'Bacterial Spot',
                'scientific_name': 'Xanthomonas vesicatoria',
                'common_names': ['Bacterial Spot', 'Bacterial Speck'],
                'category': 'bacterial',
                'description': 'A bacterial disease causing small dark spots on leaves and fruits.',
                'symptoms': 'Small, dark, water-soaked spots on leaves, stems, and fruits.',
                'visual_indicators': [
                    'Small dark spots with yellow halos',
                    'Water-soaked appearance of lesions',
                    'Defoliation in severe cases',
                    'Scabby lesions on fruits'
                ],
                'affected_crops': ['tomato', 'pepper'],
                'typical_severity': 'medium',
                'spread_rate': 'Fast in wet conditions',
                'seasonal_pattern': 'Warm, wet weather',
                'favorable_conditions': {
                    'temperature': '25-30°C',
                    'humidity': '>85%',
                    'weather': 'Warm and wet'
                },
                'prevention_methods': 'Use pathogen-free seeds, avoid overhead irrigation, copper sprays',
                'organic_treatments': 'Copper-based bactericides',
                'chemical_treatments': 'Copper hydroxide, Streptomycin',
                'confidence_threshold': 0.75
            },
            {
                'name': 'Aphid Infestation',
                'scientific_name': 'Aphidoidea',
                'common_names': ['Aphids', 'Plant Lice', 'Greenfly'],
                'category': 'pest',
                'description': 'Small soft-bodied insects that feed on plant sap.',
                'symptoms': 'Clusters of small insects on leaves and stems, yellowing, stunted growth.',
                'visual_indicators': [
                    'Small green, black, or white insects in clusters',
                    'Sticky honeydew on leaves',
                    'Yellowing and curling of leaves',
                    'Stunted plant growth'
                ],
                'affected_crops': ['tomato', 'pepper', 'lettuce', 'cabbage'],
                'typical_severity': 'low',
                'spread_rate': 'Very fast reproduction',
                'seasonal_pattern': 'Spring and early summer',
                'favorable_conditions': {
                    'temperature': '15-25°C',
                    'humidity': 'Moderate',
                    'weather': 'Mild temperatures'
                },
                'prevention_methods': 'Beneficial insects, reflective mulch, companion planting',
                'organic_treatments': 'Insecticidal soap, neem oil, ladybugs',
                'chemical_treatments': 'Imidacloprid, Thiamethoxam, Pyrethroids',
                'confidence_threshold': 0.8
            }
        ]
        
        created_diseases = []
        for disease_data in diseases_data:
            disease, created = Disease.objects.get_or_create(
                name=disease_data['name'],
                defaults=disease_data
            )
            if created:
                self.stdout.write(f'Created disease: {disease.name}')
                created_diseases.append(disease)
            else:
                self.stdout.write(f'Disease already exists: {disease.name}')
        
        # Create treatments for diseases
        treatments_data = [
            # Late Blight treatments
            {
                'disease_name': 'Tomato Late Blight',
                'treatments': [
                    {
                        'name': 'Copper Fungicide Application',
                        'treatment_type': 'curative',
                        'method': 'chemical',
                        'description': 'Apply copper-based fungicide to control late blight',
                        'detailed_instructions': 'Spray copper fungicide on all plant surfaces, including undersides of leaves. Apply in early morning or evening.',
                        'timing': 'At first sign of disease or preventively in wet weather',
                        'frequency': 'Every 7-10 days',
                        'duration': 'Until disease is controlled',
                        'materials_needed': ['Copper fungicide', 'Sprayer', 'Protective equipment'],
                        'effectiveness_rating': 4.0,
                        'safety_precautions': 'Wear protective clothing, avoid spraying in windy conditions',
                        'suitable_crops': ['tomato', 'potato']
                    },
                    {
                        'name': 'Remove Affected Plant Parts',
                        'treatment_type': 'curative',
                        'method': 'cultural',
                        'description': 'Remove and destroy infected plant material',
                        'detailed_instructions': 'Cut off affected leaves, stems, and fruits. Dispose of in trash, not compost.',
                        'timing': 'Immediately upon detection',
                        'frequency': 'As needed',
                        'duration': 'Ongoing monitoring',
                        'materials_needed': ['Clean pruning shears', 'Disinfectant', 'Trash bags'],
                        'effectiveness_rating': 3.5,
                        'safety_precautions': 'Disinfect tools between plants',
                        'suitable_crops': ['tomato', 'potato']
                    }
                ]
            },
            # Early Blight treatments
            {
                'disease_name': 'Tomato Early Blight',
                'treatments': [
                    {
                        'name': 'Neem Oil Treatment',
                        'treatment_type': 'curative',
                        'method': 'organic',
                        'description': 'Apply neem oil to control early blight fungus',
                        'detailed_instructions': 'Mix neem oil according to label instructions. Spray thoroughly on all plant surfaces.',
                        'timing': 'Early morning or evening',
                        'frequency': 'Every 7-14 days',
                        'duration': '3-4 applications',
                        'materials_needed': ['Neem oil', 'Water', 'Sprayer'],
                        'effectiveness_rating': 3.5,
                        'safety_precautions': 'Avoid spraying in direct sunlight',
                        'suitable_crops': ['tomato', 'pepper']
                    }
                ]
            },
            # Powdery Mildew treatments
            {
                'disease_name': 'Powdery Mildew',
                'treatments': [
                    {
                        'name': 'Baking Soda Spray',
                        'treatment_type': 'curative',
                        'method': 'organic',
                        'description': 'Homemade baking soda spray to control powdery mildew',
                        'detailed_instructions': 'Mix 1 tsp baking soda per quart of water with a few drops of dish soap. Spray on affected areas.',
                        'timing': 'Early morning or evening',
                        'frequency': 'Every 3-5 days',
                        'duration': 'Until symptoms disappear',
                        'materials_needed': ['Baking soda', 'Dish soap', 'Water', 'Sprayer'],
                        'effectiveness_rating': 3.0,
                        'safety_precautions': 'Test on small area first',
                        'suitable_crops': ['tomato', 'cucumber', 'pepper']
                    }
                ]
            },
            # Aphid treatments
            {
                'disease_name': 'Aphid Infestation',
                'treatments': [
                    {
                        'name': 'Insecticidal Soap',
                        'treatment_type': 'curative',
                        'method': 'organic',
                        'description': 'Apply insecticidal soap to control aphids',
                        'detailed_instructions': 'Spray insecticidal soap directly on aphid colonies. Ensure good coverage of undersides of leaves.',
                        'timing': 'Early morning or evening',
                        'frequency': 'Every 2-3 days',
                        'duration': 'Until aphids are controlled',
                        'materials_needed': ['Insecticidal soap', 'Sprayer'],
                        'effectiveness_rating': 4.0,
                        'safety_precautions': 'Safe for beneficial insects when dry',
                        'suitable_crops': ['tomato', 'pepper', 'lettuce']
                    },
                    {
                        'name': 'Beneficial Insect Release',
                        'treatment_type': 'preventive',
                        'method': 'biological',
                        'description': 'Release ladybugs or lacewings to control aphids naturally',
                        'detailed_instructions': 'Release beneficial insects in the evening when temperatures are cooler.',
                        'timing': 'Early in aphid season',
                        'frequency': 'One-time release',
                        'duration': 'Ongoing natural control',
                        'materials_needed': ['Ladybugs or lacewings'],
                        'effectiveness_rating': 4.5,
                        'safety_precautions': 'Avoid pesticide use when beneficials are present',
                        'suitable_crops': ['tomato', 'pepper', 'lettuce', 'cabbage']
                    }
                ]
            }
        ]
        
        for treatment_group in treatments_data:
            try:
                disease = Disease.objects.get(name=treatment_group['disease_name'])
                for treatment_data in treatment_group['treatments']:
                    treatment_data['disease'] = disease
                    treatment, created = Treatment.objects.get_or_create(
                        name=treatment_data['name'],
                        disease=disease,
                        defaults=treatment_data
                    )
                    if created:
                        self.stdout.write(f'Created treatment: {treatment.name} for {disease.name}')
                    else:
                        self.stdout.write(f'Treatment already exists: {treatment.name}')
            except Disease.DoesNotExist:
                self.stdout.write(f'Disease not found: {treatment_group["disease_name"]}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated {len(created_diseases)} diseases and their treatments'
            )
        )