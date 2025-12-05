# AgroBridge Kubernetes Deployment

This directory contains Kubernetes manifests and configurations for deploying the AgroBridge microservices platform to Kubernetes clusters.

## Overview

The Kubernetes deployment provides:

- **Scalable Microservices**: All 22 microservices with auto-scaling
- **High Availability**: Multi-replica deployments with load balancing
- **Zero-Downtime Deployments**: Rolling updates with automatic rollback
- **Service Mesh**: Istio for advanced traffic management
- **Observability**: Integrated monitoring, logging, and tracing
- **Security**: Network policies, RBAC, and secrets management

## Requirements Fulfilled

This implementation satisfies:
- **Infrastructure Deployment**: Complete Kubernetes orchestration
- **30.8**: Zero-downtime deployments with automatic rollback
- **26.8**: Service mesh implementation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Ingress Controller                       │ │
│  │              (NGINX/Istio Gateway)                         │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │                    Service Mesh (Istio)                     │ │
│  │  - Traffic Management                                       │ │
│  │  - Security (mTLS)                                         │ │
│  │  - Observability                                           │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │              Microservices (Deployments)                    │ │
│  │                                                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  Auth    │  │  Users   │  │  Farms   │  │Marketplace│  │ │
│  │  │ (3 pods) │  │ (3 pods) │  │ (3 pods) │  │ (3 pods) │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │                                                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │   AI     │  │  Crop    │  │   IoT    │  │  Notify  │  │ │
│  │  │ (2 pods) │  │ (2 pods) │  │ (3 pods) │  │ (3 pods) │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │                                                             │ │
│  │  ... (14 more services)                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              StatefulSets (Databases)                        │ │
│  │                                                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │PostgreSQL│  │  MongoDB │  │  Redis   │  │RabbitMQ  │  │ │
│  │  │ (3 pods) │  │ (3 pods) │  │ (3 pods) │  │ (3 pods) │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │           Monitoring & Observability                         │ │
│  │                                                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │Prometheus│  │ Grafana  │  │  Jaeger  │  │   ELK    │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
kubernetes/
├── README.md                       # This file
├── QUICK_START.md                  # Quick deployment guide
├── kustomization.yaml              # Kustomize configuration
│
├── base/                           # Base configurations
│   ├── namespace.yaml              # Namespace definition
│   ├── configmaps/                 # ConfigMaps
│   ├── secrets/                    # Secrets (templates)
│   └── network-policies/           # Network policies
│
├── deployments/                    # Service deployments
│   ├── authentication.yaml         # Auth service
│   ├── users.yaml                  # User service
│   ├── farms.yaml                  # Farm service
│   ├── marketplace.yaml            # Marketplace service
│   ├── ai-assistant.yaml           # AI service
│   ├── crop-detection.yaml         # Crop detection
│   ├── iot.yaml                    # IoT service
│   ├── notifications.yaml          # Notification service
│   ├── financial.yaml              # Financial service
│   ├── learning.yaml               # Learning service
│   ├── community.yaml              # Community service
│   ├── scheduling.yaml             # Scheduling service
│   ├── analytics.yaml              # Analytics service
│   ├── payments.yaml               # Payment service
│   ├── admin.yaml                  # Admin service
│   ├── blockchain.yaml             # Blockchain service
│   ├── export-docs.yaml            # Export docs service
│   ├── emergency.yaml              # Emergency service
│   ├── file-storage.yaml           # File storage service
│   ├── api-gateway.yaml            # API Gateway (Kong)
│   ├── monitoring.yaml             # Monitoring service
│   └── backup.yaml                 # Backup service
│
├── statefulsets/                   # Stateful services
│   ├── postgresql.yaml             # PostgreSQL cluster
│   ├── mongodb.yaml                # MongoDB cluster
│   ├── redis.yaml                  # Redis cluster
│   ├── rabbitmq.yaml               # RabbitMQ cluster
│   ├── elasticsearch.yaml          # Elasticsearch cluster
│   └── timescaledb.yaml            # TimescaleDB
│
├── services/                       # Service definitions
│   ├── authentication-svc.yaml
│   ├── users-svc.yaml
│   ├── farms-svc.yaml
│   └── ... (all services)
│
├── ingress/                        # Ingress configurations
│   ├── ingress.yaml                # Main ingress
│   ├── tls-certificates.yaml      # TLS certificates
│   └── rate-limiting.yaml          # Rate limiting
│
├── autoscaling/                    # HPA configurations
│   ├── authentication-hpa.yaml
│   ├── users-hpa.yaml
│   ├── farms-hpa.yaml
│   └── ... (all services)
│
├── istio/                          # Service mesh configs
│   ├── gateway.yaml                # Istio gateway
│   ├── virtual-services.yaml      # Virtual services
│   ├── destination-rules.yaml     # Destination rules
│   ├── peer-authentication.yaml   # mTLS config
│   └── authorization-policies.yaml # RBAC policies
│
├── monitoring/                     # Monitoring configs
│   ├── prometheus.yaml             # Prometheus
│   ├── grafana.yaml                # Grafana
│   ├── jaeger.yaml                 # Jaeger
│   └── service-monitors.yaml      # Service monitors
│
├── security/                       # Security configs
│   ├── rbac.yaml                   # RBAC policies
│   ├── pod-security-policies.yaml # Pod security
│   ├── network-policies.yaml      # Network policies
│   └── secrets-management.yaml    # Secrets config
│
├── storage/                        # Storage configs
│   ├── storage-classes.yaml       # Storage classes
│   ├── persistent-volumes.yaml    # PVs
│   └── persistent-volume-claims.yaml # PVCs
│
├── overlays/                       # Environment overlays
│   ├── development/                # Dev environment
│   ├── staging/                    # Staging environment
│   └── production/                 # Production environment
│
└── scripts/                        # Deployment scripts
    ├── deploy.sh                   # Main deployment script
    ├── rollback.sh                 # Rollback script
    ├── scale.sh                    # Scaling script
    ├── health-check.sh             # Health check script
    └── cleanup.sh                  # Cleanup script
