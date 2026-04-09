const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
  <div className="px-5 py-6 space-y-2">
    <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
    <p className="text-sm text-muted-foreground">{description}</p>
    <div className="mt-8 flex items-center justify-center py-16">
      <p className="text-muted-foreground text-sm">Coming in Phase 2</p>
    </div>
  </div>
);

export default PlaceholderPage;
