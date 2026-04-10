import { Card, CardContent } from '@/components/ui/card';
import { Users, Briefcase, BookOpen, MessageSquare, Calendar, Star, ArrowRight } from 'lucide-react';

const sections = [
  { id: 'directory', label: 'Student Directory', description: 'Find students across Ireland', icon: Users },
  { id: 'projects', label: 'Project Collaboration', description: 'Cross-campus project board', icon: Briefcase },
  { id: 'resources', label: 'Resource Finder', description: 'Shared academic resources', icon: BookOpen },
  { id: 'industry', label: 'Industry Discussions', description: 'Talk about your field', icon: MessageSquare },
  { id: 'events', label: 'Events', description: 'Upcoming student events', icon: Calendar },
  { id: 'reviews', label: 'Cross-Ireland Reviews', description: 'Compare colleges nationwide', icon: Star },
];

const CourseConnectPage = () => {
  return (
    <div className="px-5 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Course Connect</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect with students across Ireland.</p>
      </section>

      <section className="space-y-3">
        {sections.map((section) => (
          <Card key={section.id} className="rounded-xl border-[1.5px] border-accent dark:border-white hover:bg-secondary transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <section.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{section.label}</p>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </section>

      <p className="text-xs text-muted-foreground text-center">Full directory and boards — coming soon</p>
    </div>
  );
};

export default CourseConnectPage;
