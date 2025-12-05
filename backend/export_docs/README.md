# Export Documentation Service

The Export Documentation Service manages the generation, validation, and submission of export documents for international trade.

## Features

### Document Management
- Generate export documents from templates
- Support multiple document types (invoices, certificates, etc.)
- Digital signature generation
- Version control for documents
- Document expiry tracking

### Compliance Validation
- Country-specific compliance rules
- Product category validation
- Required field checking
- Format validation
- Automated compliance checking

### Customs Integration
- Electronic submission to customs systems
- Submission status tracking
- Automatic retry for failed submissions
- Response handling

### Template Management
- Country-specific templates
- Version control
- Support for multiple document formats
- Template customization

## Document Types

- **INVOICE**: Commercial Invoice
- **CERTIFICATE_ORIGIN**: Certificate of Origin
- **PHYTOSANITARY**: Phytosanitary Certificate
- **PACKING_LIST**: Packing List
- **BILL_LADING**: Bill of Lading
- **EXPORT_LICENSE**: Export License
- **CUSTOMS_DECLARATION**: Customs Declaration

## API Endpoints

### Document Templates
- `GET /api/export-docs/templates/` - List templates
- `GET /api/export-docs/templates/{id}/` - Get template details
- `GET /api/export-docs/templates/for_country/` - Get template for country
- `POST /api/export-docs/templates/` - Create template (admin)
- `PUT /api/export-docs/templates/{id}/` - Update template (admin)

### Compliance Rules
- `GET /api/export-docs/compliance-rules/` - List rules
- `GET /api/export-docs/compliance-rules/{id}/` - Get rule details
- `POST /api/export-docs/compliance-rules/` - Create rule (admin)
- `PUT /api/export-docs/compliance-rules/{id}/` - Update rule (admin)

### Export Documents
- `GET /api/export-docs/documents/` - List documents
- `POST /api/export-docs/documents/` - Create document
- `GET /api/export-docs/documents/{id}/` - Get document details
- `PUT /api/export-docs/documents/{id}/` - Update document
- `POST /api/export-docs/documents/{id}/check_compliance/` - Check compliance
- `POST /api/export-docs/documents/{id}/regenerate/` - Regenerate document
- `POST /api/export-docs/documents/{id}/submit_to_customs/` - Submit to customs
- `POST /api/export-docs/documents/{id}/approve/` - Approve document (admin)
- `POST /api/export-docs/documents/{id}/reject/` - Reject document (admin)
- `GET /api/export-docs/documents/{id}/versions/` - Get version history
- `GET /api/export-docs/documents/statistics/` - Get statistics

### Customs Submissions
- `GET /api/export-docs/submissions/` - List submissions
- `GET /api/export-docs/submissions/{id}/` - Get submission details
- `GET /api/export-docs/submissions/{id}/check_status/` - Check status
- `POST /api/export-docs/submissions/{id}/retry/` - Retry submission

## Models

### DocumentTemplate
Stores document templates for different countries and document types.

### ComplianceRule
Defines compliance rules for export documentation.

### ExportDocument
Represents a generated export document.

### DocumentVersion
Tracks version history of documents.

### CustomsSubmission
Tracks submissions to customs systems.

## Services

### DocumentGenerationService
Handles document generation and file creation.

### ComplianceService
Validates documents against compliance rules.

### CustomsIntegrationService
Manages integration with customs systems.

### TemplateManagementService
Manages document templates.

### DocumentVersionService
Handles document versioning.

## Management Commands

### populate_export_data
Populate sample templates and compliance rules:
```bash
python manage.py populate_export_data
```

### check_expired_documents
Check and mark expired documents:
```bash
python manage.py check_expired_documents
```

### retry_failed_submissions
Retry failed customs submissions:
```bash
python manage.py retry_failed_submissions --max-retries 3
```

## Usage Examples

### Create Export Document
```python
from export_docs.services import DocumentGenerationService

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
        'exporter_address': '123 Farm Road',
        'importer_name': 'XYZ Company',
        'importer_address': '456 Business St'
    }
}

document = DocumentGenerationService.create_and_generate(user, data)
```

### Check Compliance
```python
from export_docs.services import ComplianceService

is_compliant, issues, warnings = ComplianceService.check_compliance(document)

if not is_compliant:
    print("Compliance issues:", issues)
```

### Submit to Customs
```python
from export_docs.services import CustomsIntegrationService

submission = CustomsIntegrationService.submit_to_customs(
    document,
    'US_CUSTOMS_SYSTEM'
)
```

## Configuration

### Environment Variables
- `EXPORT_DOCS_SERVICE_PORT`: Service port (default: 8017)
- `CUSTOMS_API_URL`: Customs system API URL
- `CUSTOMS_API_KEY`: Customs system API key

## Testing

Run tests:
```bash
python manage.py test export_docs
```

## Service Registration

The service automatically registers with Consul on startup:
```python
from export_docs.service_registration import register_service
register_service()
```

## Dependencies

- Django REST Framework
- Celery (for async tasks)
- WeasyPrint (for PDF generation)
- Consul (for service discovery)

## Security

- Document access restricted to owners and admins
- Digital signatures for document authenticity
- Compliance validation before submission
- Audit trail for all document changes

## Compliance Rules

Rules can be configured for:
- Required fields
- Value ranges
- Format validation
- Required documents
- Certification requirements

## Document Lifecycle

1. **DRAFT**: Initial creation
2. **PENDING_REVIEW**: Submitted for review
3. **APPROVED**: Approved for submission
4. **REJECTED**: Rejected, needs revision
5. **SUBMITTED**: Submitted to customs
6. **ACCEPTED**: Accepted by customs
7. **EXPIRED**: Document expired

## Integration

The service integrates with:
- **Notification Service**: Status updates
- **User Service**: User management
- **File Storage**: Document storage
- **Customs Systems**: Electronic submission
