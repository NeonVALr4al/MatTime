import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

type Roll = {
  id: string;
  roll_date: string;
  opponent_note: string | null;
  position_result: string | null;
  submission_landed: string | null;
  submission_received: string | null;
  notes: string | null;
};

type Props = { refreshKey: number };

export default function SparringList({ refreshKey }: Props) {
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRolls = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sparring_log')
      .select('id, roll_date, opponent_note, position_result, submission_landed, submission_received, notes')
      .order('roll_date', { ascending: false });
    if (!error && data) setRolls(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRolls();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this roll? This cannot be undone.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('sparring_log').delete().eq('id', id);
    setDeletingId(null);
    if (error) return alert(`Failed to delete: ${error.message}`);
    setRolls((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <p className="text-slate-400 text-sm">Loading rolls...</p>;
  if (rolls.length === 0) return <p className="text-slate-400 text-sm">No rolls logged yet.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white">Your Rolls</h3>
      {rolls.map((r) => (
        <div key={r.id} className="bg-slate-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold">{r.roll_date}</p>
            {r.opponent_note && <span className="text-xs text-slate-400">{r.opponent_note}</span>}
          </div>
          {r.position_result && <p className="text-sm text-slate-300 mt-1">{r.position_result}</p>}
          {r.submission_landed && (
            <p className="text-sm text-green-400 mt-1">Landed: {r.submission_landed}</p>
          )}
          {r.submission_received && (
            <p className="text-sm text-red-400 mt-1">Received: {r.submission_received}</p>
          )}
          {r.notes && <p className="text-sm text-slate-400 italic mt-2">{r.notes}</p>}
          <button
            onClick={() => handleDelete(r.id)}
            disabled={deletingId === r.id}
            className="mt-3 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            {deletingId === r.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
}