#!/bin/bash

# Script to generate Kubernetes manifests for all AgroBridge services
# This creates deployment, service, and HPA manifests for each microservice

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"

# Service definitions: name, port, cpu_request, memory_request, cpu_limit, memory_limit, min_replicas, max_replicas
SERVICES=(
    "farms:8003:200m:256Mi:1000m:1Gi:3:10"
    "marketplace:8004:300m:512Mi:1500m:2Gi:3:15"
    "ai-assistant:8005:500m:1Gi:2000m:4Gi:2:8"
    "crop-detection:8006:500m:1Gi:2000m:4Gi:2:8"
    "iot:8007:200m:256Mi:1000m:1Gi:3:10"
    "notifications:8008:200m:256Mi:1000m:1Gi:3:10"
    "financial:8009:200m:256Mi:1000m:1Gi:3:10"
    "learning:8010:200m:512Mi:1000m:2Gi:3:10"
    "community:8011:200m:512Mi:1000m:2Gi:3:10"
    "scheduling:8012:200m:256Mi:1000m:1Gi:3:10"
    "analytics:8013:500m:1Gi:2000m:4Gi:2:8"
    "payments:8014:300m:512Mi:1500m:2Gi:3:10"
    "admin:8015:200m:256Mi:1000m:1Gi:2:5"
    "blockchain:8016:200m:512Mi:1000m:2Gi:2:5"
    "export-docs:8017:200m:256Mi:1000m:1Gi:2:5"
    "emergency:8018:200m:256Mi:1000m:1Gi:3:10"
    "file-storage:8019:300m:512Mi:1500m:2Gi:3:10"
    "api-gateway:8000:300m:512Mi:1500m:2Gi:3:15"
    "monitoring:8020:200m:512Mi:1000m:2Gi:2:5"
    "backup:8021:200m:512Mi:1000m:2Gi:1:3"
)

echo "Generating Kubernetes manifests for AgroBridge services..."

for service_def in "${SERVICES[@]}"; do
    IFS=':' read -r name port cpu_req mem_req cpu_lim mem_lim min_rep max_rep <<< "$service_def"
    
    echo "Generating manifests for $name..."
    
    # Generate Deployment
    cat > "${K8S_DIR}/deployments/${name}.yaml" <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: agrobridge
  labels:
    app: ${name}
    version: v1
    tier: backend
spec:
  replicas: ${min_rep}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ${name}
      version: v1
  template:
    metadata:
      labels:
        app: ${name}
        version: v1
        tier: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "${port}"
    spec:
      serviceAccountName: agrobridge-service-account
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: ${name}
        image: agrobridge/${name}:latest
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: ${port}
          protocol: TCP
        env:
        - name: SERVICE_NAME
          value: "${name}"
        - name: SERVICE_PORT
          value: "${port}"
        - name: DATABASE_HOST
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: postgresql-host
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: postgresql-password
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: cache-config
              key: redis-host
        - name: LOG_LEVEL
          value: "INFO"
        - name: ENVIRONMENT
          value: "production"
        resources:
          requests:
            cpu: ${cpu_req}
            memory: ${mem_req}
          limits:
            cpu: ${cpu_lim}
            memory: ${mem_lim}
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 0
          periodSeconds: 10
          failureThreshold: 30
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: config
        configMap:
          name: ${name}-config
      - name: logs
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - ${name}
              topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: ${name}
  namespace: agrobridge
  labels:
    app: ${name}
spec:
  type: ClusterIP
  ports:
  - name: http
    port: ${port}
    targetPort: http
    protocol: TCP
  selector:
    app: ${name}
EOF

    # Generate HPA
    cat > "${K8S_DIR}/autoscaling/${name}-hpa.yaml" <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${name}-hpa
  namespace: agrobridge
  labels:
    app: ${name}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${name}
  minReplicas: ${min_rep}
  maxReplicas: ${max_rep}
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
EOF

done

echo ""
echo "✓ All manifests generated successfully!"
echo ""
echo "Generated files:"
echo "  - ${#SERVICES[@]} deployment manifests in deployments/"
echo "  - ${#SERVICES[@]} HPA manifests in autoscaling/"
echo ""
echo "To deploy:"
echo "  kubectl apply -f deployments/"
echo "  kubectl apply -f autoscaling/"
