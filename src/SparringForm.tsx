import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Card from './components/Card';

type Props = {
  userId: string;
  onAdded: () => void;
};

type Technique = { id: string; name: string };

const OUTCOMES = ['Won from', 'Lost from', 'Neutral position'];

export default function SparringForm({ userId, onAdded }: Props) {
  const [rollDate, setRollDate] = useState(new Date().toISOString().split('T')[0]);
  const [opponentNote, setOpponentNote] = useState('');
  const [outcome, setOutcome] = useState('Won from');
  const [position, setPosition] = useState('');
  const [submissionLanded, setSubmissionLanded] = useState('');
  const [submissionReceived, setSubmissionReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [submissionTechniques, setSubmissionTechniques] = useState<Technique[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSubmissions = async () => {
      const { data } = await supabase
        .from('techniques')
        .select('id, name')
        .eq('category', 'submission')
        .order('name');
      setSubmissionTechniques(data ?? []);
    };
    loadSubmissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const positionResult = position.trim() ? `${outcome} ${position.trim()}` : outcome;

    const { error } = await supabase.from('sparring_log').insert({
      user_id: userId,
      roll_date: rollDate,
      opponent_note: opponentNote || null,
      position_result: positionResult,
      submission_landed: submissionLanded || null,
      submission_received: submissionReceived || null,
      notes: notes || null,
    });

    setSaving(false);
    if (error) return setError(error.message);

    setOpponentNote('');
    setPosition('');
    setSubmissionLanded('');
    setSubmissionReceived('');
    setNotes('');
    onAdded();
  };

  const inputClass =
    'w-full min-h-[44px] rounded-lg bg-mat-bg text-mat-text placeholder-mat-faint px-3 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-red';
  const labelClass = 'block text-sm font-medium text-mat-muted mb-1.5';
  const selectClass =
    'min-h-[44px] rounded-lg bg-mat-bg text-mat-text px-3 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-red';

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-4">
        <h3 className="text-lg font-bold text-mat-text">Log a Roll</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" value={rollDate} onChange={(e) => setRollDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Training Partner</label>
            <input
              type="text"
              placeholder="e.g. training partner, blue belt"
              value={opponentNote}
              onChange={(e) => setOpponentNote(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Position</label>
          <div className="flex gap-2">
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className={`${selectClass} w-40 flex-shrink-0`}
            >
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="e.g. mount, closed guard"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={`${inputClass} flex-1 min-w-0`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Submission Landed</label>
            <select
              value={submissionLanded}
              onChange={(e) => setSubmissionLanded(e.target.value)}
              className={`${selectClass} w-full`}
            >
              <option value="">None</option>
              {submissionTechniques.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Submission Received</label>
            <select
              value={submissionReceived}
              onChange={(e) => setSubmissionReceived(e.target.value)}
              className={`${selectClass} w-full`}
            >
              <option value="">None</option>
              {submissionTechniques.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg bg-mat-bg text-mat-text px-3 py-2.5 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-red" />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[44px] bg-mat-red hover:opacity-90 disabled:opacity-40 text-white font-semibold rounded-lg transition-all duration-200 active:scale-[0.98]"
        >
          {saving ? 'Saving...' : 'Log Roll'}
        </button>
      </Card>
    </form>
  );
}