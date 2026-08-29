import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Tab } from '../BottomNav';

type Props = {
  session: Session;
  onNavigate: (tab: Tab) => void;
};

type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  date: string;
  durationLabel: string;
  durationColor: string;
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function startOfWeek(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // treat Monday as start of week
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

export default function CombatScreen({ session, onNavigate }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .single();
      setDisplayName(profile?.display_name || session.user.email?.split('@')[0] || 'Grappler');

      const weekStart = startOfWeek();
      const { count } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .gte('session_date', weekStart);
      setWeeklyCount(count ?? 0);

      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, session_date, class_type, duration_minutes')
        .order('session_date', { ascending: false })
        .limit(3);

      const { data: rolls } = await supabase
        .from('sparring_log')
        .select('id, roll_date, submission_landed, position_result')
        .order('roll_date', { ascending: false })
        .limit(3);

      const sessionItems: ActivityItem[] = (sessions ?? []).map((s) => ({
        id: `session-${s.id}`,
        title: `${s.class_type.charAt(0).toUpperCase() + s.class_type.slice(1)} Session`,
        meta: s.duration_minutes ? `${s.duration_minutes} min session` : 'Session',
        date: s.session_date,
        durationLabel: s.duration_minutes ? `${s.duration_minutes} MIN` : '',
        durationColor: 'text-green-400',
      }));

      const rollItems: ActivityItem[] = (rolls ?? []).map((r) => ({
        id: `roll-${r.id}`,
        title: 'Sparring Roll',
        meta: r.submission_landed ? `Landed: ${r.submission_landed}` : (r.position_result ?? 'Rolling'),
        date: r.roll_date,
        durationLabel: '',
        durationColor: 'text-red-400',
      }));

      const combined = [...sessionItems, ...rollItems]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 4);

      setActivity(combined);
      setLoading(false);
    };

    load();
  }, [session.user.id]);

  return (
    <div className="flex flex-col gap-6 text-white pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-red-500 tracking-wide">OS.TACTICAL_</p>
          <h1 className="text-2xl font-bold">Welcome back, {loading ? '...' : displayName}</h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold border-2 border-red-500 flex-shrink-0"
        >
          {displayName ? displayName.charAt(0).toUpperCase() : '?'}
        </button>
      </div>

      {/* Weekly streak card */}
      <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Weekly_Streak</p>
          <p className="font-bold text-white">
            {loading ? '...' : weeklyCount} Class{weeklyCount === 1 ? '' : 'es'} This Week
          </p>
        </div>
        <span className="text-red-500 font-bold text-lg">X{weeklyCount}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onNavigate('log')}
          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl py-3 transition-colors"
        >
          Log Session
        </button>
        <button
          type="button"
          onClick={() => onNavigate('log')}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl py-3 transition-colors"
        >
          Log Sparring
        </button>
      </div>

      {/* Upcoming class - static placeholder, no schedule feature exists yet */}
      <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-wide text-red-400">Upcoming_Class</p>
        <p className="font-bold text-white mt-1">No upcoming class scheduled</p>
        <p className="text-xs text-slate-400 mt-1">Class scheduling isn't part of MatTime yet</p>
      </div>

      {/* Recent activity */}
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Recent_Logs_</p>
        {loading && <p className="text-slate-500 text-sm">Loading...</p>}
        {!loading && activity.length === 0 && (
          <p className="text-slate-500 text-sm">No activity yet, log a session to get started.</p>
        )}
        <div className="flex flex-col gap-2">
          {activity.map((item) => (
            <div key={item.id} className="bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-slate-800">
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.meta}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                {item.durationLabel && (
                  <p className={`text-xs font-bold ${item.durationColor}`}>{item.durationLabel}</p>
                )}
                <p className="text-[10px] text-slate-500">{timeAgo(item.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}