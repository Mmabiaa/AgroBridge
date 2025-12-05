#!/usr/bin/env python3
"""
AgroBridge Security Testing - OWASP ZAP Scanner
Automated security scanning using OWASP ZAP
Requirements: 34.7, 30.4
"""

import os
import sys
import time
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import requests

try:
    from zapv2 import ZAPv2
except ImportError:
    print("Error: python-owasp-zap-v2.4 not installed")
    print("Install with: pip install python-owasp-zap-v2.4")
    sys.exit(1)

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

class ZAPScanner:
    """OWASP ZAP Security Scanner"""
    
    def __init__(self, target_url: str, zap_host: str = 'localhost', zap_port: int = 8080):
        self.target_url = target_url
        self.zap = ZAPv2(proxies={'http': f'http://{zap_host}:{zap_port}', 
                                   'https': f'http://{zap_host}:{zap_port}'})
        self.scan_id = None
        self.results = {}
        
    def print_header(self, text: str):
        """Print formatted header"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}\n")
    
    def print_success(self, text: str):
        """Print success message"""
        print(f"{Colors.GREEN}✓ {text}{Colors.END}")
    
    def print_warning(self, text: str):
        """Print warning message"""
        print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")
    
    def print_error(self, text: str):
        """Print error message"""
        print(f"{Colors.RED}✗ {text}{Colors.END}")
    
    def check_zap_connection(self) -> bool:
        """Check if ZAP is running and accessible"""
        try:
            version = self.zap.core.version
            self.print_success(f"Connected to ZAP version {version}")
            return True
        except Exception as e:
            self.print_error(f"Failed to connect to ZAP: {e}")
            return False
    
    def spider_scan(self) -> bool:
        """Run spider scan to discover URLs"""
        self.print_header("Spider Scan")
        
        try:
            print(f"Starting spider scan on {self.target_url}...")
            scan_id = self.zap.spider.scan(self.target_url)
            
            # Wait for spider to complete
            while int(self.zap.spider.status(scan_id)) < 100:
                progress = int(self.zap.spider.status(scan_id))
                print(f"Spider progress: {progress}%", end='\r')
                time.sleep(2)
            
            print()
            self.print_success("Spider scan completed")
            
            # Get discovered URLs
            urls = self.zap.core.urls()
            self.print_success(f"Discovered {len(urls)} URLs")
            
            self.results['spider'] = {
                'urls_found': len(urls),
                'urls': urls[:50]  # Store first 50 URLs
            }
            
            return True
            
        except Exception as e:
            self.print_error(f"Spider scan failed: {e}")
            return False
    
    def active_scan(self) -> bool:
        """Run active security scan"""
        self.print_header("Active Security Scan")
        
        try:
            print(f"Starting active scan on {self.target_url}...")
            self.scan_id = self.zap.ascan.scan(self.target_url)
            
            # Wait for scan to complete
            while int(self.zap.ascan.status(self.scan_id)) < 100:
                progress = int(self.zap.ascan.status(self.scan_id))
                print(f"Scan progress: {progress}%", end='\r')
                time.sleep(5)
            
            print()
            self.print_success("Active scan completed")
            return True
            
        except Exception as e:
            self.print_error(f"Active scan failed: {e}")
            return False
    
    def ajax_spider_scan(self) -> bool:
        """Run AJAX spider for JavaScript-heavy applications"""
        self.print_header("AJAX Spider Scan")
        
        try:
            print(f"Starting AJAX spider on {self.target_url}...")
            scan_id = self.zap.ajaxSpider.scan(self.target_url)
            
            # Wait for AJAX spider to complete
            timeout = 300  # 5 minutes timeout
            start_time = time.time()
            
            while self.zap.ajaxSpider.status == 'running':
                if time.time() - start_time > timeout:
                    self.print_warning("AJAX spider timeout")
                    self.zap.ajaxSpider.stop()
                    break
                print("AJAX spider running...", end='\r')
                time.sleep(5)
            
            print()
            self.print_success("AJAX spider completed")
            
            # Get results
            results = self.zap.ajaxSpider.results()
            self.print_success(f"Found {len(results)} additional URLs")
            
            self.results['ajax_spider'] = {
                'urls_found': len(results),
                'urls': results[:50]
            }
            
            return True
            
        except Exception as e:
            self.print_warning(f"AJAX spider not available or failed: {e}")
            return False
    
    def get_alerts(self) -> List[Dict]:
        """Get security alerts from scan"""
        try:
            alerts = self.zap.core.alerts(baseurl=self.target_url)
            return alerts
        except Exception as e:
            self.print_error(f"Failed to get alerts: {e}")
            return []
    
    def analyze_results(self) -> Dict:
        """Analyze scan results and categorize by severity"""
        self.print_header("Security Analysis")
        
        alerts = self.get_alerts()
        
        # Categorize by risk level
        categorized = {
            'High': [],
            'Medium': [],
            'Low': [],
            'Informational': []
        }
        
        for alert in alerts:
            risk = alert.get('risk', 'Informational')
            categorized[risk].append(alert)
        
        # Print summary
        print(f"Total Alerts: {len(alerts)}")
        print(f"  {Colors.RED}High: {len(categorized['High'])}{Colors.END}")
        print(f"  {Colors.YELLOW}Medium: {len(categorized['Medium'])}{Colors.END}")
        print(f"  {Colors.BLUE}Low: {len(categorized['Low'])}{Colors.END}")
        print(f"  Informational: {len(categorized['Informational'])}")
        
        # Print high-risk alerts
        if categorized['High']:
            print(f"\n{Colors.RED}{Colors.BOLD}HIGH RISK ALERTS:{Colors.END}")
            for alert in categorized['High']:
                print(f"\n  {Colors.RED}• {alert['alert']}{Colors.END}")
                print(f"    URL: {alert['url']}")
                print(f"    Description: {alert['description'][:100]}...")
                print(f"    Solution: {alert['solution'][:100]}...")
        
        # Print medium-risk alerts
        if categorized['Medium']:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}MEDIUM RISK ALERTS:{Colors.END}")
            for alert in categorized['Medium'][:5]:  # Show first 5
                print(f"\n  {Colors.YELLOW}• {alert['alert']}{Colors.END}")
                print(f"    URL: {alert['url']}")
                print(f"    Description: {alert['description'][:100]}...")
        
        self.results['alerts'] = {
            'total': len(alerts),
            'high': len(categorized['High']),
            'medium': len(categorized['Medium']),
            'low': len(categorized['Low']),
            'informational': len(categorized['Informational']),
            'details': categorized
        }
        
        return categorized
    
    def generate_report(self, output_dir: Path):
        """Generate scan reports"""
        self.print_header("Generating Reports")
        
        output_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        try:
            # HTML Report
            html_report = self.zap.core.htmlreport()
            html_file = output_dir / f'zap_report_{timestamp}.html'
            with open(html_file, 'w') as f:
                f.write(html_report)
            self.print_success(f"HTML report: {html_file}")
            
            # XML Report
            xml_report = self.zap.core.xmlreport()
            xml_file = output_dir / f'zap_report_{timestamp}.xml'
            with open(xml_file, 'w') as f:
                f.write(xml_report)
            self.print_success(f"XML report: {xml_file}")
            
            # JSON Report
            json_file = output_dir / f'zap_report_{timestamp}.json'
            with open(json_file, 'w') as f:
                json.dump(self.results, f, indent=2)
            self.print_success(f"JSON report: {json_file}")
            
            # Markdown Summary
            md_file = output_dir / f'zap_summary_{timestamp}.md'
            self.generate_markdown_summary(md_file)
            self.print_success(f"Markdown summary: {md_file}")
            
        except Exception as e:
            self.print_error(f"Failed to generate reports: {e}")
    
    def generate_markdown_summary(self, output_file: Path):
        """Generate markdown summary report"""
        alerts = self.results.get('alerts', {})
        
        content = f"""# AgroBridge Security Scan Report

