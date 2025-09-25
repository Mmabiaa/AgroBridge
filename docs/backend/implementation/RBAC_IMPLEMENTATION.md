# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented in the AgroBridge platform. The system ensures that users can only access features, pages, and data relevant to their assigned role, maintaining security and providing a personalized user experience.

## System Architecture

### Backend (FastAPI + SQLAlchemy)

#### User Model
```python
class UserRole(str, enum.Enum):
    farmer = "farmer"
    poultry_keeper = "poultry_keeper"
    buyer = "buyer"
    ngo = "ngo"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.farmer)
    permissions = Column(JSON, default=dict)  # Role-specific permissions
    profile_data = Column(JSON, default=dict)  # Additional profile information
```

#### Permission System
The system defines granular permissions for different actions:

- **Dashboard permissions**: `view_dashboard`, `view_analytics`, `view_monitoring`
- **AI and Tools**: `use_agrigpt`, `use_crop_detection`, `use_voice_commands`
- **Marketplace**: `view_marketplace`, `create_product`, `edit_product`, `delete_product`
- **Learning and Community**: `view_learning`, `create_content`, `moderate_community`
- **Advanced Features**: `use_satellite_integration`, `use_iot_sensors`, `use_drone_integration`
- **Admin**: `manage_users`, `manage_system`, `view_admin_dashboard`

#### Role-Based Permission Mapping
Each role has a predefined set of permissions:

```python
ROLE_PERMISSIONS = {
    "farmer": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_MONITORING,
        Permission.USE_AGRIGPT,
        # ... more permissions
    },
    "buyer": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_MARKETPLACE,
        Permission.PLACE_ORDERS,
        # ... limited permissions
    },
    "admin": {
        # All permissions
        Permission.MANAGE_USERS,
        Permission.MANAGE_SYSTEM,
        # ... etc
    }
}
```

### Frontend (React + TypeScript)

#### Authentication Context
The `AuthContext` provides:
- User authentication state
- Role-based permissions
- Access control functions
- User profile management

```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: UserRegistrationData) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  updateUserProfile: (profileData: Record<string, any>) => void;
}
```

#### Protected Routes
Routes are protected using the `ProtectedRoute` component with multiple protection levels:

```typescript
<ProtectedRoute 
  requiredPermission="view_admin_dashboard"
  requiredRole={['admin']}
  requiredRoute="/admin"
>
  <Admin />
</ProtectedRoute>
```

#### Role-Based Navigation
Navigation items are dynamically filtered based on user permissions:

```typescript
const getFilteredNavigation = (): NavigationItem[] => {
  return allNavigationItems.filter(item => {
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    if (item.role && !item.role.includes(user.role)) {
      return false;
    }
    return true;
  });
};
```

## User Roles and Capabilities

### 1. Farmer Role
**Permissions**: Full access to farming tools and monitoring
- Dashboard with farm overview
- AI-powered farming assistant (AgriGPT)
- Crop disease detection
- Voice commands
- Farm monitoring and analytics
- Smart scheduling
- Financial planning
- Advanced technologies (satellite, IoT, drones, AR)

**Navigation Items**:
- Dashboard, Analytics, Monitoring
- AgriGPT, Crop Detection, Voice Commands
- Marketplace, Learning, Community
- Advanced features (Satellite, IoT, Drones, AR)

### 2. Poultry Keeper Role
**Permissions**: Similar to farmer but without advanced farming features
- Basic farm monitoring
- AI assistance
- Marketplace access
- Learning resources
- IoT sensor integration
- Financial planning

**Navigation Items**:
- Dashboard, Analytics, Monitoring
- AgriGPT, Crop Detection, Voice Commands
- Marketplace, Learning, Community
- IoT Sensors

### 3. Buyer Role
**Permissions**: Limited to purchasing and learning
- Dashboard overview
- Marketplace access
- Order management
- Learning center
- Community access
- Basic financial planning

**Navigation Items**:
- Dashboard, Marketplace
- Learning, Community
- Financial Planning

### 4. NGO Role
**Permissions**: Community management and content creation
- Dashboard with community overview
- Farm monitoring (community farms)
- Analytics and insights
- Content creation and management
- Community moderation
- Satellite and IoT access

