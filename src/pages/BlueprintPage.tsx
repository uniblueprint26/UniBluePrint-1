import { useNavigate } from 'react-router-dom';
import { FileText, TrendingUp } from 'lucide-react';

const BlueprintPage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-5 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Blueprint</h1>
      <p className="text-sm text-muted-foreground">Choose your path.</p>
      <div className="space-y-3">
        <button onClick={() => navigate('/foundation')} className="w-full flex items-center gap-4 p-5 rounded-xl bg-card border border-border text-left hover:bg-secondary transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Foundation Blueprint</p>
            <p className="text-sm text-muted-foreground">Build the essentials</p>
          </div>
        </button>
        <button onClick={() => navigate('/elevation')} className="w-full flex items-center gap-4 p-5 rounded-xl bg-card border border-border text-left hover:bg-secondary transition-colors">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Elevation Blueprint</p>
            <p className="text-sm text-muted-foreground">Take it further</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default BlueprintPage;
