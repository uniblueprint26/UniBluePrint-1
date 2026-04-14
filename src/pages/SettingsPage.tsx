import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, User, GraduationCap, Mail, Bell, ShieldCheck, Lock, CreditCard, Clock, SlidersHorizontal, Headset, FileCheck, Settings } from 'lucide-react';
import { useState } from 'react';

const settingsCards = [
  { title: 'My Identity', subtitle: 'Who you are on the platform', icon: User, path: '/settings/identity' },
  { title: 'My Status', subtitle: 'Where you are in your journey', icon: GraduationCap, path: '/settings/status' },
  { title: 'My Connections', subtitle: 'How we reach you', icon: Mail, path: '/settings/connections' },
  { title: 'My Alerts', subtitle: 'Stay informed, stay ahead', icon: Bell, path: '/settings/alerts' },
  { title: 'My Privacy', subtitle: 'Your data, your control', icon: ShieldCheck, path: '/settings/privacy' },
  { title: 'My Security', subtitle: 'Keep your Blueprint safe', icon: Lock, path: '/settings/security' },
  { title: 'My Finances', subtitle: 'Your payments and billing', icon: CreditCard, path: '/settings/finances' },
  { title: 'My Blueprint History', subtitle: 'Everything you have built', icon: Clock, path: '/settings/history' },
  { title: 'My Display', subtitle: 'Make it yours', icon: SlidersHorizontal, path: '/settings/display' },
  { title: 'Blueprint Support', subtitle: 'We are here when you need us', icon: Headset, path: '/settings/support' },
  { title: 'Blueprint Terms', subtitle: 'The structure behind the platform', icon: FileCheck, path: '/settings/terms' },
  { title: 'My Account', subtitle: 'Manage your Blueprint', icon: Settings, path: '/settings/account' },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = settingsCards.filter(
    (c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-5 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Your Blueprint</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search settings..."
          className="pl-10 rounded-lg"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.path)}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border text-left transition-colors hover:bg-secondary"
          >
            <div className="w-10 h-10 icon-chip flex-shrink-0">
              <card.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{card.title}</p>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
