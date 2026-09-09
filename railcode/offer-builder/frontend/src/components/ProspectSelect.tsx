import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Check } from 'lucide-react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal,
} from '@floating-ui/react';
async function fetchProspects() {
  const token = localStorage.getItem('offer-builder-token');
  const res = await fetch(`/api/prospects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch prospects');
  return res.json() as Promise<Array<{ id: string; displayName: string; company?: string; email?: string }>>;
}

interface ProspectSelectProps {
  value?: string; // prospect id (stored in name field)
  onChange: (id: string, displayName: string) => void;
  placeholder?: string;
}

export function ProspectSelect({ value, onChange, placeholder = 'Search prospect / lead...' }: ProspectSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { data: prospects, isLoading } = useQuery({
    queryKey: ['prospects-select'],
    queryFn: fetchProspects,
    enabled: isOpen,
    staleTime: 30_000,
  });

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

  const filtered = useMemo(() => {
    if (!prospects) return [];
    if (!query) return prospects.slice(0, 20);
    const q = query.toLowerCase();
    return prospects.filter((p) => p.displayName.toLowerCase().includes(q) || p.company?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)).slice(0, 20);
  }, [prospects, query]);

  const selected = prospects?.find((p) => p.id === value);
  const displayValue = selected ? selected.displayName : (value || '');

  return (
    <div className="relative">
      <div
        ref={refs.setReference}
        onClick={() => setIsOpen((v) => !v)}
        className="w-full h-10 px-3 flex items-center gap-2 text-[13px] border border-[var(--ods-border,#e5e5ea)] rounded-[4px] bg-white hover:border-[var(--ods-border-strong,#d1d1d6)] cursor-pointer transition-colors"
      >
        <Search className="w-3.5 h-3.5 text-[var(--ods-text-tertiary,#8a8a93)] shrink-0" />
        <span className={`truncate ${displayValue ? 'text-[var(--ods-text-primary,#18181b)]' : 'text-[var(--ods-text-tertiary,#8a8a93)]'}`}>
          {displayValue || placeholder}
        </span>
      </div>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-[60] w-[320px] bg-white border border-[var(--ods-border,#e5e5ea)] rounded-[6px] shadow-lg overflow-hidden flex flex-col"
          >
            <div className="p-2 border-b border-[var(--ods-border,#e5e5ea)]">
              <div className="flex items-center gap-2 h-8 px-2 rounded-[4px] bg-[var(--ods-bg-secondary,#f8f9fc)] border border-[var(--ods-border,#e5e5ea)]">
                <Search className="w-3.5 h-3.5 text-[var(--ods-text-tertiary)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type prospect / lead name..."
                  className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--ods-text-tertiary)]"
                />
              </div>
            </div>
            <div className="max-h-[240px] overflow-y-auto py-1">
              {isLoading ? (
                <div className="px-3 py-6 text-center text-[13px] text-[var(--ods-text-tertiary)]">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-[13px] text-[var(--ods-text-tertiary)]">No results</div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onChange(p.id, p.displayName);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left px-3 h-9 flex items-center justify-between gap-2 text-[13px] hover:bg-[var(--ods-bg-secondary)] transition-colors ${
                      p.id === value ? 'bg-[var(--ods-bg-secondary)] text-[var(--ods-text-primary)] font-medium' : 'text-[var(--ods-text-secondary)]'
                    }`}
                  >
                    <span className="truncate">
                      <span className="font-medium">{p.displayName}</span>
                      {p.company && <span className="ml-1.5 text-[11px] text-[var(--ods-text-tertiary)]">{p.company}</span>}
                    </span>
                    {p.id === value && <Check className="w-3.5 h-3.5 text-[var(--ods-brand-600)] shrink-0" />}
                  </button>
                ))
              )}
            </div>
            {value && (
              <div className="p-2 border-t border-[var(--ods-border)]">
                <button
                  onClick={() => {
                    onChange('', '');
                    setIsOpen(false);
                  }}
                  className="w-full h-7 text-[12px] text-[var(--ods-text-tertiary)] hover:text-[var(--ods-text-primary)] transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
