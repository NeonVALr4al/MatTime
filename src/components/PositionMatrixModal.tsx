import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import RadarChart from './RadarChart';
import { SPARRING_CATEGORIES } from '../sparringCategories';

type Props = { userId: string; onClose: () => void };

export default function PositionMatrixModal({ userId, onClose }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('sparring_log')
        .select('category')
        .eq('user_id', userId)
        .not('category', 'is', null);

      const next: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.category) next[row.category] = (next[row.category] ?? 0) + 1;
      }
      setCounts(next);
      setLoading(false);
    };
    load();
  }, [userId]);

  const chartData = SPARRING_CATEGORIES.map((c) => ({ label: c.short, value: counts[c.value] ?? 0 }));
  const totalRounds = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
      <div className="bg-mat-card border border-mat-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between p-4 border-b border-mat-border sticky top-0 bg-mat-card">
          <div>
            <p className="text-mat-accent text-[11px] font-semibold uppercase tracking-wide">Playstyle</p>
            <h2 className="text-mat-text font-extrabold text-lg">Athlete's Position Matrix</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close position matrix"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-mat-muted hover:text-mat-text hover:bg-mat-border transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {loading ? (
            <p className="text-mat-faint text-sm">Loading...</p>
          ) : totalRounds === 0 ? (
            <p className="text-mat-faint text-sm">
              Log a sparring round with a focus area to build your playstyle profile.
            </p>
          ) : (
            <>
              <RadarChart data={chartData} />
              <div className="grid grid-cols-3 gap-1.5">
                {SPARRING_CATEGORIES.map((c) => (
                  <span
                    key={c.value}
                    className="text-[10px] font-semibold text-mat-muted bg-mat-bg border border-mat-border-strong rounded px-2 py-1 text-center"
                  >
                    {c.short}: {counts[c.value] ?? 0}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
