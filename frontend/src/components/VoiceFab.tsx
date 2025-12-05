import { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export const VoiceFab = () => {
  const { user, hasPermission } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // Position state (default: bottom-left)
  const [position, setPosition] = useState({ x: 20, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);

    // set initial Y = bottom - 80px (approx FAB height + margin)
    if (typeof window !== 'undefined') {
      setPosition({ x: 20, y: window.innerHeight - 80 });
    }
  }, []);

  if (!user) return null;

  const canUseVoice = hasPermission('use_voice_commands');

  // Start dragging
  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  // Handle dragging
  const onDrag = (e: MouseEvent | TouchEvent) => {
    if (!dragging) return;

    const clientX =
      e instanceof TouchEvent ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY =
      e instanceof TouchEvent ? e.touches[0].clientY : (e as MouseEvent).clientY;

    setPosition({
      x: clientX - offset.x,
      y: clientY - offset.y,
    });
  };

  const stopDrag = () => setDragging(false);

  // Attach drag listeners
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('touchmove', onDrag);
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('touchend', stopDrag);
    } else {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
    }

    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [dragging, offset]);

  return (
    <div
      className="fixed z-[60]"
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <div className="flex items-center gap-2">
        <Link to="/voice-commands" aria-label="Open voice commands">
          <Button
            size="icon"
            className={`h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-105 ${
              canUseVoice
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
            title={
              canUseVoice
                ? 'Voice commands'
                : 'Voice commands unavailable for your role'
            }
          >
            <Mic className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
