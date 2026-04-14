import { useNavigate } from 'react-router-dom';
import { PieChart, Megaphone } from 'lucide-react';

const MorePage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-5 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">More</h1>
      <p className="text-sm text-muted-foreground">Additional tools and features.</p>
      <div className="space-y-3">
        <button onClick={() => navigate('/budget')} className="w-full flex items-center gap-4 p-5 accent-card text-left hover:bg-secondary transition-colors">
          <div className="w-12 h-12 rounded-xl icon-chip">
            <PieChart className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Budgeting Tool</p>
            <p className="text-sm text-muted-foreground">Spending Based · Saving Based · Balanced</p>
          </div>
        </button>
        <button onClick={() => navigate('/ads')} className="w-full flex items-center gap-4 p-5 accent-card text-left hover:bg-secondary transition-colors">
          <div className="w-12 h-12 rounded-xl icon-chip">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Advertisement Board</p>
            <p className="text-sm text-muted-foreground">Deals and opportunities</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default MorePage;
