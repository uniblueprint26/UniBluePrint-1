import { useNavigate } from 'react-router-dom';
import { FileText, Linkedin, Mail, ClipboardList, Mic, Search, GraduationCap, ArrowRight } from 'lucide-react';

interface ServiceDef {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  standardOriginal: string;
  standardTrial: string;
  premiumOriginal: string;
  premiumTrial: string;
}

const services: ServiceDef[] = [
  { id: 'cv', label: 'CV', description: 'Professional CV tailored to your goals', icon: FileText, standardOriginal: '€20', standardTrial: '€10', premiumOriginal: '€36', premiumTrial: '€18' },
  { id: 'linkedin', label: 'LinkedIn', description: 'Optimised LinkedIn profile', icon: Linkedin, standardOriginal: '€20', standardTrial: '€10', premiumOriginal: '€36', premiumTrial: '€18' },
  { id: 'cover-letter', label: 'Cover Letter', description: 'Targeted cover letter writing', icon: Mail, standardOriginal: '€20', standardTrial: '€10', premiumOriginal: '€36', premiumTrial: '€18' },
  { id: 'application-form', label: 'Application Form', description: 'Structured form assistance', icon: ClipboardList, standardOriginal: 'From €20', standardTrial: 'From €10', premiumOriginal: 'From €36', premiumTrial: 'From €18' },
  { id: 'interview-prep', label: 'Interview Prep', description: 'Mock interview and feedback', icon: Mic, standardOriginal: '€20', standardTrial: '€10', premiumOriginal: '€36', premiumTrial: '€18' },
  { id: 'job-search', label: 'Job Search', description: 'Personalised job search strategy', icon: Search, standardOriginal: '€15', standardTrial: '€8', premiumOriginal: '€26', premiumTrial: '€13' },
  { id: 'cao-support', label: 'CAO Support', description: 'CAO application guidance', icon: GraduationCap, standardOriginal: '€20', standardTrial: '€10', premiumOriginal: '€36', premiumTrial: '€18' },
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

const FoundationServicesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-5 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Foundation Blueprint</h1>
        <p className="text-sm text-muted-foreground mt-1">Build the essentials for your journey.</p>
      </section>

      <section className="space-y-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => navigate(`/foundation/${service.id}`)}
            className="w-full"
          >
            <div className="accent-card hover:bg-secondary transition-colors relative">
              <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground border border-background z-10">
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
