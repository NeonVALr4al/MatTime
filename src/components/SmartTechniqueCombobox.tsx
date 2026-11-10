import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toTitleCase } from '../utils/text';

type Technique = {
  id: string;
  name: string;
};

type Props = {
  userId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export default function SmartTechniqueCombobox({ userId, selectedIds, onChange }: Props) {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('techniques').select('id, name').order('name');
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
    if (!trimmed) return;
    setError('');

    const existing = techniques.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      addId(existing.id);
      setName('');
      return;
    }

    setSaving(true);
    const { data, error: insertError } = await supabase
      .from('techniques')
      .insert({ name: toTitleCase(trimmed), created_by: userId })
      .select('id, name')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: found } = await supabase
          .from('techniques')
          .select('id, name')
          .ilike('name', trimmed)
          .maybeSingle();
        if (found) {
          setTechniques((prev) => [...prev, found]);
          addId(found.id);
          setName('');
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
    setSaving(false);
  };

  const canAdd = name.trim().length > 0 && !saving;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-mat-muted">Techniques drilled</p>

      <div className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(toTitleCase(e.target.value))}
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
