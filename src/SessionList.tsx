import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Card from './components/Card';

type Technique = { name: string; category: string };

type Session = {
  id: string;
  session_date: string;
  class_type: string;
  duration_minutes: number | null;
  intensity: number | null;
  notes: string | null;
  techniques: Technique[];
};

type Props = { refreshKey: number };

export default function SessionList({ refreshKey }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select(`id, session_date, class_type, duration_minutes, intensity, notes, session_techniques ( techniques ( name, category ) )`)
      .order('session_date', { ascending: false });

    if (!error && data) {
      const shaped = data.map((s) => ({
        ...s,
        techniques: (s.session_techniques ?? [])
          .map((st: { techniques: Technique | Technique[] | null }) =>
            Array.isArray(st.techniques) ? st.techniques[0] : st.techniques
          )
          .filter((t: Technique | null): t is Technique => t !== null),
      }));
      setSessions(shaped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this session? This cannot be undone.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    setDeletingId(null);
    if (error) return alert(`Failed to delete: ${error.message}`);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return <p className="text-mat-faint text-sm">Loading sessions...</p>;
  if (sessions.length === 0) return <p className="text-mat-faint text-sm">No sessions logged yet.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-mat-text">Your Sessions</h3>
      {sessions.map((s) => (
        <Card key={s.id}>
          <div className="flex items-center justify-between">
            <p className="text-mat-text font-bold">{s.session_date}</p>
            <span className="text-xs uppercase tracking-wide text-mat-red bg-[rgba(255,46,85,0.13)] px-2 py-0.5 rounded">
              {s.class_type}
            </span>
          </div>
          <p className="text-sm text-mat-muted mt-1">
            {s.duration_minutes} min · intensity {s.intensity}/5
          </p>
          {s.notes && <p className="text-sm text-mat-muted italic mt-2">{s.notes}</p>}
          {s.techniques.length > 0 && (
            <p className="text-sm text-mat-muted mt-2">
              <span className="text-mat-faint">Techniques:</span> {s.techniques.map((t) => t.name).join(', ')}
            </p>
          )}
          <button
            onClick={() => handleDelete(s.id)}
            disabled={deletingId === s.id}
            className="mt-3 min-h-[44px] px-3 -ml-3 text-sm text-mat-red hover:opacity-80 disabled:opacity-50 transition-all duration-200 active:scale-[0.98]"
          >
            {deletingId === s.id ? 'Deleting...' : 'Delete'}
          </button>
        </Card>
      ))}
    </div>
  );
}