"""
Management command to send task reminders
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from scheduling.models import Task
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Send reminders for upcoming tasks'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without actually sending reminders',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write('Checking for tasks that need reminders...')
        
        # Get tasks that need reminders
        now = timezone.now()
        
        # Find tasks where:
        # 1. Reminder is enabled
        # 2. Reminder hasn't been sent yet
        # 3. Current time is past the reminder time
        # 4. Task is not completed or cancelled
        
        tasks_needing_reminders = Task.objects.filter(
            reminder_enabled=True,
            reminder_sent=False,
            status__in=['pending', 'in_progress']
        )
        
        reminders_sent = 0
        
        for task in tasks_needing_reminders:
            reminder_time = task.due_date - timedelta(minutes=task.reminder_time)
            
            if now >= reminder_time:
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f'[DRY RUN] Would send reminder for task: {task.title} '
                            f'(due: {task.due_date})'
                        )
                    )
                else:
                    try:
                        success = task.send_reminder()
                        if success:
                            reminders_sent += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'Sent reminder for task: {task.title}'
                                )
                            )
                        else:
                            self.stdout.write(
                                self.style.WARNING(
                                    f'Reminder already sent or not yet time for task: {task.title}'
                                )
                            )
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(
                                f'Failed to send reminder for task {task.title}: {str(e)}'
                            )
                        )
                        logger.error(f'Failed to send reminder for task {task.id}: {str(e)}')
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'[DRY RUN] Would have sent {reminders_sent} reminders'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully sent {reminders_sent} task reminders'
                )
            )
