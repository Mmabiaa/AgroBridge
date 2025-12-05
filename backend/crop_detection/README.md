# Crop Detection Service

## Overview
The Crop Detection Service provides AI-powered disease detection and treatment recommendations for agricultural crops. It allows farmers to upload images of their crops and receive instant analysis with actionable treatment suggestions.

## Features

### 🔍 Disease Detection
- Upload crop images for AI analysis
- Detect multiple diseases per image
- Confidence scoring for each detection
- Bounding box identification of affected areas
- Support for 12+ crop types

### 💊 Treatment Recommendations
- Intelligent treatment suggestions based on detected diseases
- Filter by organic/chemical preferences
- Effectiveness ratings for each treatment
- Detailed application instructions
- Safety precautions and environmental impact information

### 📊 Analytics & History
- Track scan history and trends
- User performance statistics
- Health score tracking over time
- Disease pattern analysis

### 👨‍🔬 Expert Review System
- Quality assurance workflow
- Expert validation of AI predictions
- Feedback loop for model improvement

## API Endpoints

### Disease Management
```
GET /api/v1/crop-detection/diseases/          # List diseases
GET /api/v1/crop-detection/diseases/{id}/     # Get disease details
GET /api/v1/crop-detection/diseases/search/   # Search diseases
GET /api/v1/crop-detection/diseases/categories/ # Get disease categories
```

### Treatment Management
```
GET /api/v1/crop-detection/treatments/        # List treatments
GET /api/v1/crop-detection/treatments/{id}/   # Get treatment details
POST /api/v1/crop-detection/treatments/recommend/ # Get recommendations
```

### Crop Scanning
```
POST /api/v1/crop-detection/scans/            # Upload and analyze image
GET /api/v1/crop-detection/scans/             # List user's scans
GET /api/v1/crop-detection/scans/{id}/        # Get scan details
POST /api/v1/crop-detection/scans/{id}/feedback/ # Provide feedback
GET /api/v1/crop-detection/scans/statistics/  # Get user statistics
```

### Quick Analysis
```
POST /api/v1/crop-detection/analysis/analyze/ # Analyze without saving
GET /api/v1/crop-detection/analysis/supported_crops/ # Get supported crops
```

### History & Analytics
```
GET /api/v1/crop-detection/history/summary/   # Get user's scan history
```

## Usage Examples

### 1. Upload and Analyze Crop Image

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@crop_photo.jpg" \
  -F "crop_type=tomato" \
  -F "location_data={\"lat\": 40.7128, \"lng\": -74.0060}" \
  http://localhost:8000/api/v1/crop-detection/scans/
```

### 2. Get Treatment Recommendations

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disease_id": "disease-uuid-here",
    "crop_type": "tomato",
    "organic_only": true
  }' \
  http://localhost:8000/api/v1/crop-detection/treatments/recommend/
```

### 3. Search Diseases

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/crop-detection/diseases/search/?query=blight&crop_type=tomato"
```

## Supported Crop Types

- Tomato
- Potato  
- Corn
- Wheat
- Rice
- Soybean
- Pepper
- Cucumber
- Lettuce
- Carrot
- Onion
- Cabbage

## Image Requirements

- **Formats**: JPEG, PNG, WebP
- **Max Size**: 10MB
- **Min Resolution**: 100x100 pixels
- **Recommended**: High-quality images with good lighting

## Sample Diseases Included

1. **Tomato Late Blight** (Phytophthora infestans)
2. **Tomato Early Blight** (Alternaria solani)  
3. **Powdery Mildew** (Erysiphe cichoracearum)
4. **Bacterial Spot** (Xanthomonas vesicatoria)
5. **Aphid Infestation** (Aphidoidea)

## Management Commands

### Populate Sample Data
```bash
python manage.py populate_crop_diseases
```

## Testing

Run the complete test suite:
```bash
python manage.py test crop_detection
```

Run specific test categories:
```bash
# Model tests
python manage.py test crop_detection.tests.CropDetectionModelTests

# API tests  
python manage.py test crop_detection.tests.DiseaseAPITests
python manage.py test crop_detection.tests.CropScanAPITests

# Service tests
python manage.py test crop_detection.tests.ImageAnalysisServiceTests
```

## Development Setup

1. **Install Dependencies**
   ```bash
   pip install Pillow  # For image processing
   ```

2. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

3. **Populate Sample Data**
   ```bash
   python manage.py populate_crop_diseases
   ```

4. **Create Superuser** (optional)
   ```bash
   python manage.py createsuperuser
   ```

5. **Start Development Server**
   ```bash
   python manage.py runserver
   ```

## Production Considerations

### ML Model Integration
The current implementation uses a mock analysis service. For production:

1. Replace `ImageAnalysisService` with real ML model integration
2. Consider using YOLOv5/YOLOv8 for object detection
3. Implement model versioning and A/B testing
4. Add GPU support for faster inference

### Async Processing
For production workloads:

1. Integrate with Celery for background processing
2. Use Redis/RabbitMQ for task queuing
3. Implement progress tracking for long-running tasks

### Storage & CDN
1. Configure cloud storage (AWS S3, Google Cloud Storage)
2. Set up CDN for image delivery
3. Implement image optimization and resizing

### Monitoring
1. Set up application monitoring (Sentry, New Relic)
2. Configure performance metrics collection
3. Implement health checks and alerting

## Security

- All endpoints require JWT authentication
- Image uploads are validated for type and size
- Malware scanning recommended for production
- Rate limiting implemented to prevent abuse

## Contributing

1. Follow Django best practices
2. Write tests for new features
3. Update documentation
4. Follow PEP 8 style guidelines

## License

This service is part of the AgroBridge platform and follows the project's licensing terms.