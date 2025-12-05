#!/usr/bin/env python3
"""
AgroBridge mTLS Verification Tool
Verifies mutual TLS configuration for all microservices
Requirements: 34.1
"""

import os
import sys
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple
import json

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    """Print formatted header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}\n")

def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def run_command(cmd: List[str]) -> Tuple[int, str, str]:
    """Run shell command and return exit code, stdout, stderr"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return 1, "", "Command timed out"
    except Exception as e:
        return 1, "", str(e)

def check_certificate_exists(cert_path: Path) -> bool:
    """Check if certificate file exists"""
    return cert_path.exists() and cert_path.is_file()

def get_certificate_info(cert_path: Path) -> Dict:
    """Extract certificate information"""
    if not check_certificate_exists(cert_path):
        return None
    
    info = {}
    
    # Get subject
    code, stdout, _ = run_command([
        'openssl', 'x509', '-in', str(cert_path),
        '-noout', '-subject'
    ])
    if code == 0:
        info['subject'] = stdout.strip().replace('subject=', '')
    
    # Get issuer
    code, stdout, _ = run_command([
        'openssl', 'x509', '-in', str(cert_path),
        '-noout', '-issuer'
    ])
    if code == 0:
        info['issuer'] = stdout.strip().replace('issuer=', '')
    
    # Get validity dates
    code, stdout, _ = run_command([
        'openssl', 'x509', '-in', str(cert_path),
        '-noout', '-startdate'
    ])
    if code == 0:
        info['not_before'] = stdout.strip().replace('notBefore=', '')
    
    code, stdout, _ = run_command([
        'openssl', 'x509', '-in', str(cert_path),
        '-noout', '-enddate'
    ])
    if code == 0:
        info['not_after'] = stdout.strip().replace('notAfter=', '')
    
    # Get serial number
    code, stdout, _ = run_command([
        'openssl', 'x509', '-in', str(cert_path),
        '-noout', '-serial'
    ])
    if code == 0:
        info['serial'] = stdout.strip().replace('serial=', '')
    
    # Get fingerprint
    code, stdout, _ = run_command([
        'openssl', 'x509', '-in', str(cert_path),
        '-noout', '-fingerprint', '-sha256'
    ])
    if code == 0:
        info['fingerprint'] = stdout.strip().replace('SHA256 Fingerprint=', '')
    
    return info

def verify_certificate_chain(cert_path: Path, ca_path: Path) -> bool:
    """Verify certificate against CA"""
    code, stdout, stderr = run_command([
        'openssl', 'verify',
        '-CAfile', str(ca_path),
        str(cert_path)
    ])
    return code == 0 and 'OK' in stdout

def check_certificate_expiry(cert_path: Path, warning_days: int = 30) -> Tuple[bool, int]:
    """Check if certificate is expiring soon"""
    code, stdout, _ = run_command([
        'openssl', 'x509', '-in', str(cert_path),
        '-noout', '-checkend', str(warning_days * 86400)
    ])
    
    # Get days until expiry
    code2, stdout2, _ = run_command([
        'openssl', 'x509', '-in', str(cert_path),
        '-noout', '-enddate'
    ])
    
    if code2 == 0:
        expiry_str = stdout2.strip().replace('notAfter=', '')
        try:
            expiry_date = datetime.strptime(expiry_str, '%b %d %H:%M:%S %Y %Z')
            days_until_expiry = (expiry_date - datetime.now()).days
            return code == 0, days_until_expiry
        except:
            pass
    
    return code == 0, -1

def check_key_permissions(key_path: Path) -> bool:
    """Check if private key has correct permissions (600)"""
    if not key_path.exists():
        return False
    
    # On Unix systems, check permissions
    if os.name != 'nt':  # Not Windows
        stat_info = os.stat(key_path)
        mode = stat_info.st_mode & 0o777
        return mode == 0o600
    
    return True  # Skip check on Windows

