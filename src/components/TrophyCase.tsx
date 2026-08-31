import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type Props = { userId: string; onClose: () => void };

type Placement = 'gold' | 'silver' | 'bronze';

type CompetitionResult = {
  id: string;
  event_name: string;
  organization: string;
  division: string | null;
  placement: Placement;
  event_date: string;
};

const ORGANIZATIONS = ['IBJJF', 'AJP', 'Other'];

const SHELVES: { placement: Placement; label: string; gradient: string; ring: string }[] = [
  {
    placement: 'gold',
    label: 'Gold',
    gradient: 'radial-gradient(circle at 35% 30%, #fff6cc, #ffd700 45%, #a97a0a 100%)',
    ring: '#ffd700',
  },
  {
    placement: 'silver',
    label: 'Silver',
    gradient: 'radial-gradient(circle at 35% 30%, #ffffff, #c7c9cc 45%, #7c8085 100%)',
    ring: '#c7c9cc',
  },
  {
    placement: 'bronze',
    label: 'Bronze',
    gradient: 'radial-gradient(circle at 35% 30%, #f2c48f, #cd7f32 45%, #7c4a1e 100%)',
    ring: '#cd7f32',
  },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function Medal({ result, ring, gradient, onDelete, deleting }: {
  result: CompetitionResult;
  ring: string;
  gradient: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center gap-1 w-20">
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Remove result"
        className="absolute -top-2.5 right-0.5 p-1.5 text-mat-faint hover:text-mat-red disabled:opacity-40"
      >
        <span className="w-4 h-4 rounded-full bg-mat-bg border border-mat-border-strong text-[10px] leading-none flex items-center justify-center">
          ×
        </span>
      </button>
      <div
        title={`${result.event_name} · ${result.organization}${result.division ? ` · ${result.division}` : ''} · ${formatDate(result.event_date)}`}
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: gradient,
          boxShadow: `0 5px 10px rgba(0,0,0,0.55), inset 0 -3px 4px rgba(0,0,0,0.35), inset 0 2px 3px rgba(255,255,255,0.55), 0 0 0 1px ${ring}55`,
        }}
      >
        <svg viewBox="0 0 24 24" fill="rgba(0,0,0,0.35)" className="w-6 h-6">
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l7.1-1.01L12 2z" />
        </svg>
      </div>
      <p className="text-[9px] text-mat-muted text-center leading-tight truncate w-full">{result.event_name}</p>
    </div>
  );
}

export default function TrophyCase({ userId, onClose }: Props) {
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [organization, setOrganization] = useState('IBJJF');
  const [division, setDivision] = useState('');
  const [placement, setPlacement] = useState<Placement>('gold');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('competition_results')
        .select('id, event_name, organization, division, placement, event_date')
        .eq('user_id', userId)
        .order('event_date', { ascending: false });
      setResults(data ?? []);
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleAdd = async () => {
    if (!eventName.trim()) {
      setError('Event name is required.');
      return;
    }
    setError('');
    setSaving(true);

    const { data, error: insertError } = await supabase
      .from('competition_results')
      .insert({
        user_id: userId,
        event_name: eventName.trim(),
        organization,
        division: division.trim() || null,
        placement,
        event_date: eventDate,
        notes: notes.trim() || null,
      })
      .select('id, event_name, organization, division, placement, event_date')
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setResults((prev) => [data, ...prev]);
    setEventName('');
    setDivision('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this result? This cannot be undone.')) return;
    setDeletingId(id);
    const { error: deleteError } = await supabase.from('competition_results').delete().eq('id', id);
    setDeletingId(null);
    if (deleteError) return alert(`Failed to delete: ${deleteError.message}`);
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const inputClass =
    'w-full min-h-[40px] rounded-lg bg-mat-bg text-mat-text px-3 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-red';
  const labelClass = 'block text-xs font-medium text-mat-muted mb-1';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
      <div className="bg-mat-card border border-mat-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between p-4 border-b border-mat-border sticky top-0 bg-mat-card">
          <div>
            <p className="text-mat-red text-[11px] font-semibold uppercase tracking-wide">Fighter Achievements</p>
            <h2 className="text-mat-text font-extrabold text-lg">Competition Trophy Case</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trophy case"
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
          ) : (
            <div
              className="rounded-2xl p-4 flex flex-col gap-5"
              style={{
                background: 'linear-gradient(180deg, #2a1c12, #170f0a)',
                boxShadow: 'inset 0 0 24px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
              }}
            >
              {SHELVES.map((shelf) => {
                const shelfResults = results.filter((r) => r.placement === shelf.placement);
                return (
                  <div key={shelf.placement} className="flex flex-col gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: shelf.ring }}>
                      {shelf.label} · {shelfResults.length}
                    </p>
                    <div className="flex flex-wrap gap-3 pb-3">
                      {shelfResults.length === 0 ? (
                        <p className="text-mat-faint text-xs italic">No {shelf.label.toLowerCase()} medals yet</p>
                      ) : (
                        shelfResults.map((r) => (
                          <Medal
                            key={r.id}
                            result={r}
                            ring={shelf.ring}
                            gradient={shelf.gradient}
                            onDelete={() => handleDelete(r.id)}
                            deleting={deletingId === r.id}
                          />
                        ))
                      )}
                    </div>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        background: 'linear-gradient(180deg, #6b4a2c, #3c2715)',
                        boxShadow: '0 6px 10px rgba(0,0,0,0.5)',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {showAddForm ? (
            <div className="flex flex-col gap-3 bg-mat-bg border border-mat-border-strong rounded-xl p-3">
              <div>
                <label className={labelClass}>Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. IBJJF Pan Ams"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Organization</label>
                  <select value={organization} onChange={(e) => setOrganization(e.target.value)} className={inputClass}>
                    {ORGANIZATIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Placement</label>
                  <select value={placement} onChange={(e) => setPlacement(e.target.value as Placement)} className={inputClass}>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Division</label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    placeholder="optional"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg bg-mat-bg text-mat-text px-3 py-2 text-sm outline-none border border-mat-border-strong focus:border-mat-red"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 min-h-[40px] bg-mat-red-strong hover:opacity-90 disabled:opacity-40 text-white font-semibold rounded-lg text-sm transition-opacity"
                >
                  {saving ? 'Saving...' : 'Save Result'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  disabled={saving}
                  className="flex-1 min-h-[40px] bg-mat-card border border-mat-border-strong text-mat-muted hover:text-mat-text font-semibold rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="min-h-[40px] bg-mat-card border border-mat-border-strong text-mat-text font-semibold rounded-lg text-sm hover:border-mat-red transition-colors"
            >
              + Add Competition Result
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
