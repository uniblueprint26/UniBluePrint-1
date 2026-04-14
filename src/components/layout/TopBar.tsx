import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRef, useState } from 'react';
import ubpLogoTransparent from '@/assets/ubp-logo-transparent.png';
import ubpLogoCream from '@/assets/ubp-logo-cream.png';

const TopBar = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [animating, setAnimating] = useState(false);
  const underlineRef = useRef<HTMLSpanElement>(null);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogoTap = () => {
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      navigate('/home');
    }, 400);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
      <button onClick={handleLogoTap} className="flex items-center gap-2 relative">
        <div className="h-8 rounded-md border border-[#1E3A5F] bg-[#F5F0E8] flex items-center justify-center px-1.5">
          <img
            src={ubpLogoTransparent}
            alt="UniBluePrint"
            className="h-6 w-auto dark:hidden"
          />
          <img
            src={ubpLogoCream}
            alt="UniBluePrint"
            className="h-6 w-auto hidden dark:block"
          />
        </div>
        <span className="font-semibold text-foreground text-lg tracking-tight">UniBluePrint</span>
        {animating && (
          <span
            ref={underlineRef}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary logo-tap-underline origin-left"
          />
        )}
      </button>

      <button onClick={() => navigate('/settings')} className="focus:outline-none">
        <Avatar className="h-9 w-9 border-2 border-border">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>
    </header>
  );
};

export default TopBar;
