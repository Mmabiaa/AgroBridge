/**
 * Permission-based conditional rendering component
 */
import { WithPermission } from '@/hooks/usePermissions';
import { UserRole } from '@/contexts/AuthContext';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: UserRole | UserRole[];
  route?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export const PermissionGate: React.FC<PermissionGateProps> = (props) => {
  return <WithPermission {...props} />;
};

export default PermissionGate;