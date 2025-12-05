# test_smtp_fixed.py
import os
import sys
import django
import smtplib

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set the correct settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')

try:
    django.setup()
    
    from django.conf import settings
    
    print("=== SMTP Connection Test ===")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
    
    # Check if password is loaded
    if settings.EMAIL_HOST_PASSWORD:
        print("✅ EMAIL_HOST_PASSWORD: [LOADED]")
        print(f"Password length: {len(settings.EMAIL_HOST_PASSWORD)}")
    else:
        print("❌ EMAIL_HOST_PASSWORD: [NOT LOADED]")
        print("Check your .env file and environment variables")
    
    print("\nTesting SMTP connection...")
    
    try:
        # Test connection
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10)
        print("✅ Connected to SMTP server")
        
        # Test STARTTLS
        server.starttls()
        print("✅ STARTTLS enabled")
        
        # Test login
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        print("✅ Login successful")
        
        server.quit()
        print("🎉 All SMTP tests passed! Emails should work.")
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ Authentication failed: {e}")
        print("\nPossible solutions:")
        print("1. Make sure you're using an App Password, not your regular password")
        print("2. Enable 2-Factor Authentication on your Google account")
        print("3. Generate a new App Password at: https://myaccount.google.com/apppasswords")
        
    except smtplib.SMTPServerDisconnected as e:
        print(f"❌ Connection closed: {e}")
        print("\nPossible solutions:")
        print("1. Try using SSL instead of TLS (port 465)")
        print("2. Check your firewall/antivirus settings")
        print("3. Try a different network")
        
    except Exception as e:
        print(f"❌ Connection error: {e}")

except Exception as e:
    print(f"❌ Django setup failed: {e}")
    print("Make sure you're running this from your project root directory")