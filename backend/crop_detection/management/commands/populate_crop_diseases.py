"""
Management command to populate the database with sample crop diseases and treatments
"""
from django.core.management.base import BaseCommand
from crop_detection.models import Disease, Treatment


class Command(BaseCommand):
    help = 'Populate database with sample crop diseases and treatments'

    def handle(self, *args, **options):
        self.stdout.write('Populating crop diseases and treatments...')
        
        # Create sample diseases
        diseases_data = [
            {
                'name': 'Tomato Late Blight',
                'scientific_name': 'Phytophthora infestans',
                'common_names': ['Late Blight', 'Potato Blight'],
                'category': 'fungal',
                'description': 'A devastating fungal disease that affects tomatoes and potatoes, causing dark lesions on leaves, stems, and fruits.',
                'symptoms': 'Dark, water-soaked lesions on leaves that rapidly expand. White fungal growth on leaf undersides during humid conditions. Brown to black lesions on stems and fruits.',
                'visual_indicators': [
                    'Dark brown or black lesions with irregular borders',
                    'White fuzzy growth on leaf undersides',
                    'Rapid wilting and death of affected plant parts',
                    'Distinctive musty odor'
                ],
                'affected_crops': ['tomato', 'potato'],
                'typical_severity': 'high',
                'spread_rate': 'Very rapid in humid conditions',
                'seasonal_pattern': 'Most common in cool, wet weather (60-70°F with high humidity)',
                'favorable_conditions': {
                    'temperature': '60-70°F (15-21°C)',
                    'humidity': 'High (>90%)',
                    'moisture': 'Wet leaves for 12+ hours',
                    'weather': 'Cool, rainy periods'
                },
                'prevention_methods': 'Use resistant varieties, ensure good air circulation, avoid overhead watering, apply preventive fungicides.',
                'organic_treatments': 'Copper-based fungicides, baking soda spray, neem oil, remove affected plant parts.',
                'chemical_treatments': 'Chlorothalonil, mancozeb, metalaxyl-based fungicides.',
                'confidence_threshold': 0.8
            },
            {
                'name': 'Tomato Early Blight',
                'scientific_name': 'Alternaria solani',
                'common_names': ['Early Blight', 'Target Spot'],
                'category': 'fungal',
                'description': 'A common fungal disease causing circular lesions with concentric rings on tomato leaves and fruits.',
                'symptoms': 'Circular brown spots with concentric rings (target-like appearance) on lower leaves. Yellowing and dropping of affected leaves. Dark, sunken lesions on fruits.',
                'visual_indicators': [
                    'Circular brown spots with target-like rings',
                    'Yellowing leaves starting from bottom',
                    'Dark, sunken spots on fruits',
                    'Stem lesions with dark rings'
                ],
                'affected_crops': ['tomato', 'potato', 'pepper'],
                'typical_severity': 'medium',
                'spread_rate': 'Moderate, spreads through spores',
                'seasonal_pattern': 'Common in warm, humid weather throughout growing season',
                'favorable_conditions': {
                    'temperature': '75-85°F (24-29°C)',
                    'humidity': 'High humidity',
                    'moisture': 'Wet foliage',
                    'stress': 'Plant stress increases susceptibility'
                },
                'prevention_methods': 'Crop rotation, mulching, proper spacing, avoid overhead watering.',
                'organic_treatments': 'Copper fungicides, baking soda, compost tea, remove affected leaves.',
                'chemical_treatments': 'Chlorothalonil, mancozeb, azoxystrobin.',
                'confidence_threshold': 0.75
            },
            {
                'name': 'Powdery Mildew',
                'scientific_name': 'Erysiphe cichoracearum',
                'common_names': ['Powdery Mildew', 'White Mold'],
                'category': 'fungal',
                'description': 'A fungal disease that creates white, powdery coating on leaves and stems of various crops.',
                'symptoms': 'White, powdery coating on upper leaf surfaces. Yellowing and distortion of leaves. Stunted growth and reduced yield.',
                'visual_indicators': [
                    'White, powdery coating on leaves',
                    'Yellowing and curling of leaves',
                    'Stunted plant growth',
                    'Premature leaf drop'
                ],
                'affected_crops': ['cucumber', 'pepper', 'tomato', 'lettuce'],
                'typical_severity': 'medium',
                'spread_rate': 'Moderate to fast in dry conditions',
                'seasonal_pattern': 'Common in warm, dry days with cool nights',
                'favorable_conditions': {
                    'temperature': '68-78°F (20-26°C)',
                    'humidity': 'Moderate humidity (40-70%)',
                    'moisture': 'Dry conditions paradoxically favor this disease',
                    'air_circulation': 'Poor air circulation increases risk'
                },
                'prevention_methods': 'Proper spacing, good air circulation, resistant varieties.',
                'organic_treatments': 'Baking soda spray, milk spray, neem oil, sulfur dust.',
                'chemical_treatments': 'Myclobutanil, propiconazole, trifloxystrobin.',
                'confidence_threshold': 0.85
            },
            {
                'name': 'Bacterial Spot',
                'scientific_name': 'Xanthomonas vesicatoria',
                'common_names': ['Bacterial Spot', 'Bacterial Speck'],
                'category': 'bacterial',
                'description': 'A bacterial disease causing small, dark spots on leaves and fruits of tomatoes and peppers.',
                'symptoms': 'Small, dark brown to black spots on leaves with yellow halos. Raised, scab-like lesions on fruits. Defoliation in severe cases.',
                'visual_indicators': [
                    'Small, dark spots with yellow halos',
                    'Raised, corky lesions on fruits',
                    'Leaf yellowing and drop',
                    'Water-soaked appearance initially'
                ],
                'affected_crops': ['tomato', 'pepper'],
                'typical_severity': 'medium',
                'spread_rate': 'Fast in wet, warm conditions',
                'seasonal_pattern': 'Most active in warm, wet weather',
                'favorable_conditions': {
                    'temperature': '75-86°F (24-30°C)',
                    'humidity': 'High humidity',
                    'moisture': 'Wet conditions, rain splash',
                    'wounds': 'Entry through natural openings or wounds'
                },
                'prevention_methods': 'Use pathogen-free seeds, avoid overhead irrigation, copper sprays.',
                'organic_treatments': 'Copper-based bactericides, remove affected plants.',
                'chemical_treatments': 'Copper hydroxide, copper sulfate, streptomycin.',
                'confidence_threshold': 0.7
            },
            {
                'name': 'Aphid Infestation',
                'scientific_name': 'Aphidoidea',
                'common_names': ['Aphids', 'Plant Lice', 'Greenfly'],
                'category': 'pest',
                'description': 'Small, soft-bodied insects that feed on plant sap, causing stunted growth and transmitting viruses.',
                'symptoms': 'Clusters of small, soft-bodied insects on leaves and stems. Yellowing and curling of leaves. Sticky honeydew on plant surfaces.',
                'visual_indicators': [
                    'Small green, black, or white insects in clusters',
                    'Curled or distorted leaves',
                    'Sticky honeydew on leaves',
                    'Sooty mold growth on honeydew'
                ],
                'affected_crops': ['tomato', 'pepper', 'cucumber', 'lettuce', 'cabbage'],
                'typical_severity': 'low',
                'spread_rate': 'Very fast reproduction',
                'seasonal_pattern': 'Most active in spring and early summer',
                'favorable_conditions': {
                    'temperature': '65-80°F (18-27°C)',
                    'humidity': 'Moderate humidity',
                    'nitrogen': 'High nitrogen levels attract aphids',
                    'stress': 'Stressed plants more susceptible'
                },
                'prevention_methods': 'Beneficial insects, reflective mulches, avoid over-fertilizing.',
                'organic_treatments': 'Insecticidal soap, neem oil, ladybugs, lacewings.',
                'chemical_treatments': 'Imidacloprid, thiamethoxam, pyrethroids.',
                'confidence_threshold': 0.9
            }
        ]
        
        created_diseases = []
        for disease_data in diseases_data:
            disease, created = Disease.objects.get_or_create(
                name=disease_data['name'],
                defaults=disease_data
            )
            if created:
                created_diseases.append(disease)
                self.stdout.write(f'Created disease: {disease.name}')
            else:
                self.stdout.write(f'Disease already exists: {disease.name}')
        
        # Create sample treatments
        treatments_data = [
            # Tomato Late Blight treatments
            {
                'disease_name': 'Tomato Late Blight',
                'name': 'Copper Fungicide Spray',
                'treatment_type': 'preventive',
                'method': 'chemical',
                'description': 'Apply copper-based fungicide as preventive measure',
                'detailed_instructions': 'Mix copper fungicide according to label instructions. Spray thoroughly covering all plant surfaces. Apply in early morning or evening to avoid leaf burn.',
                'timing': 'Apply before disease symptoms appear, especially during cool, wet weather',
                'frequency': 'Every 7-10 days during favorable disease conditions',
                'duration': 'Continue throughout growing season as needed',
                'materials_needed': ['Copper fungicide', 'Sprayer', 'Water'],
                'effectiveness_rating': 4.2,
                'suitable_crops': ['tomato', 'potato']
            },
            {
                'disease_name': 'Tomato Late Blight',
                'name': 'Remove Affected Plant Parts',
                'treatment_type': 'curative',
                'method': 'cultural',
                'description': 'Immediately remove and destroy infected plant material',
                'detailed_instructions': 'Cut affected leaves, stems, and fruits at least 6 inches below visible symptoms. Dispose in trash, not compost. Disinfect tools between cuts.',
                'timing': 'As soon as symptoms are noticed',
                'frequency': 'Check plants daily and remove as needed',
                'duration': 'Throughout growing season',
                'materials_needed': ['Clean pruning shears', 'Disinfectant', 'Trash bags'],
                'effectiveness_rating': 3.8,
                'suitable_crops': ['tomato', 'potato']
            },
            # Tomato Early Blight treatments
            {
                'disease_name': 'Tomato Early Blight',
                'name': 'Baking Soda Spray',
                'treatment_type': 'curative',
                'method': 'organic',
                'description': 'Organic fungicide spray using baking soda',
                'detailed_instructions': 'Mix 1 tablespoon baking soda + 1/2 teaspoon liquid soap per quart of water. Spray on affected areas and surrounding healthy tissue.',
                'timing': 'Apply at first sign of symptoms',
                'frequency': 'Every 3-5 days until symptoms improve',
                'duration': '2-3 weeks or until symptoms resolve',
                'materials_needed': ['Baking soda', 'Liquid soap', 'Water', 'Sprayer'],
                'effectiveness_rating': 3.5,
                'suitable_crops': ['tomato', 'pepper']
            },
            # Powdery Mildew treatments
            {
                'disease_name': 'Powdery Mildew',
                'name': 'Milk Spray Treatment',
                'treatment_type': 'curative',
                'method': 'organic',
                'description': 'Natural antifungal treatment using milk',
                'detailed_instructions': 'Mix 1 part milk with 9 parts water. Spray on affected leaves in early morning. The proteins in milk have antifungal properties.',
                'timing': 'Apply at first sign of white powdery coating',
                'frequency': 'Every 3 days for 2 weeks',
                'duration': 'Continue until symptoms disappear',
                'materials_needed': ['Fresh milk', 'Water', 'Sprayer'],
                'effectiveness_rating': 3.7,
                'suitable_crops': ['cucumber', 'pepper', 'tomato']
            },
            # Bacterial Spot treatments
            {
                'disease_name': 'Bacterial Spot',
                'name': 'Copper Bactericide',
                'treatment_type': 'curative',
                'method': 'chemical',
                'description': 'Copper-based bactericide for bacterial diseases',
                'detailed_instructions': 'Apply copper hydroxide or copper sulfate according to label rates. Ensure good coverage of all plant surfaces.',
                'timing': 'Apply at first sign of bacterial spots',
                'frequency': 'Every 5-7 days',
                'duration': 'Continue for 3-4 applications',
                'materials_needed': ['Copper bactericide', 'Sprayer', 'Water'],
                'effectiveness_rating': 4.0,
                'suitable_crops': ['tomato', 'pepper']
            },
            # Aphid treatments
            {
                'disease_name': 'Aphid Infestation',
                'name': 'Insecticidal Soap Spray',
                'treatment_type': 'curative',
                'method': 'organic',
                'description': 'Safe, organic treatment for soft-bodied insects',
                'detailed_instructions': 'Mix insecticidal soap according to label instructions. Spray directly on aphid colonies, ensuring contact with insects.',
                'timing': 'Apply when aphids are first noticed',
                'frequency': 'Every 2-3 days until population is controlled',
                'duration': '1-2 weeks typically sufficient',
                'materials_needed': ['Insecticidal soap', 'Water', 'Sprayer'],
                'effectiveness_rating': 4.3,
                'suitable_crops': ['tomato', 'pepper', 'cucumber', 'lettuce']
            },
            {
                'disease_name': 'Aphid Infestation',
                'name': 'Beneficial Insect Release',
                'treatment_type': 'biological',
                'method': 'biological',
                'description': 'Introduce natural predators to control aphid populations',
                'detailed_instructions': 'Release ladybugs or lacewings in the garden. Provide habitat for beneficial insects with diverse plantings.',
                'timing': 'Early in season before aphid populations explode',
                'frequency': 'One-time release, may need to repeat if population doesn\'t establish',
                'duration': 'Beneficial insects provide ongoing control',
                'materials_needed': ['Ladybugs or lacewings', 'Diverse flowering plants'],
                'effectiveness_rating': 4.5,
                'suitable_crops': ['tomato', 'pepper', 'cucumber', 'lettuce', 'cabbage']
            }
        ]
        
        created_treatments = []
        for treatment_data in treatments_data:
            try:
                disease = Disease.objects.get(name=treatment_data['disease_name'])
                treatment_data.pop('disease_name')  # Remove this key as it's not a model field
                treatment_data['disease'] = disease
                
                treatment, created = Treatment.objects.get_or_create(
                    name=treatment_data['name'],
                    disease=disease,
                    defaults=treatment_data
                )
                if created:
                    created_treatments.append(treatment)
                    self.stdout.write(f'Created treatment: {treatment.name} for {disease.name}')
                else:
                    self.stdout.write(f'Treatment already exists: {treatment.name}')
            except Disease.DoesNotExist:
                self.stdout.write(f'Disease not found: {treatment_data["disease_name"]}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated database with {len(created_diseases)} diseases '
                f'and {len(created_treatments)} treatments'
            )
        )