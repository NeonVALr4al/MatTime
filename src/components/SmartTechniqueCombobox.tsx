import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

type Technique = {
  id: string;
  name: string;
  category: string;
  isPopular: boolean;
};

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

const CATEGORY_ORDER = ['submission', 'sweep', 'takedown', 'escape', 'guard pass', 'guard retention'];

const CATEGORY_LABELS: Record<string, string> = {
  submission: 'Submissions',
  sweep: 'Sweeps',
  takedown: 'Takedowns',
  escape: 'Escapes',
  'guard pass': 'Guard Passing',
  'guard retention': 'Guard Retention',
};

const POPULAR_NAMES = new Set(['Armbar', 'Triangle Choke', 'Double Leg', 'Toreando Pass', 'Berimbolo']);

export default function SmartTechniqueCombobox({ selectedIds, onChange }: Props) {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('techniques').select('id, name, category').order('name');
      if (!error && data) {
        setTechniques(
          data
            .filter((t) => CATEGORY_ORDER.includes(t.category))
            .map((t) => ({ id: t.id, name: t.name, category: t.category, isPopular: POPULAR_NAMES.has(t.name) }))
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q ? techniques.filter((t) => t.name.toLowerCase().includes(q)) : techniques;
    return CATEGORY_ORDER.map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      items: matching.filter((t) => t.category === key),
    })).filter((g) => g.items.length > 0);
  }, [techniques, query]);

  const flatList = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const flatIndexById = useMemo(() => {
    const m = new Map<string, number>();
    flatList.forEach((t, i) => m.set(t.id, i));
    return m;
  }, [flatList]);

  useEffect(() => {
    const item = flatList[highlightedIndex];
    if (!item) return;
    document.getElementById(`technique-option-${item.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, flatList]);

  const popularTechniques = useMemo(
    () => techniques.filter((t) => t.isPopular).slice(0, 5),
    [techniques]
  );

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlightedIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatList[highlightedIndex];
      if (item) toggle(item.id);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const highlightedId = flatList[highlightedIndex]?.id;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-mat-muted">Techniques drilled</p>

      {popularTechniques.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {popularTechniques.map((t) => {
            const isSelected = selectedIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={`min-h-[36px] px-3 rounded-full text-xs font-semibold border transition-colors active:scale-[0.98] ${
                  isSelected
                    ? 'bg-mat-accent-fill border-mat-accent-border text-mat-accent'
                    : 'bg-mat-fill border-mat-border-strong text-mat-faint hover:border-mat-accent hover:text-mat-text'
                }`}
              >
                {isSelected ? '✓' : '+'} {t.name}
              </button>
            );
          })}
        </div>
      )}

      <div ref={containerRef} className="relative">
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls="technique-listbox"
          aria-activedescendant={highlightedId ? `technique-option-${highlightedId}` : undefined}
          aria-autocomplete="list"
          aria-label="Search and select techniques drilled"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Loading techniques...' : 'Search techniques...'}
          disabled={loading}
          className="w-full min-h-[44px] rounded-lg bg-mat-fill text-mat-text placeholder-mat-faint px-3 text-sm outline-none border border-mat-border-strong transition-all duration-200 focus:border-mat-accent focus:ring-1 focus:ring-mat-accent/20 disabled:opacity-50"
        />

        {open && !loading && (
          <ul
            id="technique-listbox"
            role="listbox"
            aria-multiselectable="true"
            className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto no-scrollbar rounded-lg bg-mat-card border border-mat-border-strong shadow-lg py-1"
          >
            {flatList.length === 0 ? (
              <li className="px-3 py-2 text-xs text-mat-faint">No techniques match "{query}".</li>
            ) : (
              groups.map((group) => (
                <li key={group.key}>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-mat-faint">
                    {group.label}
                  </p>
                  <ul>
                    {group.items.map((t) => {
                      const isHighlighted = flatIndexById.get(t.id) === highlightedIndex;
                      const isSelected = selectedIds.includes(t.id);
                      return (
                        <li
                          key={t.id}
                          id={`technique-option-${t.id}`}
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => setHighlightedIndex(flatIndexById.get(t.id) ?? 0)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => toggle(t.id)}
                          className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                            isHighlighted ? 'bg-mat-accent-fill' : 'hover:bg-mat-card-hover'
                          } ${isSelected ? 'text-mat-accent' : 'text-mat-text'}`}
                        >
                          <span>{t.name}</span>
                          {isSelected && <span className="text-mat-accent text-xs">✓</span>}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.map((id) => {
            const t = techniques.find((x) => x.id === id);
            if (!t) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 min-h-[32px] pl-3 pr-2 rounded-full bg-mat-accent-fill border border-mat-accent-border text-mat-accent text-xs font-semibold"
              >
                {t.name}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  aria-label={`Remove ${t.name}`}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-mat-accent/20 transition-colors"
                >
                  ✕
                </button>
              </span>
            );
          })}
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
