import { useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import SessionForm from '../SessionForm';
import SessionList from '../SessionList';
import SparringForm from '../SparringForm';
import SparringList from '../SparringList';

type Props = {
  session: Session;
};

type Mode = 'session' | 'sparring';

export default function LogScreen({ session }: Props) {
  const [mode, setMode] = useState<Mode>('session');
  const [sessionRefresh, setSessionRefresh] = useState(0);
  const [sparringRefresh, setSparringRefresh] = useState(0);

  return (
    <div className="flex flex-col gap-6 text-white pb-4">
      <div>
        <p className="text-xs font-semibold text-red-500 tracking-wide">
          {mode === 'session' ? 'SESSION_INTAKE' : 'COMBAT_FEEDBACK'}
        </p>
        <h1 className="text-2xl font-bold">{mode === 'session' ? 'Log Training' : 'Log Sparring'}</h1>
      </div>

      {/* Mode switcher */}
      <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => setMode('session')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'session' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Training
        </button>
        <button
          type="button"
          onClick={() => setMode('sparring')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'sparring' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Sparring
        </button>
      </div>

      {mode === 'session' ? (
        <>
          <SessionForm userId={session.user.id} onSessionAdded={() => setSessionRefresh((k) => k + 1)} />
          <SessionList refreshKey={sessionRefresh} />
        </>
      ) : (
        <>
          <SparringForm userId={session.user.id} onAdded={() => setSparringRefresh((k) => k + 1)} />
          <SparringList refreshKey={sparringRefresh} />
        </>
      )}
    </div>
  );
}