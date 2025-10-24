from django.core.management.base import BaseCommand
from django.db.models import Count
from authentication.models import User


class Command(BaseCommand):
       help = 'Remove duplicate users by email and username'

       def handle(self, *args, **options):
           # Find duplicate emails
           duplicate_emails = User.objects.values('email').annotate(
               count=Count('id')
           ).filter(count__gt=1)

           self.stdout.write(f"Found {duplicate_emails.count()} duplicate emails")

           for item in duplicate_emails:
               email = item['email']
               users = User.objects.filter(email=email).order_by('date_joined')
               
               self.stdout.write(f"\nEmail: {email}")
               self.stdout.write(f"Total users: {users.count()}")
               
               # Keep the first user, delete the rest
               first_user = users.first()
               duplicates = users.exclude(id=first_user.id)
               
               self.stdout.write(f"Keeping: {first_user.username} (ID: {first_user.id}, Created: {first_user.date_joined})")
               self.stdout.write(f"Deleting {duplicates.count()} duplicates:")
               
               for dup in duplicates:
                   self.stdout.write(f"  - {dup.username} (ID: {dup.id}, Created: {dup.date_joined})")
                   dup.delete()

           self.stdout.write(self.style.SUCCESS("\n✅ Email cleanup complete!"))

           # Also find duplicate usernames
           duplicate_usernames = User.objects.values('username').annotate(
               count=Count('id')
           ).filter(count__gt=1)

           self.stdout.write(f"\nFound {duplicate_usernames.count()} duplicate usernames")

           for item in duplicate_usernames:
               username = item['username']
               users = User.objects.filter(username=username).order_by('date_joined')
               
               self.stdout.write(f"\nUsername: {username}")
               self.stdout.write(f"Total users: {users.count()}")
               
               # Keep the first user, delete the rest
               first_user = users.first()
               duplicates = users.exclude(id=first_user.id)
               
               self.stdout.write(f"Keeping: {first_user.username} (ID: {first_user.id}, Created: {first_user.date_joined})")
               self.stdout.write(f"Deleting {duplicates.count()} duplicates:")
               
               for dup in duplicates:
                   self.stdout.write(f"  - {dup.username} (ID: {dup.id}, Created: {dup.date_joined})")
                   dup.delete()

           self.stdout.write(self.style.SUCCESS("\n✅ All cleanup complete!"))