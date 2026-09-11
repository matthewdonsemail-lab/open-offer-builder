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
import { api } from '@/lib/api';

function fetchIndustries() {
  return api.industries.list();
}

interface IndustrySelectProps {
  value?: string; // campaign industryId SELECT value (e.g. AUTO_DETAILING); '' = none
  onChange: (key: string) => void;
  placeholder?: string;
}

export function IndustrySelect({ value, onChange, placeholder = 'Industry (optional)...' }: IndustrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { data: industries, isLoading } = useQuery({
    queryKey: ['industries-select'],
    queryFn: fetchIndustries,
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
    if (!industries) return [];
    if (!query) return industries.slice(0, 20);
    const q = query.toLowerCase();
    return industries.filter((i) => i.label.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)).slice(0, 20);
  }, [industries, query]);

  const selected = industries?.find((i) => i.key === value);
  const displayValue = value ? (selected ? selected.label : value) : '';

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
                  placeholder="Type industry name..."
                  className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--ods-text-tertiary)]"
                />
              </div>
            </div>
            <div className="max-h-[240px] overflow-y-auto py-1">
              {isLoading ? (
                <div className="px-3 py-6 text-center text-[13px] text-[var(--ods-text-tertiary)]">Loading...</div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onChange('');
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left px-3 h-9 flex items-center justify-between gap-2 text-[13px] hover:bg-[var(--ods-bg-secondary)] transition-colors ${
                      !value ? 'bg-[var(--ods-bg-secondary)] text-[var(--ods-text-primary)] font-medium' : 'text-[var(--ods-text-secondary)]'
                    }`}
                  >
                    <span className="font-medium">None</span>
                    {!value && <Check className="w-3.5 h-3.5 text-[var(--ods-brand-600)] shrink-0" />}
                  </button>
                  {filtered.length === 0 ? (
                    <div className="px-3 py-3 text-center text-[12px] text-[var(--ods-text-tertiary)]">
                      {industries?.length ? 'No results' : 'No industries configured — set an industryId on a campaign in Twenty.'}
                    </div>
                  ) : (
                    filtered.map((ind) => (
                      <button
                        key={ind.key}
                        onClick={() => {
                          onChange(ind.key);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className={`w-full text-left px-3 h-9 flex items-center justify-between gap-2 text-[13px] hover:bg-[var(--ods-bg-secondary)] transition-colors ${
                          ind.key === value ? 'bg-[var(--ods-bg-secondary)] text-[var(--ods-text-primary)] font-medium' : 'text-[var(--ods-text-secondary)]'
                        }`}
                      >
                        <span className="truncate">
                          <span className="font-medium">{ind.label}</span>
                          {ind.key !== ind.label && <span className="ml-1.5 text-[11px] text-[var(--ods-text-tertiary)]">{ind.key}</span>}
                        </span>
                        {ind.key === value && <Check className="w-3.5 h-3.5 text-[var(--ods-brand-600)] shrink-0" />}
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}