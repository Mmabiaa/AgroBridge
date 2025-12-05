#!/usr/bin/env python3
"""
AgroBridge Monitoring Service Test Script

Tests all monitoring components to ensure they are working correctly.
"""

import requests
import time
import sys
from typing import Dict, List, Tuple
from datetime import datetime


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


class MonitoringTester:
    """Test suite for monitoring services"""
    
    def __init__(self):
        self.services = {
            'Prometheus': 'http://localhost:9090/-/healthy',
            'Grafana': 'http://localhost:3000/api/health',
            'Alertmanager': 'http://localhost:9093/-/healthy',
            'Elasticsearch': 'http://localhost:9200/_cluster/health',
            'Kibana': 'http://localhost:5601/api/status',
            'Jaeger': 'http://localhost:16686/',
            'Loki': 'http://localhost:3100/ready',
        }
        
        self.results: List[Tuple[str, bool, str]] = []
    
    def print_header(self, text: str):
        """Print formatted header"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.ENDC}\n")
    
    def print_success(self, text: str):
        """Print success message"""
        print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")
    
    def print_warning(self, text: str):
        """Print warning message"""
        print(f"{Colors.YELLOW}⚠ {text}{Colors.ENDC}")
    
    def print_error(self, text: str):
        """Print error message"""
        print(f"{Colors.RED}✗ {text}{Colors.ENDC}")
    
    def test_service_health(self, name: str, url: str) -> bool:
        """Test if a service is healthy"""
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                self.print_success(f"{name} is healthy")
                self.results.append((name, True, "Healthy"))
                return True
            else:
                self.print_error(f"{name} returned status {response.status_code}")
                self.results.append((name, False, f"Status {response.status_code}"))
                return False
        except requests.exceptions.ConnectionError:
            self.print_error(f"{name} is not reachable")
            self.results.append((name, False, "Not reachable"))
            return False
        except requests.exceptions.Timeout:
            self.print_error(f"{name} timed out")
            self.results.append((name, False, "Timeout"))
            return False
        except Exception as e:
            self.print_error(f"{name} error: {str(e)}")
            self.results.append((name, False, str(e)))
            return False
    
    def test_prometheus_targets(self) -> bool:
        """Test Prometheus target discovery"""
        try:
            response = requests.get('http://localhost:9090/api/v1/targets', timeout=5)
            if response.status_code == 200:
                data = response.json()
                active_targets = data.get('data', {}).get('activeTargets', [])
                
                up_count = sum(1 for t in active_targets if t.get('health') == 'up')
                total_count = len(active_targets)
                
                if up_count > 0:
                    self.print_success(f"Prometheus has {up_count}/{total_count} targets up")
                    return True
                else:
                    self.print_warning(f"Prometheus has 0/{total_count} targets up")
                    return False
            else:
                self.print_error("Failed to query Prometheus targets")
                return False
        except Exception as e:
            self.print_error(f"Prometheus targets test failed: {str(e)}")
            return False
    
    def test_prometheus_metrics(self) -> bool:
        """Test if Prometheus is collecting metrics"""
        try:
            # Query for up metric
            response = requests.get(
                'http://localhost:9090/api/v1/query',
                params={'query': 'up'},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('data', {}).get('result', [])
                
                if results:
                    self.print_success(f"Prometheus is collecting metrics ({len(results)} series)")
                    return True
                else:
                    self.print_warning("Prometheus has no metrics yet")
                    return False
            else:
                self.print_error("Failed to query Prometheus metrics")
                return False
        except Exception as e:
            self.print_error(f"Prometheus metrics test failed: {str(e)}")
            return False
    
    def test_grafana_datasources(self) -> bool:
        """Test Grafana datasource configuration"""
        try:
            response = requests.get(
                'http://localhost:3000/api/datasources',
                auth=('admin', 'admin'),
                timeout=5
            )
            
            if response.status_code == 200:
                datasources = response.json()
                
                if datasources:
                    self.print_success(f"Grafana has {len(datasources)} datasources configured")
                    for ds in datasources:
                        print(f"  - {ds.get('name')} ({ds.get('type')})")
                    return True
                else:
                    self.print_warning("Grafana has no datasources configured")
                    return False
            else:
                self.print_error("Failed to query Grafana datasources")
                return False
        except Exception as e:
            self.print_error(f"Grafana datasources test failed: {str(e)}")
            return False
    
    def test_grafana_dashboards(self) -> bool:
        """Test Grafana dashboard provisioning"""
        try:
            response = requests.get(
                'http://localhost:3000/api/search?type=dash-db',
                auth=('admin', 'admin'),
                timeout=5
            )
            
            if response.status_code == 200:
                dashboards = response.json()
                
                if dashboards:
                    self.print_success(f"Grafana has {len(dashboards)} dashboards")
                    for dash in dashboards:
                        print(f"  - {dash.get('title')}")
                    return True
                else:
                    self.print_warning("Grafana has no dashboards yet")
                    return False
            else:
                self.print_error("Failed to query Grafana dashboards")
                return False
        except Exception as e:
            self.print_error(f"Grafana dashboards test failed: {str(e)}")
            return False
    
    def test_elasticsearch_indices(self) -> bool:
        """Test Elasticsearch index creation"""
        try:
            response = requests.get('http://localhost:9200/_cat/indices?format=json', timeout=5)
            
            if response.status_code == 200:
                indices = response.json()
                
                if indices:
                    self.print_success(f"Elasticsearch has {len(indices)} indices")
                    return True
                else:
                    self.print_warning("Elasticsearch has no indices yet")
                    return False
            else:
                self.print_error("Failed to query Elasticsearch indices")
                return False
        except Exception as e:
            self.print_error(f"Elasticsearch indices test failed: {str(e)}")
            return False
    
    def test_alertmanager_config(self) -> bool:
        """Test Alertmanager configuration"""
        try:
            response = requests.get('http://localhost:9093/api/v1/status', timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                config = data.get('data', {}).get('config', {})
                
                if config:
                    self.print_success("Alertmanager is configured")
                    return True
                else:
                    self.print_warning("Alertmanager has no configuration")
                    return False
            else:
                self.print_error("Failed to query Alertmanager status")
                return False
        except Exception as e:
            self.print_error(f"Alertmanager config test failed: {str(e)}")
            return False
    
    def test_jaeger_services(self) -> bool:
        """Test Jaeger service discovery"""
        try:
            response = requests.get('http://localhost:16686/api/services', timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                services = data.get('data', [])
                
                if services:
                    self.print_success(f"Jaeger has {len(services)} services")
                    return True
                else:
                    self.print_warning("Jaeger has no services yet (no traces collected)")
                    return False
            else:
                self.print_error("Failed to query Jaeger services")
                return False
        except Exception as e:
            self.print_error(f"Jaeger services test failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all monitoring tests"""
        self.print_header("AgroBridge Monitoring Service Tests")
        
        print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Test 1: Service Health
        self.print_header("Test 1: Service Health Checks")
        for name, url in self.services.items():
            self.test_service_health(name, url)
            time.sleep(0.5)
        
        # Test 2: Prometheus
        self.print_header("Test 2: Prometheus Configuration")
        self.test_prometheus_targets()
        time.sleep(0.5)
        self.test_prometheus_metrics()
        
        # Test 3: Grafana
        self.print_header("Test 3: Grafana Configuration")
        self.test_grafana_datasources()
        time.sleep(0.5)
        self.test_grafana_dashboards()
        
        # Test 4: Elasticsearch
        self.print_header("Test 4: Elasticsearch Configuration")
        self.test_elasticsearch_indices()
        
        # Test 5: Alertmanager
        self.print_header("Test 5: Alertmanager Configuration")
        self.test_alertmanager_config()
        
        # Test 6: Jaeger
        self.print_header("Test 6: Jaeger Configuration")
        self.test_jaeger_services()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        self.print_header("Test Summary")
        
        passed = sum(1 for _, success, _ in self.results if success)
        total = len(self.results)
        
        print(f"Total tests: {total}")
        print(f"Passed: {Colors.GREEN}{passed}{Colors.ENDC}")
        print(f"Failed: {Colors.RED}{total - passed}{Colors.ENDC}")
        print(f"Success rate: {(passed/total*100):.1f}%\n")
        
        if passed == total:
            self.print_success("All tests passed! Monitoring is fully operational.")
            sys.exit(0)
        elif passed > total / 2:
            self.print_warning("Some tests failed. Check the errors above.")
            sys.exit(1)
        else:
            self.print_error("Most tests failed. Monitoring setup needs attention.")
            sys.exit(1)


def main():
    """Main entry point"""
    tester = MonitoringTester()
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Tests interrupted by user{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n{Colors.RED}Unexpected error: {str(e)}{Colors.ENDC}")
        sys.exit(1)


if __name__ == '__main__':
    main()