def verify_ca_certificate(ca_dir: Path) -> bool:
    """Verify CA certificate"""
    print_header("Verifying Certificate Authority")
    
    ca_cert = ca_dir / 'ca-cert.pem'
    ca_key = ca_dir / 'ca-key.pem'
    
    all_checks_passed = True
    
    # Check CA certificate exists
    if check_certificate_exists(ca_cert):
        print_success(f"CA certificate found: {ca_cert}")
    else:
        print_error(f"CA certificate not found: {ca_cert}")
        return False
    
    # Check CA key exists
    if check_certificate_exists(ca_key):
        print_success(f"CA private key found: {ca_key}")
    else:
        print_error(f"CA private key not found: {ca_key}")
        all_checks_passed = False
    
    # Check CA key permissions
    if check_key_permissions(ca_key):
        print_success("CA private key has correct permissions (600)")
    else:
        print_warning("CA private key permissions should be 600")
        all_checks_passed = False
    
    # Get CA certificate info
    ca_info = get_certificate_info(ca_cert)
    if ca_info:
        print(f"\n{Colors.BOLD}CA Certificate Details:{Colors.END}")
        print(f"  Subject: {ca_info.get('subject', 'N/A')}")
        print(f"  Valid From: {ca_info.get('not_before', 'N/A')}")
        print(f"  Valid Until: {ca_info.get('not_after', 'N/A')}")
        print(f"  Serial: {ca_info.get('serial', 'N/A')}")
    
    # Check CA expiry
    is_valid, days = check_certificate_expiry(ca_cert, warning_days=90)
    if days > 90:
        print_success(f"CA certificate valid for {days} days")
    elif days > 0:
        print_warning(f"CA certificate expires in {days} days - consider renewal")
        all_checks_passed = False
    else:
        print_error("CA certificate has expired!")
        all_checks_passed = False
    
    return all_checks_passed

def verify_service_certificates(services_dir: Path, ca_cert: Path) -> Dict:
    """Verify all service certificates"""
    print_header("Verifying Service Certificates")
    
    services = [
        'authentication', 'users', 'farms', 'marketplace', 'ai-assistant',
        'crop-detection', 'iot', 'notifications', 'financial', 'learning',
        'community', 'scheduling', 'analytics', 'payments', 'admin',
        'blockchain', 'export-docs', 'emergency', 'file-storage',
        'api-gateway', 'monitoring', 'backup'
    ]
    
    results = {}
    
    for service in services:
        service_dir = services_dir / service
        cert_path = service_dir / f'{service}-cert.pem'
        key_path = service_dir / f'{service}-key.pem'
        fullchain_path = service_dir / f'{service}-fullchain.pem'
        
        service_result = {
            'cert_exists': False,
            'key_exists': False,
            'fullchain_exists': False,
            'key_permissions_ok': False,
            'chain_valid': False,
            'expiry_ok': False,
            'days_until_expiry': -1
        }
        
        # Check certificate exists
        if check_certificate_exists(cert_path):
            service_result['cert_exists'] = True
        
        # Check key exists
        if check_certificate_exists(key_path):
            service_result['key_exists'] = True
        
        # Check fullchain exists
        if check_certificate_exists(fullchain_path):
            service_result['fullchain_exists'] = True
        
        # Check key permissions
        if check_key_permissions(key_path):
            service_result['key_permissions_ok'] = True
        
        # Verify certificate chain
        if service_result['cert_exists']:
            if verify_certificate_chain(cert_path, ca_cert):
                service_result['chain_valid'] = True
        
        # Check expiry
        if service_result['cert_exists']:
            is_valid, days = check_certificate_expiry(cert_path)
            service_result['expiry_ok'] = is_valid
            service_result['days_until_expiry'] = days
        
        results[service] = service_result
        
        # Print service status
        all_ok = all([
            service_result['cert_exists'],
            service_result['key_exists'],
            service_result['fullchain_exists'],
            service_result['key_permissions_ok'],
            service_result['chain_valid'],
            service_result['expiry_ok']
        ])
        
        if all_ok:
            print_success(f"{service:20} - All checks passed ({service_result['days_until_expiry']} days)")
        else:
            issues = []
            if not service_result['cert_exists']:
                issues.append('no cert')
            if not service_result['key_exists']:
                issues.append('no key')
            if not service_result['chain_valid']:
                issues.append('invalid chain')
            if not service_result['expiry_ok']:
                issues.append('expiring soon')
            
            print_error(f"{service:20} - Issues: {', '.join(issues)}")
    
    return results

