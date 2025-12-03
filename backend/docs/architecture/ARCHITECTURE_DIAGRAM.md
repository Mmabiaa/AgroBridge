# AgroBridge Microservices Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                          │
│  (Web App, Mobile App, IoT Devices, Third-party Integrations)      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER (NGINX)                          │
│                      SSL/TLS Termination                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Kong)                             │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐    │
│  │ Rate Limit   │ Auth Check   │ Routing      │ Logging      │    │
│  └──────────────┴──────────────┴──────────────┴──────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ LAYER 1      │    │ LAYER 2      │    │ LAYER 3      │
│ Core         │    │ Business     │    │ Advanced     │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Layer 1: Core Services (Foundation)

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE SERVICES                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │  Authentication  │  │   User Service   │              │
│  │                  │  │                  │              │
│  │  • Registration  │  │  • Profiles      │              │
│  │  • Login/Logout  │  │  • Preferences   │              │
│  │  • JWT Tokens    │  │  • Settings      │              │
│  │  • OAuth 2.0     │  │  • GDPR          │              │
│  │  • MFA           │  │  • Roles         │              │
│  └──────────────────┘  └──────────────────┘              │
│                                                             │
│  ┌──────────────────────────────────────────┐             │
│  │         API Gateway Service              │             │
│  │                                          │             │
│  │  • Request Routing                       │             │
│  │  • Rate Limiting                         │             │
│  │  • Circuit Breaker                       │             │
│  │  • API Versioning                        │             │
│  └──────────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Layer 2: Business Services (Core Features)

```
┌─────────────────────────────────────────────────────────────┐
│                  BUSINESS SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Farms     │  │ Marketplace  │  │ AI Assistant │    │
│  │              │  │              │  │              │    │
│  │ • Farm Mgmt  │  │ • Products   │  │ • AgriGPT    │    │
│  │ • Crops      │  │ • Orders     │  │ • Voice      │    │
│  │ • Fields     │  │ • Reviews    │  │ • NLP        │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │Crop Detection│  │  Financial   │  │   Learning   │    │
│  │              │  │              │  │              │    │
│  │ • Disease    │  │ • Income     │  │ • Courses    │    │
│  │ • Treatment  │  │ • Expenses   │  │ • Tutorials  │    │
│  │ • Analysis   │  │ • Budgets    │  │ • Certs      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────┐             │
│  │          Community Service               │             │
│  │                                          │             │
│  │  • Social Posts  • Messaging  • Forums  │             │
│  └──────────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Layer 3: Advanced Services (Specialized Features)

```
┌─────────────────────────────────────────────────────────────┐
│                 ADVANCED SERVICES                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │     IoT      │  │Notifications │  │  Analytics   │    │
│  │              │  │              │  │              │    │
│  │ • Devices    │  │ • Real-time  │  │ • Dashboards │    │
│  │ • Sensors    │  │ • Push       │  │ • Predictions│    │
│  │ • Monitoring │  │ • Email/SMS  │  │ • Insights   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Scheduling  │  │   Payments   │  │  Blockchain  │    │
│  │              │  │              │  │              │    │
│  │ • Tasks      │  │ • Processing │  │ • Certs      │    │
│  │ • Reminders  │  │ • Escrow     │  │ • Traceability│   │
│  │ • Calendar   │  │ • Multi-curr │  │ • Verification│   │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────────────────────┐      │
│  │ Export Docs  │  │    Emergency Response        │      │
│  │              │  │                              │      │
│  │ • Documents  │  │ • Alerts  • Incidents        │      │
│  │ • Compliance │  │ • Broadcasting               │      │
│  └──────────────┘  └──────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Layer 4: Infrastructure Services (Platform)

```
┌─────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE SERVICES                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────┐       │
│  │  Storage Service │  │    Admin Service         │       │
│  │                  │  │                          │       │
│  │  • File Storage  │  │  • User Management       │       │
│  │  • Image Proc    │  │  • Content Moderation    │       │
│  │  • CDN           │  │  • System Config         │       │
│  └──────────────────┘  └──────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Communication Layer

```
┌─────────────────────────────────────────────────────────────┐
│              MESSAGE BUS (RabbitMQ/Kafka)                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Event Types:                                        │  │
│  │  • user.registered    • order.placed                │  │
│  │  • farm.created       • payment.processed           │  │
│  │  • disease.detected   • sensor.alert                │  │
│  │  • emergency.alert    • notification.created        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ PostgreSQL   │  │   MongoDB    │  │    Redis     │    │
│  │              │  │              │  │              │    │
│  │ • Users      │  │ • AI Logs    │  │ • Cache      │    │
│  │ • Farms      │  │ • Conversations│ │ • Sessions  │    │
│  │ • Orders     │  │ • Documents  │  │ • Queues     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────────────────────┐       │
│  │ TimescaleDB  │  │     Elasticsearch            │       │
│  │              │  │                              │       │
│  │ • IoT Data   │  │ • Product Search             │       │
│  │ • Metrics    │  │ • Full-text Search           │       │
│  └──────────────┘  └──────────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Shared Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│              SHARED INFRASTRUCTURE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────┐       │
│  │ Service Registry │  │   Secrets Manager        │       │
│  │    (Consul)      │  │   (HashiCorp Vault)      │       │
│  └──────────────────┘  └──────────────────────────┘       │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────┐       │
│  │   Monitoring     │  │      Logging             │       │
│  │ (Prometheus)     │  │    (ELK Stack)           │       │
│  └──────────────────┘  └──────────────────────────┘       │
│                                                             │
│  ┌──────────────────────────────────────────────┐         │
│  │      Distributed Tracing (Jaeger)            │         │
│  └──────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Shared Libraries Structure

