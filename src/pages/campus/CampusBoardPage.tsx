import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Trash2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Board {
  id: string;
  name: string;
  description: string | null;
}

interface Post {
  id: string;
  content: string;
  author_name: string | null;
  user_id: string;
  created_at: string | null;
}

const initials = (name?: string | null) =>
  (name || 'S').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const CampusBoardPage = () => {
  const { boardType } = useParams<{ boardType: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load board + its posts
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data: b } = await supabase
        .from('boards')
        .select('id,name,description')
        .eq('type', boardType)
        .maybeSingle();
      if (!active) return;
      if (!b) { setNotFound(true); setLoading(false); return; }
      setBoard(b as Board);
      const { data: p } = await supabase
        .from('posts')
        .select('id,content,author_name,user_id,created_at')
        .eq('board_id', b.id)
        .order('created_at', { ascending: false });
      if (!active) return;
      setPosts((p as Post[]) || []);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [boardType]);

  // Realtime: new + deleted posts on this board
  useEffect(() => {
    if (!board) return;
    const channel = supabase
      .channel(`posts:${board.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `board_id=eq.${board.id}` },
        (payload) => {
          const np = payload.new as Post;
          setPosts((prev) => (prev.some((p) => p.id === np.id) ? prev : [np, ...prev]));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts', filter: `board_id=eq.${board.id}` },
        (payload) => {
          const old = payload.old as { id: string };
          setPosts((prev) => prev.filter((p) => p.id !== old.id));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [board]);

  const handlePost = async () => {
    if (!user || !board || !content.trim()) return;
    setPosting(true);
    const { data, error } = await supabase
      .from('posts')
      .insert({
        board_id: board.id,
        user_id: user.id,
        content: content.trim(),
        author_name: profile?.full_name || 'Student',
      })
      .select('id,content,author_name,user_id,created_at')
      .single();
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    setContent('');
    if (data) setPosts((prev) => (prev.some((p) => p.id === data.id) ? prev : [data as Post, ...prev]));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="px-5 py-6 space-y-6">
      <button
        onClick={() => navigate('/campus')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Campus Connect
      </button>

      {notFound ? (
        <div className="accent-card">
          <div className="p-6 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">Board not found</p>
            <p className="text-xs text-muted-foreground">This board doesn't exist yet.</p>
          </div>
        </div>
      ) : (
        <>
          <section className="flex items-center gap-3">
            <div className="w-11 h-11 icon-chip shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{board?.name || 'Loading...'}</h1>
              {board?.description && <p className="text-sm text-muted-foreground">{board.description}</p>}
            </div>
          </section>

          {/* Composer */}
          <div className="bg-card rounded-xl shadow-sm border border-border/60 p-4 space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share something with your campus..."
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button onClick={handlePost} disabled={posting || !content.trim()} className="rounded-lg">
                <Send className="h-4 w-4 mr-2" />
                {posting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>

          {/* Feed */}
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : posts.length === 0 ? (
            <div className="accent-card">
              <div className="p-8 text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Your campus community is just getting started.</p>
                <p className="text-sm text-muted-foreground">Be the first to post.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="accent-card">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 icon-chip shrink-0 text-xs font-semibold">
                        {initials(post.author_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {post.author_name || 'Student'}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {post.created_at && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                              </span>
                            )}
                            {post.user_id === user?.id && (
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                aria-label="Delete post"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">{post.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CampusBoardPage;
