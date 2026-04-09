import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TopBar = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
      <button onClick={() => navigate('/home')} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">UB</span>
        </div>
        <span className="font-semibold text-foreground text-lg tracking-tight">UniBluePrint</span>
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
