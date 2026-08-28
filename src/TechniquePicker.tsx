import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

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

  return (
    <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/50">
      <p className="text-sm font-semibold text-slate-300 mb-2">Techniques drilled</p>

      <div className="max-h-36 overflow-y-auto space-y-1 mb-3 pr-1">
        {techniques.length === 0 && <p className="text-sm text-slate-500 italic">No techniques yet, add one below.</p>}
        {techniques.map((t) => (
          <label key={t.id} className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.includes(t.id)}
              onChange={() => toggle(t.id)}
              className="rounded accent-blue-600"
            />
            {t.name} <span className="text-slate-500">({t.category})</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New technique name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 min-w-0 rounded-md bg-slate-700 text-white placeholder-slate-400 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="rounded-md bg-slate-700 text-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddTechnique}
          disabled={adding || !newName.trim()}
          className="rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-3 py-1.5 transition-colors"
        >
          {adding ? '...' : 'Add'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
}