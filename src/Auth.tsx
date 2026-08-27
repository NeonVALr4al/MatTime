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
      // No need to manually create a profile row here anymore, a database
      // trigger automatically creates one whenever a new user signs up.
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isSignUp ? 'Sign Up' : 'Log In'}</h2>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">{isSignUp ? 'Sign Up' : 'Log In'}</button>
      <p onClick={() => setIsSignUp(!isSignUp)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
        {isSignUp ? 'Already have an account? Log in' : "Need an account? Sign up"}
      </p>
    </form>
  );
}