import { useNavigate } from 'react-router-dom';
import { Users, BookOpen } from 'lucide-react';

const ConnectPage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-5 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Connect</h1>
      <p className="text-sm text-muted-foreground">Your campus and course network.</p>
      <div className="space-y-3">
        <button onClick={() => navigate('/campus')} className="w-full flex items-center gap-4 p-5 rounded-xl bg-card border border-border text-left hover:bg-secondary transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Campus Connect</p>
            <p className="text-sm text-muted-foreground">Your campus community</p>
          </div>
        </button>
        <button onClick={() => navigate('/connect/course')} className="w-full flex items-center gap-4 p-5 rounded-xl bg-card border border-border text-left hover:bg-secondary transition-colors">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Course Connect</p>
            <p className="text-sm text-muted-foreground">Course-specific groups</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ConnectPage;
