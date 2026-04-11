import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CreditCard, Plus, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const serviceInfo: Record<string, { label: string; description: string; price: number }> = {
  cv: { label: 'CV', description: 'Professional CV tailored to your goals', price: 2900 },
  linkedin: { label: 'LinkedIn', description: 'Optimised LinkedIn profile', price: 2400 },
  'cover-letter': { label: 'Cover Letter', description: 'Targeted cover letter writing', price: 1900 },
  'application-form': { label: 'Application Form', description: 'Structured form assistance', price: 1900 },
  'interview-prep': { label: 'Interview Prep', description: 'Mock interview and feedback', price: 3400 },
  'job-search': { label: 'Job Search', description: 'Personalised job search strategy', price: 2400 },
  'cao-support': { label: 'CAO Support', description: 'CAO application guidance', price: 2900 },
};

interface ExperienceEntry {
  company: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
  achievements: string;
}

const emptyExperience: ExperienceEntry = {
  company: '', jobTitle: '', startDate: '', endDate: '', responsibilities: '', achievements: '',
};

const SECTION_TITLES = [
  'Personal Info',
  'Target Role',
  'Education',
  'Experience',
  'Skills',
  'Achievements',
  'Style Preference',
];

const STORAGE_KEY = 'unibp_cv_draft';

