import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import BottomNav from './BottomNav';
import ProfileScreen from './screens/ProfileScreen';
import type { Tab } from './BottomNav';
import CombatScreen from './screens/CombatScreen';
import LogScreen from './screens/LogScreen';
import JourneyScreen from './screens/JourneyScreen';
import HistoryScreen from './screens/HistoryScreen';
import MetricsScreen from './screens/MetricsScreen';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('combat');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!session) return <Auth />;

  const renderScreen = () => {
    switch (activeTab) {
      case 'combat':
        return <CombatScreen session={session} onNavigate={setActiveTab} />;
      case 'log':
        return <LogScreen session={session} />;
      case 'journey':
        return <JourneyScreen session={session} />;
      case 'history':
        return <HistoryScreen session={session} />;
      case 'metrics':
        return <MetricsScreen session={session} />;
      case 'profile':
        return <ProfileScreen session={session} />;
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <main className="max-w-xl mx-auto px-4 py-6">{renderScreen()}</main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;