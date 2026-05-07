import { useNavigate } from 'react-router-dom';
import { User, Network, Briefcase, Users, Mic2, GraduationCap, ArrowRight } from 'lucide-react';

interface ServiceDef {
  id: string;
  label: string;
  description: string;
  icon: typeof User;
  standardOriginal: string;
  standardTrial: string;
  premiumOriginal: string;
  premiumTrial: string;
}

const services: ServiceDef[] = [
  { id: 'personal-branding', label: 'Personal Branding', description: 'Build your professional brand', icon: User, standardOriginal: '€40', standardTrial: '€20', premiumOriginal: '€55', premiumTrial: '€28' },
  { id: 'network-assistance', label: 'Network Assistance', description: 'Expand your professional network', icon: Network, standardOriginal: '€30', standardTrial: '€15', premiumOriginal: '€46', premiumTrial: '€23' },
  { id: 'portfolio', label: 'Portfolio', description: 'Create a standout portfolio', icon: Briefcase, standardOriginal: '€30', standardTrial: '€15', premiumOriginal: '€46', premiumTrial: '€23' },
  { id: 'mentorship', label: 'Mentorship', description: 'Matched with an industry mentor', icon: Users, standardOriginal: '€20', standardTrial: '€10', premiumOriginal: '€36', premiumTrial: '€18' },
  { id: 'pitch-coaching', label: 'Pitch Coaching', description: 'Refine your pitch delivery', icon: Mic2, standardOriginal: '€25', standardTrial: '€13', premiumOriginal: '€42', premiumTrial: '€21' },
  { id: 'postgrad-support', label: 'Postgrad Support', description: 'Postgraduate application guidance', icon: GraduationCap, standardOriginal: '€30', standardTrial: '€15', premiumOriginal: '€52', premiumTrial: '€26' },
];

const PriceBlock = ({ original, trial }: { original: string; trial: string }) => (
  <div className="flex flex-col items-end">
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-muted-foreground line-through">{original}</span>
      <span className="text-base font-bold text-primary">{trial}</span>
    </div>
    <span className="text-[10px] text-muted-foreground/70 mt-0.5">September trial price</span>
  </div>
);

const ElevationServicesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-5 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Elevation Blueprint</h1>
        <p className="text-sm text-muted-foreground mt-1">Take your Blueprint further.</p>
      </section>

      <section className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="accent-card hover:bg-secondary transition-colors cursor-pointer relative">
            <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1E3A5F] text-white border border-[#F5F0E8] z-10">
              50% OFF
            </span>
            <div className="p-4 flex items-center gap-4">
              <div className="w-11 h-11 icon-chip shrink-0">
                <service.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground text-sm">{service.label}</p>
                <p className="text-xs text-muted-foreground">{service.description}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0 pr-1">
                <PriceBlock original={service.standardOriginal} trial={service.standardTrial} />
                <PriceBlock original={service.premiumOriginal} trial={service.premiumTrial} />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>
        ))}
      </section>

      <p className="text-xs text-muted-foreground text-center">Coach directory and booking — coming soon</p>
    </div>
  );
};

export default ElevationServicesPage;
