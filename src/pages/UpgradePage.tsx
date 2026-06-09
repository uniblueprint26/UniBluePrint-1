import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const proBenefits = [
  'Elevation Blueprint — coaches & mentorship',
  'Full Lifestyle Blueprint deals',
  'Priority queue on Foundation services',
  'Lower Premium-tier pricing',
  'Permanent wallet & unlimited Ad Board',
];

const tiers = [
  { id: 'pro_monthly', label: 'Pro Monthly', price: '€6.99', per: '/month', note: null },
  { id: 'pro_annual', label: 'Pro Annual', price: '€49.99', per: '/year', note: 'Best value' },
];

const tierLabel: Record<string, string> = { pro_monthly: 'Pro Monthly', pro_annual: 'Pro Annual' };

const UpgradePage = () => {
  const navigate = useNavigate();
  const { isPro, subscription, refreshSubscription } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const subscribe = async (tier: string) => {
    setBusy(tier);
    const { error } = await supabase.rpc('dev_activate_subscription', { p_tier: tier });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    await refreshSubscription();
    toast.success("You're Pro! (test activation)");
  };

  const cancel = async () => {
    setBusy('cancel');
    const { error } = await supabase.rpc('cancel_subscription');
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    await refreshSubscription();
    toast('Subscription canceled.');
  };

  return (
    <div className="px-5 py-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">UniBluePrint Pro</h1>
        <p className="text-sm text-muted-foreground mt-1">Unlock everything your Blueprint can do.</p>
      </section>

      <div className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
        Test activation — real payment is coming. No card is charged.
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border/60 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg icon-chip">
            <Crown className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">Pro includes</span>
        </div>
        {proBenefits.map((b) => (
          <div key={b} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="text-sm text-foreground">{b}</span>
          </div>
        ))}
      </div>

      {isPro ? (
        <div className="bg-card rounded-xl shadow-sm border border-border/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {subscription ? tierLabel[subscription.tier] || 'Pro' : 'Pro'} — active
              </p>
              {subscription?.current_period_end && (
                <p className="text-xs text-muted-foreground">
                  Renews {format(new Date(subscription.current_period_end), 'dd MMM yyyy')}
                </p>
              )}
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">PRO</span>
          </div>
          <Button variant="outline" className="w-full rounded-lg" onClick={cancel} disabled={busy === 'cancel'}>
            {busy === 'cancel' ? 'Canceling...' : 'Cancel subscription'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map((t) => (
            <div key={t.id} className="bg-card rounded-xl shadow-sm border border-border/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.label}</p>
                  {t.note && <p className="text-xs text-primary font-medium">{t.note}</p>}
                </div>
                <p className="text-lg font-bold text-foreground">
                  {t.price}
                  <span className="text-xs font-normal text-muted-foreground">{t.per}</span>
                </p>
              </div>
              <Button className="w-full rounded-lg h-11 font-semibold" onClick={() => subscribe(t.id)} disabled={busy === t.id}>
                {busy === t.id ? 'Activating...' : `Subscribe ${t.price}${t.per}`}
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center">Mental Health & Wellbeing is always free — no Pro needed.</p>
        </div>
      )}
    </div>
  );
};

export default UpgradePage;
