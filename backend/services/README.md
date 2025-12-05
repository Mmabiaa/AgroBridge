# AgroBridge Microservices

This directory contains all microservices for the AgroBridge platform.

## Service Structure

Each service follows a standard Django structure with:
- `models.py` - Database models
- `views.py` - API endpoints
- `serializers.py` - Data serialization
- `urls.py` - URL routing
- `services.py` - Business logic
- `tests.py` - Unit tests
- `permissions.py` - Access control
- `migrations/` - Database migrations

## Services

### Core Services (Layer 1 - Foundation)
1. **authentication** - User registration, login, JWT tokens, RBAC
2. **users** - User profiles, preferences, settings
3. **api_gateway** - Request routing, rate limiting, circuit breaker

### Business Services (Layer 2 - Core Features)
4. **farms** - Farm management, crops, fields
5. **marketplace** - Products, orders, reviews
6. **ai_assistant** - AgriGPT, voice commands, NLP
7. **crop_detection** - Disease detection, image analysis
8. **financial** - Income/expense tracking, budgets, reports
9. **learning** - Courses, tutorials, certificates
10. **community** - Social posts, messaging, forums

### Advanced Services (Layer 3 - Specialized Features)
11. **iot** - IoT devices, sensor data, monitoring
12. **notifications** - Real-time notifications, WebSocket, push
13. **analytics** - Dashboards, predictions, insights
14. **scheduling** - Task management, reminders, calendar
15. **payments** - Payment processing, escrow, multi-currency
16. **blockchain** - Certificates, traceability, verification
17. **export_docs** - Export documentation, compliance
18. **emergency** - Emergency alerts, incident response

### Infrastructure Services (Layer 4 - Platform)
19. **storage** - File storage, image processing, CDN
20. **admin** - Admin panel, system management
21. **monitoring** - Logging, metrics, tracing
22. **backup** - Database backups, disaster recovery

## Shared Libraries

- `common/` - Shared utilities, base classes, constants
- `events/` - Event definitions and publishers
- `middleware/` - Custom middleware components
- `utils/` - Helper functions and utilities
