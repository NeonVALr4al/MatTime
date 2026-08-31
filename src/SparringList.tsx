import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Card from './components/Card';
import DeleteButton from './components/DeleteButton';
import CollapsibleSection from './components/CollapsibleSection';

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

  if (loading) return <p className="text-mat-faint text-sm">Loading rolls...</p>;
  if (rolls.length === 0) return <p className="text-mat-faint text-sm">No rolls logged yet.</p>;

    return (
    <CollapsibleSection title="Your Rolls" defaultOpen={false}>
      <div className="max-h-[420px] overflow-y-auto no-scrollbar space-y-3 pr-1">
        {rolls.map((r) => (
                <Card key={r.id}>
          <div className="flex items-center justify-between">
            <p className="text-mat-text font-bold">{r.roll_date}</p>
            <div className="flex items-center gap-2">
              {r.opponent_note && <span className="text-xs text-mat-muted">{r.opponent_note}</span>}
              <DeleteButton onClick={() => handleDelete(r.id)} disabled={deletingId === r.id} />
            </div>
          </div>
          {r.position_result && <p className="text-sm text-mat-muted mt-1">{r.position_result}</p>}
          {r.submission_landed && (
            <p className="text-sm text-mat-green mt-1">Landed: {r.submission_landed}</p>
          )}
          {r.submission_received && (
            <p className="text-sm text-mat-red mt-1">Received: {r.submission_received}</p>
          )}
          {r.notes && <p className="text-sm text-mat-muted italic mt-2">{r.notes}</p>}
        </Card>
        ))}
      </div>
    </CollapsibleSection>
  );
}