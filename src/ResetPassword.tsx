import { useState } from 'react';
import { supabase } from './supabaseClient';

type Props = { onDone: () => void };

export default function ResetPassword({ onDone }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    onDone();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mat-bg font-sans px-4">
      <form
        onSubmit={handleSubmit}
        className="card-top-light w-full max-w-sm bg-mat-card border border-mat-border rounded-2xl shadow-lg p-8 space-y-4"
      >
        <div className="text-center space-y-1">
          <p className="text-mat-accent text-[11px] font-semibold uppercase tracking-wide">Fighter Access</p>
          <h2 className="text-2xl font-extrabold text-mat-text">Set a new password</h2>
        </div>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          className="w-full min-h-[44px] rounded-lg bg-mat-fill text-mat-text placeholder-mat-faint px-4 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-accent focus:ring-1 focus:ring-mat-accent/20"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full min-h-[44px] rounded-lg bg-mat-fill text-mat-text placeholder-mat-faint px-4 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-accent focus:ring-1 focus:ring-mat-accent/20"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[44px] bg-mat-accent-strong hover:bg-mat-accent-hover disabled:opacity-40 text-white font-semibold rounded-lg transition-all duration-200 active:scale-[0.98]"
        >
          {submitting ? 'Saving...' : 'Save New Password'}
        </button>
      </form>
    </div>
  );
}
