import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Clock, Users, Eye, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type SubmissionStage = 'submitted' | 'in_queue' | 'assigned' | 'in_review' | 'delivered';

interface Submission {
  id: string;
  stage: SubmissionStage | null;
  notes: string | null;
  submitted_at: string | null;
  in_queue_at: string | null;
  assigned_at: string | null;
  in_review_at: string | null;
  delivered_at: string | null;
  created_at: string | null;
  service_id: string | null;
}

const stages: { key: SubmissionStage; label: string; icon: React.ElementType }[] = [
  { key: 'submitted', label: 'Submitted', icon: CheckCircle2 },
  { key: 'in_queue', label: 'In Queue', icon: Clock },
  { key: 'assigned', label: 'Assigned', icon: Users },
  { key: 'in_review', label: 'In Review', icon: Eye },
  { key: 'delivered', label: 'Delivered', icon: Package },
];

const stageTimestampKey: Record<SubmissionStage, keyof Submission> = {
  submitted: 'submitted_at',
  in_queue: 'in_queue_at',
  assigned: 'assigned_at',
  in_review: 'in_review_at',
  delivered: 'delivered_at',
};

const SubmissionTracker = ({ submission }: { submission: Submission }) => {
  const currentStage = submission.stage || 'submitted';
  const currentIndex = stages.findIndex((s) => s.key === currentStage);

  return (
    <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
      <CardContent className="p-5">
        {/* Parse service name from notes */}
        <h3 className="font-semibold text-foreground text-sm mb-4">
          Submission #{submission.id.slice(0, 8)}
        </h3>

        <div className="space-y-0">
          {stages.map((stage, idx) => {
            const isActive = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const timestampField = stageTimestampKey[stage.key];
            const timestamp = submission[timestampField] as string | null;

            return (
              <div key={stage.key} className="flex items-start gap-3">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <stage.icon className="h-4 w-4" />
                  </div>
                  {idx < stages.length - 1 && (
                    <div
                      className={`w-0.5 h-8 ${
                        isActive ? 'bg-primary/30' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>

                {/* Label + timestamp */}
                <div className="pt-1 pb-4">
                  <p
                    className={`text-sm font-medium ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {stage.label}
                  </p>
                  {timestamp && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(timestamp), 'dd MMM yyyy, HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const SubmissionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSubmissions((data as Submission[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="px-5 py-6 space-y-6">
      <button
        onClick={() => navigate('/foundation')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to services
      </button>

      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">My Submissions</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your Foundation Blueprint orders.</p>
      </section>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!loading && submissions.length === 0 && (
        <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
            <button
              onClick={() => navigate('/foundation')}
              className="text-sm font-medium text-primary hover:underline mt-2"
            >
              Browse services →
            </button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {submissions.map((sub) => (
          <SubmissionTracker key={sub.id} submission={sub} />
        ))}
      </div>
    </div>
  );
};

export default SubmissionsPage;
