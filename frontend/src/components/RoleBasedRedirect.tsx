import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'buyer':
          navigate('/marketplace', { replace: true });
          break;
        case 'ngo':
          navigate('/admin', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
          break;
      }
    }
  }, [user, navigate]);

  return null;
};