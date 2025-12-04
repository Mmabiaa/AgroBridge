"""
Report Generation Service
"""
from django.utils import timezone
import json
import csv
import os
import logging

logger = logging.getLogger(__name__)


class ReportGenerator:
    """
    Generate reports in various formats
    """
    
    def __init__(self, report):
        self.report = report
        self.user = report.user
    
    def generate(self):
        """
        Generate report based on type and format
        
        Returns:
            tuple: (file_path, file_size)
        """
        # Get report data
        data = self._get_report_data()
        
        # Generate file based on format
        if self.report.format == 'pdf':
            file_path = self._generate_pdf(data)
        elif self.report.format == 'csv':
            file_path = self._generate_csv(data)
        elif self.report.format == 'excel':
            file_path = self._generate_excel(data)
        else:  # json
            file_path = self._generate_json(data)
        
        # Get file size
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        
        return file_path, file_size
    
    def _get_report_data(self):
        """
        Get data for the report based on report type
        
        Returns:
            dict: Report data
        """
        from .services import DashboardService
        
        report_type = self.report.report_type
        period_days = (self.report.period_end - self.report.period_start).days
        
        dashboard_service = DashboardService(user=self.user)
        
        if report_type == 'farm_performance':
            data = dashboard_service.get_farm_performance(period_days)
        elif report_type == 'financial_summary':
            data = dashboard_service.get_financial_summary(period_days)
        elif report_type == 'marketplace_insights':
            data = dashboard_service.get_marketplace_stats(period_days)
        elif report_type == 'crop_analysis':
            data = self._get_crop_analysis_data(period_days)
        else:  # custom
            data = self.report.parameters
        
        # Add metadata
        data['report_metadata'] = {
            'title': self.report.title,
            'generated_at': timezone.now().isoformat(),
            'period_start': self.report.period_start.isoformat(),
            'period_end': self.report.period_end.isoformat(),
            'user': self.user.username
        }
        
        return data
    
    def _get_crop_analysis_data(self, days):
        """Get crop analysis data"""
        from farms.models import Crop
        from datetime import timedelta
        
        start_date = timezone.now() - timedelta(days=days)
        
        crops = Crop.objects.filter(
            field__farm__owner=self.user,
            planting_date__gte=start_date
        )
        
        return {
            'total_crops': crops.count(),
            'active_crops': crops.filter(status='growing').count(),
            'harvested_crops': crops.filter(status='harvested').count(),
            'crops_by_type': list(crops.values('crop_type').annotate(
                count=Count('id')
            ))
        }
    
    def _generate_pdf(self, data):
        """
        Generate PDF report
        
        Args:
            data: Report data
        
        Returns:
            str: File path
        """
        # Simplified PDF generation (would use reportlab or weasyprint in production)
        file_name = f"report_{self.report.id}.pdf"
        file_path = os.path.join('media', 'reports', file_name)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # For now, create a text file as placeholder
        with open(file_path, 'w') as f:
            f.write(f"Report: {self.report.title}\n")
            f.write(f"Generated: {timezone.now()}\n\n")
            f.write(json.dumps(data, indent=2))
        
        logger.info(f"PDF report generated: {file_path}")
        return file_path
    
    def _generate_csv(self, data):
        """
        Generate CSV report
        
        Args:
            data: Report data
        
        Returns:
            str: File path
        """
        file_name = f"report_{self.report.id}.csv"
        file_path = os.path.join('media', 'reports', file_name)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Flatten data for CSV
        with open(file_path, 'w', newline='') as f:
            writer = csv.writer(f)
            
            # Write header
            writer.writerow(['Metric', 'Value'])
            
            # Write data
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                writer.writerow([key, value])
        
        logger.info(f"CSV report generated: {file_path}")
        return file_path
    
    def _generate_excel(self, data):
        """
        Generate Excel report
        
        Args:
            data: Report data
        
        Returns:
            str: File path
        """
        # Would use openpyxl or xlsxwriter in production
        # For now, generate CSV
        return self._generate_csv(data)
    
    def _generate_json(self, data):
        """
        Generate JSON report
        
        Args:
            data: Report data
        
        Returns:
            str: File path
        """
        file_name = f"report_{self.report.id}.json"
        file_path = os.path.join('media', 'reports', file_name)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Write JSON
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        logger.info(f"JSON report generated: {file_path}")
        return file_path
