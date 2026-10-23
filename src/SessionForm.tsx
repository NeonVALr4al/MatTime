import { useState } from 'react';
import { supabase } from './supabaseClient';
import SmartTechniqueCombobox from './components/SmartTechniqueCombobox';
import Card from './components/Card';
import { useToast } from './hooks/useToast';

type Props = {
  userId: string;
  onSessionAdded: () => void;
};

const INTENSITY_OPTIONS = [
  { label: 'Light', value: 1, activeClass: 'bg-mat-green-strong border-mat-green text-white', hoverClass: 'hover:border-[rgba(16,185,129,0.5)]' },
  { label: 'Medium', value: 3, activeClass: 'bg-mat-orange-strong border-mat-orange text-white', hoverClass: 'hover:border-[rgba(245,158,11,0.5)]' },
  { label: 'Hard', value: 5, activeClass: 'bg-mat-accent-strong border-mat-accent text-white', hoverClass: 'hover:border-mat-accent-hover' },
];

export default function SessionForm({ userId, onSessionAdded }: Props) {
  const { showToast } = useToast();
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
    showToast('Session logged.');
  };

  const inputClass =
    'w-full min-h-[44px] rounded-lg bg-mat-fill text-mat-text px-3 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-accent focus:ring-1 focus:ring-mat-accent/20';
  const labelClass = 'block text-sm font-medium text-mat-muted mb-1.5';

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-4">
        <h3 className="text-lg font-bold text-mat-text">Log a Session</h3>

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
            <label className={labelClass}>Intensity</label>
            <div className="flex gap-2">
              {INTENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIntensity(opt.value)}
                  className={`flex-1 min-h-[44px] rounded-lg text-sm font-semibold border transition-all duration-200 active:scale-[0.98] ${
                    intensity === opt.value
                      ? opt.activeClass
                      : `bg-mat-fill border-mat-border-strong text-mat-muted ${opt.hoverClass}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg bg-mat-fill text-mat-text px-3 py-2.5 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-accent focus:ring-1 focus:ring-mat-accent/20" />
        </div>

        <SmartTechniqueCombobox selectedIds={techniqueIds} onChange={setTechniqueIds} />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[44px] bg-mat-accent-strong hover:bg-mat-accent-hover disabled:opacity-40 text-white font-semibold rounded-lg transition-all duration-200 active:scale-[0.98]"
        >
          {saving ? 'Saving...' : 'Log Session'}
        </button>
      </Card>
    </form>
  );
}