import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingDown, TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

type BudgetMode = 'spending' | 'saving' | 'balanced';

const categories = ['Rent', 'Food', 'Transport', 'Entertainment', 'Education', 'Health', 'Subscriptions', 'Other'];

interface BudgetEntry {
  id: string;
  type: string;
  amount_cents: number;
  category: string | null;
  description: string | null;
  date: string | null;
  mode: string | null;
}

const BudgetPage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<BudgetMode>('balanced');
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: 'expense', amount: '', category: 'Food', description: '' });

  useEffect(() => {
    if (!user) return;
    const fetchEntries = async () => {
      const { data } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      setEntries((data as BudgetEntry[]) || []);
    };
    fetchEntries();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !newEntry.amount) return;
    const amountCents = Math.round(parseFloat(newEntry.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const { data, error } = await supabase.from('budget_entries').insert({
      user_id: user.id,
      type: newEntry.type,
      amount_cents: amountCents,
      category: newEntry.type === 'expense' ? newEntry.category : null,
      description: newEntry.description || null,
      date: new Date().toISOString().split('T')[0],
      mode,
    }).select().single();

    if (error) {
      toast.error(error.message);
      return;
    }

    setEntries((prev) => [data as BudgetEntry, ...prev]);
    setNewEntry({ type: 'expense', amount: '', category: 'Food', description: '' });
    setShowAdd(false);
    toast.success('Entry added');
  };

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const { totalIncome, totalExpense, weeklyExpense } = useMemo(() => {
    let inc = 0, exp = 0, wExp = 0;
    entries.forEach((e) => {
      if (e.type === 'income') inc += e.amount_cents;
      else {
        exp += e.amount_cents;
        if (e.date && isWithinInterval(new Date(e.date), { start: weekStart, end: weekEnd })) {
          wExp += e.amount_cents;
        }
      }
    });
    return { totalIncome: inc, totalExpense: exp, weeklyExpense: wExp };
  }, [entries, weekStart, weekEnd]);

  const balance = totalIncome - totalExpense;

  const modeDescriptions: Record<BudgetMode, string> = {
    spending: 'Track where your money goes. Focus on categorising and controlling expenses.',
    saving: 'Set saving goals first, then allocate what remains for spending.',
    balanced: 'Equal focus on income, expenses, and savings for a complete picture.',
  };

  return (
    <div className="px-5 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Budgeting Tool</h1>
        <p className="text-sm text-muted-foreground mt-1">Take control of your finances.</p>
      </section>

      {/* Mode selector */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as BudgetMode)}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="saving">Saving</TabsTrigger>
          <TabsTrigger value="balanced">Balanced</TabsTrigger>
        </TabsList>
        <TabsContent value={mode}>
          <p className="text-xs text-muted-foreground mt-2">{modeDescriptions[mode]}</p>
        </TabsContent>
      </Tabs>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Income</span>
            </div>
            <p className="text-lg font-bold text-foreground">€{(totalIncome / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Expenses</span>
            </div>
            <p className="text-lg font-bold text-foreground">€{(totalExpense / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Balance</span>
            </div>
            <p className={`text-lg font-bold ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              €{(balance / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">This Week</span>
            </div>
            <p className="text-lg font-bold text-foreground">€{(weeklyExpense / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add entry */}
      {!showAdd ? (
        <Button onClick={() => setShowAdd(true)} className="w-full rounded-xl" variant="outline">
          <Plus className="h-4 w-4 mr-2" /> Add Entry
        </Button>
      ) : (
        <Card className="rounded-xl border-[1.5px] border-accent dark:border-white">
          <CardContent className="p-5 space-y-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={newEntry.type === 'income' ? 'default' : 'outline'}
                onClick={() => setNewEntry((p) => ({ ...p, type: 'income' }))}
              >
                Income
              </Button>
              <Button
                size="sm"
                variant={newEntry.type === 'expense' ? 'default' : 'outline'}
                onClick={() => setNewEntry((p) => ({ ...p, type: 'expense' }))}
              >
                Expense
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Amount (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newEntry.amount}
                onChange={(e) => setNewEntry((p) => ({ ...p, amount: e.target.value }))}
              />
            </div>

            {newEntry.type === 'expense' && (
              <div className="space-y-1.5">
                <Label className="text-sm">Category</Label>
                <Select value={newEntry.category} onValueChange={(v) => setNewEntry((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm">Description (optional)</Label>
              <Input
                placeholder="What was this for?"
                value={newEntry.description}
                onChange={(e) => setNewEntry((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAdd} className="flex-1 rounded-xl">Save</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)} className="rounded-xl">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent entries */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Recent Entries</h2>
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No entries yet. Add your first one above.</p>
        )}
        <div className="space-y-2">
          {entries.slice(0, 20).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {entry.type === 'income' ? '+ Income' : entry.category || 'Expense'}
                </p>
                {entry.description && <p className="text-xs text-muted-foreground">{entry.description}</p>}
                {entry.date && <p className="text-xs text-muted-foreground">{format(new Date(entry.date), 'dd MMM yyyy')}</p>}
              </div>
              <p className={`text-sm font-semibold ${entry.type === 'income' ? 'text-green-600' : 'text-foreground'}`}>
                {entry.type === 'income' ? '+' : '-'}€{(entry.amount_cents / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BudgetPage;
