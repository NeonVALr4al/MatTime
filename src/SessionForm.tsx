import { useState } from 'react';
import { supabase } from './supabaseClient';
import TechniquePicker from './TechniquePicker';

type Props = {
  userId: string;
  onSessionAdded: () => void;
};

export default function SessionForm({ userId, onSessionAdded }: Props) {
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [classType, setClassType] = useState('gi');
  const [duration, setDuration] = useState(60);
  const [intensity, setIntensity] = useState(3);
  const [notes, setNotes] = useState('');
  const [techniqueIds, setTechniqueIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        session_date: sessionDate,
        class_type: classType,
        duration_minutes: duration,
        intensity: intensity,
        notes: notes,
      })
      .select()
      .single();

    if (sessionError) {
      setSaving(false);
      setError(sessionError.message);
      return;
    }

    if (techniqueIds.length > 0) {
      const rows = techniqueIds.map((technique_id) => ({
        session_id: sessionData.id,
        technique_id,
        user_id: userId,
      }));
      const { error: linkError } = await supabase.from('session_techniques').insert(rows);
      if (linkError) {
        setSaving(false);
        setError(`Session saved, but linking techniques failed: ${linkError.message}`);
        return;
      }
    }

    setSaving(false);
    setSessionDate(new Date().toISOString().split('T')[0]);
    setClassType('gi');
    setDuration(60);
    setIntensity(3);
    setNotes('');
    setTechniqueIds([]);
    onSessionAdded();
  };

  const inputClass =
    'w-full rounded-md bg-slate-700 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1';

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 space-y-4 shadow">
      <h3 className="text-lg font-bold text-white">Log a Session</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Class Type</label>
          <select value={classType} onChange={(e) => setClassType(e.target.value)} className={inputClass}>
            <option value="gi">Gi</option>
            <option value="no-gi">No-Gi</option>
            <option value="open mat">Open Mat</option>
            <option value="competition">Competition</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Duration (minutes)</label>
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Intensity (1-5)</label>
          <input type="number" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} min={1} max={5} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} />
      </div>

      <TechniquePicker selectedIds={techniqueIds} onChange={setTechniqueIds} />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
      >
        {saving ? 'Saving...' : 'Log Session'}
      </button>
    </form>
  );
}