import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import ubpLogo from '@/assets/ubp-logo-transparent.png';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      setError(
        (error.message || '').toLowerCase().includes('session')
          ? 'This reset link has expired or is invalid. Request a new one from the sign-in page.'
          : error.message
      );
      return;
    }
    toast.success('Password updated. You are now signed in.');
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <img src={ubpLogo} alt="UniBluePrint" className="h-16 w-auto mx-auto" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Set a new password</h1>
            <p className="text-sm text-muted-foreground">Choose a password to secure your Blueprint.</p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border/60 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a new password"
                required
                minLength={6}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your new password"
                required
                minLength={6}
                className="rounded-lg"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full rounded-lg h-11 font-semibold" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </Button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
