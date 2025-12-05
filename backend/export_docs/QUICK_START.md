# Export Documentation Service - Quick Start Guide

## Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Migrations
```bash
python manage.py makemigrations export_docs
python manage.py migrate export_docs
```

### 3. Populate Sample Data
```bash
python manage.py populate_export_data
```

### 4. Register Service with Consul (Optional)
```bash
python -m export_docs.service_registration
```

## Basic Usage

### 1. Create a Document Template (Admin)

```python
from export_docs.models import DocumentTemplate

template = DocumentTemplate.objects.create(
    name='US Commercial Invoice',
    document_type='INVOICE',
    country_code='USA',
    version='1.0'
)
```

### 2. Create an Export Document

**Via API:**
```bash
curl -X POST http://localhost:8000/api/export-docs/documents/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "template-uuid",
    "destination_country": "USA",
    "product_description": "Fresh Cocoa Beans",
    "product_category": "Agriculture",
    "hs_code": "1801001000",
    "quantity": 1000,
    "unit": "kg",
    "value": 5000,
    "currency": "USD",
    "document_data": {
      "exporter_name": "ABC Farm",
      "exporter_address": "123 Farm Road, Ghana",
      "importer_name": "XYZ Company",
      "importer_address": "456 Business St, USA"
    }
  }'
```

**Via Python:**
```python
from export_docs.services import DocumentGenerationService
from export_docs.models import DocumentTemplate

template = DocumentTemplate.objects.get(
    document_type='INVOICE',
    country_code='USA'
)

data = {
    'template': template,
    'destination_country': 'USA',
    'product_description': 'Fresh Cocoa Beans',
    'product_category': 'Agriculture',
    'hs_code': '1801001000',
    'quantity': 1000,
    'unit': 'kg',
    'value': 5000,
    'currency': 'USD',
    'document_data': {
        'exporter_name': 'ABC Farm',
        'importer_name': 'XYZ Company'
    }
}

document = DocumentGenerationService.create_and_generate(user, data)
print(f"Document created: {document.document_number}")
```

### 3. Check Compliance

**Via API:**
```bash
curl -X POST http://localhost:8000/api/export-docs/documents/{id}/check_compliance/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Via Python:**
```python
from export_docs.services import ComplianceService

is_compliant, issues, warnings = ComplianceService.check_compliance(document)

if is_compliant:
    print("Document is compliant!")
else:
    print("Compliance issues found:")
    for issue in issues:
        print(f"  - {issue['message']}")
```

### 4. Submit to Customs

**Via API:**
```bash
curl -X POST http://localhost:8000/api/export-docs/documents/{id}/submit_to_customs/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customs_system": "US_CUSTOMS"
  }'
```

**Via Python:**
```python
from export_docs.services import CustomsIntegrationService

submission = CustomsIntegrationService.submit_to_customs(
    document,
    'US_CUSTOMS'
)

print(f"Submission reference: {submission.submission_reference}")
print(f"Status: {submission.status}")
```

### 5. Get Document Statistics

**Via API:**
```bash
curl -X GET http://localhost:8000/api/export-docs/documents/statistics/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Operations

### List All Documents
```bash
curl -X GET http://localhost:8000/api/export-docs/documents/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter Documents by Status
```bash
curl -X GET "http://localhost:8000/api/export-docs/documents/?status=APPROVED" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Document Details
```bash
curl -X GET http://localhost:8000/api/export-docs/documents/{id}/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Regenerate Document
```bash
curl -X POST http://localhost:8000/api/export-docs/documents/{id}/regenerate/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "PDF",
    "include_signature": true
  }'
```

### Get Version History
```bash
curl -X GET http://localhost:8000/api/export-docs/documents/{id}/versions/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Approve Document (Admin)
```bash
curl -X POST http://localhost:8000/api/export-docs/documents/{id}/approve/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Management Commands

### Check Expired Documents
```bash
python manage.py check_expired_documents
```

### Retry Failed Submissions
```bash
python manage.py retry_failed_submissions --max-retries 3
```

### Populate Test Data
```bash
python manage.py populate_export_data
```

## Admin Interface

Access the admin interface at: `http://localhost:8000/admin/export_docs/`

Available admin sections:
- Document Templates
- Compliance Rules
- Export Documents
- Document Versions
- Customs Submissions

## Testing

### Run All Tests
```bash
python manage.py test export_docs
```

### Run Specific Test
```bash
python manage.py test export_docs.tests.DocumentGenerationServiceTest
```

### Run with Coverage
```bash
coverage run --source='export_docs' manage.py test export_docs
coverage report
```

## Troubleshooting

### Document Generation Fails
- Check that template exists for the country
- Verify all required fields are provided
- Check document_data JSON is valid

### Compliance Check Fails
- Review compliance issues in response
- Check if required documents exist
- Verify field values meet requirements

### Customs Submission Fails
- Ensure document is approved
- Check compliance is verified
- Review error message in submission

## Configuration

### Environment Variables
```bash
# Service configuration
EXPORT_DOCS_SERVICE_PORT=8017

# Customs API (when integrated)
CUSTOMS_API_URL=https://customs.example.com/api
CUSTOMS_API_KEY=your_api_key

# File storage
MEDIA_ROOT=/path/to/media
MEDIA_URL=/media/
```

## API Authentication

All API endpoints require authentication. Include the JWT token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

## Next Steps

1. Create document templates for your countries
2. Configure compliance rules
3. Integrate with real customs APIs
4. Set up scheduled tasks for expiry checking
5. Configure notifications for status updates

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the IMPLEMENTATION_SUMMARY.md for technical details
- Check the test files for usage examples
