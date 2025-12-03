"""
Django management command to setup Elasticsearch indexes
"""
from django.core.management.base import BaseCommand
from shared.database.elasticsearch_config import setup_elasticsearch_indexes, ELASTICSEARCH_INDEXES


class Command(BaseCommand):
    help = 'Setup Elasticsearch indexes for all services'

    def add_arguments(self, parser):
        parser.add_argument(
            '--service',
            type=str,
            help='Setup Elasticsearch for a specific service only',
        )
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Delete and recreate existing indexes',
        )

    def handle(self, *args, **options):
        service_name = options.get('service')
        recreate = options.get('recreate', False)
        
        if recreate:
            self.stdout.write(
                self.style.WARNING('⚠ Recreate mode: existing indexes will be deleted')
            )
        
        if service_name:
            # Setup specific service
            self.stdout.write(f'Setting up Elasticsearch for service: {service_name}')
            try:
                if recreate:
                    from shared.database.elasticsearch_config import ElasticsearchManager
                    es = ElasticsearchManager.get_instance(service_name)
                    indexes = ELASTICSEARCH_INDEXES.get(service_name, {})
                    for index_name in indexes.keys():
                        full_index_name = f"{service_name}_{index_name}"
                        if es.client.indices.exists(index=full_index_name):
                            es.client.indices.delete(index=full_index_name)
                            self.stdout.write(f'  Deleted index: {full_index_name}')
                
                setup_elasticsearch_indexes(service_name)
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Elasticsearch setup completed for {service_name}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to setup Elasticsearch for {service_name}: {e}')
                )
        else:
            # Setup all services
            self.stdout.write('Setting up Elasticsearch for all services...')
            success_count = 0
            fail_count = 0
            
            for service in ELASTICSEARCH_INDEXES.keys():
                try:
                    if recreate:
                        from shared.database.elasticsearch_config import ElasticsearchManager
                        es = ElasticsearchManager.get_instance(service)
                        indexes = ELASTICSEARCH_INDEXES.get(service, {})
                        for index_name in indexes.keys():
                            full_index_name = f"{service}_{index_name}"
                            if es.client.indices.exists(index=full_index_name):
                                es.client.indices.delete(index=full_index_name)
                    
                    setup_elasticsearch_indexes(service)
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ {service}')
                    )
                    success_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'✗ {service}: {e}')
                    )
                    fail_count += 1
            
            self.stdout.write('')
            self.stdout.write(
                self.style.SUCCESS(
                    f'Elasticsearch setup completed: {success_count} successful, {fail_count} failed'
                )
            )
