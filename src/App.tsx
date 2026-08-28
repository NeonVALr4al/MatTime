import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import SessionForm from './SessionForm';
import SessionList from './SessionList';
import SparringForm from './SparringForm';
import SparringList from './SparringList';
import PromotionForm from './PromotionForm';
import PromotionList from './PromotionList';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionRefresh, setSessionRefresh] = useState(0);
  const [sparringRefresh, setSparringRefresh] = useState(0);
  const [promotionRefresh, setPromotionRefresh] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">MatTime</h1>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm hidden sm:inline">{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-10">
        <section className="space-y-4">
          <SessionForm userId={session.user.id} onSessionAdded={() => setSessionRefresh((k) => k + 1)} />
          <SessionList refreshKey={sessionRefresh} />
        </section>

        <section className="space-y-4">
          <SparringForm userId={session.user.id} onAdded={() => setSparringRefresh((k) => k + 1)} />
          <SparringList refreshKey={sparringRefresh} />
        </section>

        <section className="space-y-4">
          <PromotionForm userId={session.user.id} onAdded={() => setPromotionRefresh((k) => k + 1)} />
          <PromotionList refreshKey={promotionRefresh} />
        </section>
      </main>
    </div>
  );
}

export default App;