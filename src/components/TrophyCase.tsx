import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';

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

const SHELVES: { placement: Placement; label: string; colors: [string, string, string]; ring: string }[] = [
  { placement: 'gold', label: 'Gold', colors: ['#fff6cc', '#ffd700', '#a97a0a'], ring: '#ffd700' },
  { placement: 'silver', label: 'Silver', colors: ['#ffffff', '#c7c9cc', '#7c8085'], ring: '#c7c9cc' },
  { placement: 'bronze', label: 'Bronze', colors: ['#f2c48f', '#cd7f32', '#7c4a1e'], ring: '#cd7f32' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function Medal({ result, colors, onDelete, deleting }: {
  result: CompetitionResult;
  colors: [string, string, string];
  onDelete: () => void;
  deleting: boolean;
}) {
  const gradientId = `trophy-gradient-${result.id}`;
  const [light, mid, dark] = colors;

  return (
    <div className="relative flex flex-col items-center gap-1 w-20">
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Remove result"
        className="absolute -top-2.5 right-0.5 p-1.5 text-mat-faint hover:text-mat-accent disabled:opacity-40"
      >
        <span className="w-4 h-4 rounded-full bg-mat-bg border border-mat-border-strong text-[10px] leading-none flex items-center justify-center">
          ×
        </span>
      </button>
      <svg
        viewBox="0 0 24 24"
        className="w-12 h-12"
        style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))' }}
      >
        <title>{`${result.event_name} · ${result.organization}${result.division ? ` · ${result.division}` : ''} · ${formatDate(result.event_date)}`}</title>
        <defs>
          <radialGradient id={gradientId} cx="35%" cy="25%" r="75%">
            <stop offset="0%" stopColor={light} />
            <stop offset="45%" stopColor={mid} />
            <stop offset="100%" stopColor={dark} />
          </radialGradient>
        </defs>
        {/* handles */}
        <path
          d="M6 4C3 4 3 8 6 8.5M18 4c3 0 3 4 0 4.5"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        {/* cup */}
        <path
          d="M6 3h12c0 5-1.5 8-4 8.7h-4C7.5 11 6 8 6 3z"
          fill={`url(#${gradientId})`}
          stroke={dark}
          strokeWidth={0.4}
        />
        {/* stem */}
        <rect x="11" y="11.2" width="2" height="4" fill={`url(#${gradientId})`} />
        {/* base */}
        <rect x="9" y="15.2" width="6" height="2" rx="0.5" fill={`url(#${gradientId})`} stroke={dark} strokeWidth={0.3} />
        <rect x="7" y="17.6" width="10" height="2" rx="1" fill={`url(#${gradientId})`} stroke={dark} strokeWidth={0.3} />
      </svg>
      <p className="text-[9px] text-white/60 text-center leading-tight truncate w-full">{result.event_name}</p>
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
  const confirm = useConfirm();
  const { showToast } = useToast();

  useEscapeKey(onClose);

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
    showToast('Competition result added.');
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Remove this result? This cannot be undone.'))) return;
    setDeletingId(id);
    const { error: deleteError } = await supabase.from('competition_results').delete().eq('id', id);
    setDeletingId(null);
    if (deleteError) return showToast(`Failed to delete: ${deleteError.message}`, 'error');
    setResults((prev) => prev.filter((r) => r.id !== id));
    showToast('Result removed.');
  };

  const inputClass =
    'w-full min-h-[40px] rounded-lg bg-mat-fill text-mat-text px-3 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-accent';
  const labelClass = 'block text-xs font-medium text-mat-muted mb-1';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-mat-card border border-mat-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between p-4 border-b border-mat-border sticky top-0 bg-mat-card">
          <div>
            <p className="text-mat-accent text-[11px] font-semibold uppercase tracking-wide">Fighter Achievements</p>
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
                            colors={shelf.colors}
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
                  className="w-full rounded-lg bg-mat-bg text-mat-text px-3 py-2 text-sm outline-none border border-mat-border-strong focus:border-mat-accent"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 min-h-[40px] bg-mat-accent-strong hover:opacity-90 disabled:opacity-40 text-white font-semibold rounded-lg text-sm transition-opacity"
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
              className="min-h-[40px] bg-mat-card border border-mat-border-strong text-mat-text font-semibold rounded-lg text-sm hover:border-mat-accent transition-colors"
            >
              + Add Competition Result
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
