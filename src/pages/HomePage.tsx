import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, TrendingUp, Users, BookOpen, Sparkles, Calculator, Megaphone } from 'lucide-react';

const categories = [
  { label: 'Foundation Blueprint', icon: FileText, path: '/foundation', color: 'bg-primary/10 text-primary' },
  { label: 'Elevation Blueprint', icon: TrendingUp, path: '/elevation', color: 'bg-accent/10 text-accent' },
  { label: 'Campus Connect', icon: Users, path: '/campus', color: 'bg-primary/10 text-primary' },
  { label: 'Course Connect', icon: BookOpen, path: '/connect/course', color: 'bg-accent/10 text-accent' },
  { label: 'Lifestyle', icon: Sparkles, path: '/lifestyle', color: 'bg-primary/10 text-primary' },
  { label: 'Budgeting Tool', icon: Calculator, path: '/budget', color: 'bg-accent/10 text-accent' },
  { label: 'Ad Board', icon: Megaphone, path: '/ads', color: 'bg-primary/10 text-primary' },
];

const quickActions = [
  { label: 'New Blueprint', path: '/foundation', icon: FileText },
  { label: 'My Budget', path: '/budget', icon: Calculator },
  { label: 'Campus', path: '/campus', icon: Users },
  { label: 'Deals', path: '/lifestyle', icon: Sparkles },
];

const HomePage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const subtitle = profile?.university_or_field || 'Getting started';

  return (
    <div className="px-5 py-6 space-y-8">
      {/* Hero Greeting */}
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-90"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Deals Strip */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Featured Deals</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="min-w-[200px] rounded-xl border-border">
              <CardContent className="p-4">
                <div className="h-20 rounded-lg bg-muted mb-3 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Featured Deal {i}</p>
                <p className="text-xs text-muted-foreground mt-1">Exclusive student offer</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Explore</h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => navigate(cat.path)}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left transition-colors hover:bg-secondary"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color}`}>
                <cat.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-foreground">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Activity / Suggested */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
          {profile?.onboarding_completed ? 'Recent Activity' : 'Suggested For You'}
        </h2>
        {!profile?.onboarding_completed && (
          <Card className="rounded-xl border-border">
            <CardContent className="p-5">
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
            </CardContent>
          </Card>
        )}
        {profile?.onboarding_completed && (
          <div className="space-y-3">
            <Card className="rounded-xl border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">No recent activity yet. Start exploring your Blueprint.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
