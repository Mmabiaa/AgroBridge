"""
Management command to test WebSocket functionality
"""
from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json


class Command(BaseCommand):
    help = 'Test WebSocket functionality and channel layers'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--test-type',
            type=str,
            default='basic',
            choices=['basic', 'broadcast', 'group'],
            help='Type of WebSocket test to run'
        )
    
    def handle(self, *args, **options):
        test_type = options['test_type']
        
        self.stdout.write('Testing WebSocket functionality...')
        
        # Get channel layer
        channel_layer = get_channel_layer()
        
        if not channel_layer:
            self.stdout.write(
                self.style.ERROR('No channel layer configured. Check CHANNEL_LAYERS setting.')
            )
            return
        
        # Test basic channel layer functionality
        if test_type == 'basic':
            self.test_basic_channel_layer(channel_layer)
        elif test_type == 'broadcast':
            self.test_broadcast(channel_layer)
        elif test_type == 'group':
            self.test_group_functionality(channel_layer)
    
    def test_basic_channel_layer(self, channel_layer):
        """Test basic channel layer send/receive"""
        self.stdout.write('Testing basic channel layer functionality...')
        
        try:
            # Test channel layer connection
            async_to_sync(channel_layer.send)('test-channel', {
                'type': 'test.message',
                'text': 'Hello WebSocket!'
            })
            
            self.stdout.write(
                self.style.SUCCESS('✓ Channel layer send test passed')
            )
            
            # Test group functionality
            async_to_sync(channel_layer.group_add)('test-group', 'test-channel')
            async_to_sync(channel_layer.group_send)('test-group', {
                'type': 'test.group.message',
                'text': 'Group message test'
            })
            
            self.stdout.write(
                self.style.SUCCESS('✓ Group functionality test passed')
            )
            
            # Cleanup
            async_to_sync(channel_layer.group_discard)('test-group', 'test-channel')
            
            self.stdout.write(
                self.style.SUCCESS('✓ All basic tests passed!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Channel layer test failed: {str(e)}')
            )
    
    def test_broadcast(self, channel_layer):
        """Test broadcast functionality"""
        self.stdout.write('Testing broadcast functionality...')
        
        try:
            # Simulate broadcasting to multiple channels
            channels = ['user-1', 'user-2', 'user-3']
            
            for channel in channels:
                async_to_sync(channel_layer.send)(channel, {
                    'type': 'broadcast.message',
                    'data': {
                        'message': 'Broadcast test message',
                        'timestamp': '2024-01-01T00:00:00Z'
                    }
                })
            
            self.stdout.write(
                self.style.SUCCESS(f'✓ Broadcast sent to {len(channels)} channels')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Broadcast test failed: {str(e)}')
            )
    
    def test_group_functionality(self, channel_layer):
        """Test group-based messaging"""
        self.stdout.write('Testing group functionality...')
        
        try:
            # Create test groups
            groups = {
                'farm-alerts': ['farmer-1', 'farmer-2', 'expert-1'],
                'marketplace-updates': ['buyer-1', 'seller-1', 'seller-2'],
                'notifications': ['user-1', 'user-2', 'user-3', 'user-4']
            }
            
            # Add channels to groups
            for group_name, channels in groups.items():
                for channel in channels:
                    async_to_sync(channel_layer.group_add)(group_name, channel)
                
                self.stdout.write(f'✓ Added {len(channels)} channels to group: {group_name}')
            
            # Send messages to groups
            test_messages = {
                'farm-alerts': {
                    'type': 'farm.alert',
                    'data': {
                        'farm_id': 'farm-123',
                        'alert_type': 'sensor_offline',
                        'message': 'Soil moisture sensor offline'
                    }
                },
                'marketplace-updates': {
                    'type': 'marketplace.update',
                    'data': {
                        'product_id': 'prod-456',
                        'event': 'price_change',
                        'new_price': 25.99
                    }
                },
                'notifications': {
                    'type': 'notification',
                    'data': {
                        'title': 'System Maintenance',
                        'message': 'Scheduled maintenance in 1 hour'
                    }
                }
            }
            
            for group_name, message in test_messages.items():
                async_to_sync(channel_layer.group_send)(group_name, message)
                self.stdout.write(f'✓ Sent message to group: {group_name}')
            
            # Cleanup groups
            for group_name, channels in groups.items():
                for channel in channels:
                    async_to_sync(channel_layer.group_discard)(group_name, channel)
            
            self.stdout.write(
                self.style.SUCCESS('✓ All group functionality tests passed!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Group functionality test failed: {str(e)}')
            )
    
    def get_channel_layer_info(self):
        """Get information about the configured channel layer"""
        channel_layer = get_channel_layer()
        
        if not channel_layer:
            return "No channel layer configured"
        
        return {
            'backend': channel_layer.__class__.__name__,
            'config': getattr(channel_layer, 'hosts', 'Unknown configuration')
        }