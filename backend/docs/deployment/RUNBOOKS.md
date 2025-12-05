# Deployment Runbooks

This document contains comprehensive operational runbooks for deployment, maintenance, and troubleshooting tasks.

## Table of Contents

1. [Standard Deployment](#standard-deployment)
2. [Emergency Rollback](#emergency-rollback)
3. [Database Migration](#database-migration)
4. [Scaling Operations](#scaling-operations)
5. [Backup and Restore](#backup-and-restore)
6. [Security Incident Response](#security-incident-response)
7. [Performance Troubleshooting](#performance-troubleshooting)
8. [Service Recovery](#service-recovery)
9. [Certificate Renewal](#certificate-renewal)
10. [Monitoring Setup](#monitoring-setup)

---

## 1. Standard Deployment

### Purpose
Deploy a new version of AgroBridge to production with zero downtime.

### Prerequisites
- [ ] All tests passing in CI/CD
- [ ] Code review approved
- [ ] Database migrations tested in staging
- [ ] Deployment window scheduled
- [ ] Team notified
- [ ] Rollback plan ready

### Steps

#### 1.1 Pre-Deployment Checks
```bash
# Verify staging deployment
kubectl get pods -n agrobridge-staging
kubectl logs -n agrobridge-staging -l app=api-gateway --tail=100

# Check database backup
./scripts/verify-backup.sh production

# Verify monitoring
curl https://status.agrobridge.com/api/health
```

#### 1.2 Deploy to Production
```bash
# Set context
kubectl config use-context production

# Deploy new version
kubectl apply -f kubernetes/production/

# Watch rollout
kubectl rollout status deployment/api-gateway -n agrobridge-production
kubectl rollout status deployment/auth-service -n agrobridge-production
kubectl rollout status deployment/marketplace-service -n agrobridge-production

# Verify all services
kubectl get pods -n agrobridge-production
```

#### 1.3 Run Database Migrations
```bash
# Get migration pod
kubectl get pods -n agrobridge-production -l app=migration-job

# Run migrations
kubectl exec -it <migration-pod> -n agrobridge-production -- \
  python manage.py migrate --noinput

# Verify migrations
kubectl exec -it <migration-pod> -n agrobridge-production -- \
  python manage.py showmigrations
```

#### 1.4 Post-Deployment Verification
```bash
# Health checks
curl https://api.agrobridge.com/health/
curl https://api.agrobridge.com/health/ready/
curl https://api.agrobridge.com/health/live/

# Smoke tests
./tests/smoke-tests.sh production

# Check logs for errors
kubectl logs -n agrobridge-production -l app=api-gateway --tail=100 | grep ERROR

# Monitor metrics
# Open Grafana: https://grafana.agrobridge.com
# Check dashboard: "Production Deployment"
```

#### 1.5 Enable Traffic
```bash
# Gradually increase traffic (if using canary deployment)
kubectl patch deployment api-gateway -n agrobridge-production \
  -p '{"spec":{"replicas":10}}'

# Monitor error rates
watch -n 5 'kubectl top pods -n agrobridge-production'
```

### Success Criteria
- [ ] All pods running and healthy
- [ ] Health checks passing
- [ ] Error rate < 0.1%
- [ ] Response time < 500ms (p95)
- [ ] No critical alerts

### Rollback Trigger
If any of these occur within 30 minutes:
- Error rate > 1%
- Response time > 2s (p95)
- Critical service down
- Database corruption detected

---

## 2. Emergency Rollback

### Purpose
Quickly revert to the previous stable version in case of critical issues.

### When to Rollback
- Critical bugs affecting users
- Security vulnerabilities discovered
- Performance degradation > 50%
- Data corruption risk
- Service unavailability > 5 minutes

### Steps

#### 2.1 Immediate Actions
```bash
# Stop current deployment
kubectl rollout pause deployment/api-gateway -n agrobridge-production

# Notify team
./scripts/notify-team.sh "ROLLBACK IN PROGRESS"

# Set maintenance mode (optional)
kubectl apply -f kubernetes/maintenance-mode.yaml
```

#### 2.2 Rollback Application
```bash
# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n agrobridge-production
kubectl rollout undo deployment/auth-service -n agrobridge-production
kubectl rollout undo deployment/marketplace-service -n agrobridge-production

# Watch rollback
kubectl rollout status deployment/api-gateway -n agrobridge-production

# Verify all services
kubectl get pods -n agrobridge-production
```

#### 2.3 Rollback Database (if needed)
```bash
# CAUTION: Only if migrations caused issues

# Stop all services
kubectl scale deployment --all --replicas=0 -n agrobridge-production

# Restore database from backup
./scripts/restore-database.sh production <backup-timestamp>

# Verify database
./scripts/verify-database.sh production

# Restart services
kubectl scale deployment --all --replicas=3 -n agrobridge-production
```

#### 2.4 Verification
```bash
# Health checks
./tests/health-checks.sh production

# Smoke tests
./tests/smoke-tests.sh production

# Check error logs
kubectl logs -n agrobridge-production -l app=api-gateway --tail=200 | grep ERROR
```

#### 2.5 Post-Rollback
```bash
# Disable maintenance mode
kubectl delete -f kubernetes/maintenance-mode.yaml

# Notify team
./scripts/notify-team.sh "ROLLBACK COMPLETE - System Stable"

# Create incident report
./scripts/create-incident-report.sh
```

### Recovery Time Objective (RTO)
- Application rollback: < 5 minutes
- Database rollback: < 15 minutes
- Full system recovery: < 30 minutes

---

## 3. Database Migration

### Purpose
Safely apply database schema changes to production.

### Prerequisites
- [ ] Migration tested in staging
- [ ] Backup completed
- [ ] Migration is reversible
- [ ] Downtime window approved (if needed)

### Steps

#### 3.1 Pre-Migration
```bash
# Create backup
./scripts/backup-database.sh production

# Verify backup
./scripts/verify-backup.sh production

# Test migration in staging
kubectl exec -it <staging-pod> -- python manage.py migrate --plan

# Estimate migration time
kubectl exec -it <staging-pod> -- python manage.py migrate --dry-run
```

#### 3.2 Run Migration
```bash
# For zero-downtime migrations
kubectl exec -it <migration-pod> -n agrobridge-production -- \
  python manage.py migrate --noinput

# For migrations requiring downtime
# 1. Enable maintenance mode
kubectl apply -f kubernetes/maintenance-mode.yaml

# 2. Scale down services
kubectl scale deployment --all --replicas=0 -n agrobridge-production

# 3. Run migration
kubectl exec -it <migration-pod> -n agrobridge-production -- \
  python manage.py migrate --noinput

# 4. Scale up services
kubectl scale deployment --all --replicas=3 -n agrobridge-production

# 5. Disable maintenance mode
kubectl delete -f kubernetes/maintenance-mode.yaml
```

#### 3.3 Verification
```bash
# Verify migrations applied
kubectl exec -it <pod> -n agrobridge-production -- \
  python manage.py showmigrations

# Check database integrity
./scripts/verify-database.sh production

# Run smoke tests
./tests/smoke-tests.sh production
```

### Rollback Migration
```bash
# Revert to previous migration
kubectl exec -it <pod> -n agrobridge-production -- \
  python manage.py migrate <app_name> <previous_migration_number>

# Or restore from backup
./scripts/restore-database.sh production <backup-timestamp>
```

---

## 4. Scaling Operations

### Purpose
Scale services up or down based on load.

### Horizontal Scaling

#### Scale Up
```bash
# Scale specific service
kubectl scale deployment api-gateway --replicas=10 -n agrobridge-production

# Scale all services
kubectl scale deployment --all --replicas=5 -n agrobridge-production

# Auto-scaling
kubectl autoscale deployment api-gateway \
  --min=3 --max=20 --cpu-percent=70 \
  -n agrobridge-production
```

#### Scale Down
```bash
# Gradually scale down
kubectl scale deployment api-gateway --replicas=3 -n agrobridge-production

# Verify no active connections
kubectl exec -it <pod> -- netstat -an | grep ESTABLISHED
```

### Vertical Scaling

#### Increase Resources
```bash
# Edit deployment
kubectl edit deployment api-gateway -n agrobridge-production

# Update resources
resources:
  requests:
    memory: "2Gi"
    cpu: "1000m"
  limits:
    memory: "4Gi"
    cpu: "2000m"

# Apply changes
kubectl apply -f kubernetes/production/api-gateway.yaml
```

### Database Scaling

#### Read Replicas
```bash
# Add read replica
./scripts/add-read-replica.sh production

# Configure connection pooling
kubectl edit configmap database-config -n agrobridge-production
```

---

## 5. Backup and Restore

### Purpose
Ensure data safety and enable disaster recovery.

### Automated Backups

#### Configure Backup Schedule
```bash
# Edit backup CronJob
kubectl edit cronjob database-backup -n agrobridge-production

# Verify backup schedule
kubectl get cronjob -n agrobridge-production

# Check recent backups
./scripts/list-backups.sh production
```

### Manual Backup

#### Full Database Backup
```bash
# PostgreSQL
kubectl exec -it postgres-0 -n agrobridge-production -- \
  pg_dumpall -U postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# MongoDB
kubectl exec -it mongodb-0 -n agrobridge-production -- \
  mongodump --out=/backup/$(date +%Y%m%d_%H%M%S)

# Upload to S3
aws s3 cp backup_*.sql s3://agrobridge-backups/production/
```

#### Application Data Backup
```bash
# Media files
kubectl exec -it <pod> -n agrobridge-production -- \
  tar -czf /tmp/media_backup.tar.gz /app/media/

# Upload to S3
kubectl cp <pod>:/tmp/media_backup.tar.gz ./media_backup.tar.gz
aws s3 cp media_backup.tar.gz s3://agrobridge-backups/media/
```

### Restore from Backup

#### Restore Database
```bash
# Stop services
kubectl scale deployment --all --replicas=0 -n agrobridge-production

# Download backup
aws s3 cp s3://agrobridge-backups/production/backup_20241205.sql ./

# Restore PostgreSQL
kubectl exec -i postgres-0 -n agrobridge-production -- \
  psql -U postgres < backup_20241205.sql

# Restore MongoDB
kubectl exec -it mongodb-0 -n agrobridge-production -- \
  mongorestore /backup/20241205/

# Restart services
kubectl scale deployment --all --replicas=3 -n agrobridge-production
```

#### Restore Media Files
```bash
# Download backup
aws s3 cp s3://agrobridge-backups/media/media_backup.tar.gz ./

# Upload to pod
kubectl cp media_backup.tar.gz <pod>:/tmp/

# Extract
kubectl exec -it <pod> -n agrobridge-production -- \
  tar -xzf /tmp/media_backup.tar.gz -C /app/
```

### Backup Verification
```bash
# Test restore in staging
./scripts/test-restore.sh staging backup_20241205.sql

# Verify data integrity
./scripts/verify-backup.sh production backup_20241205.sql
```

---

## 6. Security Incident Response

### Purpose
Respond to security incidents quickly and effectively.

### Incident Types
1. Unauthorized access
2. Data breach
3. DDoS attack
4. Malware/ransomware
5. Vulnerability exploitation

### Response Steps

#### 6.1 Detection and Assessment
```bash
# Check security logs
kubectl logs -n agrobridge-production -l app=api-gateway | grep "401\|403\|500"

# Review access logs
./scripts/analyze-access-logs.sh production

# Check for suspicious activity
./scripts/security-audit.sh production
```

#### 6.2 Containment
```bash
# Block suspicious IPs
kubectl exec -it api-gateway-<pod> -- \
  iptables -A INPUT -s <suspicious-ip> -j DROP

# Revoke compromised tokens
kubectl exec -it auth-service-<pod> -- \
  python manage.py revoke_tokens --user-id <user-id>

# Enable rate limiting
kubectl apply -f kubernetes/rate-limit-strict.yaml

# Isolate affected services
kubectl label pod <pod-name> quarantine=true
```

#### 6.3 Eradication
```bash
# Patch vulnerabilities
kubectl apply -f kubernetes/security-patches/

# Update secrets
./scripts/rotate-secrets.sh production

# Scan for malware
./scripts/malware-scan.sh production
```

#### 6.4 Recovery
```bash
# Restore from clean backup
./scripts/restore-database.sh production <clean-backup>

# Redeploy services
kubectl rollout restart deployment --all -n agrobridge-production

# Verify system integrity
./scripts/integrity-check.sh production
```

#### 6.5 Post-Incident
```bash
# Generate incident report
./scripts/generate-incident-report.sh

# Update security policies
./scripts/update-security-policies.sh

# Notify affected users
./scripts/notify-users.sh security-incident
```

---

## 7. Performance Troubleshooting

### Purpose
Diagnose and resolve performance issues.

### Common Issues

#### High CPU Usage
```bash
# Identify high CPU pods
kubectl top pods -n agrobridge-production --sort-by=cpu

# Check pod details
kubectl describe pod <pod-name> -n agrobridge-production

# View logs
kubectl logs <pod-name> -n agrobridge-production --tail=500

# Profile application
kubectl exec -it <pod-name> -- python -m cProfile manage.py runserver
```

#### High Memory Usage
```bash
# Check memory usage
kubectl top pods -n agrobridge-production --sort-by=memory

# Check for memory leaks
kubectl exec -it <pod-name> -- python -m memory_profiler manage.py

# Restart pod if needed
kubectl delete pod <pod-name> -n agrobridge-production
```

#### Slow Database Queries
```bash
# Enable query logging
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# Analyze slow queries
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Add indexes
kubectl exec -it <pod> -- python manage.py dbshell
CREATE INDEX idx_farm_user ON farms_farm(user_id);
```

#### High Response Times
```bash
# Check API gateway metrics
kubectl logs -n agrobridge-production -l app=api-gateway | grep "response_time"

# Analyze bottlenecks
./scripts/analyze-performance.sh production

# Enable caching
kubectl apply -f kubernetes/redis-cache.yaml
```

---

## 8. Service Recovery

### Purpose
Recover failed services and restore normal operations.

### Service Health Check
```bash
# Check all services
kubectl get pods -n agrobridge-production

# Check specific service
kubectl describe pod <pod-name> -n agrobridge-production

# View events
kubectl get events -n agrobridge-production --sort-by='.lastTimestamp'
```

### Restart Service
```bash
# Graceful restart
kubectl rollout restart deployment <service-name> -n agrobridge-production

# Force restart
kubectl delete pod <pod-name> -n agrobridge-production

# Restart all services
kubectl rollout restart deployment --all -n agrobridge-production
```

### Database Recovery
```bash
# Check database status
kubectl exec -it postgres-0 -- psql -U postgres -c "SELECT version();"

# Repair database
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "REINDEX DATABASE agrobridge;"

# Vacuum database
kubectl exec -it postgres-0 -- \
  psql -U postgres -c "VACUUM FULL ANALYZE;"
```

### Message Queue Recovery
```bash
# Check RabbitMQ status
kubectl exec -it rabbitmq-0 -- rabbitmqctl status

# Purge dead queues
kubectl exec -it rabbitmq-0 -- rabbitmqctl purge_queue <queue-name>

# Reset RabbitMQ
kubectl exec -it rabbitmq-0 -- rabbitmqctl reset
```

---

## 9. Certificate Renewal

### Purpose
Renew SSL/TLS certificates before expiration.

### Check Certificate Expiry
```bash
# Check certificate
echo | openssl s_client -servername api.agrobridge.com \
  -connect api.agrobridge.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# List all certificates
kubectl get certificates -n agrobridge-production
```

### Renew Certificate (Let's Encrypt)
```bash
# Using cert-manager
kubectl apply -f kubernetes/certificates/

# Force renewal
kubectl delete certificate api-agrobridge-com -n agrobridge-production
kubectl apply -f kubernetes/certificates/api-certificate.yaml

# Verify renewal
kubectl describe certificate api-agrobridge-com -n agrobridge-production
```

### Manual Certificate Update
```bash
# Create secret with new certificate
kubectl create secret tls api-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n agrobridge-production

# Update ingress
kubectl apply -f kubernetes/ingress.yaml

# Verify
curl -vI https://api.agrobridge.com
```

---

## 10. Monitoring Setup

### Purpose
Set up comprehensive monitoring for the platform.

### Prometheus Setup
```bash
# Install Prometheus
helm install prometheus prometheus-community/prometheus \
  -n monitoring --create-namespace

# Configure scrape targets
kubectl apply -f kubernetes/monitoring/prometheus-config.yaml

# Verify
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
# Open http://localhost:9090
```

### Grafana Setup
```bash
# Install Grafana
helm install grafana grafana/grafana \
  -n monitoring

# Get admin password
kubectl get secret --namespace monitoring grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode

# Add Prometheus datasource
kubectl apply -f kubernetes/monitoring/grafana-datasources.yaml

# Import dashboards
kubectl apply -f kubernetes/monitoring/grafana-dashboards.yaml
```

### Alert Manager Setup
```bash
# Configure alerts
kubectl apply -f kubernetes/monitoring/alert-rules.yaml

# Configure notifications
kubectl apply -f kubernetes/monitoring/alert-manager-config.yaml

# Test alerts
kubectl exec -it alertmanager-0 -- amtool alert add test
```

### Log Aggregation (ELK Stack)
```bash
# Install Elasticsearch
helm install elasticsearch elastic/elasticsearch -n logging

# Install Logstash
helm install logstash elastic/logstash -n logging

# Install Kibana
helm install kibana elastic/kibana -n logging

# Configure log shipping
kubectl apply -f kubernetes/logging/filebeat-config.yaml
```

---

## Emergency Contacts

### On-Call Team
- **Primary**: +254-XXX-XXXX-XXX
- **Secondary**: +254-XXX-XXXX-XXX
- **Manager**: +254-XXX-XXXX-XXX

### Escalation Path
1. On-call engineer (0-15 min)
2. Team lead (15-30 min)
3. Engineering manager (30-60 min)
4. CTO (> 60 min or critical)

### External Contacts
- **Cloud Provider Support**: support@cloudprovider.com
- **Database Support**: support@database.com
- **Security Team**: security@agrobridge.com

---

## Appendix

### Useful Commands

#### Quick Status Check
```bash
#!/bin/bash
# save as: quick-status.sh

echo "=== Pod Status ==="
kubectl get pods -n agrobridge-production

echo "=== Service Status ==="
kubectl get svc -n agrobridge-production

echo "=== Recent Events ==="
kubectl get events -n agrobridge-production --sort-by='.lastTimestamp' | tail -10

echo "=== Resource Usage ==="
kubectl top pods -n agrobridge-production
```

#### Health Check Script
```bash
#!/bin/bash
# save as: health-check.sh

ENDPOINTS=(
  "https://api.agrobridge.com/health/"
  "https://api.agrobridge.com/health/ready/"
  "https://api.agrobridge.com/health/live/"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Checking $endpoint"
  curl -f -s -o /dev/null -w "%{http_code}\n" "$endpoint"
done
```

### Maintenance Windows

- **Regular Maintenance**: Every Sunday 02:00-04:00 UTC
- **Emergency Maintenance**: As needed with 1-hour notice
- **Planned Upgrades**: Monthly, first Saturday 00:00-06:00 UTC

### Change Management

All production changes must:
1. Be tested in staging
2. Have rollback plan
3. Be documented
4. Be approved by team lead
5. Be scheduled during maintenance window (unless emergency)
