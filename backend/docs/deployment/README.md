# AgroBridge Deployment Guide

## Overview

This guide covers deployment procedures for the AgroBridge platform across different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Methods](#deployment-methods)
4. [Configuration](#configuration)
5. [Database Migrations](#database-migrations)
6. [Monitoring](#monitoring)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Docker**: v20.10+
- **Kubernetes**: v1.24+
- **kubectl**: v1.24+
- **Helm**: v3.10+
- **Git**: v2.30+

### Access Requirements

- Kubernetes cluster access (staging/production)
- Container registry credentials (GHCR)
- Database credentials
- Cloud provider credentials (AWS/GCP/Azure)
- Secrets management access (Vault)

### System Requirements

**Minimum (Development)**:
- 4 CPU cores
- 8 GB RAM
- 50 GB storage

**Recommended (Production)**:
- 16 CPU cores
- 32 GB RAM
- 500 GB SSD storage
- Load balancer
- CDN

## Environment Setup

### Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/agrobridge.git
cd agrobridge

# Set up Python environment
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start infrastructure
docker-compose -f docker-compose.infrastructure.yml up -d

# Run migrations
python manage.py migrate

# Start services
python manage.py runserver
```

### Staging Environment

```bash
# Configure kubectl
export KUBECONFIG=~/.kube/staging-config

# Verify connection
kubectl cluster-info
kubectl get nodes

# Deploy infrastructure
kubectl apply -k kubernetes/overlays/staging/infrastructure

# Deploy services
kubectl apply -k kubernetes/overlays/staging

# Verify deployment
kubectl get pods -n agrobridge-staging
```

### Production Environment

```bash
# Configure kubectl
export KUBECONFIG=~/.kube/production-config

# Verify connection
kubectl cluster-info
kubectl get nodes

# Create namespace
kubectl create namespace agrobridge

# Deploy secrets
kubectl apply -f kubernetes/base/secrets/

# Deploy infrastructure
kubectl apply -k kubernetes/overlays/production/infrastructure

# Deploy services
kubectl apply -k kubernetes/overlays/production

# Verify deployment
kubectl get pods -n agrobridge
kubectl get svc -n agrobridge
```

## Deployment Methods

### Method 1: Docker Compose (Development)

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Method 2: Kubernetes (Staging/Production)

```bash
# Deploy using kubectl
kubectl apply -k kubernetes/overlays/production

# Deploy using Helm
helm install agrobridge ./helm/agrobridge \
  --namespace agrobridge \
  --values helm/values-production.yaml

# Upgrade deployment
helm upgrade agrobridge ./helm/agrobridge \
  --namespace agrobridge \
  --values helm/values-production.yaml
```

### Method 3: CI/CD Pipeline (Automated)

Deployments are automated via GitHub Actions:

1. **Staging**: Automatic on push to `develop`
2. **Production**: Manual approval required on push to `main`

See [CI/CD Documentation](../ci-cd/README.md) for details.

## Configuration

### Environment Variables

**Required Variables:**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/agrobridge
MONGODB_URL=mongodb://user:pass@host:27017/agrobridge
REDIS_URL=redis://host:6379/0

# Authentication
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# External Services
OPENAI_API_KEY=your-openai-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Storage
S3_BUCKET_NAME=agrobridge-storage
CDN_URL=https://cdn.agrobridge.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
PROMETHEUS_ENABLED=true
```

### Secrets Management

**Using Kubernetes Secrets:**

```bash
# Create secret
kubectl create secret generic agrobridge-secrets \
  --from-literal=database-url='postgresql://...' \
  --from-literal=jwt-secret='...' \
  --namespace agrobridge

# Create from file
kubectl create secret generic agrobridge-secrets \
  --from-env-file=.env.production \
  --namespace agrobridge
```

**Using HashiCorp Vault:**

```bash
# Write secrets
vault kv put secret/agrobridge/database \
  url='postgresql://...' \
  password='...'

# Read secrets
vault kv get secret/agrobridge/database
```

### Service Configuration

Each service has its own configuration file:

```
backend/
├── authentication/config.py
├── farms/config.py
├── marketplace/config.py
└── ...
```

## Database Migrations

### Running Migrations

```bash
# Development
python manage.py migrate

# Staging
kubectl exec -it deployment/authentication -n agrobridge-staging -- \
  python manage.py migrate

# Production (with backup)
# 1. Backup database first
./scripts/backup-database.sh production

# 2. Run migrations
kubectl exec -it deployment/authentication -n agrobridge -- \
  python manage.py migrate

# 3. Verify
kubectl exec -it deployment/authentication -n agrobridge -- \
  python manage.py showmigrations
```

### Creating Migrations

```bash
# Create migration
python manage.py makemigrations

# Create empty migration
python manage.py makemigrations --empty app_name

# Name migration
python manage.py makemigrations --name add_user_fields
```

### Migration Best Practices

1. **Always backup before migrations**
2. **Test migrations in staging first**
3. **Use reversible migrations when possible**
4. **Document complex migrations**
5. **Monitor migration performance**

## Monitoring

### Health Checks

```bash
# Check service health
curl https://api.agrobridge.com/health

# Check individual service
kubectl exec -it deployment/authentication -n agrobridge -- \
  curl http://localhost:8000/health
```

### Logs

```bash
# View logs
kubectl logs deployment/authentication -n agrobridge

# Follow logs
kubectl logs -f deployment/authentication -n agrobridge

# View logs from all pods
kubectl logs -l app=authentication -n agrobridge

# View logs from specific time
kubectl logs deployment/authentication -n agrobridge --since=1h
```

### Metrics

Access monitoring dashboards:

- **Grafana**: https://grafana.agrobridge.com
- **Prometheus**: https://prometheus.agrobridge.com
- **Kibana**: https://kibana.agrobridge.com

### Alerts

Configure alerts in `monitoring/alerts/`:

```yaml
# Example alert
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
```

## Rollback Procedures

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/authentication -n agrobridge

# Rollback to previous version
kubectl rollout undo deployment/authentication -n agrobridge

# Rollback to specific revision
kubectl rollout undo deployment/authentication \
  --to-revision=2 \
  -n agrobridge

# Check rollout status
kubectl rollout status deployment/authentication -n agrobridge
```

### Helm Rollback

```bash
# View release history
helm history agrobridge -n agrobridge

# Rollback to previous release
helm rollback agrobridge -n agrobridge

# Rollback to specific revision
helm rollback agrobridge 2 -n agrobridge
```

### Database Rollback

```bash
# Restore from backup
./scripts/restore-database.sh production backup-2025-12-05.sql

# Rollback specific migration
python manage.py migrate app_name 0001_previous_migration
```

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -n agrobridge

# Describe pod
kubectl describe pod <pod-name> -n agrobridge

# Check events
kubectl get events -n agrobridge --sort-by='.lastTimestamp'

# Common causes:
# - Image pull errors
# - Resource limits
# - Configuration errors
# - Health check failures
```

#### 2. Database Connection Issues

```bash
# Test database connection
kubectl exec -it deployment/authentication -n agrobridge -- \
  python -c "from django.db import connection; connection.ensure_connection()"

# Check database pod
kubectl get pods -l app=postgresql -n agrobridge

# View database logs
kubectl logs -l app=postgresql -n agrobridge

# Common causes:
# - Wrong credentials
# - Network policies
# - Database not ready
# - Connection pool exhausted
```

#### 3. High Memory Usage

```bash
# Check resource usage
kubectl top pods -n agrobridge

# Check resource limits
kubectl describe pod <pod-name> -n agrobridge | grep -A 5 Limits

# Solutions:
# - Increase memory limits
# - Optimize queries
# - Enable caching
# - Scale horizontally
```

#### 4. Service Unavailable

```bash
# Check service endpoints
kubectl get endpoints -n agrobridge

# Check service
kubectl describe svc <service-name> -n agrobridge

# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -O- http://<service-name>:8000/health

# Common causes:
# - No healthy pods
# - Wrong service selector
# - Network policies
# - Port mismatch
```

### Debug Commands

```bash
# Get shell in pod
kubectl exec -it <pod-name> -n agrobridge -- /bin/bash

# Run Django shell
kubectl exec -it deployment/authentication -n agrobridge -- \
  python manage.py shell

# Check Django settings
kubectl exec -it deployment/authentication -n agrobridge -- \
  python manage.py diffsettings

# Test specific endpoint
kubectl exec -it deployment/authentication -n agrobridge -- \
  curl http://localhost:8000/api/v1/health
```

### Performance Issues

```bash
# Check slow queries
kubectl exec -it postgresql-0 -n agrobridge -- \
  psql -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check cache hit rate
kubectl exec -it redis-0 -n agrobridge -- \
  redis-cli INFO stats | grep keyspace

# Check API response times
kubectl logs deployment/api-gateway -n agrobridge | \
  grep "response_time" | awk '{sum+=$NF; count++} END {print sum/count}'
```

## Maintenance

### Scheduled Maintenance

1. **Announce maintenance window** (24-48 hours notice)
2. **Enable maintenance mode**
3. **Backup all data**
4. **Perform updates**
5. **Run tests**
6. **Disable maintenance mode**
7. **Monitor for issues**

### Scaling

```bash
# Scale deployment
kubectl scale deployment/authentication --replicas=5 -n agrobridge

# Autoscaling
kubectl autoscale deployment/authentication \
  --min=2 --max=10 --cpu-percent=70 \
  -n agrobridge

# Check autoscaler
kubectl get hpa -n agrobridge
```

## Security

### Security Checklist

- [ ] All secrets stored in Vault/Secrets Manager
- [ ] TLS/SSL certificates configured
- [ ] Network policies applied
- [ ] RBAC configured
- [ ] Security scanning enabled
- [ ] Audit logging enabled
- [ ] Backup encryption enabled
- [ ] Firewall rules configured

### Security Updates

```bash
# Update dependencies
pip install --upgrade -r requirements.txt

# Scan for vulnerabilities
safety check
bandit -r backend/

# Update base images
docker pull python:3.11-slim
docker build --no-cache -t agrobridge/service:latest .
```

## Support

### Emergency Contacts

- **On-Call Engineer**: +233-XXX-XXXX
- **DevOps Team**: devops@agrobridge.com
- **Security Team**: security@agrobridge.com

### Escalation

1. **Level 1**: On-call engineer
2. **Level 2**: DevOps lead
3. **Level 3**: CTO

### Documentation

- **Runbooks**: `docs/runbooks/`
- **Architecture**: `docs/architecture/`
- **API Docs**: `docs/api/`
- **Troubleshooting**: `docs/troubleshooting/`

## Appendix

### Useful Scripts

```bash
# Backup database
./scripts/backup-database.sh <environment>

# Restore database
./scripts/restore-database.sh <environment> <backup-file>

# Deploy service
./scripts/deploy-service.sh <service> <environment>

# Run health checks
./scripts/health-check.sh <environment>

# Generate SSL certificates
./scripts/generate-certs.sh <domain>
```

### Configuration Files

- `kubernetes/`: Kubernetes manifests
- `helm/`: Helm charts
- `docker/`: Dockerfiles
- `scripts/`: Deployment scripts
- `.github/workflows/`: CI/CD pipelines
