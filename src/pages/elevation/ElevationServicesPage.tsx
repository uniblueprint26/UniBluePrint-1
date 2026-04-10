import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { User, Network, Briefcase, Users, Mic2, GraduationCap, ArrowRight } from 'lucide-react';

const services = [
  { id: 'personal-branding', label: 'Personal Branding', description: 'Build your professional brand', icon: User },
  { id: 'network-assistance', label: 'Network Assistance', description: 'Expand your professional network', icon: Network },
  { id: 'portfolio', label: 'Portfolio', description: 'Create a standout portfolio', icon: Briefcase },
  { id: 'mentorship', label: 'Mentorship', description: 'Matched with an industry mentor', icon: Users },
  { id: 'pitch-coaching', label: 'Pitch Coaching', description: 'Refine your pitch delivery', icon: Mic2 },
  { id: 'postgrad-support', label: 'Postgrad Support', description: 'Postgraduate application guidance', icon: GraduationCap },
];

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
          <Card key={service.id} className="rounded-xl border-[1.5px] border-accent dark:border-white hover:bg-secondary transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <service.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground text-sm">{service.label}</p>
                <p className="text-xs text-muted-foreground">{service.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </section>

      <p className="text-xs text-muted-foreground text-center">Coach directory and booking — coming soon</p>
    </div>
  );
};

export default ElevationServicesPage;
