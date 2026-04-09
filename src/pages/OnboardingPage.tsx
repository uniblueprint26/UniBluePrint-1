import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const userTypes = [
  'University Student',
  '5th Year',
  '6th Year',
  'Apprentice',
  'Young Worker',
  'Other Young Person',
];

const notificationCategories = [
  { key: 'blueprint_alerts', label: 'Blueprint Alerts', desc: 'Updates on your submissions and reviews' },
  { key: 'budget_alerts', label: 'Budget Alerts', desc: 'Spending and saving notifications' },
  { key: 'ad_alerts', label: 'Ad Alerts', desc: 'New advertisements relevant to you' },
  { key: 'connect_alerts', label: 'Connect Alerts', desc: 'Campus and course activity' },
  { key: 'promotional_alerts', label: 'Promotional Alerts', desc: 'Deals and partner offers' },
  { key: 'security_alerts', label: 'Security Alerts', desc: 'Account security updates' },
];

const OnboardingPage = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');

  // Step 2
  const [userType, setUserType] = useState('');

  // Step 3
  const [personalEmail, setPersonalEmail] = useState('');
  const [universityEmail, setUniversityEmail] = useState('');
  const [deliveryPreference, setDeliveryPreference] = useState('primary');

  // Step 4
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationCategories.map(c => [c.key, true]))
  );

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        if (data.onboarding_step) setStep(data.onboarding_step);
        if (data.full_name) setFullName(data.full_name);
        if (data.date_of_birth) setDob(data.date_of_birth);
        if (data.user_type) setUserType(data.user_type);
        if (data.personal_email) setPersonalEmail(data.personal_email);
        if (data.university_email) setUniversityEmail(data.university_email);
        if (data.delivery_preference) setDeliveryPreference(data.delivery_preference);
      }
    };
    loadProgress();
  }, [user]);

  const saveProgress = async (data: Record<string, any>, nextStep: number) => {
    if (!user) return;
    setLoading(true);
    await supabase
      .from('profiles')
      .update({ ...data, onboarding_step: nextStep })
      .eq('id', user.id);
    setStep(nextStep);
    setLoading(false);
  };

  const handleStep1 = () => {
    if (!fullName.trim() || !dob) return;
    saveProgress({ full_name: fullName.trim(), date_of_birth: dob }, 2);
  };

  const handleStep2 = () => {
    if (!userType) return;
    saveProgress({ user_type: userType }, 3);
  };

  const handleStep3 = () => {
    saveProgress({
      personal_email: personalEmail || null,
      university_email: universityEmail || null,
      delivery_preference: deliveryPreference,
    }, 4);
  };

  const handleStep4 = async () => {
    if (!user) return;
    setLoading(true);
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true, onboarding_step: 4 })
      .eq('id', user.id);
    await refreshProfile();
    navigate('/home');
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Set Up Your Blueprint</h1>
          <span className="text-sm text-muted-foreground">Step {step} of 4</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Basic Information</h2>
              <p className="text-sm text-muted-foreground">Tell us who you are.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="rounded-lg" />
              </div>
            </div>
            <Button onClick={handleStep1} className="w-full rounded-lg h-11 font-semibold" disabled={!fullName.trim() || !dob || loading}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Your Status</h2>
              <p className="text-sm text-muted-foreground">Where are you in your journey?</p>
            </div>
            <div className="grid gap-3">
              {userTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setUserType(type)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all text-sm font-medium",
                    userType === type
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/30"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-lg flex-1">Back</Button>
              <Button onClick={handleStep2} className="rounded-lg flex-1 font-semibold" disabled={!userType || loading}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Your Connections</h2>
              <p className="text-sm text-muted-foreground">How should we reach you?</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Personal Email (optional)</Label>
                <Input value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} placeholder="personal@email.com" className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>University or Work Email (optional)</Label>
                <Input value={universityEmail} onChange={(e) => setUniversityEmail(e.target.value)} placeholder="you@university.ie" className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>Delivery Preference</Label>
                <div className="flex gap-3">
                  {['primary', 'personal', 'university'].map((pref) => (
                    <button
                      key={pref}
                      onClick={() => setDeliveryPreference(pref)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-all",
                        deliveryPreference === pref
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-lg flex-1">Back</Button>
              <Button onClick={handleStep3} className="rounded-lg flex-1 font-semibold" disabled={loading}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground">Stay informed, stay ahead.</p>
            </div>
            <div className="space-y-3">
              {notificationCategories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setNotifications(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    notifications[cat.key]
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="rounded-lg flex-1">Back</Button>
              <Button onClick={handleStep4} className="rounded-lg flex-1 font-semibold" disabled={loading}>
                Confirm &amp; Launch Your Blueprint
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
