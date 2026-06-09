import { useNavigate } from 'react-router-dom';
import { FileText, Linkedin, Mail, ClipboardList, Mic, Search, GraduationCap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { priceCents, isProRate, isTrialActive, euro, FOUNDATION_PRICING, type Tier } from '@/config/pricing';

interface ServiceDef {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
}

const services: ServiceDef[] = [
  { id: 'cv', label: 'CV', description: 'Professional CV tailored to your goals', icon: FileText },
  { id: 'linkedin', label: 'LinkedIn', description: 'Optimised LinkedIn profile', icon: Linkedin },
  { id: 'cover-letter', label: 'Cover Letter', description: 'Targeted cover letter writing', icon: Mail },
  { id: 'application-form', label: 'Application Form', description: 'Structured form assistance', icon: ClipboardList },
  { id: 'interview-prep', label: 'Interview Prep', description: 'Mock interview and feedback', icon: Mic },
  { id: 'job-search', label: 'Job Search', description: 'Personalised job search strategy', icon: Search },
  { id: 'cao-support', label: 'CAO Support', description: 'CAO application guidance', icon: GraduationCap },
];

const PriceRow = ({ serviceId, tier, isPro, label }: { serviceId: string; tier: Tier; isPro: boolean; label: string }) => {
  const p = FOUNDATION_PRICING[serviceId];
  const trial = isTrialActive();
  const now = priceCents(serviceId, tier, isPro) ?? 0;
  const full = tier === 'standard' ? p.standard : isPro ? p.premiumPro : p.premiumFree;
  const prefix = p.from ? 'From ' : '';
  return (
    <div className="flex items-baseline justify-end gap-1.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      {trial && <span className="text-[10px] text-muted-foreground line-through">{prefix}{euro(full)}</span>}
      <span className="text-sm font-bold text-primary">{prefix}{euro(now)}</span>
      {isProRate(serviceId, tier, isPro) && <span className="text-[9px] font-semibold text-primary">Pro</span>}
    </div>
  );
};

const FoundationServicesPage = () => {
  const navigate = useNavigate();
  const { isPro } = useAuth();
  const trial = isTrialActive();

  return (
    <div className="px-5 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Foundation Blueprint</h1>
        <p className="text-sm text-muted-foreground mt-1">Build the essentials for your journey.</p>
      </section>

      <section className="space-y-3">
        {services.map((service) => (
          <button key={service.id} onClick={() => navigate(`/foundation/${service.id}`)} className="w-full">
            <div className="accent-card hover:bg-secondary transition-colors relative">
              {trial && (
                <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground border border-background z-10">
                  50% OFF
                </span>
              )}
              <div className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 icon-chip shrink-0">
                  <service.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground text-sm">{service.label}</p>
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0 pr-1">
                  <PriceRow serviceId={service.id} tier="standard" isPro={isPro} label="Standard" />
                  <PriceRow serviceId={service.id} tier="premium" isPro={isPro} label="Premium" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>
          </button>
        ))}
      </section>

      <button
        onClick={() => navigate('/foundation/submissions')}
        className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
      >
        View My Submissions
      </button>
    </div>
  );
};

export default FoundationServicesPage;