```

## Prerequisites

### Required Tools
- kubectl (v1.28+)
- helm (v3.12+)
- kustomize (v5.0+)
- istioctl (v1.20+)
- docker (v24.0+)

### Cluster Requirements
- Kubernetes v1.28+
- Minimum 3 worker nodes
- 16 CPU cores per node
- 32GB RAM per node
- 500GB storage per node
- LoadBalancer support (or MetalLB)

### Install Tools

```bash
# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# kustomize
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
sudo mv kustomize /usr/local/bin/

# istioctl
curl -L https://istio.io/downloadIstio | sh -
sudo mv istio-*/bin/istioctl /usr/local/bin/
```

## Quick Start

### 1. Create Namespace

```bash
kubectl apply -f base/namespace.yaml
```

### 2. Install Istio Service Mesh

```bash
istioctl install --set profile=production -y
kubectl label namespace agrobridge istio-injection=enabled
```

### 3. Deploy Infrastructure (Databases)

```bash
kubectl apply -f statefulsets/
kubectl wait --for=condition=ready pod -l app=postgresql -n agrobridge --timeout=300s
```

### 4. Create ConfigMaps and Secrets

```bash
kubectl apply -f base/configmaps/
kubectl apply -f base/secrets/
```

### 5. Deploy Microservices

```bash
kubectl apply -f deployments/
kubectl apply -f services/
```

### 6. Configure Ingress

```bash
kubectl apply -f ingress/
```

### 7. Set Up Auto-Scaling

```bash
kubectl apply -f autoscaling/
```

### 8. Deploy Monitoring

```bash
kubectl apply -f monitoring/
```

### 9. Verify Deployment

```bash
kubectl get pods -n agrobridge
kubectl get services -n agrobridge
kubectl get ingress -n agrobridge
```

## Deployment Strategies

### Rolling Update (Default)

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

- Zero downtime
- Gradual rollout
- Automatic rollback on failure

### Blue-Green Deployment

```bash
# Deploy new version (green)
kubectl apply -f deployments/authentication-v2.yaml

# Switch traffic
kubectl patch service authentication -p '{"spec":{"selector":{"version":"v2"}}}'

# Rollback if needed
kubectl patch service authentication -p '{"spec":{"selector":{"version":"v1"}}}'
```

### Canary Deployment (with Istio)

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: authentication
spec:
  hosts:
  - authentication
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: authentication
        subset: v2
  - route:
    - destination:
        host: authentication
        subset: v1
      weight: 90
    - destination:
        host: authentication
        subset: v2
      weight: 10
```

