"""
Image analysis service for crop disease detection
"""
import logging
import time
import random
from typing import Dict, List, Optional, Tuple
from PIL import Image
import io
from django.core.files.uploadedfile import InMemoryUploadedFile
from .models import Disease, Treatment

logger = logging.getLogger(__name__)


class ImageAnalysisService:
    """
    Service for analyzing crop images and detecting diseases
    """
    
    def __init__(self):
        self.model_version = "v1.0.0-mock"
        self.supported_crops = [
            'tomato', 'potato', 'corn', 'wheat', 'rice', 'soybean',
            'pepper', 'cucumber', 'lettuce', 'carrot', 'onion', 'cabbage'
        ]
    
    def analyze_image(self, image_file, crop_type: str = None, location_data: dict = None) -> Dict:
        """
        Analyze crop image for diseases and health assessment
        
        Args:
            image_file: Uploaded image file
            crop_type: Type of crop (optional)
            location_data: GPS and location information (optional)
            
        Returns:
            Dict containing analysis results
        """
        start_time = time.time()
        
        try:
            # Validate and process image
            image_info = self._process_image(image_file)
            
            # Detect crop type if not provided
            if not crop_type:
                crop_type = self._detect_crop_type(image_file)
            
            # Perform disease detection
            disease_detections = self._detect_diseases(image_file, crop_type)
            
            # Calculate health score
            health_score = self._calculate_health_score(disease_detections, image_info)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                disease_detections, crop_type, location_data
            )
            
            # Calculate processing time
            processing_time = int((time.time() - start_time) * 1000)
            
            return {
                'success': True,
                'crop_type': crop_type,
                'health_score': health_score,
                'detected_diseases': disease_detections,
                'recommendations': recommendations,
                'confidence_scores': {
                    'overall': self._calculate_overall_confidence(disease_detections),
                    'crop_detection': 0.85,
                    'health_assessment': 0.80
                },
                'image_info': image_info,
                'model_version': self.model_version,
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'processing_time_ms': int((time.time() - start_time) * 1000)
            }
    
    def _process_image(self, image_file) -> Dict:
        """Process and extract information from image"""
        try:
            # Open image with PIL
            image = Image.open(image_file)
            
            # Get image metadata
            image_info = {
                'format': image.format,
                'mode': image.mode,
                'size': image.size,
                'width': image.width,
                'height': image.height,
                'file_size': image_file.size
            }
            
            # Extract EXIF data if available
            if hasattr(image, '_getexif') and image._getexif():
                exif_data = image._getexif()
                if exif_data:
                    image_info['has_exif'] = True
                    # Add relevant EXIF data (GPS, camera info, etc.)
            
            return image_info
            
        except Exception as e:
            logger.error(f"Image processing failed: {str(e)}")
            return {'error': str(e)}
    
    def _detect_crop_type(self, image_file) -> str:
        """
        Detect crop type from image (mock implementation)
        In production, this would use a trained ML model
        """
        # Mock crop detection - randomly select from supported crops
        # In production, this would analyze the image features
        detected_crops = ['tomato', 'pepper', 'cucumber', 'lettuce']
        return random.choice(detected_crops)
    
    def _detect_diseases(self, image_file, crop_type: str) -> List[Dict]:
        """
        Detect diseases in the crop image (mock implementation)
        In production, this would use a trained ML model
        """
        # Get diseases that affect this crop type
        relevant_diseases = Disease.objects.filter(
            affected_crops__contains=[crop_type],
            is_active=True
        )
        
        detections = []
        
        # Mock disease detection logic
        # In production, this would analyze image features using ML models
        
        # Simulate different scenarios based on random factors
        scenario = random.choice(['healthy', 'single_disease', 'multiple_diseases', 'severe'])
        
        if scenario == 'healthy':
            # No diseases detected
            pass
        
        elif scenario == 'single_disease':
            # Single disease with moderate confidence
            if relevant_diseases.exists():
                disease = random.choice(relevant_diseases)
                confidence = random.uniform(0.7, 0.9)
                
                detections.append({
                    'disease_id': str(disease.id),
                    'disease_name': disease.name,
                    'confidence_score': round(confidence, 3),
                    'affected_area_percentage': random.uniform(10, 30),
                    'severity': random.choice(['low', 'medium']),
                    'location_in_image': {
                        'x': random.randint(10, 80),
                        'y': random.randint(10, 80),
                        'width': random.randint(20, 40),
                        'height': random.randint(20, 40)
                    }
                })
        
        elif scenario == 'multiple_diseases':
            # Multiple diseases detected
            selected_diseases = random.sample(
                list(relevant_diseases), 
                min(2, len(relevant_diseases))
            )
            
            for disease in selected_diseases:
                confidence = random.uniform(0.6, 0.85)
                
                detections.append({
                    'disease_id': str(disease.id),
                    'disease_name': disease.name,
                    'confidence_score': round(confidence, 3),
                    'affected_area_percentage': random.uniform(5, 25),
                    'severity': random.choice(['low', 'medium']),
                    'location_in_image': {
                        'x': random.randint(10, 80),
                        'y': random.randint(10, 80),
                        'width': random.randint(15, 35),
                        'height': random.randint(15, 35)
                    }
                })
        
        elif scenario == 'severe':
            # Severe disease case
            if relevant_diseases.exists():
                disease = random.choice(relevant_diseases)
                confidence = random.uniform(0.85, 0.95)
                
                detections.append({
                    'disease_id': str(disease.id),
                    'disease_name': disease.name,
                    'confidence_score': round(confidence, 3),
                    'affected_area_percentage': random.uniform(40, 70),
                    'severity': random.choice(['high', 'critical']),
                    'location_in_image': {
                        'x': random.randint(5, 60),
                        'y': random.randint(5, 60),
                        'width': random.randint(30, 60),
                        'height': random.randint(30, 60)
                    }
                })
        
        return detections
    
    def _calculate_health_score(self, disease_detections: List[Dict], image_info: Dict) -> float:
        """Calculate overall plant health score (0-100)"""
        if not disease_detections:
            # No diseases detected - high health score with some variation
            return round(random.uniform(85, 95), 1)
        
        # Start with base health score
        base_score = 100.0
        
        # Reduce score based on detected diseases
        for detection in disease_detections:
            confidence = detection['confidence_score']
            affected_area = detection.get('affected_area_percentage', 20)
            severity = detection.get('severity', 'medium')
            
            # Calculate impact based on severity
            severity_multiplier = {
                'low': 0.5,
                'medium': 1.0,
                'high': 1.5,
                'critical': 2.0
            }.get(severity, 1.0)
            
            # Calculate score reduction
            impact = (affected_area / 100) * confidence * severity_multiplier * 50
            base_score -= impact
        
        # Ensure score is within bounds
        health_score = max(0.0, min(100.0, base_score))
        
        return round(health_score, 1)
    
    def _generate_recommendations(self, disease_detections: List[Dict], 
                                crop_type: str, location_data: dict = None) -> List[Dict]:
        """Generate AI recommendations based on detected diseases"""
        recommendations = []
        
        if not disease_detections:
            # Healthy plant recommendations
            recommendations.append({
                'type': 'preventive',
                'priority': 'low',
                'title': 'Maintain Plant Health',
                'description': 'Your plant appears healthy. Continue current care practices.',
                'actions': [
                    'Monitor regularly for early signs of disease',
                    'Maintain proper watering schedule',
                    'Ensure adequate nutrition',
                    'Keep growing area clean'
                ]
            })
            return recommendations
        
        # Generate recommendations for each detected disease
        for detection in disease_detections:
            try:
                disease = Disease.objects.get(id=detection['disease_id'])
                severity = detection.get('severity', 'medium')
                confidence = detection['confidence_score']
                
                # Determine priority based on severity and confidence
                if severity in ['high', 'critical'] and confidence > 0.8:
                    priority = 'urgent'
                elif severity == 'medium' and confidence > 0.7:
                    priority = 'high'
                else:
                    priority = 'medium'
                
                # Get relevant treatments
                treatments = Treatment.objects.filter(
                    disease=disease,
                    is_recommended=True,
                    suitable_crops__contains=[crop_type]
                ).order_by('-effectiveness_rating')[:3]
                
                recommendation = {
                    'type': 'treatment',
                    'priority': priority,
                    'disease_id': str(disease.id),
                    'disease_name': disease.name,
                    'title': f'Treat {disease.name}',
                    'description': f'Detected {disease.name} with {confidence:.1%} confidence.',
                    'severity': severity,
                    'confidence': confidence,
                    'immediate_actions': [
                        'Isolate affected plants if possible',
                        'Remove severely affected plant parts',
                        'Improve air circulation around plants'
                    ],
                    'treatments': []
                }
                
                # Add treatment options
                for treatment in treatments:
                    recommendation['treatments'].append({
                        'id': str(treatment.id),
                        'name': treatment.name,
                        'type': treatment.treatment_type,
                        'method': treatment.method,
                        'effectiveness': treatment.effectiveness_rating,
                        'description': treatment.description,
                        'materials': treatment.materials_needed,
                        'organic': treatment.is_organic
                    })
                
                recommendations.append(recommendation)
                
            except Disease.DoesNotExist:
                logger.warning(f"Disease not found: {detection['disease_id']}")
                continue
        
        # Add general recommendations
        if len(disease_detections) > 1:
            recommendations.append({
                'type': 'general',
                'priority': 'high',
                'title': 'Multiple Issues Detected',
                'description': 'Multiple diseases detected. Consider comprehensive treatment approach.',
                'actions': [
                    'Consult with agricultural expert',
                    'Implement integrated pest management',
                    'Monitor treatment effectiveness closely',
                    'Consider crop rotation for next season'
                ]
            })
        
        return recommendations
    
    def _calculate_overall_confidence(self, disease_detections: List[Dict]) -> float:
        """Calculate overall confidence score for the analysis"""
        if not disease_detections:
            return 0.9  # High confidence in healthy assessment
        
        # Average confidence of all detections
        confidences = [d['confidence_score'] for d in disease_detections]
        return round(sum(confidences) / len(confidences), 3)
    
    def get_supported_crops(self) -> List[str]:
        """Get list of supported crop types"""
        return self.supported_crops
    
    def validate_image(self, image_file) -> Tuple[bool, str]:
        """
        Validate uploaded image file
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check file size (max 10MB)
            if image_file.size > 10 * 1024 * 1024:
                return False, "Image file too large (max 10MB)"
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if image_file.content_type not in allowed_types:
                return False, f"Unsupported image format. Allowed: {', '.join(allowed_types)}"
            
            # Try to open image with PIL
            try:
                image = Image.open(image_file)
                image.verify()  # Verify it's a valid image
            except Exception:
                return False, "Invalid or corrupted image file"
            
            # Check image dimensions (minimum size)
            image_file.seek(0)  # Reset file pointer after verify()
            image = Image.open(image_file)
            if image.width < 100 or image.height < 100:
                return False, "Image too small (minimum 100x100 pixels)"
            
            return True, ""
            
        except Exception as e:
            return False, f"Image validation error: {str(e)}"