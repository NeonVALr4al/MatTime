import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

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

  if (loading) return <p className="text-slate-400 text-sm">Loading sessions...</p>;
  if (sessions.length === 0) return <p className="text-slate-400 text-sm">No sessions logged yet.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white">Your Sessions</h3>
      {sessions.map((s) => (
        <div key={s.id} className="bg-slate-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold">{s.session_date}</p>
            <span className="text-xs uppercase tracking-wide text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
              {s.class_type}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {s.duration_minutes} min · intensity {s.intensity}/5
          </p>
          {s.notes && <p className="text-sm text-slate-300 italic mt-2">{s.notes}</p>}
          {s.techniques.length > 0 && (
            <p className="text-sm text-slate-400 mt-2">
              <span className="text-slate-500">Techniques:</span> {s.techniques.map((t) => t.name).join(', ')}
            </p>
          )}
          <button
            onClick={() => handleDelete(s.id)}
            disabled={deletingId === s.id}
            className="mt-3 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            {deletingId === s.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
}