def generate_report(ca_valid: bool, service_results: Dict) -> Dict:
    """Generate verification report"""
    print_header("Verification Report")
    
    total_services = len(service_results)
    valid_services = sum(1 for r in service_results.values() if all([
        r['cert_exists'], r['key_exists'], r['chain_valid'], r['expiry_ok']
    ]))
    
    expiring_soon = [
        name for name, r in service_results.items()
        if r['cert_exists'] and 0 < r['days_until_expiry'] < 30
    ]
    
    expired = [
        name for name, r in service_results.items()
        if r['cert_exists'] and r['days_until_expiry'] <= 0
    ]
    
    invalid_chain = [
        name for name, r in service_results.items()
        if r['cert_exists'] and not r['chain_valid']
    ]
    
    report = {
        'timestamp': datetime.now().isoformat(),
        'ca_valid': ca_valid,
        'total_services': total_services,
        'valid_services': valid_services,
        'expiring_soon': expiring_soon,
        'expired': expired,
        'invalid_chain': invalid_chain,
        'overall_status': 'PASS' if ca_valid and valid_services == total_services else 'FAIL'
    }
    
    print(f"Total Services: {total_services}")
    print(f"Valid Services: {valid_services}")
    print(f"CA Status: {'✓ Valid' if ca_valid else '✗ Invalid'}")
    
    if expiring_soon:
        print_warning(f"Certificates expiring soon (< 30 days): {len(expiring_soon)}")
        for service in expiring_soon:
            days = service_results[service]['days_until_expiry']
            print(f"  - {service}: {days} days")
    
    if expired:
        print_error(f"Expired certificates: {len(expired)}")
        for service in expired:
            print(f"  - {service}")
    
    if invalid_chain:
        print_error(f"Invalid certificate chains: {len(invalid_chain)}")
        for service in invalid_chain:
            print(f"  - {service}")
    
    print(f"\n{Colors.BOLD}Overall Status: ", end='')
    if report['overall_status'] == 'PASS':
        print(f"{Colors.GREEN}PASS{Colors.END}")
    else:
        print(f"{Colors.RED}FAIL{Colors.END}")
    
    return report

def main():
    """Main verification function"""
    script_dir = Path(__file__).parent
    certs_dir = script_dir / 'certs'
    ca_dir = certs_dir / 'ca'
    services_dir = certs_dir / 'services'
    
    print_header("AgroBridge mTLS Verification Tool")
    
    # Check if certificates directory exists
    if not certs_dir.exists():
        print_error(f"Certificates directory not found: {certs_dir}")
        print("Run ./generate-certs.sh first to generate certificates")
        sys.exit(1)
    
    # Verify CA
    ca_valid = verify_ca_certificate(ca_dir)
    
    # Verify service certificates
    ca_cert = ca_dir / 'ca-cert.pem'
    service_results = verify_service_certificates(services_dir, ca_cert)
    
    # Generate report
    report = generate_report(ca_valid, service_results)
    
    # Save report to file
    report_file = certs_dir / 'verification-report.json'
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nDetailed report saved to: {report_file}")
    
    # Exit with appropriate code
    sys.exit(0 if report['overall_status'] == 'PASS' else 1)

if __name__ == '__main__':
    main()
