# AgroBridge CI/CD Pipeline

This directory contains GitHub Actions workflows for continuous integration and deployment of the AgroBridge platform.

## Overview

The CI/CD pipeline provides:

- **Automated Testing**: Unit, integration, and end-to-end tests
- **Code Quality**: Linting, formatting, and static analysis
- **Security Scanning**: Dependency, container, and code security
- **Automated Builds**: Docker image building and pushing
- **Automated Deployments**: Staging and production deployments
- **Quality Gates**: Enforce code coverage and test requirements

## Workflows

### 1. CI - Build and Test (`ci-build-test.yml`)

**Triggers**: Push to main/develop, Pull requests

**Jobs**:
- Code Quality (Black, isort, Flake8, Pylint, Bandit)
- Dependency Security Scan (Safety)
- Unit Tests (per service, with coverage)
- Integration Tests (with PostgreSQL, Redis, RabbitMQ)
- Build Docker Images
- Container Security Scan (Trivy)
- Coverage Report
- Quality Gate

**Requirements Fulfilled**:
- 30.1: Unit testing with coverage
- 30.2: Automated builds and tests
- 30.3: Integration testing
- 30.4: Security scanning

### 2. CD - Deploy (`cd-deploy.yml`)

**Triggers**: Push to main, Manual dispatch

**Jobs**:
- Build and Push Docker Images (to GHCR)
- Deploy to Staging (automatic)
- Deploy to Production (with approval)
- Database Migrations
- Post-Deployment Tests
- Update Deployment Status

**Environments**:
- **Staging**: Automatic deployment from develop branch
- **Production**: Manual approval required, deployed from main

**Requirements Fulfilled**:
- 30.7: Automated deployments
- 30.8: Zero-downtime deployments with rollback

### 3. Security Scan (`security-scan.yml`)

**Triggers**: Daily schedule, Push, Pull requests

**Jobs**:
- OWASP ZAP Scan
- Dependency Vulnerability Scan (Snyk)
- Secret Scanning (Gitleaks)
- Container Image Scan (Trivy)
- CodeQL Analysis
- Infrastructure Security Scan (Checkov)
- Security Report Generation

**Requirements Fulfilled**:
- 30.4: Security testing
- 34.7: Automated security scans

### 4. Release (`release.yml`)

**Triggers**: Version tags (v*.*.*)

**Jobs**:
- Create GitHub Release
- Build Release Artifacts
- Update Documentation
- Notify Release

## Quality Gates

### Code Coverage
- **Minimum**: 80% overall coverage
- **Per Service**: 75% minimum
- **Critical Paths**: 90% minimum

### Test Requirements
- All unit tests must pass
- All integration tests must pass
- No high/critical security vulnerabilities
- Code quality checks must pass

### Security Requirements
- No secrets in code
- No high/critical vulnerabilities in dependencies
- No high/critical vulnerabilities in containers
- Security scans must pass

## Deployment Process

### Staging Deployment

1. **Automatic**: Triggered on push to `develop` branch
2. **Steps**:
   - Build and push Docker images
   - Deploy to staging cluster
   - Run smoke tests
   - Notify team

### Production Deployment

1. **Manual Approval**: Required for production
2. **Steps**:
   - Build and push Docker images
   - Create backup of current state
   - Deploy to production cluster
   - Monitor rollout
   - Run health checks
   - Run smoke tests
   - Rollback on failure
   - Notify team

### Rollback Process

**Automatic Rollback**:
- Triggered on deployment failure
- Reverts to previous version
- Notifies team

**Manual Rollback**:
```bash
kubectl rollout undo deployment/<service> -n agrobridge
```

## Environment Variables

### Required Secrets

**GitHub Secrets**:
- `GITHUB_TOKEN`: Automatically provided
- `KUBE_CONFIG_STAGING`: Kubernetes config for staging (base64)
- `KUBE_CONFIG_PRODUCTION`: Kubernetes config for production (base64)
- `SLACK_WEBHOOK`: Slack webhook URL for notifications
- `SLACK_SECURITY_WEBHOOK`: Slack webhook for security alerts
- `SNYK_TOKEN`: Snyk API token for vulnerability scanning
- `EMAIL_USERNAME`: SMTP username for email notifications
- `EMAIL_PASSWORD`: SMTP password for email notifications

**Environment Variables**:
- `PYTHON_VERSION`: Python version (default: 3.11)
- `NODE_VERSION`: Node.js version (default: 18)
- `REGISTRY`: Container registry (default: ghcr.io)

## Local Testing

### Run Tests Locally

```bash
# Unit tests
pytest backend/tests/unit/

# Integration tests
docker-compose -f docker-compose.test.yml up -d
pytest backend/tests/integration/
docker-compose -f docker-compose.test.yml down

# Code quality
flake8 backend/
black --check backend/
pylint backend/
```

### Build Docker Images Locally

```bash
# Build single service
docker build -t agrobridge/authentication:local ./backend/authentication

# Build all services
./backend/scripts/build-all.sh
```

### Test Deployment Locally

```bash
# Deploy to local Kubernetes
kubectl apply -k backend/kubernetes/overlays/development

# Check status
kubectl get pods -n agrobridge-dev
```

## Monitoring and Alerts

### Slack Notifications

- ✅ Successful deployments
- ❌ Failed deployments
- ⚠️ Security vulnerabilities found
- 📊 Test coverage reports

### Email Notifications

- Release announcements
- Critical security alerts
- Deployment failures

### GitHub Notifications

- Pull request status checks
- Deployment status
- Security alerts

## Troubleshooting

### Common Issues

**1. Tests Failing**
```bash
# Check test logs
gh run view <run-id> --log

# Run tests locally
pytest backend/tests/ -v
```

**2. Deployment Failing**
```bash
# Check deployment status
kubectl rollout status deployment/<service> -n agrobridge

# View logs
kubectl logs deployment/<service> -n agrobridge

# Rollback
kubectl rollout undo deployment/<service> -n agrobridge
```

**3. Security Scan Failing**
```bash
# View security report
gh run view <run-id> --log

# Fix vulnerabilities
pip install --upgrade <package>
```

**4. Quality Gate Failing**
```bash
# Check coverage
pytest --cov=backend/ --cov-report=html

# Fix code quality
black backend/
isort backend/
```

## Best Practices

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `hotfix/*`: Urgent fixes

### Commit Messages

Follow conventional commits:
```
feat: add new feature
fix: fix bug
docs: update documentation
test: add tests
refactor: refactor code
chore: update dependencies
```

### Pull Requests

- All PRs require review
- All tests must pass
- Code coverage must meet threshold
- No security vulnerabilities

### Versioning

Follow semantic versioning:
- `v1.0.0`: Major release
- `v1.1.0`: Minor release
- `v1.1.1`: Patch release

## Performance

### Build Times

- Code Quality: ~2 minutes
- Unit Tests: ~5 minutes per service
- Integration Tests: ~10 minutes
- Docker Build: ~3 minutes per service
- Total CI: ~20-30 minutes

### Deployment Times

- Staging: ~5 minutes
- Production: ~10 minutes (with approval)
- Rollback: ~2 minutes

## Cost Optimization

- Use caching for dependencies
- Parallel job execution
- Conditional job execution
- Artifact retention policies

## Support

- **Documentation**: See individual workflow files
- **Issues**: GitHub Issues
- **Emergency**: ops@agrobridge.com

## License

Copyright © 2025 AgroBridge. All rights reserved.
