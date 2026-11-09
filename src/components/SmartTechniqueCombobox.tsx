import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

type Technique = {
  id: string;
  name: string;
  category: string;
};

type Props = {
  userId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

const CATEGORIES = ['submission', 'sweep', 'takedown', 'escape', 'guard pass', 'guard retention'];

const CATEGORY_LABELS: Record<string, string> = {
  submission: 'Submission',
  sweep: 'Sweep',
  takedown: 'Takedown',
  escape: 'Escape',
  'guard pass': 'Guard Pass',
  'guard retention': 'Guard Retention',
};

function toTitleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

export default function SmartTechniqueCombobox({ userId, selectedIds, onChange }: Props) {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('techniques').select('id, name, category').order('name');
      if (!error && data) setTechniques(data);
      setLoading(false);
    };
    load();
  }, []);

  const selectedTechniques = useMemo(
    () => selectedIds.map((id) => techniques.find((t) => t.id === id)).filter((t): t is Technique => !!t),
    [selectedIds, techniques]
  );

  const addId = (id: string) => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id]);
  };

  const removeId = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed || !category) return;
    setError('');

    const existing = techniques.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      addId(existing.id);
      setName('');
      setCategory(null);
      return;
    }

    setSaving(true);
    const { data, error: insertError } = await supabase
      .from('techniques')
      .insert({ name: toTitleCase(trimmed), category, created_by: userId })
      .select('id, name, category')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: found } = await supabase
          .from('techniques')
          .select('id, name, category')
          .ilike('name', trimmed)
          .maybeSingle();
        if (found) {
          setTechniques((prev) => [...prev, found]);
          addId(found.id);
          setName('');
          setCategory(null);
        } else {
          setError('That technique already exists but could not be found. Try again.');
        }
      } else {
        setError(insertError.message);
      }
      setSaving(false);
      return;
    }

    setTechniques((prev) => [...prev, data]);
    addId(data.id);
    setName('');
    setCategory(null);
    setSaving(false);
  };

  const canAdd = name.trim().length > 0 && !!category && !saving;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-mat-muted">Techniques drilled</p>

      <div className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (canAdd) handleAdd();
            }
          }}
          placeholder={loading ? 'Loading...' : 'Type a technique, e.g. Armbar'}
          disabled={loading}
          className="w-full min-h-[44px] rounded-lg bg-mat-fill text-mat-text placeholder-mat-faint px-3 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-accent focus:ring-1 focus:ring-mat-accent/20 disabled:opacity-50"
        />

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(category === c ? null : c)}
              className={`min-h-[36px] px-3 rounded-full text-xs font-semibold border transition-colors active:scale-[0.98] ${
                category === c
                  ? 'bg-mat-accent-strong border-mat-accent text-white'
                  : 'bg-transparent border-mat-border-strong text-mat-muted hover:border-mat-accent-hover hover:text-mat-text'
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="min-h-[36px] px-4 rounded-lg text-xs font-semibold bg-mat-accent-fill border border-mat-accent-border text-mat-accent transition-colors disabled:opacity-40"
        >
          {saving ? 'Adding...' : 'Add technique'}
        </button>

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {selectedTechniques.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedTechniques.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 min-h-[32px] pl-3 pr-2 rounded-full bg-mat-accent-fill border border-mat-accent-border text-mat-accent text-xs font-semibold"
            >
              {t.name}
              <span className="opacity-70 font-normal">· {CATEGORY_LABELS[t.category] ?? t.category}</span>
              <button
                type="button"
                onClick={() => removeId(t.id)}
                aria-label={`Remove ${t.name}`}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-mat-accent/20 transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-semibold text-mat-faint hover:text-mat-text underline underline-offset-2"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
