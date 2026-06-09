import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ubpLogoTransparent from '@/assets/ubp-logo-transparent.png';
import ubpLogoCream from '@/assets/ubp-logo-cream.png';

const TopBar = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [animating, setAnimating] = useState(false);
  const [unread, setUnread] = useState(0);
  const underlineRef = useRef<HTMLSpanElement>(null);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setUnread(count || 0);
    };
    fetchUnread();
    const channel = supabase
      .channel(`notif-bell:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        fetchUnread
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

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
        <div className="h-8 rounded-md border border-primary bg-background flex items-center justify-center px-1.5">
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

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/notifications')}
          className="relative focus:outline-none"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-foreground" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <button onClick={() => navigate('/settings')} className="focus:outline-none">
          <Avatar className="h-9 w-9 border-2 border-primary">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
