import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ServerNavItem { href: string; label: string; }

export const useServerNavigation = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ServerNavItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const fetchNav = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await fetch('/api/navigation', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setItems(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load navigation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNav();
    return () => { cancelled = true; };
  }, [user?.id]);

  return { items, error, loading };
}; 