# marketplace/management/commands/create_categories.py
from django.core.management.base import BaseCommand
from marketplace.models import Category

class Command(BaseCommand):
    help = 'Create default categories'

    def handle(self, *args, **options):
        categories = [
            {'name': 'Fruits', 'description': 'Fresh fruits'},
            {'name': 'Vegetables', 'description': 'Fresh vegetables'},
            {'name': 'Grains', 'description': 'Various grains'},
            {'name': 'Dairy', 'description': 'Dairy products'},
            {'name': 'Meat & Poultry', 'description': 'Meat and poultry products'},
            {'name': 'Seafood', 'description': 'Fresh and frozen seafood'},
            {'name': 'Herbs & Spices', 'description': 'Fresh and dried herbs and spices'},
            {'name': 'Nuts & Seeds', 'description': 'Various nuts and seeds'},
            {'name': 'Organic Products', 'description': 'Certified organic products'},
            {'name': 'Processed Foods', 'description': 'Processed food items'},
        ]

        created_count = 0
        for category_data in categories:
            category, created = Category.objects.get_or_create(
                name=category_data['name'],
                defaults={'description': category_data['description']}
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} categories')
        )