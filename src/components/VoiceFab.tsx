import { useEffect, useState } from 'react';
import { Mic, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface VoiceFabProps {
  position?: 'bottom-right' | 'bottom-left';
}

export const VoiceFab = ({ position = 'bottom-right' }: VoiceFabProps) => {
  const { user, hasPermission } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  if (!user) return null;

  const canUseVoice = hasPermission('use_voice_commands');

  const posClass = position === 'bottom-right'
    ? 'right-4 md:right-6'
    : 'left-4 md:left-6';

  return (
    <div className={`fixed ${posClass} bottom-4 md:bottom-6 z-[60]`}>
      <div className="flex items-center gap-2">
        <Link to="/voice-commands" aria-label="Open voice commands">
          <Button
            size="icon"
            className={`h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-105 ${
              canUseVoice ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
            title={canUseVoice ? 'Voice commands' : 'Voice commands unavailable for your role'}
          >
            <Mic className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}; 