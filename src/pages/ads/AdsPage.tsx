import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Plus, ExternalLink, Image, Paperclip } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AD_CATEGORIES = [
  'All', 'My Campus', 'All Ireland', 'Jobs', 'Social', 'Sport',
  'Course Specific', 'Services', 'Second Hand', 'Events', 'Other',
];

const PRICE_OPTIONS = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'free', label: 'Free' },
  { value: 'contact', label: 'Contact for Price' },
];

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
  const [activeFilter, setActiveFilter] = useState('All');
  const [ads, setAds] = useState<Ad[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAd, setNewAd] = useState({
    title: '', category: '', description: '', priceType: '', priceAmount: '', target_url: '',
  });
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
    if (!newAd.category) {
      toast.error('Please select a category');
      return;
    }
    setSubmitting(true);

    let priceStr = '';
    if (newAd.priceType === 'free') priceStr = 'Free';
    else if (newAd.priceType === 'contact') priceStr = 'Contact for price';
    else if (newAd.priceType === 'fixed') priceStr = `€${newAd.priceAmount}`;

    const desc = [
      newAd.description,
      priceStr ? `Price: ${priceStr}` : '',
      newAd.category ? `Category: ${newAd.category}` : '',
    ].filter(Boolean).join('\n');

    const { error } = await supabase.from('ads').insert({
      title: newAd.title,
      description: desc || null,
      target_url: newAd.target_url || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Ad submitted for review');
      setNewAd({ title: '', category: '', description: '', priceType: '', priceAmount: '', target_url: '' });
      setShowCreate(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="px-5 py-6 space-y-5">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Advertisement Board</h1>
        <p className="text-sm text-muted-foreground mt-1">Deals and opportunities for students.</p>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {AD_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeFilter === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-accent dark:border-white hover:bg-secondary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full rounded-xl border-[1.5px] border-accent dark:border-white"
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
                placeholder="e.g. Selling textbooks, Study group wanted"
                value={newAd.title}
                onChange={(e) => setNewAd((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Category</Label>
              <Select value={newAd.category} onValueChange={(v) => setNewAd((p) => ({ ...p, category: v }))}>
                <SelectTrigger className="rounded-md">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {AD_CATEGORIES.filter(c => c !== 'All').map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Description</Label>
              <Textarea
                placeholder="Describe what you're offering or looking for..."
                value={newAd.description}
                onChange={(e) => setNewAd((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Price</Label>
              <Select value={newAd.priceType} onValueChange={(v) => setNewAd((p) => ({ ...p, priceType: v }))}>
                <SelectTrigger className="rounded-md">
                  <SelectValue placeholder="Select pricing" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newAd.priceType === 'fixed' && (
                <Input
                  type="number"
                  placeholder="Enter amount in €"
                  value={newAd.priceAmount}
                  onChange={(e) => setNewAd((p) => ({ ...p, priceAmount: e.target.value }))}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Photos (up to 5, max 10MB each)</Label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-accent dark:border-white rounded-xl p-4 justify-center">
                <Image className="h-4 w-4" />
                <span>Photo uploads — coming soon</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">External Link (optional)</Label>
              <Input
                placeholder="https://..."
                value={newAd.target_url}
                onChange={(e) => setNewAd((p) => ({ ...p, target_url: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">File Attachment (optional)</Label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-accent dark:border-white rounded-xl p-4 justify-center">
                <Paperclip className="h-4 w-4" />
                <span>File attachments — coming soon</span>
              </div>
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

      <div className="space-y-3">
        {ads.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No ads posted yet. Be the first!</p>
        )}
        {ads.map((ad) => (
          <Card key={ad.id} className="rounded-xl border-[1.5px] border-accent dark:border-white">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 icon-chip shrink-0">
                  <Megaphone className="h-5 w-5" />
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
