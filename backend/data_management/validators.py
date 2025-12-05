"""
Data Validation Utilities

Provides comprehensive data validation for all input across the platform.
"""
import re
from typing import Any, Dict, List
from django.core.exceptions import ValidationError
from django.core.validators import validate_email as django_validate_email
import json


class DataValidator:
    """Comprehensive data validation utilities."""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format."""
        try:
            django_validate_email(email)
            return True
        except ValidationError:
            return False
    
    @staticmethod
    def validate_phone(phone: str, country_code: str = None) -> bool:
        """
        Validate phone number format.
        Supports international formats.
        """
        # Remove spaces and dashes
        phone = re.sub(r'[\s\-\(\)]', '', phone)
        
        # Check for international format
        if phone.startswith('+'):
            # International format: +[country code][number]
            pattern = r'^\+[1-9]\d{1,14}$'
        else:
            # Local format (10-15 digits)
            pattern = r'^\d{10,15}$'
        
        return bool(re.match(pattern, phone))
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """Validate URL format."""
        pattern = r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
        return bool(re.match(pattern, url))
    
    @staticmethod
    def validate_geojson(geojson_data: Dict) -> bool:
        """Validate GeoJSON format."""
        try:
            if not isinstance(geojson_data, dict):
                return False
            
            # Check required fields
            if 'type' not in geojson_data:
                return False
            
            valid_types = [
                'Point', 'LineString', 'Polygon', 'MultiPoint',
                'MultiLineString', 'MultiPolygon', 'GeometryCollection',
                'Feature', 'FeatureCollection'
            ]
            
            if geojson_data['type'] not in valid_types:
                return False
            
            # Check coordinates for geometry types
            if geojson_data['type'] in ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon']:
                if 'coordinates' not in geojson_data:
                    return False
            
            return True
        except Exception:
            return False
    
    @staticmethod
    def validate_coordinates(latitude: float, longitude: float) -> bool:
        """Validate geographic coordinates."""
        try:
            lat = float(latitude)
            lon = float(longitude)
            return -90 <= lat <= 90 and -180 <= lon <= 180
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def validate_date_range(start_date, end_date) -> bool:
        """Validate that end_date is after start_date."""
        if not start_date or not end_date:
            return False
        return end_date >= start_date
    
    @staticmethod
    def validate_positive_number(value: Any) -> bool:
        """Validate that value is a positive number."""
        try:
            num = float(value)
            return num > 0
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def validate_json(json_string: str) -> bool:
        """Validate JSON format."""
        try:
            json.loads(json_string)
            return True
        except (json.JSONDecodeError, TypeError):
            return False
    
    @staticmethod
    def sanitize_html(text: str) -> str:
        """Sanitize HTML to prevent XSS attacks."""
        import html
        return html.escape(text)
    
    @staticmethod
    def sanitize_sql(text: str) -> str:
        """Sanitize input to prevent SQL injection."""
        # Remove common SQL injection patterns
        dangerous_patterns = [
            r'(\bOR\b|\bAND\b).*=.*',
            r';\s*DROP\s+TABLE',
            r';\s*DELETE\s+FROM',
            r';\s*UPDATE\s+',
            r';\s*INSERT\s+INTO',
            r'--',
            r'/\*.*\*/',
        ]
        
        for pattern in dangerous_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text
    
    @staticmethod
    def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
        """Validate file extension."""
        if not filename:
            return False
        
        extension = filename.rsplit('.', 1)[-1].lower()
        return extension in [ext.lower() for ext in allowed_extensions]
    
    @staticmethod
    def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
        """Validate file size."""
        max_size_bytes = max_size_mb * 1024 * 1024
        return 0 < file_size <= max_size_bytes
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """
        Validate password strength.
        Returns dict with validation results.
        """
        result = {
            'valid': True,
            'errors': []
        }
        
        if len(password) < 8:
            result['valid'] = False
            result['errors'].append('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', password):
            result['valid'] = False
            result['errors'].append('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', password):
            result['valid'] = False
            result['errors'].append('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', password):
            result['valid'] = False
            result['errors'].append('Password must contain at least one digit')
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            result['valid'] = False
            result['errors'].append('Password must contain at least one special character')
        
        return result
    
    @staticmethod
    def validate_username(username: str) -> Dict[str, Any]:
        """Validate username format."""
        result = {
            'valid': True,
            'errors': []
        }
        
        if len(username) < 3:
            result['valid'] = False
            result['errors'].append('Username must be at least 3 characters long')
        
        if len(username) > 30:
            result['valid'] = False
            result['errors'].append('Username must be at most 30 characters long')
        
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            result['valid'] = False
            result['errors'].append('Username can only contain letters, numbers, and underscores')
        
        return result
    
    @staticmethod
    def validate_currency_code(code: str) -> bool:
        """Validate ISO 4217 currency code."""
        # Common currency codes
        valid_codes = [
            'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR',
            'XOF', 'XAF', 'EGP', 'MAD', 'TZS', 'UGX'
        ]
        return code.upper() in valid_codes
    
    @staticmethod
    def validate_country_code(code: str) -> bool:
        """Validate ISO 3166-1 alpha-2 country code."""
        # African country codes
        valid_codes = [
            'NG', 'GH', 'KE', 'ZA', 'EG', 'MA', 'TZ', 'UG',
            'ET', 'CI', 'SN', 'CM', 'BF', 'ML', 'RW', 'BJ'
        ]
        return code.upper() in valid_codes


class InputSanitizer:
    """Sanitize user inputs to prevent security vulnerabilities."""
    
    @staticmethod
    def sanitize_string(text: str, max_length: int = None) -> str:
        """Sanitize string input."""
        if not text:
            return ''
        
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Strip whitespace
        text = text.strip()
        
        # Limit length
        if max_length:
            text = text[:max_length]
        
        return text
    
    @staticmethod
    def sanitize_integer(value: Any, min_value: int = None, max_value: int = None) -> int:
        """Sanitize integer input."""
        try:
            num = int(value)
            
            if min_value is not None and num < min_value:
                num = min_value
            
            if max_value is not None and num > max_value:
                num = max_value
            
            return num
        except (ValueError, TypeError):
            return 0
    
    @staticmethod
    def sanitize_float(value: Any, min_value: float = None, max_value: float = None) -> float:
        """Sanitize float input."""
        try:
            num = float(value)
            
            if min_value is not None and num < min_value:
                num = min_value
            
            if max_value is not None and num > max_value:
                num = max_value
            
            return num
        except (ValueError, TypeError):
            return 0.0
    
    @staticmethod
    def sanitize_list(items: List, max_items: int = None) -> List:
        """Sanitize list input."""
        if not isinstance(items, list):
            return []
        
        if max_items:
            items = items[:max_items]
        
        return items
