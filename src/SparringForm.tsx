import { useState } from 'react';
import { supabase } from './supabaseClient';

type Props = {
  userId: string;
  onAdded: () => void;
};

const OUTCOMES = ['Won from', 'Lost from', 'Neutral position'];

export default function SparringForm({ userId, onAdded }: Props) {
  const [rollDate, setRollDate] = useState(new Date().toISOString().split('T')[0]);
  const [opponentNote, setOpponentNote] = useState('');
  const [outcome, setOutcome] = useState('Won from');
  const [position, setPosition] = useState('');
  const [submissionLanded, setSubmissionLanded] = useState('');
  const [submissionReceived, setSubmissionReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
    'w-full rounded-md bg-slate-700 text-white placeholder-slate-400 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1';

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 space-y-4 shadow">
      <h3 className="text-lg font-bold text-white">Log a Roll</h3>

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
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={`${inputClass} w-40 flex-shrink-0`}>
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="e.g. mount, closed guard"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Submission Landed</label>
          <input
            type="text"
            placeholder="e.g. triangle choke"
            value={submissionLanded}
            onChange={(e) => setSubmissionLanded(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Submission Received</label>
          <input
            type="text"
            placeholder="optional"
            value={submissionReceived}
            onChange={(e) => setSubmissionReceived(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
      >
        {saving ? 'Saving...' : 'Log Roll'}
      </button>
    </form>
  );
}