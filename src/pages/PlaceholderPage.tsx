import { Hammer } from 'lucide-react';

const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
  <div className="px-5 py-6">
    <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">{title}</h1>
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl bg-card border border-border">
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Hammer className="h-5 w-5 text-primary" />
      </div>
      <p className="text-base font-semibold text-foreground">Coming soon</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
    </div>
  </div>
);

export default PlaceholderPage;
