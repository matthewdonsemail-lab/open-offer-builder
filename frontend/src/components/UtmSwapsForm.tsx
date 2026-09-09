import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { WidgetCard } from '@/components/ui/WidgetCard';

export type UtmRule = {
  id: string;
  match: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  swaps: {
    heroH1?: string;
    heroLede?: string;
    videoUrl?: string;
    quizIntroTitle?: string;
  };
};

export type UtmSwapsData = {
  default: {
    heroH1?: string;
    heroLede?: string;
    videoUrl?: string;
  };
  rules: UtmRule[];
};

const DEFAULT_UTM: UtmSwapsData = {
  default: {},
  rules: [
    {
      id: 'utm1',
      match: { utm_source: 'google', utm_campaign: 'example' },
      swaps: { heroH1: 'For Acme Teams…', heroLede: 'Special for Google traffic', videoUrl: '' },
    },
  ],
};

function genId() {
  return Math.random().toString(36).slice(2, 8);
}

export function UtmSwapsForm({
  value,
  onChange,
}: {
  value?: UtmSwapsData;
  onChange?: (data: UtmSwapsData) => void;
}) {
  const [data, setData] = useState<UtmSwapsData>(value || DEFAULT_UTM);

  React.useEffect(() => {
    if (value) setData(value);
  }, [value]);

  const update = (patch: Partial<UtmSwapsData>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.(next);
  };

  const updateRuleMatch = (id: string, field: keyof UtmRule['match'], val: string) => {
    const next = {
      ...data,
      rules: data.rules.map((r) => (r.id === id ? { ...r, match: { ...r.match, [field]: val } } : r)),
    };
    setData(next);
    onChange?.(next);
  };

  const updateRuleSwap = (id: string, field: keyof UtmRule['swaps'], val: string) => {
    const next = {
      ...data,
      rules: data.rules.map((r) => (r.id === id ? { ...r, swaps: { ...r.swaps, [field]: val } } : r)),
    };
    setData(next);
    onChange?.(next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <WidgetCard title="UTM Swaps — per-UTM text overrides">
        <p className="text-[12px] text-[var(--ods-text-secondary)] mb-3">
          Type <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">/</code> in an empty line for blocks. When URL contains <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">?utm_source=google&utm_campaign=example</code>, the matching rule’s swaps replace the default hero/video/quiz intro. First matching rule wins.
        </p>

        {/* Default */}
        <div className="rounded-[6px] border border-[var(--ods-border)] p-3 bg-[#fafafb]/50 space-y-2">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--ods-text-tertiary)]">Default (no UTM match)</span>
          <input
            value={data.default.heroH1 || ''}
            onChange={(e) => update({ default: { ...data.default, heroH1: e.target.value } })}
            placeholder="Default hero H1"
            className="w-full h-8 px-2.5 text-[12px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
          />
          <input
            value={data.default.heroLede || ''}
            onChange={(e) => update({ default: { ...data.default, heroLede: e.target.value } })}
            placeholder="Default hero lede"
            className="w-full h-8 px-2.5 text-[12px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
          />
          <input
            value={data.default.videoUrl || ''}
            onChange={(e) => update({ default: { ...data.default, videoUrl: e.target.value } })}
            placeholder="Default video URL https://..."
            className="w-full h-8 px-2.5 text-[12px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
          />
        </div>

        {/* Rules */}
        <div className="space-y-3">
          {data.rules.map((rule, idx) => (
            <div key={rule.id} className="rounded-[6px] border border-[var(--ods-border)] p-3 bg-white space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[var(--ods-text-tertiary)]">Rule {idx + 1}</span>
                <div className="flex-1" />
                <button
                  onClick={() => {
                    const next = { ...data, rules: data.rules.filter((r) => r.id !== rule.id) };
                    setData(next);
                    onChange?.(next);
                  }}
                  className="p-1 rounded hover:bg-black/[0.06] text-[var(--ods-text-tertiary)] hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const).map((k) => (
                  <div key={k}>
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">{k}</label>
                    <input
                      value={(rule.match as any)[k] || ''}
                      onChange={(e) => updateRuleMatch(rule.id, k, e.target.value)}
                      placeholder={k === 'utm_source' ? 'google' : k === 'utm_campaign' ? 'example' : ''}
                      className="w-full h-7 px-2 text-[11px] border border-[var(--ods-border)] rounded-[4px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-dashed border-[var(--ods-border)]">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)]">Swaps when matched</label>
                <input
                  value={rule.swaps.heroH1 || ''}
                  onChange={(e) => updateRuleSwap(rule.id, 'heroH1', e.target.value)}
                  placeholder="Swapped hero H1"
                  className="w-full h-7 px-2 text-[11px] border border-[var(--ods-border)] rounded-[4px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                />
                <input
                  value={rule.swaps.heroLede || ''}
                  onChange={(e) => updateRuleSwap(rule.id, 'heroLede', e.target.value)}
                  placeholder="Swapped hero lede"
                  className="w-full h-7 px-2 text-[11px] border border-[var(--ods-border)] rounded-[4px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                />
                <input
                  value={rule.swaps.videoUrl || ''}
                  onChange={(e) => updateRuleSwap(rule.id, 'videoUrl', e.target.value)}
                  placeholder="Swapped video URL"
                  className="w-full h-7 px-2 text-[11px] border border-[var(--ods-border)] rounded-[4px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                />
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              const next = { ...data, rules: [...data.rules, { id: genId(), match: {}, swaps: {} }] };
              setData(next);
              onChange?.(next);
            }}
            className="w-full h-8 text-[12px] font-medium border border-dashed border-[var(--ods-border)] rounded-[6px] hover:bg-[var(--ods-bg-secondary)] hover:border-[var(--ods-brand-600)] hover:text-[var(--ods-brand-600)] inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3 h-3" /> Add UTM rule
          </button>
          <p className="text-[11px] text-[var(--ods-text-tertiary)]">Stored as <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">utmSwaps</code> RAW_JSON on <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">agencyOffer</code>. PreviewPage will apply first matching rule via <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">URLSearchParams</code>.</p>
        </div>
      </WidgetCard>
    </div>
  );
}
