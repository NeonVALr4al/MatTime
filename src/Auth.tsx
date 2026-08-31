import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setSubmitting(false);
      if (error) return setError(error.message);
      if (!data.session) {
        setMessage('Check your email to confirm your account before logging in.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) return setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mat-bg font-sans px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-mat-card border border-mat-border rounded-2xl shadow-lg p-8 space-y-4"
      >
        <h2 className="text-2xl font-extrabold text-mat-text text-center">
          {isSignUp ? 'Create your MatTime account' : 'Welcome back'}
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full min-h-[44px] rounded-lg bg-mat-bg text-mat-text placeholder-mat-faint px-4 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-red"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full min-h-[44px] rounded-lg bg-mat-bg text-mat-text placeholder-mat-faint px-4 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-red"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {message && <p className="text-mat-green text-sm">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[44px] bg-mat-red-strong hover:opacity-90 disabled:opacity-40 text-white font-semibold rounded-lg transition-all duration-200 active:scale-[0.98]"
        >
          {submitting ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Log In'}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setMessage('');
          }}
          className="w-full text-center text-sm text-mat-faint hover:text-mat-text transition-colors"
        >
          {isSignUp ? 'Already have an account? Log in' : "Need an account? Sign up"}
        </button>
      </form>
    </div>
  );
}
