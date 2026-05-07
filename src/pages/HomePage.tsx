import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowUp, UsersRound, Globe, ShoppingBag, PieChart, Megaphone, Calculator, Sparkles, Ticket } from 'lucide-react';

const categories = [
  { label: 'Foundation Blueprint', icon: FileText, path: '/foundation' },
  { label: 'Elevation Blueprint', icon: ArrowUp, path: '/elevation' },
  { label: 'Lifestyle Blueprint', icon: Ticket, path: '/lifestyle' },
  { label: 'Campus Connect', icon: UsersRound, path: '/campus' },
  { label: 'Course Connect', icon: Globe, path: '/connect/course' },
  { label: 'Budgeting Tool', icon: PieChart, path: '/budget' },
];

const adsCard = { label: 'Advertisement Board', icon: Megaphone, path: '/ads' };

const quickActions = [
  { label: 'New Blueprint', path: '/foundation', icon: FileText },
  { label: 'My Budget', path: '/budget', icon: Calculator },
  { label: 'Campus', path: '/campus', icon: UsersRound },
  { label: 'Deals', path: '/lifestyle', icon: ShoppingBag },
];

const HomePage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const subtitle = profile?.university_or_field || 'Getting started';

  return (
    <div className="px-5 py-6 space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </section>

      <section>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-90"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Featured Deals</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[200px] accent-card">
              <div className="p-4">
                <div className="h-20 rounded-lg bg-[#F5F0E8] mb-3 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                {i === 1 ? (
                  <>
                    <div className="mb-2 px-2 py-1 rounded-md bg-[#1E3A5F] border border-[#F5F0E8] text-white text-xs font-bold text-center">
                      50% OFF
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Your Blueprint. Half the price. The whole of September.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Featured Deal {i}</p>
                    <p className="text-xs text-muted-foreground mt-1">Exclusive student offer</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Explore</h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => navigate(cat.path)}
              className="flex items-center gap-3 p-4 accent-card text-left transition-colors hover:bg-secondary"
            >
              <div className="w-10 h-10 icon-chip">
                <cat.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-foreground">{cat.label}</span>
            </button>
          ))}
          <button
            onClick={() => navigate(adsCard.path)}
            className="col-span-2 flex items-center gap-3 p-4 accent-card text-left transition-colors hover:bg-secondary"
          >
            <div className="w-10 h-10 icon-chip">
              <adsCard.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-foreground">{adsCard.label}</span>
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
          {profile?.onboarding_completed ? 'Recent Activity' : 'Suggested For You'}
        </h2>
        {!profile?.onboarding_completed && (
          <div className="accent-card">
            <div className="p-5">
              <h3 className="font-semibold text-foreground mb-1">Getting Started</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Complete your profile to unlock your full Blueprint experience.
              </p>
              <button
                onClick={() => navigate('/onboarding')}
                className="text-sm font-medium text-primary hover:underline"
              >
                Continue Setup →
              </button>
            </div>
          </div>
        )}
        {profile?.onboarding_completed && (
          <div className="accent-card">
            <div className="p-4">
              <p className="text-sm text-muted-foreground">No recent activity yet. Start exploring your Blueprint.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
