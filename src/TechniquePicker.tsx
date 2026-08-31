import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Card from './components/Card';
import PillTag from './components/PillTag';

type Technique = {
  id: string;
  name: string;
  category: string;
};

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

const CATEGORIES = ['submission', 'sweep', 'takedown', 'escape', 'guard pass', 'guard retention', 'other'];

export default function TechniquePicker({ selectedIds, onChange }: Props) {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('submission');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchTechniques = async () => {
    const { data, error } = await supabase.from('techniques').select('id, name, category').order('name');
    if (!error && data) setTechniques(data);
  };

  useEffect(() => {
    fetchTechniques();
  }, []);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const handleAddTechnique = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('techniques')
      .insert({ name: newName.trim(), category: newCategory, created_by: userData.user?.id })
      .select()
      .single();

    setAdding(false);
    if (error) return setError(error.message);

    setTechniques((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    onChange([...selectedIds, data.id]);
    setNewName('');
  };

  const filteredTechniques = techniques.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <p className="text-sm font-semibold text-mat-muted mb-3">Techniques drilled</p>

      <input
        type="text"
        placeholder="Search techniques..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full min-h-[40px] rounded-lg bg-mat-bg border border-mat-border-strong text-mat-text placeholder-mat-faint px-3 text-sm outline-none transition-all duration-200 focus:border-mat-red mb-3"
      />

      <div className="max-h-40 overflow-y-auto no-scrollbar flex flex-wrap gap-2 mb-4 pr-1">
        {techniques.length === 0 && <p className="text-sm text-mat-faint italic">No techniques yet, add one below.</p>}
        {techniques.length > 0 && filteredTechniques.length === 0 && (
          <p className="text-sm text-mat-faint italic">No techniques match "{search}".</p>
        )}
        {filteredTechniques.map((t) => (
          <PillTag
            key={t.id}
            label={t.name}
            sublabel={`(${t.category})`}
            selected={selectedIds.includes(t.id)}
            onClick={() => toggle(t.id)}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New technique name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 min-w-0 min-h-[44px] rounded-lg bg-mat-bg border border-mat-border-strong text-mat-text placeholder-mat-faint px-3 text-sm outline-none transition-all duration-200 focus:border-mat-red"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="min-h-[44px] rounded-lg bg-mat-bg border border-mat-border-strong text-mat-text px-2 text-sm outline-none transition-all duration-200 focus:border-mat-red"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddTechnique}
          disabled={adding || !newName.trim()}
          className="min-h-[44px] px-4 rounded-lg bg-mat-red hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
        >
          {adding ? '...' : 'Add'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </Card>
  );
}