const ServiceDetailPage = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [showReview, setShowReview] = useState(false);

  // Section 1 — Personal Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Section 2 — Target Role
  const [targetTitle, setTargetTitle] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [targetCompanies, setTargetCompanies] = useState(['', '', '']);
  const [careerLevel, setCareerLevel] = useState('');

  // Section 3 — Education
  const [degreeTitle, setDegreeTitle] = useState('');
  const [university, setUniversity] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [modules, setModules] = useState('');

  // Section 4 — Experience
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([{ ...emptyExperience }]);

  // Section 5 — Skills
  const [technicalSkills, setTechnicalSkills] = useState('');
  const [softSkills, setSoftSkills] = useState('');
  const [languages, setLanguages] = useState('');

  // Section 6 — Achievements
  const [awards, setAwards] = useState('');
  const [certifications, setCertifications] = useState('');
  const [extracurriculars, setExtracurriculars] = useState('');
  const [volunteering, setVolunteering] = useState('');

  // Section 7 — Style Preference
  const [layoutStyle, setLayoutStyle] = useState('');
  const [columnPref, setColumnPref] = useState('');
  const [tone, setTone] = useState('');

  const service = serviceId ? serviceInfo[serviceId] : null;
  const isCV = serviceId === 'cv';

  // Auto-save
  const getAllData = useCallback(() => ({
    fullName, phone, location, linkedinUrl,
    targetTitle, targetIndustry, targetCompanies, careerLevel,
    degreeTitle, university, gradYear, modules,
    experiences,
    technicalSkills, softSkills, languages,
    awards, certifications, extracurriculars, volunteering,
    layoutStyle, columnPref, tone,
  }), [fullName, phone, location, linkedinUrl, targetTitle, targetIndustry, targetCompanies, careerLevel, degreeTitle, university, gradYear, modules, experiences, technicalSkills, softSkills, languages, awards, certifications, extracurriculars, volunteering, layoutStyle, columnPref, tone]);

  useEffect(() => {
    if (!isCV) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.fullName) setFullName(d.fullName);
        if (d.phone) setPhone(d.phone);
        if (d.location) setLocation(d.location);
        if (d.linkedinUrl) setLinkedinUrl(d.linkedinUrl);
        if (d.targetTitle) setTargetTitle(d.targetTitle);
        if (d.targetIndustry) setTargetIndustry(d.targetIndustry);
        if (d.targetCompanies) setTargetCompanies(d.targetCompanies);
        if (d.careerLevel) setCareerLevel(d.careerLevel);
        if (d.degreeTitle) setDegreeTitle(d.degreeTitle);
        if (d.university) setUniversity(d.university);
        if (d.gradYear) setGradYear(d.gradYear);
        if (d.modules) setModules(d.modules);
        if (d.experiences) setExperiences(d.experiences);
        if (d.technicalSkills) setTechnicalSkills(d.technicalSkills);
        if (d.softSkills) setSoftSkills(d.softSkills);
        if (d.languages) setLanguages(d.languages);
        if (d.awards) setAwards(d.awards);
        if (d.certifications) setCertifications(d.certifications);
        if (d.extracurriculars) setExtracurriculars(d.extracurriculars);
        if (d.volunteering) setVolunteering(d.volunteering);
        if (d.layoutStyle) setLayoutStyle(d.layoutStyle);
        if (d.columnPref) setColumnPref(d.columnPref);
        if (d.tone) setTone(d.tone);
      } catch {}
    }
  }, [isCV]);

  useEffect(() => {
    if (!isCV) return;
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getAllData()));
    }, 500);
    return () => clearTimeout(timer);
  }, [isCV, getAllData]);

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

  // Non-CV services: simple form
  if (!isCV) {
    return <SimpleServiceForm service={service} serviceId={serviceId!} />;
  }

  const progress = showReview ? 100 : Math.round(((currentSection + 1) / 7) * 100);

  const addExperience = () => {
    if (experiences.length < 5) setExperiences([...experiences, { ...emptyExperience }]);
  };

  const removeExperience = (idx: number) => {
    setExperiences(experiences.filter((_, i) => i !== idx));
  };

  const updateExperience = (idx: number, field: keyof ExperienceEntry, value: string) => {
    const updated = [...experiences];
    updated[idx] = { ...updated[idx], [field]: value };
    setExperiences(updated);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: svc } = await supabase
        .from('services')
        .select('id')
        .eq('name', 'CV')
        .eq('category', 'foundation')
        .maybeSingle();

      const notes = JSON.stringify(getAllData());

      const { error } = await supabase.from('submissions').insert({
        user_id: user.id,
        service_id: svc?.id || null,
        stage: 'submitted',
        submitted_at: new Date().toISOString(),
        notes,
      });

      if (error) throw error;
      localStorage.removeItem(STORAGE_KEY);
      toast.success('CV submission received! Track progress in your submissions.');
      navigate('/foundation/submissions');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (currentSection < 6) setCurrentSection(currentSection + 1);
    else setShowReview(true);
  };

  const goBack = () => {
    if (showReview) { setShowReview(false); return; }
    if (currentSection > 0) setCurrentSection(currentSection - 1);
  };

  return (
    <div className="px-5 py-6 space-y-5">
      <button onClick={() => navigate('/foundation')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to services
      </button>

      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{service.label} Optimisation</h1>
        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
        <p className="text-lg font-semibold text-primary mt-2">€{(service.price / 100).toFixed(2)}</p>
      </section>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{showReview ? 'Review' : `Section ${currentSection + 1} of 7 — ${SECTION_TITLES[currentSection]}`}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {showReview ? (
        <ReviewScreen
          data={getAllData()}
          onEdit={(section: number) => { setShowReview(false); setCurrentSection(section); }}
          onSubmit={handleSubmit}
          submitting={submitting}
          price={service.price}
        />
      ) : (
        <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
          <CardContent className="p-5 space-y-4">
            <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">{SECTION_TITLES[currentSection]}</h2>

            {currentSection === 0 && (
              <>
                <Field label="Full Name" placeholder="e.g. Aoife Murphy" value={fullName} onChange={setFullName} />
                <Field label="Phone Number" placeholder="e.g. 083 123 4567" value={phone} onChange={setPhone} />
                <Field label="Location" placeholder="e.g. Dublin, Ireland" value={location} onChange={setLocation} />
                <Field label="LinkedIn URL" placeholder="e.g. linkedin.com/in/aoifemurphy" value={linkedinUrl} onChange={setLinkedinUrl} />
              </>
            )}

            {currentSection === 1 && (
              <>
                <Field label="Target Job Title" placeholder="e.g. Graduate Software Engineer" value={targetTitle} onChange={setTargetTitle} />
                <Field label="Target Industry" placeholder="e.g. Technology, Finance, Healthcare" value={targetIndustry} onChange={setTargetIndustry} />
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground">Target Companies (up to 3)</Label>
                  {targetCompanies.map((c, i) => (
                    <Input key={i} placeholder={`Company ${i + 1}`} value={c} onChange={(e) => {
                      const u = [...targetCompanies]; u[i] = e.target.value; setTargetCompanies(u);
                    }} />
                  ))}
                </div>
                <SelectField label="Career Level" value={careerLevel} onChange={setCareerLevel} options={[
                  { value: 'student', label: 'Student' },
                  { value: 'graduate', label: 'Graduate' },
                  { value: 'experienced', label: 'Experienced' },
                ]} placeholder="Select your career level" />
              </>
            )}

            {currentSection === 2 && (
              <>
                <Field label="Degree Title" placeholder="e.g. BSc Computer Science" value={degreeTitle} onChange={setDegreeTitle} />
                <Field label="University / College" placeholder="e.g. University College Dublin" value={university} onChange={setUniversity} />
                <Field label="Graduation Year" placeholder="e.g. 2026" value={gradYear} onChange={setGradYear} />
                <TextareaField label="Relevant Modules or Projects" placeholder="List key modules, final year project, or relevant coursework" value={modules} onChange={setModules} />
              </>
            )}

            {currentSection === 3 && (
              <>
                {experiences.map((exp, idx) => (
                  <div key={idx} className="space-y-3 pb-4 border-b border-border last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Role {idx + 1}</span>
                      {experiences.length > 1 && (
                        <button onClick={() => removeExperience(idx)} className="text-destructive hover:text-destructive/80 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <Field label="Company Name" placeholder="e.g. Deloitte Ireland" value={exp.company} onChange={(v) => updateExperience(idx, 'company', v)} />
                    <Field label="Job Title" placeholder="e.g. Marketing Intern" value={exp.jobTitle} onChange={(v) => updateExperience(idx, 'jobTitle', v)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start Date" placeholder="e.g. Jun 2024" value={exp.startDate} onChange={(v) => updateExperience(idx, 'startDate', v)} />
                      <Field label="End Date" placeholder="e.g. Aug 2024 or Present" value={exp.endDate} onChange={(v) => updateExperience(idx, 'endDate', v)} />
                    </div>
                    <TextareaField label="Key Responsibilities" placeholder="List main duties, one per line" value={exp.responsibilities} onChange={(v) => updateExperience(idx, 'responsibilities', v)} />
                    <TextareaField label="Key Achievements" placeholder="Measurable results or highlights" value={exp.achievements} onChange={(v) => updateExperience(idx, 'achievements', v)} />
                  </div>
                ))}
                {experiences.length < 5 && (
                  <Button variant="outline" onClick={addExperience} className="w-full rounded-xl">
                    <Plus className="h-4 w-4 mr-2" /> Add Another Role
                  </Button>
                )}
              </>
            )}

            {currentSection === 4 && (
              <>
                <TextareaField label="Technical Skills" placeholder="e.g. Python, Excel, Figma, SQL, Data Analysis" value={technicalSkills} onChange={setTechnicalSkills} />
                <TextareaField label="Soft Skills" placeholder="e.g. Communication, Leadership, Teamwork, Problem Solving" value={softSkills} onChange={setSoftSkills} />
                <TextareaField label="Languages Spoken" placeholder="e.g. English (native), Irish (conversational), Spanish (basic)" value={languages} onChange={setLanguages} />
              </>
            )}

            {currentSection === 5 && (
              <>
                <TextareaField label="Awards & Scholarships" placeholder="e.g. Dean's List 2024, Entrance Scholar" value={awards} onChange={setAwards} />
                <TextareaField label="Certifications" placeholder="e.g. Google Analytics Certified, First Aid" value={certifications} onChange={setCertifications} />
                <TextareaField label="Extracurricular Activities" placeholder="e.g. Debating Society President, GAA Club" value={extracurriculars} onChange={setExtracurriculars} />
                <TextareaField label="Volunteering" placeholder="e.g. SUAS Mentoring, SVP volunteer" value={volunteering} onChange={setVolunteering} />
              </>
            )}

            {currentSection === 6 && (
              <>
                <SelectField label="Layout Style" value={layoutStyle} onChange={setLayoutStyle} options={[
                  { value: 'modern', label: 'Modern' },
                  { value: 'traditional', label: 'Traditional' },
                  { value: 'creative', label: 'Creative' },
                ]} placeholder="Choose a layout style" />
                <SelectField label="Column Preference" value={columnPref} onChange={setColumnPref} options={[
                  { value: 'one-column', label: 'One Column' },
                  { value: 'two-column', label: 'Two Column' },
                ]} placeholder="Choose column layout" />
                <SelectField label="Tone" value={tone} onChange={setTone} options={[
                  { value: 'formal', label: 'Formal' },
                  { value: 'conversational', label: 'Conversational' },
                ]} placeholder="Choose tone of voice" />
              </>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              {currentSection > 0 && (
                <Button variant="outline" onClick={goBack} className="flex-1 rounded-xl">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              )}
              <Button onClick={goNext} className="flex-1 rounded-xl">
                {currentSection === 6 ? 'Review' : 'Next'} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">Auto-saved locally</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper components
const Field = ({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <Label className="text-sm text-foreground">{label}</Label>
    <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const TextareaField = ({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <Label className="text-sm text-foreground">{label}</Label>
    <Textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
  </div>
);

const SelectField = ({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string }) => (
  <div className="space-y-1.5">
    <Label className="text-sm text-foreground">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="rounded-md">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

// Review screen
const ReviewScreen = ({ data, onEdit, onSubmit, submitting, price }: { data: any; onEdit: (s: number) => void; onSubmit: () => void; submitting: boolean; price: number }) => {
  const sections = [
    { title: 'Personal Info', items: [['Name', data.fullName], ['Phone', data.phone], ['Location', data.location], ['LinkedIn', data.linkedinUrl]] },
    { title: 'Target Role', items: [['Job Title', data.targetTitle], ['Industry', data.targetIndustry], ['Companies', data.targetCompanies?.filter(Boolean).join(', ')], ['Level', data.careerLevel]] },
    { title: 'Education', items: [['Degree', data.degreeTitle], ['University', data.university], ['Grad Year', data.gradYear], ['Modules', data.modules]] },
    { title: 'Experience', items: data.experiences?.map((e: any, i: number) => [`Role ${i + 1}`, `${e.jobTitle} at ${e.company}`]) || [] },
    { title: 'Skills', items: [['Technical', data.technicalSkills], ['Soft Skills', data.softSkills], ['Languages', data.languages]] },
    { title: 'Achievements', items: [['Awards', data.awards], ['Certs', data.certifications], ['Activities', data.extracurriculars], ['Volunteering', data.volunteering]] },
    { title: 'Style', items: [['Layout', data.layoutStyle], ['Columns', data.columnPref], ['Tone', data.tone]] },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">Review Your Details</h2>
      {sections.map((sec, idx) => (
        <Card key={idx} className="rounded-xl border-[1.5px] border-accent dark:border-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">{sec.title}</h3>
              <button onClick={() => onEdit(idx)} className="text-xs text-primary hover:underline">Edit</button>
            </div>
            <div className="space-y-1">
              {sec.items.map(([label, val]: any, i: number) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-muted-foreground w-24 shrink-0">{label}:</span>
                  <span className="text-foreground">{val || '—'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

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

      <Button onClick={onSubmit} disabled={submitting} className="w-full py-3 rounded-xl font-medium">
        <Check className="h-4 w-4 mr-2" />
        {submitting ? 'Submitting...' : `Submit & Pay €${(price / 100).toFixed(2)}`}
      </Button>
    </div>
  );
};

// Simple form for non-CV services
const SimpleServiceForm = ({ service, serviceId }: { service: { label: string; description: string; price: number }; serviceId: string }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: svc } = await supabase
        .from('services')
        .select('id')
        .eq('name', service.label)
        .eq('category', 'foundation')
        .maybeSingle();

      const { error } = await supabase.from('submissions').insert({
        user_id: user.id,
        service_id: svc?.id || null,
        stage: 'submitted',
        submitted_at: new Date().toISOString(),
        notes,
      });

      if (error) throw error;
      toast.success('Submission received!');
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
        <CardContent className="p-5 space-y-4">
          <TextareaField label="Tell us about your needs" placeholder="Describe what you're looking for, your goals, and any relevant details..." value={notes} onChange={setNotes} />
        </CardContent>
      </Card>
      <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground text-sm">Payment</p>
              <p className="text-xs text-muted-foreground">Stripe Elements — coming in Phase 5</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={handleSubmit} disabled={submitting} className="w-full py-3 rounded-xl font-medium">
        {submitting ? 'Submitting...' : `Submit & Pay €${(service.price / 100).toFixed(2)}`}
      </Button>
    </div>
  );
};

export default ServiceDetailPage;
