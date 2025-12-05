# Troubleshooting Guide

Comprehensive troubleshooting guide for common issues in AgroBridge platform.

## Table of Contents

1. [Application Issues](#application-issues)
2. [Database Issues](#database-issues)
3. [Network Issues](#network-issues)
4. [Performance Issues](#performance-issues)
5. [Authentication Issues](#authentication-issues)
6. [Deployment Issues](#deployment-issues)
7. [Infrastructure Issues](#infrastructure-issues)
8. [Monitoring and Logging](#monitoring-and-logging)

---

## 1. Application Issues

### Service Won't Start

**Symptoms:**
- Pod in CrashLoopBackOff state
- Service fails to start
- Health checks failing

**Diagnosis:**
```bash
# Check pod status
kubectl get pods -n agrobridge-production

# View pod logs
kubectl logs <pod-name> -n agrobridge-production --tail=100

# Describe pod for events
kubectl describe pod <pod-name> -n agrobridge-production

# Check previous container logs
kubectl logs <pod-name> -n agrobridge-production --previous
```

**Common Causes & Solutions:**

1. **Missing Environment Variables**
```bash
# Check configmap
kubectl get configmap -n agrobridge-production
kubectl describe configmap app-config -n agrobridge-production

# Check secrets
kubectl get secrets -n agrobridge-production
kubectl describe secret app-secrets -n agrobridge-production

# Solution: Add missing variables
kubectl edit configmap app-config -n agrobridge-production
```

2. **Database Connection Failed**
```bash
# Test database connectivity
kubectl exec -it <pod-name> -n agrobridge-production -- \
  python manage.py dbshell

# Check database credentials
kubectl get secret database-credentials -n agrobridge-production -o yaml

# Solution: Update database connection string
kubectl edit secret database-credentials -n agrobridge-production
```

3. **Port Already in Use**
```bash
# Check port usage
kubectl exec -it <pod-name> -- netstat -tulpn | grep <port>

# Solution: Change port in configuration
kubectl edit deployment <service-name> -n agrobridge-production
```

### Import Errors

**Symptoms:**
- ModuleNotFoundError
- ImportError

**Diagnosis:**
```bash
# Check installed packages
kubectl exec -it <pod-name> -- pip list

# Check Python path
kubectl exec -it <pod-name> -- python -c "import sys; print(sys.path)"
```

**Solutions:**

1. **Missing Dependencies**
```bash
# Rebuild image with dependencies
docker build -t agrobridge/service:latest .
docker push agrobridge/service:latest

# Update deployment
kubectl rollout restart deployment <service-name> -n agrobridge-production
```

2. **Wrong Python Version**
```bash
# Check Python version
kubectl exec -it <pod-name> -- python --version

# Update Dockerfile to use correct version
FROM python:3.11-slim
```

### Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- OOMKilled pods
- Slow performance

**Diagnosis:**
```bash
# Monitor memory usage
kubectl top pods -n agrobridge-production --sort-by=memory

# Check memory limits
kubectl describe pod <pod-name> -n agrobridge-production | grep -A 5 "Limits"

# Profile memory usage
kubectl exec -it <pod-name> -- python -m memory_profiler manage.py
```

**Solutions:**

1. **Increase Memory Limits**
```yaml
# Update deployment
resources:
  limits:
    memory: "2Gi"
  requests:
    memory: "1Gi"
```

2. **Fix Memory Leaks**
```python
# Common causes:
# - Circular references
# - Unclosed database connections
# - Large caches
# - Event listeners not removed

# Solution: Use context managers
with connection.cursor() as cursor:
    cursor.execute("SELECT * FROM table")
```

---

## 2. Database Issues

### Connection Pool Exhausted

**Symptoms:**
- "Too many connections" error
- Slow database queries
- Timeouts

**Diagnosis:**
```bash
# Check active connections
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check connection limits
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "SHOW max_connections;"

# View active queries
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

**Solutions:**

1. **Increase Connection Pool**
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'
        }
    }
}
```

2. **Close Idle Connections**
```bash
# Kill idle connections
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '5 minutes';"
```

### Slow Queries

**Symptoms:**
- High response times
- Database CPU at 100%
- Query timeouts

**Diagnosis:**
```bash
# Enable slow query logging
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# View slow queries
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check missing indexes
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats WHERE schemaname = 'public' ORDER BY n_distinct DESC;"
```

**Solutions:**

1. **Add Indexes**
```sql
-- Identify missing indexes
SELECT
    schemaname,
    tablename,
    attname
FROM pg_stats
WHERE schemaname = 'public'
    AND n_distinct > 100
    AND correlation < 0.1;

-- Create indexes
CREATE INDEX idx_farms_user_created ON farms_farm(user_id, created_at);
CREATE INDEX idx_products_category ON marketplace_product(category);
```

2. **Optimize Queries**
```python
# Use select_related for foreign keys
farms = Farm.objects.select_related('owner').all()

# Use prefetch_related for many-to-many
farms = Farm.objects.prefetch_related('fields').all()

# Use only() to fetch specific fields
farms = Farm.objects.only('id', 'name', 'area').all()

# Use values() for dictionaries
farms = Farm.objects.values('id', 'name').all()
```

### Database Locks

**Symptoms:**
- Queries hanging
- Deadlock errors
- Slow writes

**Diagnosis:**
```bash
# Check for locks
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Check for blocking queries
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "SELECT blocked_locks.pid AS blocked_pid, blocking_locks.pid AS blocking_pid, blocked_activity.usename AS blocked_user, blocking_activity.usename AS blocking_user, blocked_activity.query AS blocked_statement, blocking_activity.query AS blocking_statement FROM pg_catalog.pg_locks blocked_locks JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid AND blocking_locks.pid != blocked_locks.pid JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid WHERE NOT blocked_locks.granted;"
```

**Solutions:**

1. **Kill Blocking Query**
```bash
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "SELECT pg_terminate_backend(<blocking_pid>);"
```

2. **Prevent Deadlocks**
```python
# Use select_for_update with consistent ordering
from django.db import transaction

with transaction.atomic():
    # Lock rows in consistent order
    farms = Farm.objects.select_for_update().order_by('id').filter(id__in=[1, 2, 3])
    for farm in farms:
        farm.area += 10
        farm.save()
```

---

## 3. Network Issues

### Service Unreachable

**Symptoms:**
- Connection refused
- Timeout errors
- DNS resolution failures

**Diagnosis:**
```bash
# Check service endpoints
kubectl get endpoints -n agrobridge-production

# Check service
kubectl describe service <service-name> -n agrobridge-production

# Test connectivity from pod
kubectl exec -it <pod-name> -- curl http://<service-name>:8000/health

# Check DNS resolution
kubectl exec -it <pod-name> -- nslookup <service-name>
```

**Solutions:**

1. **Service Selector Mismatch**
```bash
# Check pod labels
kubectl get pods -n agrobridge-production --show-labels

# Check service selector
kubectl get service <service-name> -n agrobridge-production -o yaml | grep selector

# Fix selector
kubectl edit service <service-name> -n agrobridge-production
```

2. **Network Policy Blocking**
```bash
# Check network policies
kubectl get networkpolicies -n agrobridge-production

# Describe policy
kubectl describe networkpolicy <policy-name> -n agrobridge-production

# Temporarily remove policy for testing
kubectl delete networkpolicy <policy-name> -n agrobridge-production
```

### High Latency

**Symptoms:**
- Slow API responses
- Timeouts
- Poor user experience

**Diagnosis:**
```bash
# Check network latency
kubectl exec -it <pod-name> -- ping <service-name>

# Trace route
kubectl exec -it <pod-name> -- traceroute <service-name>

# Check service mesh metrics (if using Istio)
kubectl exec -it <pod-name> -- curl localhost:15000/stats/prometheus | grep latency
```

**Solutions:**

1. **Enable Connection Pooling**
```python
# Use connection pooling
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

session = requests.Session()
retry = Retry(total=3, backoff_factor=0.3)
adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=20)
session.mount('http://', adapter)
session.mount('https://', adapter)
```

2. **Use Service Mesh**
```bash
# Install Istio
istioctl install --set profile=production

# Enable sidecar injection
kubectl label namespace agrobridge-production istio-injection=enabled

# Restart pods
kubectl rollout restart deployment --all -n agrobridge-production
```

---

## 4. Performance Issues

### High CPU Usage

**Symptoms:**
- CPU at 100%
- Slow responses
- Pod throttling

**Diagnosis:**
```bash
# Check CPU usage
kubectl top pods -n agrobridge-production --sort-by=cpu

# Profile application
kubectl exec -it <pod-name> -- python -m cProfile -o profile.stats manage.py runserver

# Analyze profile
kubectl cp <pod-name>:profile.stats ./profile.stats
python -m pstats profile.stats
```

**Solutions:**

1. **Optimize Code**
```python
# Use bulk operations
Farm.objects.bulk_create([
    Farm(name=f"Farm {i}", owner=user, area=10)
    for i in range(1000)
])

# Use iterator for large querysets
for farm in Farm.objects.iterator(chunk_size=100):
    process_farm(farm)

# Cache expensive operations
from django.core.cache import cache

def get_farm_statistics(farm_id):
    cache_key = f"farm_stats_{farm_id}"
    stats = cache.get(cache_key)
    if stats is None:
        stats = calculate_statistics(farm_id)
        cache.set(cache_key, stats, timeout=3600)
    return stats
```

2. **Scale Horizontally**
```bash
# Increase replicas
kubectl scale deployment <service-name> --replicas=5 -n agrobridge-production

# Enable autoscaling
kubectl autoscale deployment <service-name> \
  --min=3 --max=10 --cpu-percent=70 \
  -n agrobridge-production
```

### Cache Issues

**Symptoms:**
- High cache miss rate
- Slow responses
- High database load

**Diagnosis:**
```bash
# Check Redis status
kubectl exec -it redis-0 -- redis-cli INFO stats

# Check cache hit rate
kubectl exec -it redis-0 -- redis-cli INFO stats | grep keyspace_hits

# Monitor cache
kubectl exec -it redis-0 -- redis-cli MONITOR
```

**Solutions:**

1. **Optimize Cache Strategy**
```python
# Use appropriate cache timeouts
cache.set('key', value, timeout=3600)  # 1 hour

# Use cache versioning
cache_key = f"farm_{farm_id}_v2"

# Invalidate cache on updates
def update_farm(farm_id, data):
    farm = Farm.objects.get(id=farm_id)
    farm.update(**data)
    cache.delete(f"farm_{farm_id}")
```

2. **Increase Cache Size**
```bash
# Edit Redis configuration
kubectl edit statefulset redis -n agrobridge-production

# Update maxmemory
args:
  - --maxmemory 2gb
  - --maxmemory-policy allkeys-lru
```

---

## 5. Authentication Issues

### Token Expired

**Symptoms:**
- 401 Unauthorized errors
- "Token has expired" message

**Solutions:**

1. **Refresh Token**
```python
# Client-side token refresh
def refresh_access_token(refresh_token):
    response = requests.post(
        f"{API_BASE_URL}/auth/token/refresh/",
        json={"refresh": refresh_token}
    )
    return response.json()['access']

# Automatic token refresh
import requests
from requests.adapters import HTTPAdapter

class TokenRefreshAdapter(HTTPAdapter):
    def send(self, request, **kwargs):
        response = super().send(request, **kwargs)
        if response.status_code == 401:
            # Refresh token and retry
            new_token = refresh_access_token(refresh_token)
            request.headers['Authorization'] = f'Bearer {new_token}'
            response = super().send(request, **kwargs)
        return response
```

2. **Increase Token Lifetime**
```python
# settings.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

### Permission Denied

**Symptoms:**
- 403 Forbidden errors
- "You do not have permission" message

**Diagnosis:**
```bash
# Check user permissions
kubectl exec -it <pod-name> -- python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(email='user@example.com')
>>> user.get_all_permissions()
>>> user.groups.all()
```

**Solutions:**

1. **Assign Permissions**
```python
# Add user to group
from django.contrib.auth.models import Group
group = Group.objects.get(name='farmers')
user.groups.add(group)

# Assign specific permission
from django.contrib.auth.models import Permission
permission = Permission.objects.get(codename='add_farm')
user.user_permissions.add(permission)
```

---

## 6. Deployment Issues

### Image Pull Errors

**Symptoms:**
- ImagePullBackOff
- ErrImagePull

**Diagnosis:**
```bash
# Check pod events
kubectl describe pod <pod-name> -n agrobridge-production

# Check image
kubectl get pod <pod-name> -n agrobridge-production -o jsonpath='{.spec.containers[0].image}'

# Test image pull
docker pull <image-name>
```

**Solutions:**

1. **Fix Image Name**
```bash
# Update deployment with correct image
kubectl set image deployment/<service-name> \
  <container-name>=<correct-image> \
  -n agrobridge-production
```

2. **Add Image Pull Secret**
```bash
# Create secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n agrobridge-production

# Add to deployment
kubectl patch serviceaccount default \
  -p '{"imagePullSecrets": [{"name": "regcred"}]}' \
  -n agrobridge-production
```

### Failed Migrations

**Symptoms:**
- Migration errors
- Database schema mismatch

**Diagnosis:**
```bash
# Check migration status
kubectl exec -it <pod-name> -- python manage.py showmigrations

# Check for conflicts
kubectl exec -it <pod-name> -- python manage.py makemigrations --check
```

**Solutions:**

1. **Resolve Conflicts**
```bash
# Merge migrations
kubectl exec -it <pod-name> -- python manage.py makemigrations --merge

# Apply migrations
kubectl exec -it <pod-name> -- python manage.py migrate
```

2. **Fake Migration**
```bash
# If migration already applied manually
kubectl exec -it <pod-name> -- python manage.py migrate --fake <app> <migration>
```

---

## 7. Infrastructure Issues

### Disk Space Full

**Symptoms:**
- "No space left on device"
- Pod evictions
- Write failures

**Diagnosis:**
```bash
# Check disk usage
kubectl exec -it <pod-name> -- df -h

# Check large files
kubectl exec -it <pod-name> -- du -sh /* | sort -h

# Check PVC usage
kubectl get pvc -n agrobridge-production
```

**Solutions:**

1. **Clean Up Logs**
```bash
# Rotate logs
kubectl exec -it <pod-name> -- find /var/log -name "*.log" -mtime +7 -delete

# Clean Docker images
docker system prune -a --volumes
```

2. **Increase PVC Size**
```bash
# Edit PVC
kubectl edit pvc <pvc-name> -n agrobridge-production

# Increase size
spec:
  resources:
    requests:
      storage: 100Gi
```

### Node Issues

**Symptoms:**
- Node NotReady
- Pod scheduling failures

**Diagnosis:**
```bash
# Check node status
kubectl get nodes

# Describe node
kubectl describe node <node-name>

# Check node resources
kubectl top nodes
```

**Solutions:**

1. **Drain and Restart Node**
```bash
# Drain node
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Restart node (cloud provider specific)
# AWS
aws ec2 reboot-instances --instance-ids <instance-id>

# Uncordon node
kubectl uncordon <node-name>
```

---

## 8. Monitoring and Logging

### Missing Logs

**Symptoms:**
- No logs in Kibana
- Empty log files

**Diagnosis:**
```bash
# Check logging pods
kubectl get pods -n logging

# Check Filebeat
kubectl logs -n logging -l app=filebeat

# Check Logstash
kubectl logs -n logging -l app=logstash
```

**Solutions:**

1. **Restart Logging Stack**
```bash
kubectl rollout restart deployment filebeat -n logging
kubectl rollout restart deployment logstash -n logging
```

2. **Fix Log Format**
```python
# Ensure JSON logging
LOGGING = {
    'version': 1,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
```

### Metrics Not Showing

**Symptoms:**
- Empty Grafana dashboards
- Missing Prometheus metrics

**Diagnosis:**
```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
# Open http://localhost:9090/targets

# Check service monitor
kubectl get servicemonitor -n agrobridge-production

# Test metrics endpoint
kubectl exec -it <pod-name> -- curl localhost:8000/metrics
```

**Solutions:**

1. **Add Metrics Endpoint**
```python
# Install prometheus client
pip install prometheus-client

# Add metrics
from prometheus_client import Counter, Histogram
import time

request_count = Counter('http_requests_total', 'Total HTTP requests')
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')

@request_duration.time()
def process_request(request):
    request_count.inc()
    # Process request
```

2. **Create ServiceMonitor**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: agrobridge-metrics
  namespace: agrobridge-production
spec:
  selector:
    matchLabels:
      app: api-gateway
  endpoints:
  - port: metrics
    interval: 30s
```

---

## Emergency Procedures

### Complete System Failure

1. **Assess Situation**
```bash
kubectl get all -n agrobridge-production
kubectl get events -n agrobridge-production --sort-by='.lastTimestamp'
```

2. **Enable Maintenance Mode**
```bash
kubectl apply -f kubernetes/maintenance-mode.yaml
```

3. **Restore from Backup**
```bash
./scripts/restore-full-system.sh <backup-timestamp>
```

4. **Verify and Resume**
```bash
./tests/smoke-tests.sh production
kubectl delete -f kubernetes/maintenance-mode.yaml
```

### Data Corruption

1. **Stop All Services**
```bash
kubectl scale deployment --all --replicas=0 -n agrobridge-production
```

2. **Restore Database**
```bash
./scripts/restore-database.sh production <last-good-backup>
```

3. **Verify Data Integrity**
```bash
./scripts/verify-database.sh production
```

4. **Restart Services**
```bash
kubectl scale deployment --all --replicas=3 -n agrobridge-production
```

---

## Getting Help

### Internal Resources
- **Runbooks**: See RUNBOOKS.md
- **Architecture**: See docs/architecture/
- **API Docs**: https://api.agrobridge.com/docs

### External Support
- **Cloud Provider**: support@cloudprovider.com
- **Database Support**: support@database.com
- **On-Call**: +254-XXX-XXXX-XXX

### Escalation
1. On-call engineer (0-15 min)
2. Team lead (15-30 min)
3. Engineering manager (30-60 min)
4. CTO (> 60 min or critical)
