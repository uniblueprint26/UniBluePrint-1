import { Outlet } from 'react-router-dom';

const OperationsLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
            <span className="text-destructive-foreground font-bold text-sm">OP</span>
          </div>
          <span className="font-semibold text-foreground text-lg tracking-tight">Operations</span>
        </div>
      </header>
      <main className="p-5">
        <Outlet />
      </main>
    </div>
  );
};

export default OperationsLayout;
