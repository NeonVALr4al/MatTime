import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

type Promotion = {
  id: string;
  belt: string;
  stripes: number;
  promotion_date: string;
  notes: string | null;
};

const BELT_COLORS: Record<string, string> = {
  white: 'bg-slate-200 text-slate-900',
  blue: 'bg-blue-600 text-white',
  purple: 'bg-purple-600 text-white',
  brown: 'bg-amber-800 text-white',
  black: 'bg-black text-white border border-slate-600',
};

type Props = { refreshKey: number };

export default function PromotionList({ refreshKey }: Props) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPromotions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('belt_promotions')
      .select('id, belt, stripes, promotion_date, notes')
      .order('promotion_date', { ascending: false });
    if (!error && data) setPromotions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPromotions();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this promotion? This cannot be undone.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('belt_promotions').delete().eq('id', id);
    setDeletingId(null);
    if (error) return alert(`Failed to delete: ${error.message}`);
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <p className="text-slate-400 text-sm">Loading promotions...</p>;
  if (promotions.length === 0) return <p className="text-slate-400 text-sm">No promotions logged yet.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white">Belt Timeline</h3>
      {promotions.map((p) => (
        <div key={p.id} className="bg-slate-800 rounded-lg p-4 shadow flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${BELT_COLORS[p.belt] ?? 'bg-slate-600 text-white'}`}>
              {p.belt.toUpperCase()} · {p.stripes} stripe{p.stripes === 1 ? '' : 's'}
            </span>
            <span className="text-sm text-slate-400">{p.promotion_date}</span>
          </div>
          <button
            onClick={() => handleDelete(p.id)}
            disabled={deletingId === p.id}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            {deletingId === p.id ? '...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
}