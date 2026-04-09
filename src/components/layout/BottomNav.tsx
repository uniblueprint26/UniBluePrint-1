import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Users, Sparkles, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Home', icon: Home, path: '/home' },
  { label: 'Blueprint', icon: Compass, path: '/blueprint' },
  { label: 'Connect', icon: Users, path: '/connect' },
  { label: 'Lifestyle', icon: Sparkles, path: '/lifestyle' },
  { label: 'More', icon: MoreHorizontal, path: '/more' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/';
    if (path === '/blueprint') return location.pathname.startsWith('/foundation') || location.pathname.startsWith('/elevation') || location.pathname === '/blueprint';
    if (path === '/connect') return location.pathname.startsWith('/campus') || location.pathname.startsWith('/connect') || location.pathname.startsWith('/course');
    if (path === '/more') return location.pathname.startsWith('/budget') || location.pathname.startsWith('/ads') || location.pathname === '/more';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
