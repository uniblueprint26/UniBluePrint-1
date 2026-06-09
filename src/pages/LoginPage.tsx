import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import ubpLogo from '@/assets/ubp-logo-transparent.png';

type Mode = 'signin' | 'signup' | 'forgot';
type Sent = { type: 'confirm' | 'reset'; email: string } | null;

const LoginPage = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [sent, setSent] = useState<Sent>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword, resendConfirmation } = useAuth();
  const navigate = useNavigate();

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setShowResend(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email, password);
        if (error) { setError(error.message); return; }
        if (data?.session) {
          navigate('/onboarding'); // confirmation disabled → straight in
        } else {
          setSent({ type: 'confirm', email }); // email confirmation required
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) { setError(error.message); return; }
        setSent({ type: 'reset', email });
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          const notConfirmed =
            (error.message || '').toLowerCase().includes('not confirmed') ||
            error.code === 'email_not_confirmed';
          setError(
            notConfirmed
              ? "Your email isn't confirmed yet. Check your inbox for the confirmation link."
              : error.message
          );
          setShowResend(notConfirmed);
          return;
        }
        navigate('/home');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const target = sent?.email || email;
    if (!target) return;
    setLoading(true);
    setError('');
    const { error } =
      sent?.type === 'reset'
        ? await resetPassword(target)
        : await resendConfirmation(target);
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent({ type: sent?.type ?? 'confirm', email: target });
    setShowResend(false);
  };

  const submitLabel = loading
    ? 'Please wait...'
    : mode === 'signup'
      ? 'Create Your Blueprint'
      : mode === 'forgot'
        ? 'Send reset link'
        : 'Access Your Blueprint';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <img src={ubpLogo} alt="UniBluePrint" className="h-16 w-auto mx-auto" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">UniBluePrint</h1>
            <p className="text-sm text-muted-foreground">The Structure Behind Your Success</p>
          </div>
        </div>

        {sent ? (
          /* Check-your-email confirmation panel */
          <div className="bg-card rounded-xl shadow-sm border border-border/60 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                {sent.type === 'confirm' ? (
                  <>We sent a confirmation link to <span className="font-medium text-foreground">{sent.email}</span>. Open it to activate your Blueprint — you'll be signed in automatically.</>
                ) : (
                  <>We sent a password reset link to <span className="font-medium text-foreground">{sent.email}</span>. Follow it to set a new password.</>
                )}
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-3">
              <Button variant="outline" className="w-full rounded-lg" onClick={handleResend} disabled={loading}>
                {loading ? 'Sending...' : 'Resend email'}
              </Button>
              <button
                onClick={() => { setSent(null); switchMode('signin'); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to sign in
              </button>
            </div>
          </div>
        ) : (
          /* Form panel */
          <div className="bg-card rounded-xl shadow-sm border border-border/60 p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.ie"
                  required
                  className="rounded-lg"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    className="rounded-lg"
                  />
                </div>
              )}

              {error && (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{error}</p>
                  {showResend && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
                    >
                      {loading ? 'Sending...' : 'Resend confirmation email'}
                    </button>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full rounded-lg h-11 font-semibold" disabled={loading}>
                {submitLabel}
              </Button>
            </form>

            <div className="text-center space-y-2">
              {mode === 'signin' && (
                <>
                  <button
                    onClick={() => switchMode('forgot')}
                    className="block w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Don't have an account? Create one
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button
                  onClick={() => switchMode('signin')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Already have an account? Sign in
                </button>
              )}
              {mode === 'forgot' && (
                <button
                  onClick={() => switchMode('signin')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
