import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, BookOpen, MessageSquare, Calendar, Star, ArrowRight } from 'lucide-react';

const sections = [
  { id: 'directory', label: 'Student Directory', description: 'Find students across Ireland', icon: Users, feed: false },
  { id: 'projects', label: 'Project Collaboration', description: 'Cross-campus project board', icon: Briefcase, feed: true },
  { id: 'resources', label: 'Resource Finder', description: 'Shared academic resources', icon: BookOpen, feed: true },
  { id: 'industry', label: 'Industry Discussions', description: 'Talk about your field', icon: MessageSquare, feed: true },
  { id: 'events', label: 'Events', description: 'Upcoming student events', icon: Calendar, feed: true },
  { id: 'reviews', label: 'Cross-Ireland Reviews', description: 'Compare colleges nationwide', icon: Star, feed: true },
];

const CourseConnectPage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-5 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Course Connect</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect with students across Ireland.</p>
      </section>

      <section className="space-y-3">
        {sections.map((section) =>
          section.feed ? (
            <button
              key={section.id}
              onClick={() => navigate(`/connect/course/${section.id}`)}
              className="w-full accent-card hover:bg-secondary transition-colors text-left"
            >
              <div className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 icon-chip shrink-0">
                  <section.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{section.label}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </button>
          ) : (
            <div key={section.id} className="accent-card opacity-70">
              <div className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 icon-chip shrink-0">
                  <section.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{section.label}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">
                  Soon
                </span>
              </div>
            </div>
          )
        )}
      </section>
    </div>
  );
};

export default CourseConnectPage;
