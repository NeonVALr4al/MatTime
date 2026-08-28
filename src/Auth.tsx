import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return setError(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-800 rounded-xl shadow-lg p-8 space-y-4"
      >
        <h2 className="text-2xl font-bold text-white text-center">
          {isSignUp ? 'Create your MatTime account' : 'Welcome back'}
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg bg-slate-700 text-white placeholder-slate-400 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg bg-slate-700 text-white placeholder-slate-400 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg py-2 transition-colors"
        >
          {isSignUp ? 'Sign Up' : 'Log In'}
        </button>

        <p
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-center text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          {isSignUp ? 'Already have an account? Log in' : "Need an account? Sign up"}
        </p>
      </form>
    </div>
  );
}