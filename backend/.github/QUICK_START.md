# CI/CD Pipeline - Quick Start Guide

Get your CI/CD pipeline running in 5 minutes!

## Prerequisites

- GitHub repository
- Kubernetes cluster (staging and production)
- Container registry access (GitHub Packages)

## Setup (5 minutes)

### 1. Configure Secrets

Go to GitHub Settings → Secrets and add:

```bash
# Kubernetes configs (base64 encoded)
KUBE_CONFIG_STAGING=<base64-encoded-kubeconfig>
KUBE_CONFIG_PRODUCTION=<base64-encoded-kubeconfig>

# Notifications
SLACK_WEBHOOK=<slack-webhook-url>
SLACK_SECURITY_WEBHOOK=<security-slack-webhook-url>

# Security scanning
SNYK_TOKEN=<snyk-api-token>

# Email notifications
EMAIL_USERNAME=<smtp-username>
EMAIL_PASSWORD=<smtp-password>
```

### 2. Enable GitHub Actions

1. Go to repository Settings → Actions
2. Enable "Allow all actions"
3. Save

### 3. Push Code

```bash
git add .
git commit -m "feat: add CI/CD pipeline"
git push origin develop
```

That's it! The CI pipeline will run automatically.

## Usage

### Trigger CI

```bash
# Push to any branch
git push origin feature/my-feature

# Create pull request
gh pr create --base develop
```

### Deploy to Staging

```bash
# Push to develop branch
git push origin develop
```

### Deploy to Production

```bash
# Merge to main
git checkout main
git merge develop
git push origin main

# Or create release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### Manual Deployment

```bash
# Go to Actions → CD - Deploy → Run workflow
# Select environment and service
```

## Monitoring

### View Workflow Runs

```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

### Check Deployment Status

```bash
# Staging
kubectl get pods -n agrobridge-staging

# Production
kubectl get pods -n agrobridge
```

## Troubleshooting

### CI Failing

```bash
# View logs
gh run view <run-id> --log

# Run tests locally
pytest backend/tests/

# Fix and push
git commit -am "fix: resolve test failures"
git push
```

### Deployment Failing

```bash
# Check pod status
kubectl get pods -n agrobridge

# View logs
kubectl logs deployment/<service> -n agrobridge

# Rollback
kubectl rollout undo deployment/<service> -n agrobridge
```

### Security Scan Failing

```bash
# View security report
gh run view <run-id> --log

# Update dependencies
pip install --upgrade <package>

# Commit and push
git commit -am "chore: update dependencies"
git push
```

## Next Steps

1. Configure branch protection rules
2. Set up code review requirements
3. Customize quality gates
4. Add more tests
5. Configure monitoring alerts

## Support

- **Documentation**: See README.md
- **Issues**: GitHub Issues
- **Emergency**: ops@agrobridge.com
