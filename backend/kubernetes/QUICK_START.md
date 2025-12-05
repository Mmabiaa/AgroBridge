# AgroBridge Kubernetes - Quick Start Guide

Get AgroBridge running on Kubernetes in 10 minutes!

## Prerequisites

- Kubernetes cluster (v1.28+)
- kubectl configured
- helm installed
- istioctl installed
- 3+ worker nodes with 16GB RAM each

## Quick Deploy (One Command)

```bash
cd backend/kubernetes/scripts
chmod +x deploy.sh
./deploy.sh
```

That's it! The script will:
1. Create namespace
2. Install Istio
3. Deploy databases
4. Deploy all microservices
5. Configure auto-scaling
6. Set up monitoring

## Manual Steps (If Needed)

### 1. Create Namespace

```bash
kubectl apply -f base/namespace.yaml
```

### 2. Install Istio

```bash
istioctl install --set profile=production -y
kubectl label namespace agrobridge istio-injection=enabled
```

### 3. Deploy Everything

```bash
# Databases
kubectl apply -f statefulsets/

# Microservices
kubectl apply -f deployments/

# Istio config
kubectl apply -f istio/

# Auto-scaling
kubectl apply -f autoscaling/
```

### 4. Verify

```bash
kubectl get pods -n agrobridge
kubectl get services -n agrobridge
```

## Access Services

### Get Ingress IP

```bash
kubectl get svc istio-ingressgateway -n istio-system
```

### Port Forward for Local Access

```bash
# API Gateway
kubectl port-forward -n agrobridge svc/api-gateway 8000:8000

# Grafana
kubectl port-forward -n agrobridge svc/grafana 3000:3000

# Prometheus
kubectl port-forward -n agrobridge svc/prometheus 9090:9090
```

## Common Operations

### Scale a Service

```bash
kubectl scale deployment authentication --replicas=5 -n agrobridge
```

### Update a Service

```bash
kubectl set image deployment/authentication authentication=agrobridge/authentication:v2 -n agrobridge
```

### Rollback

```bash
./scripts/rollback.sh authentication
```

### View Logs

```bash
kubectl logs -f <pod-name> -n agrobridge
```

### Exec into Pod

```bash
kubectl exec -it <pod-name> -n agrobridge -- /bin/bash
```

## Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod <pod-name> -n agrobridge
kubectl logs <pod-name> -n agrobridge
```

### Service Not Accessible

```bash
kubectl get svc -n agrobridge
kubectl describe svc <service-name> -n agrobridge
```

### Check Events

```bash
kubectl get events -n agrobridge --sort-by='.lastTimestamp'
```

## Clean Up

```bash
kubectl delete namespace agrobridge
istioctl uninstall --purge -y
```

## Next Steps

1. Configure DNS for ingress IP
2. Set up TLS certificates
3. Configure monitoring alerts
4. Review security policies
5. Set up CI/CD pipeline

## Support

- Full docs: See README.md
- Issues: GitHub Issues
- Emergency: ops@agrobridge.com
