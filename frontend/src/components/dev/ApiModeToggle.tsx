import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getApiMode, toggleApiMode, getApiModeDisplay } from '@/lib/api-mode';
import { isDevelopment } from '@/lib/env';

/**
 * Developer utility to toggle between mock and real API
 * Only visible in development mode
 */
export function ApiModeToggle() {
  const [mode, setMode] = useState(getApiMode());

  useEffect(() => {
    setMode(getApiMode());
  }, []);

  if (!isDevelopment) {
    return null;
  }

  const handleToggle = () => {
    toggleApiMode();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background p-2 shadow-lg">
      <Badge variant={mode === 'mock' ? 'secondary' : 'default'}>{getApiModeDisplay()}</Badge>
      <Button size="sm" variant="outline" onClick={handleToggle}>
        Toggle API
      </Button>
    </div>
  );
}
