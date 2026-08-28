import { useState } from 'react';
import { supabase } from './supabaseClient';

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

    // Keep the profile's current belt/stripes in sync with the latest promotion
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
    'w-full rounded-md bg-slate-700 text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1';

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 space-y-4 shadow">
      <h3 className="text-lg font-bold text-white">Log a Promotion</h3>

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
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} placeholder="Optional, e.g. who promoted you, how it felt" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
      >
        {saving ? 'Saving...' : 'Log Promotion'}
      </button>
    </form>
  );
}