import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Linkedin, Mail, ClipboardList, Mic, Search, GraduationCap, ArrowRight } from 'lucide-react';

const services = [
  { id: 'cv', label: 'CV', description: 'Professional CV tailored to your goals', icon: FileText, price: '€29' },
  { id: 'linkedin', label: 'LinkedIn', description: 'Optimised LinkedIn profile', icon: Linkedin, price: '€24' },
  { id: 'cover-letter', label: 'Cover Letter', description: 'Targeted cover letter writing', icon: Mail, price: '€19' },
  { id: 'application-form', label: 'Application Form', description: 'Structured form assistance', icon: ClipboardList, price: '€19' },
  { id: 'interview-prep', label: 'Interview Prep', description: 'Mock interview and feedback', icon: Mic, price: '€34' },
  { id: 'job-search', label: 'Job Search', description: 'Personalised job search strategy', icon: Search, price: '€24' },
  { id: 'cao-support', label: 'CAO Support', description: 'CAO application guidance', icon: GraduationCap, price: '€29' },
];

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
            <Card className="rounded-xl border-[1.5px] border-accent dark:border-white hover:bg-secondary transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 icon-chip shrink-0">
                  <service.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground text-sm">{service.label}</p>
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                </div>
                <span className="text-sm font-semibold text-primary shrink-0">{service.price}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
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
