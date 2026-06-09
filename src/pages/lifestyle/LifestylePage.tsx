import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, Car, UtensilsCrossed, Scissors, Heart, Tag, Ticket, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const partnerCategories = [
  { id: 'gym', label: 'Gyms & Fitness', icon: Dumbbell },
  { id: 'driving', label: 'Driving Schools', icon: Car },
  { id: 'food', label: 'Food & Restaurants', icon: UtensilsCrossed },
  { id: 'barber', label: 'Barbers & Beauty', icon: Scissors },
  { id: 'mental-health', label: 'Mental Health', icon: Heart },
  { id: 'other', label: 'Other Deals', icon: Tag },
];

interface Deal {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  partner_id: string | null;
  partners: { type: string | null; name: string | null } | null;
}

const LifestylePage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState<'national' | 'campus'>('national');
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      const { data } = await supabase
        .from('deals')
        .select('id,title,description,discount_percent,partner_id, partners(type,name)')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(50);
      setAllDeals((data as Deal[]) || []);
    };
    fetchDeals();
  }, []);

  const deals = category ? allDeals.filter((d) => d.partners?.type === category) : allDeals;

  return (
    <div className="px-5 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Lifestyle Blueprint</h1>
        <p className="text-sm text-muted-foreground mt-1">Deals, experiences, and more.</p>
      </section>

      <Tabs value={scope} onValueChange={(v) => setScope(v as 'national' | 'campus')}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="national">National</TabsTrigger>
          <TabsTrigger value="campus">My Campus</TabsTrigger>
        </TabsList>

        <TabsContent value="national" className="mt-4 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Categories</h2>
            <div className="grid grid-cols-2 gap-3">
              {partnerCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(category === cat.id ? null : cat.id)}
                  className={cn(
                    'accent-card text-left transition-all',
                    category === cat.id ? 'ring-2 ring-primary' : 'hover:bg-secondary'
                  )}
                >
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 icon-chip shrink-0">
                      <cat.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{cat.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {category ? partnerCategories.find((c) => c.id === category)?.label : 'Featured Deals'}
              </h2>
              {category && (
                <button onClick={() => setCategory(null)} className="text-xs font-medium text-primary hover:underline">
                  Clear
                </button>
              )}
            </div>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {category ? 'No deals in this category yet.' : 'Partner deals coming soon.'}
              </p>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => deal.partner_id && navigate(`/lifestyle/partner/${deal.partner_id}`)}
                    className="w-full accent-card hover:bg-secondary transition-colors text-left"
                  >
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 icon-chip shrink-0">
                        <Ticket className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{deal.title}</p>
                        {deal.partners?.name && (
                          <p className="text-xs text-muted-foreground mt-0.5">{deal.partners.name}</p>
                        )}
                      </div>
                      {deal.discount_percent ? (
                        <span className="text-sm font-bold text-primary shrink-0">{deal.discount_percent}% off</span>
                      ) : deal.partners?.type === 'mental-health' ? (
                        <span className="text-xs font-bold text-primary shrink-0">Free</span>
                      ) : null}
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="campus" className="mt-4 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              {profile?.university_or_field ? `${profile.university_or_field} Deals` : 'Campus Deals'}
            </h2>
            <div className="accent-card">
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl icon-chip mx-auto">
                  <Ticket className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground">Partner deals are coming to your campus soon.</p>
                <p className="text-xs text-muted-foreground">Check back after launch.</p>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LifestylePage;
