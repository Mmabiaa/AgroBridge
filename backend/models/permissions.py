from enum import Enum
from typing import Dict, List, Set

class Permission(str, Enum):
    # Dashboard permissions
    VIEW_DASHBOARD = "view_dashboard"
    VIEW_ANALYTICS = "view_analytics"
    VIEW_MONITORING = "view_monitoring"
    
    # AI and Tools permissions
    USE_AGRIGPT = "use_agrigpt"
    USE_CROP_DETECTION = "use_crop_detection"
    USE_VOICE_COMMANDS = "use_voice_commands"
    
    # Marketplace permissions
    VIEW_MARKETPLACE = "view_marketplace"
    CREATE_PRODUCT = "create_product"
    EDIT_PRODUCT = "edit_product"
    DELETE_PRODUCT = "delete_product"
    PLACE_ORDERS = "place_orders"
    VIEW_ORDERS = "view_orders"
    
    # Learning and Community permissions
    VIEW_LEARNING = "view_learning"
    CREATE_CONTENT = "create_content"
    EDIT_CONTENT = "edit_content"
    DELETE_CONTENT = "delete_content"
    VIEW_COMMUNITY = "view_community"
    MODERATE_COMMUNITY = "moderate_community"
    
    # Advanced features permissions
    USE_SATELLITE_INTEGRATION = "use_satellite_integration"
    USE_IOT_SENSORS = "use_iot_sensors"
    USE_DRONE_INTEGRATION = "use_drone_integration"
    USE_AR_VISUALIZATION = "use_ar_visualization"
    USE_BLOCKCHAIN = "use_blockchain"
    
    # Financial and Planning permissions
    VIEW_FINANCIAL_PLANNING = "view_financial_planning"
    CREATE_PLANS = "create_plans"
    VIEW_SMART_SCHEDULING = "view_smart_scheduling"
    
    # Admin permissions
    MANAGE_USERS = "manage_users"
    MANAGE_SYSTEM = "manage_system"
    VIEW_ADMIN_DASHBOARD = "view_admin_dashboard"
    MANAGE_CONTENT = "manage_content"
    VIEW_LOGS = "view_logs"

# Role-based permission mappings
ROLE_PERMISSIONS: Dict[str, Set[Permission]] = {
    "farmer": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_MONITORING,
        Permission.USE_AGRIGPT,
        Permission.USE_CROP_DETECTION,
        Permission.USE_VOICE_COMMANDS,
        Permission.VIEW_MARKETPLACE,
        Permission.PLACE_ORDERS,
        Permission.VIEW_ORDERS,
        Permission.VIEW_LEARNING,
        Permission.VIEW_COMMUNITY,
        Permission.USE_SATELLITE_INTEGRATION,
        Permission.USE_IOT_SENSORS,
        Permission.USE_DRONE_INTEGRATION,
        Permission.USE_AR_VISUALIZATION,
        Permission.VIEW_FINANCIAL_PLANNING,
        Permission.CREATE_PLANS,
        Permission.VIEW_SMART_SCHEDULING,
    },
    
    "poultry_keeper": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_MONITORING,
        Permission.USE_AGRIGPT,
        Permission.USE_CROP_DETECTION,
        Permission.USE_VOICE_COMMANDS,
        Permission.VIEW_MARKETPLACE,
        Permission.PLACE_ORDERS,
        Permission.VIEW_ORDERS,
        Permission.VIEW_LEARNING,
        Permission.VIEW_COMMUNITY,
        Permission.USE_IOT_SENSORS,
        Permission.VIEW_FINANCIAL_PLANNING,
        Permission.CREATE_PLANS,
        Permission.VIEW_SMART_SCHEDULING,
    },
    
    "buyer": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_MARKETPLACE,
        Permission.PLACE_ORDERS,
        Permission.VIEW_ORDERS,
        Permission.VIEW_LEARNING,
        Permission.VIEW_COMMUNITY,
        Permission.VIEW_FINANCIAL_PLANNING,
    },
    
    "ngo": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_MONITORING,
        Permission.USE_AGRIGPT,
        Permission.VIEW_MARKETPLACE,
        Permission.VIEW_LEARNING,
        Permission.VIEW_COMMUNITY,
        Permission.MODERATE_COMMUNITY,
        Permission.CREATE_CONTENT,
        Permission.EDIT_CONTENT,
        Permission.USE_SATELLITE_INTEGRATION,
        Permission.USE_IOT_SENSORS,
        Permission.VIEW_FINANCIAL_PLANNING,
        Permission.MANAGE_CONTENT,
    },
    
    "admin": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_MONITORING,
        Permission.USE_AGRIGPT,
        Permission.USE_CROP_DETECTION,
        Permission.USE_VOICE_COMMANDS,
        Permission.VIEW_MARKETPLACE,
        Permission.CREATE_PRODUCT,
        Permission.EDIT_PRODUCT,
        Permission.DELETE_PRODUCT,
        Permission.VIEW_ORDERS,
        Permission.VIEW_LEARNING,
        Permission.CREATE_CONTENT,
        Permission.EDIT_CONTENT,
        Permission.DELETE_CONTENT,
        Permission.VIEW_COMMUNITY,
        Permission.MODERATE_COMMUNITY,
        Permission.USE_SATELLITE_INTEGRATION,
        Permission.USE_IOT_SENSORS,
        Permission.USE_DRONE_INTEGRATION,
        Permission.USE_AR_VISUALIZATION,
        Permission.USE_BLOCKCHAIN,
        Permission.VIEW_FINANCIAL_PLANNING,
        Permission.CREATE_PLANS,
        Permission.VIEW_SMART_SCHEDULING,
        Permission.MANAGE_USERS,
        Permission.MANAGE_SYSTEM,
        Permission.VIEW_ADMIN_DASHBOARD,
        Permission.MANAGE_CONTENT,
        Permission.VIEW_LOGS,
    }
}

def get_user_permissions(role: str) -> Set[Permission]:
    """Get permissions for a specific role"""
    return ROLE_PERMISSIONS.get(role, set())

def has_permission(user_permissions: Set[Permission], required_permission: Permission) -> bool:
    """Check if user has a specific permission"""
    return required_permission in user_permissions

def get_accessible_routes(role: str) -> List[str]:
    """Get accessible routes for a specific role"""
    permissions = get_user_permissions(role)
    routes = []
    
    # Map permissions to routes
    if Permission.VIEW_DASHBOARD in permissions:
        routes.append("/dashboard")
    if Permission.VIEW_ANALYTICS in permissions:
        routes.append("/analytics")
    if Permission.VIEW_MONITORING in permissions:
        routes.append("/monitoring")
    if Permission.USE_AGRIGPT in permissions:
        routes.append("/agrigpt")
    if Permission.USE_CROP_DETECTION in permissions:
        routes.append("/crop-disease-detection")
    if Permission.USE_VOICE_COMMANDS in permissions:
        routes.append("/voice-commands")
    if Permission.VIEW_MARKETPLACE in permissions:
        routes.append("/marketplace")
    if Permission.VIEW_LEARNING in permissions:
        routes.append("/learning")
    if Permission.VIEW_COMMUNITY in permissions:
        routes.append("/community")
    if Permission.VIEW_FINANCIAL_PLANNING in permissions:
        routes.append("/financial-planning")
    if Permission.VIEW_SMART_SCHEDULING in permissions:
        routes.append("/smart-scheduling")
    if Permission.VIEW_ADMIN_DASHBOARD in permissions:
        routes.append("/admin")
    
    return routes 