import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Card from '../components/Card';
import PillTag from '../components/PillTag';

type Props = { session: Session };

type SessionRow = {
  id: string;
  session_date: string;
  class_type: string;
  duration_minutes: number | null;
  notes: string | null;
};

type Filter = 'all' | 'gi' | 'no-gi' | 'open mat';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'gi', label: 'Gi Only' },
  { id: 'no-gi', label: 'No-Gi Only' },
  { id: 'open mat', label: 'Open Mat' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function classBadge(classType: string) {
  const isGi = classType === 'gi';
  return {
    bg: isGi ? 'bg-[rgba(255,46,85,0.13)]' : 'bg-mat-border-strong',
    text: isGi ? 'text-mat-red' : 'text-mat-muted',
    label: classType === 'no-gi' ? 'No-Gi' : classType === 'open mat' ? 'Open Mat' : classType.charAt(0).toUpperCase() + classType.slice(1),
  };
}

export default function HistoryScreen({ session }: Props) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('sessions')
        .select('id, session_date, class_type, duration_minutes, notes')
        .eq('user_id', session.user.id)
        .order('session_date', { ascending: false });
      setSessions(data ?? []);
      setLoading(false);
    };
    load();
  }, [session.user.id]);

  const now = new Date();
  const thisMonthSessions = sessions.filter((s) => {
    const d = new Date(s.session_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthVolumeMinutes = thisMonthSessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const monthVolumeHours = (monthVolumeMinutes / 60).toFixed(1);
  const monthLabel = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  const filtered = filter === 'all' ? sessions : sessions.filter((s) => s.class_type === filter);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-mat-red text-[11px] uppercase tracking-wide">Historical Archive</p>
        <h1 className="font-extrabold text-mat-text text-2xl">Training Logs</h1>
      </div>

      <div className="flex gap-3">
        <Card className="flex-1 flex flex-col gap-3">
          <p className="text-mat-faint text-[11px]">{monthLabel}VOLUME</p>
          <p className="text-mat-text font-bold text-xl">{monthVolumeHours} Hours</p>
        </Card>
        <Card className="flex-1 flex flex-col gap-3">
          <p className="text-mat-faint text-[11px]">{monthLabel}CLASSES</p>
          <p className="text-mat-text font-bold text-xl">{thisMonthSessions.length} Total</p>
        </Card>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <PillTag key={f.id} label={f.label} selected={filter === f.id} onClick={() => setFilter(f.id)} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-mat-faint text-sm">Loading...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-mat-faint text-sm">No sessions match this filter.</p>
        )}
        {filtered.map((s) => {
          const badge = classBadge(s.class_type);
          return (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${badge.bg} rounded-lg p-1.5`}>
                    <p className={`${badge.text} font-bold text-[10px]`}>{badge.label}</p>
                  </div>
                  <div>
                    <p className="text-mat-text font-bold text-sm">{s.notes || 'Training Session'}</p>
                    <p className="text-mat-muted text-xs">Vanguard HQ</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-mat-text font-bold text-xs">{s.duration_minutes ?? '--'} min</p>
                  <p className="text-mat-faint text-[10px]">{formatDate(s.session_date)}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}