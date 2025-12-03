# Service Defaults Configuration for Consul Service Mesh
# This file defines default configurations for all services

# Default protocol for all services
Kind = "service-defaults"
Name = "*"
Protocol = "http"

# Mutual TLS settings
MutualTLSMode = "permissive"

# Default timeouts
ConnectTimeout = "5s"
RequestTimeout = "60s"

# Retry policy
MaxRetries = 3
RetryOnConnectFailure = true
RetryOnStatusCodes = [500, 502, 503, 504]

# Circuit breaker settings
PassiveHealthCheck {
  Interval = "10s"
  MaxFailures = 5
}

# Load balancing policy
LoadBalancer {
  Policy = "round_robin"
  HashPolicies = []
}
