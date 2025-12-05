#!/usr/bin/env python3
"""
AgroBridge Comprehensive Security Testing Suite
Runs all security tests and generates consolidated report
Requirements: 34.7, 30.4
"""

import os
import sys
import subprocess
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

class SecurityTestSuite:
    """Comprehensive security testing suite"""
    
    def __init__(self, target_url: str = 'http://localhost:8000'):
        self.target_url = target_url
        self.results = {}
        self.script_dir = Path(__file__).parent
        self.reports_dir = self.script_dir / 'reports'
        self.reports_dir.mkdir(exist_ok=True)
        
    def run_command(self, cmd: List[str]) -> Tuple[int, str, str]:
        """Run shell command"""
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return 1, "", "Command timed out"
        except Exception as e:
            return 1, "", str(e)
    
    def test_zap_scan(self) -> Dict:
        """Run OWASP ZAP security scan"""
        print("\n=== Running OWASP ZAP Scan ===")
        
        zap_script = self.script_dir / 'zap-scan.py'
        if not zap_script.exists():
            return {'status': 'skipped', 'reason': 'ZAP script not found'}
        
        code, stdout, stderr = self.run_command([
            'python3', str(zap_script),
            '--target', self.target_url,
            '--output', str(self.reports_dir / 'zap')
        ])
        
        return {
            'status': 'passed' if code == 0 else 'failed',
            'exit_code': code,
            'output': stdout,
            'error': stderr
        }
    
    def test_dependency_scan(self) -> Dict:
        """Scan Python dependencies for vulnerabilities"""
        print("\n=== Scanning Dependencies ===")
        
        results = {}
        
        # Safety check
        print("Running Safety scan...")
        code, stdout, stderr = self.run_command(['safety', 'check', '--json'])
        results['safety'] = {
            'status': 'passed' if code == 0 else 'failed',
            'output': stdout
        }
        
        # Bandit check
        print("Running Bandit scan...")
        backend_dir = self.script_dir.parent.parent
        code, stdout, stderr = self.run_command([
            'bandit', '-r', str(backend_dir),
            '-f', 'json',
            '-o', str(self.reports_dir / 'bandit-report.json')
        ])
        results['bandit'] = {
            'status': 'passed' if code == 0 else 'failed',
            'output': stdout
        }
        
        return results
    
    def test_container_scan(self) -> Dict:
        """Scan Docker containers for vulnerabilities"""
        print("\n=== Scanning Docker Containers ===")
        
        # Get list of AgroBridge containers
        code, stdout, stderr = self.run_command([
            'docker', 'ps', '--filter', 'name=agrobridge', '--format', '{{.Names}}'
        ])
        
        if code != 0:
            return {'status': 'skipped', 'reason': 'Docker not available'}
        
        containers = stdout.strip().split('\n')
        results = {}
        
        for container in containers:
            if not container:
                continue
            
            print(f"Scanning {container}...")
            
            # Trivy scan
            code, stdout, stderr = self.run_command([
                'trivy', 'image',
                '--format', 'json',
                '--output', str(self.reports_dir / f'trivy-{container}.json'),
                container
            ])
            
            results[container] = {
                'status': 'passed' if code == 0 else 'failed',
                'scanner': 'trivy'
            }
        
        return results
    
    def test_ssl_tls(self) -> Dict:
        """Test SSL/TLS configuration"""
        print("\n=== Testing SSL/TLS Configuration ===")
        
        # Extract host from URL
        from urllib.parse import urlparse
        parsed = urlparse(self.target_url)
        host = parsed.hostname or 'localhost'
        port = parsed.port or 443
        
        # testssl.sh scan
        code, stdout, stderr = self.run_command([
            'testssl.sh',
            '--jsonfile', str(self.reports_dir / 'testssl-report.json'),
            f'{host}:{port}'
        ])
        
        return {
            'status': 'passed' if code == 0 else 'failed',
            'output': stdout
        }
    
    def test_authentication(self) -> Dict:
        """Test authentication security"""
        print("\n=== Testing Authentication Security ===")
        
        import requests
        
        results = {
            'tests': []
        }
        
        # Test 1: Weak password rejection
        try:
            response = requests.post(
                f'{self.target_url}/api/v1/auth/register',
                json={
                    'email': 'test@example.com',
                    'password': '123',
                    'name': 'Test User'
                },
                timeout=10
            )
            results['tests'].append({
                'name': 'Weak password rejection',
                'status': 'passed' if response.status_code == 400 else 'failed'
            })
        except Exception as e:
            results['tests'].append({
                'name': 'Weak password rejection',
                'status': 'error',
                'error': str(e)
            })
        
        # Test 2: SQL injection in login
        try:
            response = requests.post(
                f'{self.target_url}/api/v1/auth/login',
                json={
                    'email': "admin' OR '1'='1",
                    'password': 'password'
                },
                timeout=10
            )
            results['tests'].append({
                'name': 'SQL injection protection',
                'status': 'passed' if response.status_code in [400, 401] else 'failed'
            })
        except Exception as e:
            results['tests'].append({
                'name': 'SQL injection protection',
                'status': 'error',
                'error': str(e)
            })
        
        # Test 3: Rate limiting
        try:
            for i in range(15):
                response = requests.post(
                    f'{self.target_url}/api/v1/auth/login',
                    json={'email': 'test@example.com', 'password': 'wrong'},
                    timeout=10
                )
            
            results['tests'].append({
                'name': 'Rate limiting',
                'status': 'passed' if response.status_code == 429 else 'failed'
            })
        except Exception as e:
            results['tests'].append({
                'name': 'Rate limiting',
                'status': 'error',
                'error': str(e)
            })
        
        # Overall status
        passed = sum(1 for t in results['tests'] if t['status'] == 'passed')
        results['status'] = 'passed' if passed == len(results['tests']) else 'failed'
        
        return results
    
    def test_headers(self) -> Dict:
        """Test security headers"""
        print("\n=== Testing Security Headers ===")
        
        import requests
        
        try:
            response = requests.get(f'{self.target_url}/health', timeout=10)
            headers = response.headers
            
            required_headers = {
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000',
            }
            
            results = {'tests': []}
            
            for header, expected in required_headers.items():
                actual = headers.get(header, '')
                status = 'passed' if expected.lower() in actual.lower() else 'failed'
                results['tests'].append({
                    'header': header,
                    'expected': expected,
                    'actual': actual,
                    'status': status
                })
            
            passed = sum(1 for t in results['tests'] if t['status'] == 'passed')
            results['status'] = 'passed' if passed == len(results['tests']) else 'failed'
            
            return results
            
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    def generate_report(self):
        """Generate consolidated security report"""
        print("\n=== Generating Security Report ===")
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = self.reports_dir / f'security_report_{timestamp}.md'
        
        # Calculate overall status
        all_passed = all(
            result.get('status') == 'passed'
            for result in self.results.values()
            if isinstance(result, dict)
        )
        
        content = f"""# AgroBridge Security Test Report

**Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Target**: {self.target_url}
**Overall Status**: {'✅ PASSED' if all_passed else '❌ FAILED'}

## Test Results

"""
        
        # Add each test result
        for test_name, result in self.results.items():
            status_icon = '✅' if result.get('status') == 'passed' else '❌'
            content += f"### {status_icon} {test_name.replace('_', ' ').title()}\n\n"
            
            if isinstance(result, dict):
                if 'tests' in result:
                    for test in result['tests']:
                        test_status = '✅' if test.get('status') == 'passed' else '❌'
                        content += f"- {test_status} {test.get('name', 'Unknown test')}\n"
                else:
                    content += f"**Status**: {result.get('status', 'unknown')}\n"
            
            content += "\n"
        
        # Add recommendations
        content += """## Recommendations

1. ✅ All security tests should pass before deployment
2. 🔄 Run security scans regularly (weekly minimum)
3. 📊 Monitor security dashboards continuously
4. 🔐 Keep all dependencies up to date
5. 🛡️ Review and update WAF rules monthly
6. 🔑 Rotate certificates before expiry
7. 📝 Document all security incidents
8. 🎯 Conduct penetration testing quarterly

## Next Steps

"""
        
        if not all_passed:
            content += "⚠️ **Action Required**: Fix failing tests before deployment\n\n"
        else:
            content += "✅ All tests passed. System is ready for deployment.\n\n"
        
        content += """
## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Best Practices](../README.md)
- [Incident Response Plan](../docs/incident-response.md)
"""
        
        with open(report_file, 'w') as f:
            f.write(content)
        
        print(f"Report saved to: {report_file}")
        
        # Also save JSON report
        json_file = self.reports_dir / f'security_report_{timestamp}.json'
        with open(json_file, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'target': self.target_url,
                'overall_status': 'passed' if all_passed else 'failed',
                'results': self.results
            }, f, indent=2)
        
        print(f"JSON report saved to: {json_file}")
    
    def run_all_tests(self):
        """Run all security tests"""
        print("=" * 60)
        print("AgroBridge Security Test Suite")
        print("=" * 60)
        
        # Run tests
        self.results['zap_scan'] = self.test_zap_scan()
        self.results['dependency_scan'] = self.test_dependency_scan()
        self.results['container_scan'] = self.test_container_scan()
        self.results['ssl_tls'] = self.test_ssl_tls()
        self.results['authentication'] = self.test_authentication()
        self.results['security_headers'] = self.test_headers()
        
        # Generate report
        self.generate_report()
        
        # Return overall status
        all_passed = all(
            result.get('status') == 'passed'
            for result in self.results.values()
            if isinstance(result, dict)
        )
        
        return all_passed

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='AgroBridge Security Test Suite')
    parser.add_argument('--target', default='http://localhost:8000',
                       help='Target URL to test')
    
    args = parser.parse_args()
    
    suite = SecurityTestSuite(args.target)
    success = suite.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
