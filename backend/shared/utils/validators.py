"""
Common validation utilities
"""
import re
from typing import Optional


def validate_phone_number(phone: str) -> bool:
    """
    Validate phone number format
    Supports international format with country code
    """
    pattern = r'^\+?[1-9]\d{1,14}$'
    return bool(re.match(pattern, phone))


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_coordinates(latitude: float, longitude: float) -> bool:
    """Validate geographic coordinates"""
    return -90 <= latitude <= 90 and -180 <= longitude <= 180


def sanitize_string(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize string input by removing dangerous characters
    """
    # Remove null bytes and control characters
    sanitized = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
    
    if max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized.strip()
