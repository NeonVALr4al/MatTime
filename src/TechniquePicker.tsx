import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Card from './components/Card';
import PillTag from './components/PillTag';
import CollapsibleSection from './components/CollapsibleSection';

type Technique = {
  id: string;
  name: string;
  category: string;
};

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

const CATEGORY_ORDER = ['submission', 'sweep', 'takedown', 'escape', 'guard pass', 'guard retention', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
  submission: 'Submissions',
  sweep: 'Sweeps',
  takedown: 'Takedowns',
  escape: 'Escapes',
  'guard pass': 'Guard Passing',
  'guard retention': 'Guard Retention',
  other: 'Other',
};

export default function TechniquePicker({ selectedIds, onChange }: Props) {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDeleteTechnique = async (id: string) => {
    if (!window.confirm('Delete this technique? This cannot be undone.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('techniques').delete().eq('id', id);
    setDeletingId(null);
    if (error) return alert(`Failed to delete: ${error.message}`);
    setTechniques((prev) => prev.filter((t) => t.id !== id));
    onChange(selectedIds.filter((sid) => sid !== id));
  };

  const trimmedSearch = search.trim().toLowerCase();
  const hasSearch = trimmedSearch.length > 0;
  const filteredTechniques = techniques.filter((t) => t.name.toLowerCase().includes(trimmedSearch));

  const groupedTechniques = CATEGORY_ORDER.map((category) => ({
    category,
    items: techniques.filter((t) => t.category === category),
  })).filter((g) => g.items.length > 0);

  const selectedNames = selectedIds
    .map((id) => techniques.find((t) => t.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  const renderPill = (t: Technique) => (
    <div key={t.id} className="relative">
      <PillTag label={t.name} selected={selectedIds.includes(t.id)} onClick={() => toggle(t.id)} />
      <button
        type="button"
        onClick={() => handleDeleteTechnique(t.id)}
        disabled={deletingId === t.id}
        aria-label={`Delete ${t.name}`}
        className="absolute -top-3 -right-3 p-1.5 text-mat-faint hover:text-mat-red disabled:opacity-40 transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-mat-card border border-mat-border-strong text-[11px] leading-none flex items-center justify-center">
          ×
        </span>
      </button>
    </div>
  );

  return (
    <Card>
      <p className="text-sm font-semibold text-mat-muted mb-3">Techniques drilled</p>

      {searchOpen ? (
        <input
          type="text"
          autoFocus
          placeholder="Search techniques..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onBlur={() => {
            if (!search) setSearchOpen(false);
          }}
          className="w-full min-h-[40px] rounded-lg bg-mat-bg border border-mat-border-strong text-mat-text placeholder-mat-faint px-3 text-sm outline-none transition-all duration-200 focus:border-mat-red"
        />
      ) : (
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search techniques"
          className="text-mat-faint hover:text-mat-red transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {techniques.length === 0 ? (
        <p className="text-sm text-mat-faint italic mt-3">No techniques available yet.</p>
      ) : hasSearch ? (
        <div className="max-h-40 overflow-y-auto no-scrollbar flex flex-wrap gap-2 mt-3">
          {filteredTechniques.length === 0 ? (
            <p className="text-sm text-mat-faint italic">No techniques match "{search}".</p>
          ) : (
            filteredTechniques.map(renderPill)
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-3">
          {groupedTechniques.map((g) => (
            <CollapsibleSection key={g.category} title={CATEGORY_LABELS[g.category] ?? g.category} defaultOpen={false}>
              <div className="flex flex-wrap gap-2">{g.items.map(renderPill)}</div>
            </CollapsibleSection>
          ))}
        </div>
      )}

      {selectedNames.length > 0 && (
        <p className="text-xs text-mat-muted mt-3">
          <span className="text-mat-faint">Selected:</span> {selectedNames.join(', ')}
        </p>
      )}
    </Card>
  );
}
