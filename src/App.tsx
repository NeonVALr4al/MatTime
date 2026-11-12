import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import ResetPassword from './ResetPassword';
import BottomNav from './BottomNav';
import ProfileScreen from './screens/ProfileScreen';
import type { Tab } from './BottomNav';
import CombatScreen from './screens/CombatScreen';
import LogScreen from './screens/LogScreen';
import JourneyScreen from './screens/JourneyScreen';
import HistoryScreen from './screens/HistoryScreen';
import MetricsScreen from './screens/MetricsScreen';
import type { Session } from '@supabase/supabase-js';
import { useDragScroll } from './hooks/useDragScroll';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { useConfirm } from './hooks/useConfirm';
import { exitDemo } from './utils/demo';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('combat');
  const [logMode, setLogMode] = useState<'session' | 'sparring'>('session');
  const [exitingDemo, setExitingDemo] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const confirm = useConfirm();

  useDragScroll();

  const goToLog = (mode: 'session' | 'sparring') => {
    setLogMode(mode);
    setActiveTab('log');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (passwordRecovery) {
    return <ResetPassword onDone={() => setPasswordRecovery(false)} />;
  }

  if (!session) return <Auth />;

  const isDemo = session.user.is_anonymous ?? false;

  const handleExitDemo = async () => {
    const confirmed = await confirm("Exit demo and erase everything you tested?");
    if (!confirmed) return;

    setExitingDemo(true);
    const { error } = await exitDemo();
    if (error) {
      setExitingDemo(false);
      showToast(`Failed to exit demo: ${error}`, 'error');
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'combat':
        return <CombatScreen session={session} onNavigate={setActiveTab} onLogMode={goToLog} />;
      case 'log':
        return <LogScreen session={session} initialMode={logMode} />;
      case 'journey':
        return <JourneyScreen session={session} />;
      case 'history':
        return <HistoryScreen session={session} />;
      case 'metrics':
        return <MetricsScreen session={session} />;
      case 'profile':
        return <ProfileScreen session={session} theme={theme} onToggleTheme={toggleTheme} />;
    }
  };

  return (
    <div className="min-h-screen bg-mat-bg font-sans pb-20 md:pb-0 md:pl-56">
      {isDemo && (
        <div className="sticky top-0 z-40 flex items-center justify-center gap-3 bg-mat-accent-strong px-4 py-2 text-white text-sm">
          <span className="font-semibold">Demo Mode — nothing you do is saved to a real account</span>
          <button
            type="button"
            onClick={handleExitDemo}
            disabled={exitingDemo}
            className="min-h-[28px] px-3 rounded-md bg-white/15 hover:bg-white/25 disabled:opacity-40 font-semibold transition-colors"
          >
            {exitingDemo ? 'Exiting...' : 'Exit Demo'}
          </button>
        </div>
      )}
      <main className="max-w-xl md:max-w-2xl mx-auto px-4 py-6 md:py-10">{renderScreen()}</main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;