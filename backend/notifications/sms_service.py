"""
SMS Notification Service

This module handles SMS notification delivery using Twilio and Africa's Talking
for African markets.
"""

import logging
from typing import Optional, Dict, Any
from django.conf import settings
from .models import Notification

logger = logging.getLogger(__name__)

# SMS configuration
SMS_PROVIDER = getattr(settings, 'SMS_PROVIDER', 'twilio')  # 'twilio' or 'africastalking'
TWILIO_ACCOUNT_SID = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
TWILIO_AUTH_TOKEN = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
TWILIO_FROM_NUMBER = getattr(settings, 'TWILIO_FROM_NUMBER', None)
AFRICASTALKING_USERNAME = getattr(settings, 'AFRICASTALKING_USERNAME', None)
AFRICASTALKING_API_KEY = getattr(settings, 'AFRICASTALKING_API_KEY', None)
AFRICASTALKING_SENDER_ID = getattr(settings, 'AFRICASTALKING_SENDER_ID', 'AgroBridge')


class TwilioSMSService:
    """Twilio SMS service"""
    
    def __init__(self):
        self.account_sid = TWILIO_ACCOUNT_SID
        self.auth_token = TWILIO_AUTH_TOKEN
        self.from_number = TWILIO_FROM_NUMBER
        
        if not all([self.account_sid, self.auth_token, self.from_number]):
            logger.warning("Twilio SMS not fully configured")
    
    def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        """
        Send SMS via Twilio
        
        Args:
            to_number: Recipient phone number
            message: SMS message content
            
        Returns:
            Dictionary with send result
        """
        try:
            from twilio.rest import Client
            
            client = Client(self.account_sid, self.auth_token)
            
            message_obj = client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            return {
                'success': True,
                'message_id': message_obj.sid,
                'status': message_obj.status,
            }
            
        except Exception as e:
            logger.error(f"Twilio SMS send failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }


class AfricasTalkingSMSService:
    """Africa's Talking SMS service"""
    
    def __init__(self):
        self.username = AFRICASTALKING_USERNAME
        self.api_key = AFRICASTALKING_API_KEY
        self.sender_id = AFRICASTALKING_SENDER_ID
        
        if not all([self.username, self.api_key]):
            logger.warning("Africa's Talking SMS not fully configured")
    
    def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        """
        Send SMS via Africa's Talking
        
        Args:
            to_number: Recipient phone number
            message: SMS message content
            
        Returns:
            Dictionary with send result
        """
        try:
            import africastalking
            
            # Initialize SDK
            africastalking.initialize(self.username, self.api_key)
            sms = africastalking.SMS
            
            # Send SMS
            response = sms.send(
                message=message,
                recipients=[to_number],
                sender_id=self.sender_id
            )
            
            # Parse response
            if response['SMSMessageData']['Recipients']:
                recipient = response['SMSMessageData']['Recipients'][0]
                
                if recipient['status'] == 'Success':
                    return {
                        'success': True,
                        'message_id': recipient['messageId'],
                        'status': recipient['status'],
                        'cost': recipient.get('cost', ''),
                    }
                else:
                    return {
                        'success': False,
                        'error': recipient['status'],
                    }
            else:
                return {
                    'success': False,
                    'error': 'No recipients in response',
                }
                
        except Exception as e:
            logger.error(f"Africa's Talking SMS send failed: {e}")
            return {
                'success': False,
                'error': str(e),
            }


def get_sms_service():
    """
    Get configured SMS service
    
    Returns:
        SMS service instance
    """
    if SMS_PROVIDER == 'twilio':
        return TwilioSMSService()
    elif SMS_PROVIDER == 'africastalking':
        return AfricasTalkingSMSService()
    else:
        raise ValueError(f"Unknown SMS provider: {SMS_PROVIDER}")


def send_sms_notification(notification: Notification, phone_number: str) -> bool:
    """
    Send SMS notification
    
    Args:
        notification: Notification to send via SMS
        phone_number: Recipient phone number
        
    Returns:
        True if sent successfully
    """
    try:
        # Format phone number
        formatted_number = format_phone_number(phone_number)
        if not formatted_number:
            logger.error(f"Invalid phone number: {phone_number}")
            return False
        
        # Get SMS message
        message = _get_sms_message(notification)
        
        # Send SMS
        sms_service = get_sms_service()
        result = sms_service.send_sms(formatted_number, message)
        
        if result['success']:
            logger.info(f"SMS notification {notification.id} sent to {formatted_number}")
            return True
        else:
            logger.error(f"SMS notification {notification.id} failed: {result.get('error')}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send SMS notification {notification.id}: {e}")
        return False


def send_sms(phone_number: str, message: str) -> bool:
    """
    Send SMS message
    
    Args:
        phone_number: Recipient phone number
        message: SMS message content
        
    Returns:
        True if sent successfully
    """
    try:
        formatted_number = format_phone_number(phone_number)
        if not formatted_number:
            logger.error(f"Invalid phone number: {phone_number}")
            return False
        
        sms_service = get_sms_service()
        result = sms_service.send_sms(formatted_number, message)
        
        if result['success']:
            logger.info(f"SMS sent to {formatted_number}")
            return True
        else:
            logger.error(f"SMS send failed: {result.get('error')}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send SMS: {e}")
        return False


def _get_sms_message(notification: Notification) -> str:
    """
    Generate SMS message for notification
    
    Args:
        notification: Notification instance
        
    Returns:
        SMS message string (max 160 characters)
    """
    # Check if notification has template-rendered SMS message
    if hasattr(notification, '_sms_message'):
        return notification._sms_message
    
    # Generate SMS message
    message = f"{notification.title}: {notification.message}"
    
    # Add action URL if present and space allows
    if notification.action_url and len(message) < 120:
        message += f" {notification.action_url}"
    
    # Truncate if too long
    if len(message) > 160:
        message = message[:157] + "..."
    
    return message


def format_phone_number(phone_number: str) -> Optional[str]:
    """
    Format phone number for SMS sending
    
    Args:
        phone_number: Raw phone number
        
    Returns:
        Formatted phone number or None if invalid
    """
    if not phone_number:
        return None
    
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone_number))
    
    if not digits:
        return None
    
    # Handle different country formats
    if digits.startswith('0'):
        # Remove leading zero for local numbers
        digits = digits[1:]
    
    # Add country code if missing
    if len(digits) == 9:  # Assuming 9-digit local number
        # Default to Ghana (+233) - adjust based on your target market
        digits = '233' + digits
    elif len(digits) == 10:
        # Could be various countries, assume Ghana
        digits = '233' + digits
    
    # Ensure it starts with +
    if not digits.startswith('+'):
        digits = '+' + digits
    
    # Validate length (international numbers are typically 10-15 digits)
    if len(digits) < 10 or len(digits) > 16:
        return None
    
    return digits


def validate_phone_number(phone_number: str) -> bool:
    """
    Validate phone number format
    
    Args:
        phone_number: Phone number to validate
        
    Returns:
        True if valid
    """
    formatted = format_phone_number(phone_number)
    return formatted is not None


def send_verification_sms(phone_number: str, verification_code: str) -> bool:
    """
    Send SMS verification code
    
    Args:
        phone_number: Recipient phone number
        verification_code: Verification code
        
    Returns:
        True if sent successfully
    """
    message = f"Your AgroBridge verification code is: {verification_code}. Valid for 10 minutes."
    return send_sms(phone_number, message)


def send_alert_sms(phone_number: str, alert_message: str) -> bool:
    """
    Send emergency alert SMS
    
    Args:
        phone_number: Recipient phone number
        alert_message: Alert message
        
    Returns:
        True if sent successfully
    """
    message = f"ALERT: {alert_message} - AgroBridge"
    return send_sms(phone_number, message)