import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Lightbulb, BookOpen, CreditCard, Star, Car, Search, MessageCircle, ArrowRight } from 'lucide-react';

const boards = [
  { id: 'projects', label: 'Project Collaboration', description: 'Find teammates for projects', icon: MessageSquare },
  { id: 'problems', label: 'Problems & Solutions', description: 'Ask and answer questions', icon: Lightbulb },
  { id: 'notes', label: 'Shared Notes', description: 'Share and find lecture notes', icon: BookOpen },
  { id: 'subscriptions', label: 'Shared Subscriptions', description: 'Split subscription costs', icon: CreditCard },
  { id: 'reviews', label: 'College Reviews', description: 'Rate and review your college', icon: Star },
  { id: 'carpool', label: 'Carpool', description: 'Find rides to campus', icon: Car },
  { id: 'lost-found', label: 'Lost & Found', description: 'Report or find lost items', icon: Search },
  { id: 'suggestions', label: 'Campus Suggestions', description: 'Suggest improvements', icon: MessageCircle },
];

const CampusPage = () => {
  return (
    <div className="px-5 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Campus Connect</h1>
        <p className="text-sm text-muted-foreground mt-1">Your campus community.</p>
      </section>

      <section className="space-y-3">
        {boards.map((board) => (
          <Card key={board.id} className="rounded-xl border-[1.5px] border-accent dark:border-white hover:bg-secondary transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-11 h-11 icon-chip shrink-0">
                <board.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{board.label}</p>
                <p className="text-xs text-muted-foreground">{board.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </section>

      <p className="text-xs text-muted-foreground text-center">Board feeds and post creation — coming in Phase 3</p>
    </div>
  );
};

export default CampusPage;