```
┌─────────────────────────────────────────────────────────────┐
│                  SHARED LIBRARIES                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  shared/                                                    │
│  ├── common/                                               │
│  │   ├── base_models.py      (BaseModel, SoftDeleteModel) │
│  │   ├── base_views.py       (BaseViewSet)                │
│  │   ├── base_serializers.py (BaseSerializer)             │
│  │   └── constants.py        (USER_TYPES, etc.)           │
│  │                                                          │
│  ├── events/                                               │
│  │   ├── publisher.py        (EventPublisher)             │
│  │   ├── subscriber.py       (EventSubscriber)            │
│  │   └── event_types.py      (30+ event types)            │
│  │                                                          │
│  ├── utils/                                                │
│  │   ├── pagination.py       (Pagination classes)         │
│  │   ├── response.py         (success/error responses)    │
│  │   ├── exceptions.py       (Custom exceptions)          │
│  │   └── validators.py       (Validation functions)       │
│  │                                                          │
│  └── middleware/                                           │
│      ├── service_auth.py     (Service authentication)     │
│      ├── logging.py          (Request logging)            │
│      └── request_id.py       (Request ID tracking)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow Example

```
1. Client Request
   │
   ▼
2. Load Balancer (NGINX)
   │
   ▼
3. API Gateway (Kong)
   ├─ Rate Limiting
   ├─ Authentication
   └─ Routing
   │
   ▼
4. Target Service (e.g., Marketplace)
   ├─ Request ID Middleware
   ├─ Logging Middleware
   ├─ Service Auth Middleware
   │
   ▼
5. Business Logic
   ├─ Validate Input
   ├─ Process Request
   ├─ Publish Events
   │
   ▼
6. Database Operations
   │
   ▼
7. Response
   ├─ Standardized Format
   ├─ Request ID Header
   └─ Metadata
   │
   ▼
8. Client Response
```

## Event Flow Example

```
1. Service A: Order Placed
   │
   ▼
2. Publish Event
   │
   ├─ event_type: "order.placed"
   ├─ data: {order_id, buyer_id, seller_id}
   └─ metadata: {correlation_id, timestamp}
   │
   ▼
3. Message Queue (RabbitMQ)
   │
   ├──────────┬──────────┬──────────┐
   │          │          │          │
   ▼          ▼          ▼          ▼
4. Subscribers
   │          │          │          │
   Notification Payment  Analytics Inventory
   Service    Service   Service   Service
   │          │          │          │
   ▼          ▼          ▼          ▼
5. Actions
   Send       Process   Update     Reserve
   Notification Payment Stats     Stock
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Namespace: agrobridge-core                                │
│  ├─ authentication-deployment (3 replicas)                 │
│  ├─ users-deployment (3 replicas)                          │
│  └─ api-gateway-deployment (3 replicas)                    │
│                                                             │
│  Namespace: agrobridge-business                            │
│  ├─ farms-deployment (3 replicas)                          │
│  ├─ marketplace-deployment (5 replicas)                    │
│  ├─ ai-assistant-deployment (2 replicas)                   │
│  └─ crop-detection-deployment (2 replicas)                 │
│                                                             │
│  Namespace: agrobridge-advanced                            │
│  ├─ iot-deployment (3 replicas)                            │
│  ├─ notifications-deployment (3 replicas)                  │
│  ├─ analytics-deployment (2 replicas)                      │
│  └─ payments-deployment (3 replicas)                       │
│                                                             │
│  Namespace: agrobridge-infrastructure                      │
│  ├─ storage-deployment (2 replicas)                        │
│  └─ admin-deployment (2 replicas)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Legend

```
┌──────────┐
│ Service  │  = Microservice
└──────────┘

┌──────────────────┐
│ Infrastructure   │  = Shared Infrastructure
└──────────────────┘

───▶  = Synchronous Communication (REST API)
···▶  = Asynchronous Communication (Events)
═══▶  = Real-time Communication (WebSocket)
```
