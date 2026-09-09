import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { WidgetCard } from '@/components/ui/WidgetCard';

export type ProposalItem = {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'notion' | 'link';
  description?: string;
};

export type ProposalsData = {
  proposals: ProposalItem[];
};

const DEFAULT_PROPOSALS: ProposalsData = {
  proposals: [
    { id: 'p1', title: 'Example Proposal — White Sands Growth Plan', url: 'https://example.com/proposal.pdf', type: 'pdf', description: 'Detailed growth plan for the prospect.' },
  ],
};

function genId() {
  return Math.random().toString(36).slice(2, 8);
}

export function ProposalsForm({
  value,
  onChange,
}: {
  value?: ProposalsData;
  onChange?: (data: ProposalsData) => void;
}) {
  const [data, setData] = useState<ProposalsData>(value || DEFAULT_PROPOSALS);

  React.useEffect(() => {
    if (value) setData(value);
  }, [value]);

  const updateItem = (id: string, patch: Partial<ProposalItem>) => {
    const next = { ...data, proposals: data.proposals.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
    setData(next);
    onChange?.(next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <WidgetCard title="Proposals — outline for this offer">
        <p className="text-[12px] text-[var(--ods-text-secondary)] mb-3">
          Each proposal is a link or embed shown on the <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">Proposals</code> tab and optionally on the landing page. Add the actual proposal URL (Notion, PDF, or external link) — it will be stored as <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">proposalsConfig</code> RAW_JSON on <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">agencyOffer</code>.
        </p>

        <div className="space-y-3">
          {data.proposals.map((p, idx) => (
            <div key={p.id} className="rounded-[6px] border border-[var(--ods-border)] p-3 bg-[#fafafb]/50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[var(--ods-text-tertiary)]">{idx + 1}.</span>
                <input
                  value={p.title}
                  onChange={(e) => updateItem(p.id, { title: e.target.value })}
                  placeholder="Proposal title"
                  className="flex-1 h-8 px-2.5 text-[12px] font-medium border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                />
                <select
                  value={p.type}
                  onChange={(e) => updateItem(p.id, { type: e.target.value as any })}
                  className="h-8 px-2 text-[11px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                >
                  <option value="pdf">PDF</option>
                  <option value="notion">Notion</option>
                  <option value="link">Link</option>
                </select>
                <button
                  onClick={() => {
                    const next = { ...data, proposals: data.proposals.filter((x) => x.id !== p.id) };
                    setData(next);
                    onChange?.(next);
                  }}
                  className="p-1 rounded hover:bg-black/[0.06] text-[var(--ods-text-tertiary)] hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                value={p.url}
                onChange={(e) => updateItem(p.id, { url: e.target.value })}
                placeholder="https://.../proposal"
                className="w-full h-8 px-2.5 text-[12px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
              />
              <input
                value={p.description || ''}
                onChange={(e) => updateItem(p.id, { description: e.target.value })}
                placeholder="Short description (optional)"
                className="w-full h-7 px-2.5 text-[11px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
              />
            </div>
          ))}

          <button
            onClick={() => {
              const next = { ...data, proposals: [...data.proposals, { id: genId(), title: '', url: '', type: 'link' as const, description: '' }] };
              setData(next);
              onChange?.(next);
            }}
            className="w-full h-8 text-[12px] font-medium border border-dashed border-[var(--ods-border)] rounded-[6px] hover:bg-[var(--ods-bg-secondary)] hover:border-[var(--ods-brand-600)] hover:text-[var(--ods-brand-600)] inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3 h-3" /> Add proposal
          </button>
          <p className="text-[11px] text-[var(--ods-text-tertiary)]">Outline here will be rendered in Preview & Proposals tab. Stored as <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">proposalsConfig</code> on <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">agencyOffer</code>.</p>
        </div>
      </WidgetCard>
    </div>
  );
}