**Scan Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Target**: {self.target_url}

## Summary

- **Total Alerts**: {alerts.get('total', 0)}
- **High Risk**: {alerts.get('high', 0)}
- **Medium Risk**: {alerts.get('medium', 0)}
- **Low Risk**: {alerts.get('low', 0)}
- **Informational**: {alerts.get('informational', 0)}

## Risk Assessment

"""
        
        if alerts.get('high', 0) > 0:
            content += "⚠️ **CRITICAL**: High-risk vulnerabilities found. Immediate action required.\n\n"
        elif alerts.get('medium', 0) > 0:
            content += "⚠️ **WARNING**: Medium-risk vulnerabilities found. Action recommended.\n\n"
        else:
            content += "✅ **GOOD**: No high or medium-risk vulnerabilities found.\n\n"
        
        # High-risk details
        if alerts.get('details', {}).get('High'):
            content += "## High Risk Vulnerabilities\n\n"
            for alert in alerts['details']['High']:
                content += f"### {alert['alert']}\n\n"
                content += f"- **URL**: {alert['url']}\n"
                content += f"- **Description**: {alert['description']}\n"
                content += f"- **Solution**: {alert['solution']}\n"
                content += f"- **Reference**: {alert.get('reference', 'N/A')}\n\n"
        
        # Medium-risk details
        if alerts.get('details', {}).get('Medium'):
            content += "## Medium Risk Vulnerabilities\n\n"
            for alert in alerts['details']['Medium'][:10]:  # First 10
                content += f"### {alert['alert']}\n\n"
                content += f"- **URL**: {alert['url']}\n"
                content += f"- **Description**: {alert['description'][:200]}...\n\n"
        
        content += "\n## Recommendations\n\n"
        content += "1. Address all high-risk vulnerabilities immediately\n"
        content += "2. Review and fix medium-risk vulnerabilities\n"
        content += "3. Implement security best practices\n"
        content += "4. Schedule regular security scans\n"
        content += "5. Keep all dependencies up to date\n"
        
        with open(output_file, 'w') as f:
            f.write(content)
    
    def run_full_scan(self, output_dir: Path) -> bool:
        """Run complete security scan"""
        self.print_header("AgroBridge Security Scan")
        
        # Check ZAP connection
        if not self.check_zap_connection():
            return False
        
        # Run spider scan
        if not self.spider_scan():
            return False
        
        # Run AJAX spider (optional)
        self.ajax_spider_scan()
        
        # Run active scan
        if not self.active_scan():
            return False
        
        # Analyze results
        self.analyze_results()
        
        # Generate reports
        self.generate_report(output_dir)
        
        # Determine pass/fail
        alerts = self.results.get('alerts', {})
        if alerts.get('high', 0) > 0:
            self.print_error("SCAN FAILED: High-risk vulnerabilities found")
            return False
        else:
            self.print_success("SCAN PASSED: No high-risk vulnerabilities found")
            return True

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='AgroBridge OWASP ZAP Security Scanner')
    parser.add_argument('--target', default='http://localhost:8000', 
                       help='Target URL to scan')
    parser.add_argument('--zap-host', default='localhost',
                       help='ZAP proxy host')
    parser.add_argument('--zap-port', type=int, default=8080,
                       help='ZAP proxy port')
    parser.add_argument('--output', default='./reports',
                       help='Output directory for reports')
    
    args = parser.parse_args()
    
    output_dir = Path(args.output)
    
    scanner = ZAPScanner(args.target, args.zap_host, args.zap_port)
    success = scanner.run_full_scan(output_dir)
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
