import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, Car, UtensilsCrossed, Scissors, Heart, Tag, Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import FilterButton from '@/components/FilterButton';

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
}

const LifestylePage = () => {
  const { profile } = useAuth();
  const [scope, setScope] = useState<'national' | 'campus'>('national');
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    const fetchDeals = async () => {
      const { data } = await supabase
        .from('deals')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(50);
      setAllDeals((data as Deal[]) || []);
    };
    fetchDeals();
  }, []);

  const filterOptions = partnerCategories.map((c) => ({ label: c.label, value: c.id }));

  return (
    <div className="px-5 py-6 space-y-6">
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Lifestyle Blueprint</h1>
          <p className="text-sm text-muted-foreground mt-1">Deals, experiences, and more.</p>
        </div>
        <FilterButton
          options={filterOptions}
          selected={activeFilters}
          onSelectionChange={setActiveFilters}
          title="Filter Categories"
        />
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
                <div key={cat.id} className="accent-card hover:bg-secondary transition-colors cursor-pointer">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 icon-chip shrink-0">
                      <cat.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{cat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Featured Deals</h2>
            {allDeals.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Partner deals coming soon.</p>
            )}
            <div className="space-y-3">
              {allDeals.map((deal) => (
                <div key={deal.id} className="accent-card">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 icon-chip shrink-0">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{deal.title}</p>
                      {deal.description && <p className="text-xs text-muted-foreground mt-0.5">{deal.description}</p>}
                    </div>
                    {deal.discount_percent && (
                      <span className="text-sm font-bold text-primary">{deal.discount_percent}% off</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

      <p className="text-xs text-muted-foreground text-center">Lifestyle Wallet and booking — coming soon</p>
    </div>
  );
};

export default LifestylePage;
