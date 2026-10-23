import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Tab } from '../BottomNav';
import { useToast } from '../hooks/useToast';
import { formatTime, nextOccurrence, timeAgo, startOfWeek } from '../utils/date';

type Props = {
  session: Session;
  onNavigate: (tab: Tab) => void;
  onLogMode: (mode: 'session' | 'sparring') => void;
};

type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  date: string;
  durationLabel: string;
};

type ClassSlot = {
  id: string;
  day_of_week: number;
  start_time: string;
  label: string | null;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];


export default function CombatScreen({ session, onNavigate, onLogMode }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ClassSlot[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDay, setNewDay] = useState(new Date().getDay());
  const [newTime, setNewTime] = useState('18:00');
  const [newLabel, setNewLabel] = useState('');
  const [savingSlot, setSavingSlot] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadSchedule = async () => {
    const { data } = await supabase
      .from('class_schedule')
      .select('id, day_of_week, start_time, label')
      .order('day_of_week')
      .order('start_time');
    setSchedule(data ?? []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', session.user.id)
        .single();
      setDisplayName(profile?.display_name || session.user.email?.split('@')[0] || 'Grappler');
      setAvatarUrl(profile?.avatar_url ?? null);

      await loadSchedule();

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
      }));

      const rollItems: ActivityItem[] = (rolls ?? []).map((r) => ({
        id: `roll-${r.id}`,
        title: 'Sparring Roll',
        meta: r.submission_landed ? `Landed: ${r.submission_landed}` : (r.position_result ?? 'Rolling'),
        date: r.roll_date,
        durationLabel: '',
      }));

      const combined = [...sessionItems, ...rollItems]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 4);

      setActivity(combined);
      setLoading(false);
    };

    load();
  }, [session.user.id]);

  const handleAddSlot = async () => {
    setScheduleError('');
    setSavingSlot(true);

    const { data, error } = await supabase
      .from('class_schedule')
      .insert({
        user_id: session.user.id,
        day_of_week: newDay,
        start_time: newTime,
        label: newLabel.trim() || null,
      })
      .select('id, day_of_week, start_time, label')
      .single();

    setSavingSlot(false);

    if (error) {
      setScheduleError(error.message);
      return;
    }

    setSchedule((prev) =>
      [...prev, data].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
    );
    setNewLabel('');
    setShowAddForm(false);
    showToast('Class time added.');
  };

  const handleDeleteSlot = async (id: string) => {
    setDeletingSlotId(id);
    const { error } = await supabase.from('class_schedule').delete().eq('id', id);
    setDeletingSlotId(null);
    if (error) return showToast(`Failed to remove class time: ${error.message}`, 'error');
    setSchedule((prev) => prev.filter((s) => s.id !== id));
  };

  const nextClass = schedule.length
    ? schedule.reduce((soonest, s) => {
        const t = nextOccurrence(s.day_of_week, s.start_time);
        return !soonest || t < soonest.time ? { slot: s, time: t } : soonest;
      }, null as { slot: ClassSlot; time: Date } | null)
    : null;

  return (
    <div className="flex flex-col gap-6 text-mat-text pb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-mat-accent tracking-wide">COMBAT STATUS</p>
          <h1 className="text-2xl font-extrabold">Welcome back, {loading ? '...' : displayName}</h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 rounded-full bg-mat-card overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            displayName ? displayName.charAt(0).toUpperCase() : '?'
          )}
        </button>
      </div>

      <div className="bg-mat-card rounded-2xl p-4 flex items-center justify-between border border-mat-border">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-mat-faint">Weekly Streak</p>
          <p className="font-bold text-mat-text">
            {loading ? '...' : weeklyCount} Class{weeklyCount === 1 ? '' : 'es'} This Week
          </p>
        </div>
        <span className="text-mat-accent font-bold text-lg">X{weeklyCount}</span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onLogMode('session')}
          className="glow-crimson flex-1 bg-mat-accent-strong hover:bg-mat-accent-hover text-white font-semibold rounded-xl py-3 transition-colors"
        >
          Log Session
        </button>
        <button
          type="button"
          onClick={() => onLogMode('sparring')}
          className="flex-1 bg-mat-card hover:bg-mat-border text-mat-text font-semibold rounded-xl py-3 border border-mat-border transition-colors"
        >
          Log Sparring
        </button>
      </div>

      <div className="bg-mat-accent-fill border border-mat-accent-border rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wide text-mat-accent">Upcoming Class</p>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="text-[10px] font-bold uppercase tracking-wide text-mat-accent hover:opacity-80 transition-opacity"
          >
            {showAddForm ? 'Cancel' : '+ Add Class Time'}
          </button>
        </div>

        {nextClass ? (
          <p className="font-bold text-mat-text mt-1">
            {DAY_NAMES[nextClass.slot.day_of_week]} · {formatTime(nextClass.slot.start_time)}
            {nextClass.slot.label ? ` — ${nextClass.slot.label}` : ''}
          </p>
        ) : (
          <p className="font-bold text-mat-text mt-1">No upcoming class scheduled</p>
        )}

        {schedule.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {schedule.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 bg-mat-card border border-mat-border-strong rounded px-2 py-1 text-[10px] font-semibold text-mat-muted"
              >
                {DAY_ABBR[s.day_of_week]} {formatTime(s.start_time)}
                {s.label ? ` · ${s.label}` : ''}
                <button
                  type="button"
                  onClick={() => handleDeleteSlot(s.id)}
                  disabled={deletingSlotId === s.id}
                  aria-label="Remove class time"
                  className="p-1.5 -m-1.5 text-mat-faint hover:text-mat-accent disabled:opacity-40 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="flex flex-col gap-2 mt-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newDay}
                onChange={(e) => setNewDay(Number(e.target.value))}
                className="min-h-[40px] rounded-lg bg-mat-bg text-mat-text px-2 text-sm outline-none border border-mat-border-strong focus:border-mat-accent"
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="min-h-[40px] rounded-lg bg-mat-bg text-mat-text px-2 text-sm outline-none border border-mat-border-strong focus:border-mat-accent"
              />
            </div>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (optional, e.g. Gi Fundamentals)"
              className="min-h-[40px] rounded-lg bg-mat-bg text-mat-text px-3 text-sm outline-none border border-mat-border-strong focus:border-mat-accent"
            />
            <button
              type="button"
              onClick={handleAddSlot}
              disabled={savingSlot}
              className="min-h-[40px] bg-mat-accent-strong hover:bg-mat-accent-hover disabled:opacity-40 text-white font-semibold rounded-lg transition-colors"
            >
              {savingSlot ? 'Saving...' : 'Save Class Time'}
            </button>
            {scheduleError && <p className="text-red-400 text-xs">{scheduleError}</p>}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-mat-faint mb-2">Recent Logs</p>
        {loading && <p className="text-mat-faint text-sm">Loading...</p>}
        {!loading && activity.length === 0 && (
          <p className="text-mat-faint text-sm">No activity yet, log a session to get started.</p>
        )}
        <div className="flex flex-col gap-2">
          {activity.map((item) => (
            <div key={item.id} className="bg-mat-card rounded-2xl p-4 flex items-center justify-between border border-mat-border">
              <div>
                <p className="font-bold text-mat-text">{item.title}</p>
                <p className="text-xs text-mat-muted">{item.meta}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                {item.durationLabel && (
                  <p className="text-xs font-bold text-mat-green">{item.durationLabel}</p>
                )}
                <p className="text-[10px] text-mat-faint">{timeAgo(item.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}