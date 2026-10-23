import { useState } from 'react';
import { supabase } from './supabaseClient';

type Mode = 'signin' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setSubmitting(false);
      if (error) return setError(error.message);
      if (!data.session) {
        setMessage('Check your email to confirm your account before logging in.');
      }
    } else if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) return setError(error.message);
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      setSubmitting(false);
      if (error) return setError(error.message);
      setMessage('Check your email for a password reset link.');
    }
  };

  const title =
    mode === 'signup' ? 'Create your MatTime account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back';

  return (
    <div className="min-h-screen flex items-center justify-center bg-mat-bg font-sans px-4">
      <form
        onSubmit={handleSubmit}
        className="card-top-light w-full max-w-sm bg-mat-card border border-mat-border rounded-2xl shadow-lg p-8 space-y-4"
      >
        <div className="text-center space-y-1">
          <p className="text-mat-accent text-[11px] font-semibold uppercase tracking-wide">Fighter Access</p>
          <h2 className="text-2xl font-extrabold text-mat-text">{title}</h2>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full min-h-[44px] rounded-lg bg-mat-fill text-mat-text placeholder-mat-faint px-4 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-accent focus:ring-1 focus:ring-mat-accent/20"
        />

        {mode !== 'forgot' && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full min-h-[44px] rounded-lg bg-mat-fill text-mat-text placeholder-mat-faint px-4 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-accent focus:ring-1 focus:ring-mat-accent/20"
          />
        )}

        {mode === 'signin' && (
          <button
            type="button"
            onClick={() => switchMode('forgot')}
            className="block ml-auto text-xs font-semibold text-mat-accent hover:underline"
          >
            Forgot password?
          </button>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {message && <p className="text-mat-green text-sm">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[44px] bg-mat-accent-strong hover:bg-mat-accent-hover disabled:opacity-40 text-white font-semibold rounded-lg transition-all duration-200 active:scale-[0.98]"
        >
          {submitting
            ? 'Please wait...'
            : mode === 'signup'
              ? 'Sign Up'
              : mode === 'forgot'
                ? 'Send Reset Link'
                : 'Log In'}
        </button>

        {mode === 'forgot' ? (
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className="w-full text-center text-sm text-mat-faint hover:text-mat-text transition-colors"
          >
            Back to log in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
            className="w-full text-center text-sm text-mat-faint hover:text-mat-text transition-colors"
          >
            {mode === 'signup' ? 'Already have an account? Log in' : "Need an account? Sign up"}
          </button>
        )}
      </form>
    </div>
  );
}
