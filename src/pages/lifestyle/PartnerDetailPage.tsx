import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Ticket, Heart, Dumbbell, Car, UtensilsCrossed, Scissors, Tag } from 'lucide-react';
import { toast } from 'sonner';

const categoryMeta: Record<string, { label: string; icon: typeof Ticket }> = {
  gym: { label: 'Gyms & Fitness', icon: Dumbbell },
  driving: { label: 'Driving Schools', icon: Car },
  food: { label: 'Food & Restaurants', icon: UtensilsCrossed },
  barber: { label: 'Barbers & Beauty', icon: Scissors },
  'mental-health': { label: 'Mental Health', icon: Heart },
  other: { label: 'Other Deals', icon: Tag },
};

interface Partner {
  id: string;
  name: string;
  type: string | null;
  contact_email: string | null;
}

interface Deal {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
}

const PartnerDetailPage = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from('partners')
        .select('id,name,type,contact_email')
        .eq('id', partnerId)
        .maybeSingle();
      if (!active) return;
      if (!p) { setNotFound(true); setLoading(false); return; }
      setPartner(p as Partner);
      const { data: d } = await supabase
        .from('deals')
        .select('id,title,description,discount_percent')
        .eq('partner_id', p.id)
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (!active) return;
      setDeals((d as Deal[]) || []);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [partnerId]);

  const isFree = partner?.type === 'mental-health';
  const meta = partner?.type ? categoryMeta[partner.type] : null;
  const Icon = meta?.icon || Ticket;

  const handleClaim = () => {
    if (isFree) {
      toast.success('This service is free — booking opens at launch.');
    } else {
      toast('Included with Pro — manage your subscription on the UniBluePrint website.');
    }
  };

  return (
    <div className="px-5 py-6 space-y-6">
      <button
        onClick={() => navigate('/lifestyle')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Lifestyle Blueprint
      </button>

      {notFound ? (
        <div className="accent-card">
          <div className="p-6 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">Partner not found</p>
            <p className="text-xs text-muted-foreground">This partner isn't available.</p>
          </div>
        </div>
      ) : loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
      ) : (
        <>
          <section className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl icon-chip shrink-0">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">{partner?.name}</h1>
              {meta && <p className="text-sm text-muted-foreground">{meta.label}</p>}
            </div>
          </section>

          {/* Access badge */}
          <div className="bg-card rounded-xl shadow-sm border border-border/60 p-4">
            {isFree ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Free</span>
                <p className="text-sm text-foreground">Always free — no subscription needed.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground">Included with Pro</span>
                  <p className="text-sm text-foreground">Claim with a Pro subscription.</p>
                </div>
                <p className="text-xs text-muted-foreground">Manage your subscription on the UniBluePrint website.</p>
              </div>
            )}
          </div>

          {/* Deals */}
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Available Deals</h2>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No deals available right now.</p>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => (
                  <div key={deal.id} className="accent-card">
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 icon-chip shrink-0">
                        <Ticket className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{deal.title}</p>
                        {deal.description && <p className="text-xs text-muted-foreground mt-0.5">{deal.description}</p>}
                      </div>
                      {deal.discount_percent ? (
                        <span className="text-sm font-bold text-primary shrink-0">{deal.discount_percent}% off</span>
                      ) : isFree ? (
                        <span className="text-xs font-bold text-primary shrink-0">Free</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Button onClick={handleClaim} className="w-full rounded-xl h-11 font-semibold">
            {isFree ? 'Book — Free' : 'Claim with Pro'}
          </Button>
        </>
      )}
    </div>
  );
};

export default PartnerDetailPage;
