# AgroBridge Microservices Architecture

## Overview

This document describes the microservices architecture for the AgroBridge platform. The system is organized into 22 independent microservices, each handling a specific business domain.

## Architecture Layers

### Layer 1: Core Services (Foundation)
These services provide fundamental authentication and user management capabilities.

1. **Authentication Service** (`authentication/`)
   - User registration and login
   - JWT token generation and validation
   - OAuth 2.0 integration
   - Multi-factor authentication
   - Password reset and email verification

2. **User Service** (`users/`)
   - User profile management
   - User preferences and settings
   - Role management
   - GDPR compliance features

3. **API Gateway Service** (`api_gateway/`)
   - Request routing
   - Rate limiting
   - Circuit breaker
   - API versioning

### Layer 2: Business Services (Core Features)
These services implement the main business functionality.

4. **Farm Management Service** (`farms/`)
5. **Marketplace Service** (`marketplace/`)
6. **AI Assistant Service** (`ai_assistant/`)
7. **Crop Detection Service** (`crop_detection/`)
8. **Financial Management Service** (`financial/`)
9. **Learning Service** (`learning/`)
10. **Community Service** (`community/`)

### Layer 3: Advanced Services (Specialized Features)
These services provide advanced capabilities.

11. **IoT Service** (`iot/`)
12. **Notification Service** (`notifications/`)
13. **Analytics Service** (`analytics/`)
14. **Scheduling Service** (`scheduling/`)
15. **Payment Service** (`payments/`)
16. **Blockchain Service** (`blockchain/`)
17. **Export Documentation Service** (`export_docs/`)
18. **Emergency Response Service** (`emergency/`)

### Layer 4: Infrastructure Services (Platform)
These services provide platform-level capabilities.

19. **Storage Service** (`storage/`)
20. **Admin Service** (`admin/`)
21. **Monitoring Service** (infrastructure)
22. **Backup Service** (infrastructure)

## Shared Libraries

### `shared/common/`
- `base_models.py` - Base model classes with common fields
- `base_views.py` - Base viewset with standardized responses
- `base_serializers.py` - Base serializer classes
- `constants.py` - Shared constants and enums

### `shared/events/`
- `publisher.py` - Event publishing to message queue
- `subscriber.py` - Event subscription and handling
- `event_types.py` - Event type definitions

### `shared/utils/`
- `pagination.py` - Pagination utilities
- `response.py` - Standardized API responses
- `exceptions.py` - Custom exception classes
- `validators.py` - Common validation functions

### `shared/middleware/`
- `service_auth.py` - Service-to-service authentication
- `logging.py` - Request/response logging
- `request_id.py` - Request ID for distributed tracing

## Communication Patterns

### Synchronous Communication (REST APIs)
- All services expose RESTful APIs
- Standard response format with metadata
- JWT authentication for user requests
- Service tokens for inter-service calls

### Asynchronous Communication (Message Queue)
- Event-driven architecture using RabbitMQ
- Publish-subscribe pattern for event broadcasting
- Dead letter queues for failed messages
- Event types defined in `shared/events/event_types.py`

### Real-Time Communication (WebSocket)
- Django Channels for WebSocket support
- User-specific notification channels
- Live marketplace updates
- Real-time sensor data streaming

## Database Strategy

### Database per Service Pattern
Each microservice owns its database:
- **PostgreSQL** - Transactional data (users, farms, marketplace)
- **MongoDB** - Document storage (AI conversations, logs)
- **Redis** - Caching and sessions
- **TimescaleDB** - Time-series data (IoT sensors)
- **Elasticsearch** - Search and analytics

### Data Consistency
- Eventual consistency via events
- Saga pattern for distributed transactions
- Event sourcing for audit trails

## Service Discovery

Services register with Consul for:
- Dynamic service discovery
- Health checking
- Configuration management
- DNS integration

## Security

### Authentication & Authorization
- JWT tokens for user authentication
- Service tokens for inter-service calls
- Role-based access control (RBAC)
- API key management

### Data Protection
- TLS 1.3 for data in transit
- AES-256 for data at rest
- Secrets management with HashiCorp Vault
- Input validation and sanitization

## Monitoring & Observability

### Logging
- Centralized logging with ELK stack
- Structured JSON logs
- Request/response logging

### Metrics
- Prometheus for metrics collection
- Grafana dashboards
- Custom business metrics

### Tracing
- Distributed tracing with Jaeger
- Request ID propagation
- Performance monitoring

## Deployment

### Containerization
- Docker containers for each service
- Multi-stage builds for optimization
- Docker Compose for local development

### Orchestration
- Kubernetes for production
- Horizontal pod autoscaling
- Rolling updates with zero downtime

### CI/CD
- GitHub Actions for automation
- Automated testing
- Quality gates
- Automated deployments

## Development Workflow

1. **Setup Environment**
   ```bash
   cd backend
   python setup_microservices.py
   ```

2. **Install Dependencies**
   ```bash
   pip install -r shared/requirements.txt
   pip install -r requirements.txt
   ```

3. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

4. **Start Services**
   ```bash
   docker-compose up
   ```

## Testing Strategy

### Unit Tests
- Test individual components
- Mock external dependencies
- Aim for 80%+ coverage

### Integration Tests
- Test service interactions
- Use test databases
- Test event flows

### End-to-End Tests
- Test complete user flows
- Use staging environment
- Automated with CI/CD

## Best Practices

1. **Service Independence**
   - Each service should be independently deployable
   - Avoid direct database access between services
   - Use events for data synchronization

2. **API Design**
   - Follow RESTful conventions
   - Version APIs properly
   - Document with OpenAPI/Swagger

3. **Error Handling**
   - Use standardized error responses
   - Implement circuit breakers
   - Graceful degradation

4. **Performance**
   - Implement caching strategies
   - Use connection pooling
   - Optimize database queries

5. **Security**
   - Validate all inputs
   - Use parameterized queries
   - Implement rate limiting
   - Regular security audits

## Migration from Monolith

The current backend has some services already implemented as Django apps:
- `authentication/` - Already exists
- `users/` - Already exists
- `farms/` - Already exists
- `marketplace/` - Already exists
- `ai_assistant/` - Already exists
- `crop_detection/` - Already exists

These will be gradually migrated to the new microservices structure while maintaining backward compatibility.

## Next Steps

1. Complete Task 1.1: Set up monorepo structure ✓
2. Task 1.2: Configure database infrastructure
3. Task 1.3: Set up message queue infrastructure
4. Task 1.4: Configure API Gateway
5. Task 1.5: Set up service discovery
6. Task 1.6: Configure secrets management
7. Task 1.7: Set up monitoring infrastructure
8. Task 1.8: Create Docker configurations
9. Task 1.9: Set up CI/CD pipeline
