# Analytics Service

The Analytics Service provides comprehensive data analysis, predictive insights, and reporting capabilities for the AgroBridge platform.

## Features

### 1. Dashboard Metrics
- **Farm Performance**: Track farm statistics, crop yields, and field utilization
- **Marketplace Statistics**: Monitor product views, orders, and revenue
- **User Activity**: Analyze community engagement and learning progress
- **Financial Summary**: View income, expenses, and budget tracking

### 2. Predictive Analytics
- **Yield Prediction**: Forecast crop yields based on historical data and conditions
- **Price Prediction**: Predict market prices for agricultural products
- **Demand Forecasting**: Forecast product demand trends

### 3. Time-Series Analysis
- **Sensor Trends**: Analyze IoT sensor data over time
- **Crop Health Trends**: Monitor crop health and disease patterns
- **Financial Trends**: Track financial performance over time

### 4. Report Generation
- Generate reports in multiple formats (PDF, CSV, Excel, JSON)
- Customizable report parameters and time periods
- Automated report generation with Celery tasks

### 5. Actionable Insights
- **Recommendations**: Farming best practices and optimization suggestions
- **Warnings**: Risk alerts and budget overruns
- **Opportunities**: Growth and improvement opportunities
- **Alerts**: Critical notifications requiring immediate attention

### 6. ML Model Management
- Track prediction model performance
- Monitor model accuracy and metrics
- Support for model versioning and deployment

## API Endpoints

### Dashboard
- `GET /api/analytics/dashboard/overview/` - Get complete dashboard overview
- `GET /api/analytics/dashboard/farm-performance/` - Get farm performance metrics
- `GET /api/analytics/dashboard/marketplace-stats/` - Get marketplace statistics
- `GET /api/analytics/dashboard/user-activity/` - Get user activity metrics
- `GET /api/analytics/dashboard/financial-summary/` - Get financial summary

### Predictive Analytics
- `POST /api/analytics/predictions/yield/` - Predict crop yield
- `POST /api/analytics/predictions/price/` - Predict market price
- `POST /api/analytics/predictions/demand/` - Forecast product demand

### Time-Series Analysis
- `GET /api/analytics/time-series/sensor-trends/` - Analyze sensor data trends
- `GET /api/analytics/time-series/crop-health/` - Analyze crop health trends
- `GET /api/analytics/time-series/financial/` - Analyze financial trends

### Reports
- `GET /api/analytics/reports/` - List user reports
- `POST /api/analytics/reports/` - Create new report
- `GET /api/analytics/reports/{id}/` - Get report details
- `GET /api/analytics/reports/{id}/download/` - Download generated report

### Insights
- `GET /api/analytics/insights/` - List user insights
- `POST /api/analytics/insights/generate/` - Generate new insights
- `POST /api/analytics/insights/{id}/mark_read/` - Mark insight as read
- `POST /api/analytics/insights/{id}/mark_acted_upon/` - Mark insight as acted upon
- `POST /api/analytics/insights/{id}/dismiss/` - Dismiss insight

### Prediction Models
- `GET /api/analytics/models/` - List active prediction models
- `GET /api/analytics/models/{id}/` - Get model details
- `GET /api/analytics/models/{id}/performance/` - Get model performance metrics

## Usage Examples

### Get Dashboard Overview
```python
import requests

response = requests.get(
    'http://localhost:8000/api/analytics/dashboard/overview/',
    params={'days': 30},
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

data = response.json()
print(f"Total farms: {data['farm_performance']['total_farms']}")
print(f"Revenue: {data['marketplace_stats']['revenue']}")
```

### Predict Crop Yield
```python
response = requests.post(
    'http://localhost:8000/api/analytics/predictions/yield/',
    json={
        'crop_type': 'tomato',
        'area': 100.0,
        'soil_type': 'loamy',
        'irrigation': True
    },
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

prediction = response.json()
print(f"Predicted yield: {prediction['predicted_yield']} kg")
print(f"Confidence: {prediction['confidence_score'] * 100}%")
```

### Generate Report
```python
from datetime import datetime, timedelta

response = requests.post(
    'http://localhost:8000/api/analytics/reports/',
    json={
        'report_type': 'farm_performance',
        'title': 'Monthly Farm Report',
        'description': 'Performance report for last month',
        'period_start': (datetime.now() - timedelta(days=30)).isoformat(),
        'period_end': datetime.now().isoformat(),
        'format': 'pdf'
    },
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

report = response.json()
print(f"Report created: {report['id']}")
print(f"Status: {report['status']}")
```

### Get Insights
```python
response = requests.get(
    'http://localhost:8000/api/analytics/insights/',
    params={'priority': 'high', 'is_read': 'false'},
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

insights = response.json()['results']
for insight in insights:
    print(f"{insight['title']}: {insight['description']}")
    print(f"Actions: {', '.join(insight['recommended_actions'])}")
```

## Background Tasks

The service uses Celery for asynchronous processing:

- **generate_report_task**: Generate reports in background
- **calculate_dashboard_metrics_task**: Pre-calculate and cache metrics
- **generate_daily_insights_task**: Generate daily insights for all users
- **cleanup_expired_reports_task**: Clean up old reports
- **update_model_performance_task**: Update ML model performance metrics

## Configuration

Add to `INSTALLED_APPS` in settings.py:
```python
INSTALLED_APPS = [
    ...
    'analytics',
]
```

Add to URL configuration:
```python
urlpatterns = [
    ...
    path('api/analytics/', include('analytics.urls')),
]
```

## Models

### DashboardMetric
Stores calculated dashboard metrics with caching support.

### PredictionModel
Tracks ML prediction models and their performance metrics.

### Prediction
Stores individual predictions made by models.

### Report
Manages report generation requests and outputs.

### Insight
Stores actionable insights generated for users.

## Testing

Run tests:
```bash
python manage.py test analytics
```

Run specific test:
```bash
python manage.py test analytics.tests.DashboardServiceTest
```

## Service Registration

The service automatically registers with Consul for service discovery:
- Service name: `analytics-service`
- Health check: `/api/analytics/health/`
- Tags: `analytics`, `metrics`, `predictions`, `reports`

## Dependencies

- Django REST Framework
- Celery (for background tasks)
- Consul (for service discovery)
- Various AgroBridge services (farms, marketplace, financial, etc.)

## Future Enhancements

1. Advanced ML models for predictions
2. Real-time analytics with streaming data
3. Custom dashboard builder
4. Advanced data visualization
5. Anomaly detection
6. Automated insight generation with AI
7. Integration with external analytics platforms
8. Advanced report templates
9. Scheduled report delivery
10. Data export to BI tools

## Support

For issues or questions, contact the development team or create an issue in the project repository.
