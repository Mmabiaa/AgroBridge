# HashiCorp Vault Configuration for AgroBridge
# This configuration sets up Vault for development and production use

# Storage backend - File storage for development, Consul for production
storage "file" {
  path = "/vault/data"
}

# Alternative: Consul storage backend (recommended for production)
# storage "consul" {
#   address = "consul:8500"
#   path    = "vault/"
# }

# Listener configuration
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # Disable TLS for development, enable in production
  
  # Production TLS configuration (uncomment for production)
  # tls_disable = 0
  # tls_cert_file = "/vault/config/tls/vault.crt"
  # tls_key_file  = "/vault/config/tls/vault.key"
}

# API address
api_addr = "http://vault:8200"

# Cluster address
cluster_addr = "http://vault:8201"

# UI configuration
ui = true

# Telemetry for monitoring
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = false
}

# Log level
log_level = "Info"

# Disable mlock for development (enable in production)
disable_mlock = true

# Default lease duration
default_lease_ttl = "168h"  # 7 days
max_lease_ttl = "720h"      # 30 days
