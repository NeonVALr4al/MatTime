import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import SessionForm from '../SessionForm';
import SessionList from '../SessionList';
import SparringForm from '../SparringForm';
import SparringList from '../SparringList';

type Mode = 'session' | 'sparring';

type Props = {
  session: Session;
  initialMode?: Mode;
};

export default function LogScreen({ session, initialMode = 'session' }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [sessionRefresh, setSessionRefresh] = useState(0);
  const [sparringRefresh, setSparringRefresh] = useState(0);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  return (
    <div className="flex flex-col gap-6 text-mat-text pb-4">
      <div>
        <h1 className="text-2xl font-bold">{mode === 'session' ? 'Log Training' : 'Log Sparring'}</h1>
      </div>

      {/* Mode switcher */}
      <div className="flex bg-mat-card rounded-xl p-1 border border-mat-border-strong">
        <button
          type="button"
          onClick={() => setMode('session')}
          className={`flex-1 min-h-[44px] rounded-lg text-sm font-semibold transition-colors ${
            mode === 'session' ? 'bg-mat-accent-strong text-white' : 'text-mat-faint hover:text-mat-text'
          }`}
        >
          Training
        </button>
        <button
          type="button"
          onClick={() => setMode('sparring')}
          className={`flex-1 min-h-[44px] rounded-lg text-sm font-semibold transition-colors ${
            mode === 'sparring' ? 'bg-mat-accent-strong text-white' : 'text-mat-faint hover:text-mat-text'
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