**Navigation Items**:
- Dashboard, Analytics, Monitoring
- AgriGPT, Marketplace
- Learning, Community
- Content Management

### 5. Admin Role
**Permissions**: Full system access
- All user permissions
- User management
- System administration
- Content management
- System monitoring and logs
- Advanced analytics

**Navigation Items**:
- All available features
- Admin Panel
- User Management
- System Settings

## User Flow Examples

### Farmer Login Flow
1. User logs in with farmer credentials
2. System validates credentials and returns user data with permissions
3. Frontend receives permissions and accessible routes
4. Navigation is filtered to show only farmer-relevant items
5. Dashboard displays farming-specific widgets and metrics
6. User can access farming tools, monitoring, and AI features

### Admin Access Flow
1. Admin user logs in
2. System validates admin role and returns all permissions
3. Navigation shows all available features including admin panel
4. Dashboard displays system-wide metrics and admin widgets
5. User can access user management, system monitoring, and content management

### Permission Denial Flow
1. User attempts to access restricted route
2. `ProtectedRoute` component checks permissions
3. If permission denied, user is redirected to dashboard
4. Optional: Show notification about access restriction

## Security Features

### Authentication
- JWT-based authentication with role and permission claims
- Secure password hashing using bcrypt
- Token expiration and refresh mechanisms
- Session management

### Authorization
- Route-level protection using `ProtectedRoute`
- Component-level permission checks
- API endpoint protection with role verification
- Least privilege principle implementation

### Data Protection
- Role-based data filtering
- User isolation (users can only see their own data)
- Admin oversight capabilities
- Audit logging for sensitive operations

## Scalability Considerations

### Adding New Roles
1. Define new role in `UserRole` enum
2. Add role-specific permissions in `ROLE_PERMISSIONS`
3. Update permission constants if needed
4. Add role-specific navigation items
5. Update dashboard widgets

### Adding New Permissions
1. Add permission constant to `Permission` enum
2. Update role permission mappings
3. Add permission checks to relevant components
4. Update navigation filtering logic

### Adding New Features
1. Define required permissions
2. Update role permission mappings
3. Add navigation items with permission requirements
4. Implement permission checks in components
5. Update dashboard widgets

## Implementation Best Practices

### Separation of Concerns
- Backend handles authentication and permission logic
- Frontend handles UI rendering and user experience
- Clear separation between role logic and business logic

### Modular Architecture
- Permission system is centralized and reusable
- Navigation components are modular and configurable
- Dashboard widgets are role-aware and extensible

### Security First
- All routes are protected by default
- Permission checks happen at multiple levels
- User input is validated and sanitized
- Role escalation is prevented

### User Experience
- Clear indication of user role and permissions
- Intuitive navigation based on user capabilities
- Helpful error messages for access restrictions
- Consistent UI patterns across roles

## Testing and Validation

### Permission Testing
- Test each role with various permission combinations
- Verify access denial for unauthorized routes
- Test permission changes and their effects
- Validate navigation filtering

### Security Testing
- Attempt unauthorized access to restricted routes
- Test role escalation attempts
- Verify data isolation between users
- Test admin capabilities and limitations

### User Experience Testing
- Verify intuitive navigation for each role
- Test dashboard customization
- Validate error handling and user feedback
- Test responsive design across devices

## Future Enhancements

### Advanced Features
- Dynamic permission assignment
- Role hierarchies and inheritance
- Time-based permissions
- Location-based access control
- Multi-factor authentication

### Analytics and Monitoring
- Permission usage analytics
- Access pattern analysis
- Security event monitoring
- User behavior insights

### Integration
- Single Sign-On (SSO) support
- Third-party authentication providers
- API key management
- Webhook security

## Conclusion

The RBAC system provides a robust, scalable, and secure foundation for the AgroBridge platform. It ensures that users have access to appropriate features while maintaining system security and providing a personalized experience. The modular design allows for easy extension and modification as the platform evolves.

The implementation follows software engineering best practices including separation of concerns, modular architecture, and the least privilege principle. The system is designed to scale with future requirements while maintaining security and usability. 