## Auto-Scaling

### Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: authentication-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: authentication
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Vertical Pod Autoscaler (VPA)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: authentication-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: authentication
  updatePolicy:
    updateMode: "Auto"
```

### Cluster Autoscaler

Automatically scales cluster nodes based on pod resource requests.

## Service Mesh (Istio)

### Features

- **Traffic Management**: Intelligent routing, load balancing
- **Security**: Mutual TLS, authorization policies
- **Observability**: Metrics, logs, traces
- **Resilience**: Circuit breakers, retries, timeouts

### Configuration

```bash
# Install Istio
istioctl install --set profile=production

# Enable sidecar injection
kubectl label namespace agrobridge istio-injection=enabled

# Apply Istio configs
kubectl apply -f istio/
```

### mTLS Configuration

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: agrobridge
spec:
  mtls:
    mode: STRICT
```

## Monitoring and Observability

### Prometheus Metrics

- CPU, memory, disk usage
- Request rate, latency, errors
- Custom application metrics

### Grafana Dashboards

- Service health overview
- Resource utilization
- Business metrics
- SLO/SLA tracking

### Jaeger Tracing

- Distributed request tracing
- Service dependency mapping
- Performance bottleneck identification

### ELK Stack Logging

- Centralized log aggregation
- Log search and analysis
- Alert on log patterns

## Security

### RBAC Policies

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: agrobridge-developer
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list", "watch"]
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: authentication-policy
spec:
  podSelector:
    matchLabels:
      app: authentication
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 8001
```

### Pod Security Standards

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  runAsUser:
    rule: MustRunAsNonRoot
  seLinux:
    rule: RunAsAny
  fsGroup:
    rule: RunAsAny
```

## Storage

### Storage Classes

- **Fast SSD**: For databases (PostgreSQL, MongoDB)
- **Standard**: For general application data
- **Archive**: For backups and logs

### Persistent Volumes

- Automatic provisioning
- Backup and restore
- Encryption at rest

## Disaster Recovery

### Backup Strategy

- **Databases**: Daily full backups, hourly incrementals
- **Configurations**: Version controlled in Git
- **Secrets**: Encrypted backups in secure storage

### Recovery Procedures

1. Restore database from backup
2. Apply Kubernetes manifests
3. Verify service health
4. Switch DNS to new cluster

### RTO/RPO Targets

- **RTO**: < 1 hour
- **RPO**: < 15 minutes

## Troubleshooting

### Common Issues

**Pods not starting**:
```bash
kubectl describe pod <pod-name> -n agrobridge
kubectl logs <pod-name> -n agrobridge
```

**Service not accessible**:
```bash
kubectl get svc -n agrobridge
kubectl describe svc <service-name> -n agrobridge
```

**High resource usage**:
```bash
kubectl top pods -n agrobridge
kubectl top nodes
```

### Debug Commands

```bash
# Get all resources
kubectl get all -n agrobridge

# Check events
kubectl get events -n agrobridge --sort-by='.lastTimestamp'

# Exec into pod
kubectl exec -it <pod-name> -n agrobridge -- /bin/bash

# Port forward for debugging
kubectl port-forward <pod-name> 8080:8080 -n agrobridge

# View logs
kubectl logs -f <pod-name> -n agrobridge

# Check resource usage
kubectl top pods -n agrobridge
kubectl top nodes
```

## Performance Tuning

### Resource Requests and Limits

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Pod Disruption Budgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: authentication-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: authentication
```

### Quality of Service Classes

- **Guaranteed**: requests == limits
- **Burstable**: requests < limits
- **BestEffort**: no requests/limits

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Kubernetes
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        run: |
          kubectl apply -f kubernetes/deployments/
```

### GitOps with ArgoCD

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: agrobridge
spec:
  source:
    repoURL: https://github.com/agrobridge/backend
    path: kubernetes
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: agrobridge
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Cost Optimization

- Use spot instances for non-critical workloads
- Right-size resource requests
- Enable cluster autoscaler
- Use pod disruption budgets
- Implement resource quotas

## Support

- **Documentation**: See individual manifest files
- **Issues**: GitHub Issues
- **Emergency**: ops@agrobridge.com

## License

Copyright © 2025 AgroBridge. All rights reserved.
