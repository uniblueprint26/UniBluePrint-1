import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Megaphone, Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_url: string | null;
  active: boolean | null;
  created_at: string | null;
}

const AdsPage = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'all' | 'campus'>('all');
  const [ads, setAds] = useState<Ad[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAd, setNewAd] = useState({ title: '', description: '', target_url: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      setAds((data as Ad[]) || []);
    };
    fetchAds();
  }, []);

  const handleCreate = async () => {
    if (!user || !newAd.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('ads').insert({
      title: newAd.title,
      description: newAd.description || null,
      target_url: newAd.target_url || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Ad submitted for review');
      setNewAd({ title: '', description: '', target_url: '' });
      setShowCreate(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="px-5 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Advertisement Board</h1>
        <p className="text-sm text-muted-foreground mt-1">Deals and opportunities for students.</p>
      </section>

      <Tabs value={view} onValueChange={(v) => setView(v as 'all' | 'campus')}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="all">All Ireland</TabsTrigger>
          <TabsTrigger value="campus">My Campus</TabsTrigger>
        </TabsList>
      </Tabs>

      <Button
        variant="outline"
        className="w-full rounded-xl"
        onClick={() => setShowCreate(!showCreate)}
      >
        <Plus className="h-4 w-4 mr-2" /> Post an Ad
      </Button>

      {showCreate && (
        <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Title</Label>
              <Input
                placeholder="Ad title"
                value={newAd.title}
                onChange={(e) => setNewAd((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Description</Label>
              <Textarea
                placeholder="Describe your offer..."
                value={newAd.description}
                onChange={(e) => setNewAd((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Link (optional)</Label>
              <Input
                placeholder="https://..."
                value={newAd.target_url}
                onChange={(e) => setNewAd((p) => ({ ...p, target_url: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={submitting} className="flex-1 rounded-xl">
                {submitting ? 'Submitting...' : 'Submit Ad'}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="rounded-xl">Cancel</Button>
            </div>
            <p className="text-xs text-muted-foreground">Free tier. Paid promoted listings coming soon.</p>
          </CardContent>
        </Card>
      )}

      {/* Ads list */}
      <div className="space-y-3">
        {ads.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No ads posted yet. Be the first!</p>
        )}
        {ads.map((ad) => (
          <Card key={ad.id} className="rounded-xl border-[1.5px] border-accent dark:border-white">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{ad.title}</p>
                  {ad.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ad.description}</p>}
                </div>
                {ad.target_url && (
                  <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdsPage;
