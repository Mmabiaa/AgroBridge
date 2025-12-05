"""Tests for export documentation service."""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta
from .models import (
    DocumentTemplate, ComplianceRule, ExportDocument,
    DocumentVersion, CustomsSubmission
)
from .services import (
    DocumentGenerationService, ComplianceService,
    CustomsIntegrationService, TemplateManagementService
)

User = get_user_model()


class DocumentTemplateModelTest(TestCase):
    """Test DocumentTemplate model."""
    
    def setUp(self):
        self.template = DocumentTemplate.objects.create(
            name='Test Invoice Template',
            document_type='INVOICE',
            country_code='USA',
            version='1.0'
        )
    
    def test_template_creation(self):
        """Test template is created correctly."""
        self.assertEqual(self.template.name, 'Test Invoice Template')
        self.assertEqual(self.template.document_type, 'INVOICE')
        self.assertTrue(self.template.is_active)
    
    def test_template_str(self):
        """Test template string representation."""
        expected = "Test Invoice Template - USA v1.0"
        self.assertEqual(str(self.template), expected)


class ExportDocumentModelTest(TestCase):
    """Test ExportDocument model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.template = DocumentTemplate.objects.create(
            name='Test Template',
            document_type='INVOICE',
            country_code='USA'
        )
        self.document = ExportDocument.objects.create(
            document_number='INV-USA-20231201',
            user=self.user,
            template=self.template,
            destination_country='USA',
            product_description='Test Product',
            product_category='Agriculture',
            hs_code='1234567890',
            quantity=100,
            unit='kg',
            value=1000,
            document_data={}
        )
    
    def test_document_creation(self):
        """Test document is created correctly."""
        self.assertEqual(self.document.user, self.user)
        self.assertEqual(self.document.status, 'DRAFT')
        self.assertFalse(self.document.compliance_checked)
    
    def test_document_str(self):
        """Test document string representation."""
        expected = "INV-USA-20231201 - INVOICE"
        self.assertEqual(str(self.document), expected)


class DocumentGenerationServiceTest(TestCase):
    """Test DocumentGenerationService."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.template = DocumentTemplate.objects.create(
            name='Test Template',
            document_type='INVOICE',
            country_code='USA'
        )
    
    def test_generate_document_number(self):
        """Test document number generation."""
        doc_number = DocumentGenerationService.generate_document_number(
            'INVOICE', 'USA'
        )
        self.assertTrue(doc_number.startswith('INV-USA-'))
    
    def test_create_and_generate(self):
        """Test document creation and generation."""
        data = {
            'template': self.template,
            'destination_country': 'USA',
            'product_description': 'Test Product',
            'product_category': 'Agriculture',
            'hs_code': '1234567890',
            'quantity': 100,
            'unit': 'kg',
            'value': 1000,
            'document_data': {}
        }
        
        document = DocumentGenerationService.create_and_generate(
            self.user, data
        )
        
        self.assertIsNotNone(document.document_number)
        self.assertTrue(document.generated_file)
        self.assertTrue(document.digital_signature)


class ComplianceServiceTest(TestCase):
    """Test ComplianceService."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.template = DocumentTemplate.objects.create(
            name='Test Template',
            document_type='INVOICE',
            country_code='USA'
        )
        self.document = ExportDocument.objects.create(
            document_number='INV-USA-20231201',
            user=self.user,
            template=self.template,
            destination_country='USA',
            product_description='Test Product',
            product_category='Agriculture',
            hs_code='1234567890',
            quantity=100,
            unit='kg',
            value=1000,
            document_data={}
        )
        
        # Create compliance rule
        self.rule = ComplianceRule.objects.create(
            country_code='USA',
            product_category='Agriculture',
            rule_type='REQUIRED_FIELD',
            rule_name='HS Code Required',
            rule_description='HS Code must be provided',
            validation_logic={'field': 'hs_code'},
            effective_date=timezone.now().date()
        )
    
    def test_check_compliance_pass(self):
        """Test compliance check passes."""
        is_compliant, issues, warnings = ComplianceService.check_compliance(
            self.document
        )
        
        self.assertTrue(is_compliant)
        self.assertEqual(len(issues), 0)
        self.assertTrue(self.document.compliance_checked)
    
    def test_check_compliance_fail(self):
        """Test compliance check fails."""
        # Remove HS code
        self.document.hs_code = ''
        self.document.save()
        
        is_compliant, issues, warnings = ComplianceService.check_compliance(
            self.document
        )
        
        self.assertFalse(is_compliant)
        self.assertGreater(len(issues), 0)


class ExportDocumentAPITest(APITestCase):
    """Test ExportDocument API endpoints."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.template = DocumentTemplate.objects.create(
            name='Test Template',
            document_type='INVOICE',
            country_code='USA'
        )
    
    def test_create_document(self):
        """Test creating a document via API."""
        data = {
            'template': str(self.template.id),
            'destination_country': 'USA',
            'product_description': 'Test Product',
            'product_category': 'Agriculture',
            'hs_code': '1234567890',
            'quantity': 100,
            'unit': 'kg',
            'value': 1000,
            'document_data': {}
        }
        
        response = self.client.post('/api/export-docs/documents/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('document_number', response.data)
    
    def test_list_documents(self):
        """Test listing documents."""
        # Create a document
        ExportDocument.objects.create(
            document_number='INV-USA-20231201',
            user=self.user,
            template=self.template,
            destination_country='USA',
            product_description='Test Product',
            product_category='Agriculture',
            hs_code='1234567890',
            quantity=100,
            unit='kg',
            value=1000,
            document_data={}
        )
        
        response = self.client.get('/api/export-docs/documents/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_check_compliance(self):
        """Test compliance check endpoint."""
        document = ExportDocument.objects.create(
            document_number='INV-USA-20231201',
            user=self.user,
            template=self.template,
            destination_country='USA',
            product_description='Test Product',
            product_category='Agriculture',
            hs_code='1234567890',
            quantity=100,
            unit='kg',
            value=1000,
            document_data={}
        )
        
        response = self.client.post(
            f'/api/export-docs/documents/{document.id}/check_compliance/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('is_compliant', response.data)


class CustomsIntegrationServiceTest(TestCase):
    """Test CustomsIntegrationService."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.template = DocumentTemplate.objects.create(
            name='Test Template',
            document_type='INVOICE',
            country_code='USA'
        )
        self.document = ExportDocument.objects.create(
            document_number='INV-USA-20231201',
            user=self.user,
            template=self.template,
            destination_country='USA',
            product_description='Test Product',
            product_category='Agriculture',
            hs_code='1234567890',
            quantity=100,
            unit='kg',
            value=1000,
            document_data={},
            status='APPROVED',
            compliance_checked=True
        )
    
    def test_submit_to_customs(self):
        """Test submitting document to customs."""
        submission = CustomsIntegrationService.submit_to_customs(
            self.document, 'TEST_SYSTEM'
        )
        
        self.assertIsNotNone(submission.submission_reference)
        self.assertEqual(submission.customs_system, 'TEST_SYSTEM')
        self.assertIn(submission.status, ['PENDING', 'SUCCESS'])
