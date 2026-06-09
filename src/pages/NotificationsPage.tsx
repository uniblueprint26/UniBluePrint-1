import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, CheckCheck, ShieldAlert, CreditCard, FileCheck, Megaphone, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notif {
  id: string;
  category: string;
  title: string;
  message: string | null;
  read: boolean | null;
  created_at: string | null;
}

const categoryIcon: Record<string, typeof Bell> = {
  welcome: Sparkles,
  security: ShieldAlert,
  payment: CreditCard,
  output: FileCheck,
  promotional: Megaphone,
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id,category,title,message,read,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!active) return;
      setItems((data as Notif[]) || []);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-page:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notif;
          setItems((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = items.filter((i) => !i.read).length;

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    if (!user) return;
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  return (
    <div className="px-5 py-6 space-y-6">
      <section className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </section>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
      ) : items.length === 0 ? (
        <div className="accent-card">
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">You're all caught up.</p>
            <p className="text-sm text-muted-foreground">Notifications about your Blueprint will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const Icon = categoryIcon[n.category] || Bell;
            return (
              <button
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={cn(
                  'w-full accent-card text-left transition-colors',
                  n.read ? 'hover:bg-secondary' : 'ring-2 ring-primary'
                )}
              >
                <div className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 icon-chip shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                    {n.created_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
