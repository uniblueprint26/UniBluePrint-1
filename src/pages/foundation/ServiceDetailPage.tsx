import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const serviceInfo: Record<string, { label: string; description: string; price: number; fields: string[] }> = {
  cv: { label: 'CV', description: 'Professional CV tailored to your goals', price: 2900, fields: ['Current role or course', 'Target role or industry', 'Key skills and experience'] },
  linkedin: { label: 'LinkedIn', description: 'Optimised LinkedIn profile', price: 2400, fields: ['LinkedIn URL (if existing)', 'Target audience', 'Key achievements'] },
  'cover-letter': { label: 'Cover Letter', description: 'Targeted cover letter writing', price: 1900, fields: ['Target company', 'Role applying for', 'Why this role'] },
  'application-form': { label: 'Application Form', description: 'Structured form assistance', price: 1900, fields: ['Organisation name', 'Application type', 'Key questions to address'] },
  'interview-prep': { label: 'Interview Prep', description: 'Mock interview and feedback', price: 3400, fields: ['Role being interviewed for', 'Interview format', 'Areas of concern'] },
  'job-search': { label: 'Job Search', description: 'Personalised job search strategy', price: 2400, fields: ['Desired industry', 'Location preferences', 'Experience level'] },
  'cao-support': { label: 'CAO Support', description: 'CAO application guidance', price: 2900, fields: ['Current year', 'Top course choices', 'Points estimate'] },
};

const ServiceDetailPage = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const service = serviceId ? serviceInfo[serviceId] : null;

  if (!service) {
    return (
      <div className="px-5 py-6">
        <p className="text-muted-foreground">Service not found.</p>
        <Button variant="ghost" onClick={() => navigate('/foundation')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Look up service ID from database
      const { data: svc } = await supabase
        .from('services')
        .select('id')
        .eq('name', service.label)
        .eq('category', 'foundation')
        .maybeSingle();

      const notes = JSON.stringify({ fields: formData, additionalNotes });

      const { error } = await supabase.from('submissions').insert({
        user_id: user.id,
        service_id: svc?.id || null,
        stage: 'submitted',
        submitted_at: new Date().toISOString(),
        notes,
      });

      if (error) throw error;

      toast.success('Submission received! Track progress in your submissions.');
      navigate('/foundation/submissions');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 py-6 space-y-6">
      <button onClick={() => navigate('/foundation')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to services
      </button>

      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{service.label}</h1>
        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
        <p className="text-lg font-semibold text-primary mt-2">€{(service.price / 100).toFixed(2)}</p>
      </section>

      <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
        <CardContent className="p-5 space-y-5">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">Your Details</h2>

          {service.fields.map((field) => (
            <div key={field} className="space-y-1.5">
              <Label className="text-sm text-foreground">{field}</Label>
              <Input
                placeholder={`Enter ${field.toLowerCase()}`}
                value={formData[field] || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <Label className="text-sm text-foreground">Additional Notes</Label>
            <Textarea
              placeholder="Anything else we should know..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Upload className="h-3.5 w-3.5" />
            <span>File uploads coming soon</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment placeholder — Stripe Elements will go here */}
      <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground text-sm">Payment</p>
              <p className="text-xs text-muted-foreground">All payments processed securely via UniBluePrint</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Stripe Elements integration — coming in Phase 5</p>
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-xl font-medium"
      >
        {submitting ? 'Submitting...' : `Submit & Pay €${(service.price / 100).toFixed(2)}`}
      </Button>
    </div>
  );
};

export default ServiceDetailPage;
