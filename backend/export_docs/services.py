"""Business logic for export documentation service."""

import hashlib
import json
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Tuple
from django.utils import timezone
from django.core.files.base import ContentFile
from django.db import transaction
from .models import (
    DocumentTemplate, ComplianceRule, ExportDocument,
    DocumentVersion, CustomsSubmission
)


class DocumentGenerationService:
    """Service for generating export documents."""
    
    @staticmethod
    def generate_document_number(document_type: str, country_code: str) -> str:
        """Generate unique document number."""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        prefix = document_type[:3].upper()
        return f"{prefix}-{country_code}-{timestamp}"
    
    @staticmethod
    def generate_document(document: ExportDocument, format: str = 'PDF') -> bytes:
        """Generate document file from template."""
        # In production, this would use a template engine like Jinja2
        # and a PDF generation library like WeasyPrint or ReportLab
        
        template = document.template
        data = document.document_data
        
        # Simple HTML generation for demonstration
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{template.name}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .section {{ margin-bottom: 20px; }}
                .label {{ font-weight: bold; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{template.name}</h1>
                <p>Document Number: {document.document_number}</p>
                <p>Date: {document.created_at.strftime('%Y-%m-%d')}</p>
            </div>
            
            <div class="section">
                <h2>Shipment Information</h2>
                <p><span class="label">Reference:</span> {document.shipment_reference}</p>
                <p><span class="label">Origin:</span> {document.origin_country}</p>
                <p><span class="label">Destination:</span> {document.destination_country}</p>
            </div>
            
            <div class="section">
                <h2>Product Details</h2>
                <table>
                    <tr>
                        <th>Description</th>
                        <th>HS Code</th>
                        <th>Quantity</th>
                        <th>Value</th>
                    </tr>
                    <tr>
                        <td>{document.product_description}</td>
                        <td>{document.hs_code}</td>
                        <td>{document.quantity} {document.unit}</td>
                        <td>{document.value} {document.currency}</td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <h2>Additional Information</h2>
                <p><span class="label">Category:</span> {document.product_category}</p>
            </div>
        </body>
        </html>
        """
        
        if format == 'HTML':
            return html_content.encode('utf-8')
        elif format == 'PDF':
            # In production, convert HTML to PDF using WeasyPrint or similar
            return html_content.encode('utf-8')
        else:
            return html_content.encode('utf-8')
    
    @staticmethod
    def sign_document(document: ExportDocument, content: bytes) -> str:
        """Generate digital signature for document."""
        # In production, use proper digital signature with private key
        signature_data = f"{document.document_number}{document.created_at.isoformat()}"
        signature = hashlib.sha256(signature_data.encode()).hexdigest()
        return signature
    
    @staticmethod
    @transaction.atomic
    def create_and_generate(user, data: Dict) -> ExportDocument:
        """Create document and generate file."""
        # Generate document number
        template = data['template']
        document_number = DocumentGenerationService.generate_document_number(
            template.document_type,
            data['destination_country']
        )
        
        # Create document
        document = ExportDocument.objects.create(
            document_number=document_number,
            user=user,
            **data
        )
        
        # Generate file
        content = DocumentGenerationService.generate_document(document)
        filename = f"{document_number}.pdf"
        document.generated_file.save(filename, ContentFile(content))
        
        # Sign document
        document.digital_signature = DocumentGenerationService.sign_document(
            document, content
        )
        document.save()
        
        return document


class ComplianceService:
    """Service for checking export compliance."""
    
    @staticmethod
    def check_compliance(document: ExportDocument) -> Tuple[bool, List[Dict], List[Dict]]:
        """Check document compliance against rules."""
        issues = []
        warnings = []
        
        # Get applicable rules
        from django.db.models import Q
        
        rules = ComplianceRule.objects.filter(
            country_code=document.destination_country,
            is_active=True,
            effective_date__lte=timezone.now().date()
        ).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=timezone.now().date())
        )
        
        # Filter by product category if specified
        rules = rules.filter(
            Q(product_category='') | Q(product_category=document.product_category)
        )
        
        for rule in rules:
            result = ComplianceService._validate_rule(document, rule)
            if not result['passed']:
                if result['severity'] == 'ERROR':
                    issues.append({
                        'rule': rule.rule_name,
                        'message': result['message'],
                        'field': result.get('field', '')
                    })
                else:
                    warnings.append({
                        'rule': rule.rule_name,
                        'message': result['message'],
                        'field': result.get('field', '')
                    })
        
        is_compliant = len(issues) == 0
        
        # Update document
        document.compliance_checked = True
        document.compliance_issues = issues
        document.save()
        
        return is_compliant, issues, warnings
    
    @staticmethod
    def _validate_rule(document: ExportDocument, rule: ComplianceRule) -> Dict:
        """Validate a single compliance rule."""
        validation_logic = rule.validation_logic
        
        if rule.rule_type == 'REQUIRED_FIELD':
            field = validation_logic.get('field')
            value = getattr(document, field, None) or document.document_data.get(field)
            
            if not value:
                return {
                    'passed': False,
                    'severity': 'ERROR',
                    'message': f"Required field '{field}' is missing",
                    'field': field
                }
        
        elif rule.rule_type == 'VALUE_RANGE':
            field = validation_logic.get('field')
            min_value = validation_logic.get('min')
            max_value = validation_logic.get('max')
            value = getattr(document, field, None)
            
            if value is not None:
                if min_value is not None and value < Decimal(str(min_value)):
                    return {
                        'passed': False,
                        'severity': 'ERROR',
                        'message': f"Value for '{field}' is below minimum ({min_value})",
                        'field': field
                    }
                if max_value is not None and value > Decimal(str(max_value)):
                    return {
                        'passed': False,
                        'severity': 'WARNING',
                        'message': f"Value for '{field}' exceeds maximum ({max_value})",
                        'field': field
                    }
        
        elif rule.rule_type == 'FORMAT_VALIDATION':
            field = validation_logic.get('field')
            pattern = validation_logic.get('pattern')
            value = getattr(document, field, None) or document.document_data.get(field)
            
            if value:
                import re
                if not re.match(pattern, str(value)):
                    return {
                        'passed': False,
                        'severity': 'ERROR',
                        'message': f"Field '{field}' does not match required format",
                        'field': field
                    }
        
        elif rule.rule_type == 'DOCUMENT_REQUIRED':
            required_doc_type = validation_logic.get('document_type')
            # Check if user has the required document type
            has_document = ExportDocument.objects.filter(
                user=document.user,
                template__document_type=required_doc_type,
                status__in=['APPROVED', 'SUBMITTED', 'ACCEPTED']
            ).exists()
            
            if not has_document:
                return {
                    'passed': False,
                    'severity': 'ERROR',
                    'message': f"Required document '{required_doc_type}' is missing"
                }
        
        return {'passed': True}


class CustomsIntegrationService:
    """Service for integrating with customs systems."""
    
    @staticmethod
    @transaction.atomic
    def submit_to_customs(document: ExportDocument, customs_system: str) -> CustomsSubmission:
        """Submit document to customs system."""
        # Generate submission reference
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        submission_reference = f"SUB-{document.document_number}-{timestamp}"
        
        # Create submission record
        submission = CustomsSubmission.objects.create(
            document=document,
            customs_system=customs_system,
            submission_reference=submission_reference,
            status='PENDING'
        )
        
        # In production, this would make actual API calls to customs systems
        # For now, simulate submission
        try:
            # Simulate API call
            response = CustomsIntegrationService._simulate_customs_api(document)
            
            submission.status = 'SUCCESS'
            submission.response_received_at = timezone.now()
            submission.response_data = response
            submission.save()
            
            # Update document
            document.status = 'SUBMITTED'
            document.submitted_at = timezone.now()
            document.submission_reference = submission_reference
            document.customs_response = response
            document.save()
            
        except Exception as e:
            submission.status = 'FAILED'
            submission.error_message = str(e)
            submission.retry_count += 1
            submission.next_retry_at = timezone.now() + timedelta(hours=1)
            submission.save()
        
        return submission
    
    @staticmethod
    def _simulate_customs_api(document: ExportDocument) -> Dict:
        """Simulate customs API response."""
        return {
            'status': 'ACCEPTED',
            'reference': f"CUSTOMS-{document.document_number}",
            'message': 'Document accepted for processing',
            'timestamp': timezone.now().isoformat()
        }
    
    @staticmethod
    def check_submission_status(submission: CustomsSubmission) -> Dict:
        """Check status of customs submission."""
        # In production, query actual customs API
        return {
            'submission_reference': submission.submission_reference,
            'status': submission.status,
            'last_updated': submission.response_received_at
        }


class TemplateManagementService:
    """Service for managing document templates."""
    
    @staticmethod
    def get_template_for_country(document_type: str, country_code: str) -> DocumentTemplate:
        """Get active template for document type and country."""
        template = DocumentTemplate.objects.filter(
            document_type=document_type,
            country_code=country_code,
            is_active=True
        ).order_by('-version').first()
        
        if not template:
            # Fall back to generic template
            template = DocumentTemplate.objects.filter(
                document_type=document_type,
                country_code='GENERIC',
                is_active=True
            ).order_by('-version').first()
        
        return template
    
    @staticmethod
    @transaction.atomic
    def create_new_version(template: DocumentTemplate, template_file, version: str) -> DocumentTemplate:
        """Create new version of template."""
        # Deactivate old version
        template.is_active = False
        template.save()
        
        # Create new version
        new_template = DocumentTemplate.objects.create(
            name=template.name,
            document_type=template.document_type,
            country_code=template.country_code,
            template_file=template_file,
            version=version,
            is_active=True
        )
        
        return new_template


class DocumentVersionService:
    """Service for managing document versions."""
    
    @staticmethod
    @transaction.atomic
    def create_version(document: ExportDocument, changed_by, change_reason: str = '') -> DocumentVersion:
        """Create new version of document."""
        # Increment version number
        document.version += 1
        
        # Create version record
        version = DocumentVersion.objects.create(
            document=document,
            version_number=document.version,
            document_data=document.document_data,
            generated_file=document.generated_file,
            changed_by=changed_by,
            change_reason=change_reason
        )
        
        document.save()
        
        return version
