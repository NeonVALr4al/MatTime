import { useState } from 'react';
import { supabase } from './supabaseClient';
import Card from './components/Card';

type Props = {
  userId: string;
  onAdded: () => void;
};

const BELTS = ['white', 'blue', 'purple', 'brown', 'black'];

export default function PromotionForm({ userId, onAdded }: Props) {
  const [belt, setBelt] = useState('blue');
  const [stripes, setStripes] = useState(0);
  const [promotionDate, setPromotionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const { error: insertError } = await supabase.from('belt_promotions').insert({
      user_id: userId,
      belt,
      stripes,
      promotion_date: promotionDate,
      notes: notes || null,
    });

    if (insertError) {
      setSaving(false);
      return setError(insertError.message);
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ current_belt: belt, current_stripes: stripes })
      .eq('id', userId);

    setSaving(false);
    if (profileError) return setError(`Promotion saved, but profile update failed: ${profileError.message}`);

    setNotes('');
    onAdded();
  };

  const inputClass =
    'w-full min-h-[44px] rounded-lg bg-mat-bg text-mat-text px-3 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-red';
  const labelClass = 'block text-sm font-medium text-mat-muted mb-1.5';

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-4">
        <h3 className="text-lg font-bold text-mat-text">Log a Promotion</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Belt</label>
            <select value={belt} onChange={(e) => setBelt(e.target.value)} className={inputClass}>
              {BELTS.map((b) => (
                <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Stripes</label>
            <select value={stripes} onChange={(e) => setStripes(Number(e.target.value))} className={inputClass}>
              {[0, 1, 2, 3, 4].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" value={promotionDate} onChange={(e) => setPromotionDate(e.target.value)} required className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg bg-mat-bg text-mat-text px-3 py-2.5 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-red" placeholder="Optional, e.g. who promoted you, how it felt" />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[44px] bg-mat-red hover:opacity-90 disabled:opacity-40 text-white font-semibold rounded-lg transition-all duration-200 active:scale-[0.98]"
        >
          {saving ? 'Saving...' : 'Log Promotion'}
        </button>
      </Card>
    </form>
  );
}