import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal,
} from '@floating-ui/react';
import {
  CheckCircleIcon,
  StarIcon,
  HeartIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

const BADGE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  check: CheckCircleIcon,
  star: StarIcon,
  heart: HeartIcon,
  zap: BoltIcon,
};

export type ThankYouVideoItem = {
  id: string;
  title: string;
  hosting: string;
  videoTitle: string;
};

export type ThankYouData = {
  badgeIcon: string;
  badgeText: string;
  heading: string;
  video: { title: string; hosting: string };
  videoGrid: { columns: number; items: ThankYouVideoItem[] };
};

const DEFAULT_THANKYOU: ThankYouData = {
  badgeIcon: 'check',
  badgeText: "You're booked",
  heading: "You've taken your first step towards scaling your agency, now here's your second. Please watch this short video",
  video: { title: '', hosting: 'Self-hosted' },
  videoGrid: {
    columns: 2,
    items: [
      { id: 'v1', title: '', hosting: 'Self-hosted', videoTitle: '' },
      { id: 'v2', title: '', hosting: 'Self-hosted', videoTitle: '' },
    ],
  },
};

function genId() {
  return Math.random().toString(36).slice(2, 8);
}

function FloatingSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });
  return (
    <>
      <button
        ref={refs.setReference}
        onClick={() => setOpen((v) => !v)}
        type="button"
        className={`flex items-center justify-between gap-2 border border-[var(--ods-border)] rounded-[6px] bg-white hover:border-[var(--ods-border-strong)] focus:outline-none focus:border-[var(--ods-brand-600)] transition-colors ${className}`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className="w-3 h-3 shrink-0 text-[var(--ods-text-tertiary)] opacity-70" />
      </button>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-[60] min-w-[160px] py-1 bg-white border border-[var(--ods-border)] rounded-[6px] shadow-lg flex flex-col gap-0.5"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`mx-1 h-7 px-2.5 rounded-[4px] flex items-center text-[12px] text-left ${
                  opt === value ? 'bg-[var(--ods-bg-secondary)] font-medium text-[var(--ods-text-primary)]' : 'text-[var(--ods-text-secondary)] hover:bg-[var(--ods-bg-secondary)]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

function BadgeIconSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });
  const SelectedIcon = BADGE_ICON_MAP[value] || CheckCircleIcon;
  const opts = ['check', 'star', 'heart', 'zap'];
  return (
    <>
      <button
        ref={refs.setReference}
        onClick={() => setOpen((v) => !v)}
        type="button"
        className="flex items-center gap-1.5 h-7 pl-2 pr-6 text-[12px] font-medium border border-[var(--ods-border)] rounded-[6px] bg-white hover:border-[var(--ods-border-strong)] focus:outline-none focus:border-[var(--ods-brand-600)] transition-colors min-w-[110px]"
      >
        <SelectedIcon className="w-3.5 h-3.5 shrink-0 text-[var(--ods-text-tertiary)]" />
        <span className="capitalize">{value}</span>
        <ChevronDown className="w-3 h-3 shrink-0 text-[var(--ods-text-tertiary)] opacity-70 ml-auto" />
      </button>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-[60] min-w-[140px] py-1 bg-white border border-[var(--ods-border)] rounded-[6px] shadow-lg flex flex-col gap-0.5"
          >
            {opts.map((opt) => {
              const Icon = BADGE_ICON_MAP[opt] || CheckCircleIcon;
              return (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`mx-1 h-7 px-2.5 rounded-[4px] flex items-center gap-2 text-[12px] text-left ${
                    opt === value
                      ? 'bg-[var(--ods-bg-secondary)] font-medium text-[var(--ods-text-primary)]'
                      : 'text-[var(--ods-text-secondary)] hover:bg-[var(--ods-bg-secondary)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-[var(--ods-text-tertiary)]" />
                  <span className="capitalize">{opt}</span>
                </button>
              );
            })}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export function ThankYouEditor({
  value,
  onChange,
}: {
  value?: ThankYouData;
  onChange?: (data: ThankYouData) => void;
}) {
  const [data, setData] = useState<ThankYouData>(value || DEFAULT_THANKYOU);

  React.useEffect(() => {
    if (value) setData(value);
  }, [value]);

  const update = (patch: Partial<ThankYouData>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.(next);
  };

  const updateVideoGrid = (patch: Partial<ThankYouData['videoGrid']>) => {
    const next = { ...data, videoGrid: { ...data.videoGrid, ...patch } };
    setData(next);
    onChange?.(next);
  };

  const updateVideoItem = (id: string, patch: Partial<ThankYouVideoItem>) => {
    const next = {
      ...data,
      videoGrid: { ...data.videoGrid, items: data.videoGrid.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) },
    };
    setData(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-4">
      {/* PageEditorToolbar */}
      <p className="text-[12px] text-[var(--ods-text-secondary)]">Type <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">/</code> in an empty line for blocks. Set up per-UTM text swaps in the <span className="font-medium text-[var(--ods-text-primary)]">UTM swaps</span> tab.</p>

      {/* EditorCanvas */}
      <div className="rounded-[8px] border border-[var(--ods-border,#e5e5e5)] bg-white p-6 space-y-6">
        <span className="text-[11px] text-[var(--ods-text-tertiary)]">Hover any block for actions · type <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">/</code> in an empty line for blocks</span>

        {/* BadgeBlock */}
        <div className="rounded-[6px] border border-dashed border-[var(--ods-border)] p-3 flex flex-col gap-3 bg-[#fafafb]/50">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--ods-text-tertiary)]">Badge</span>
            <BadgeIconSelect value={data.badgeIcon} onChange={(v) => update({ badgeIcon: v })} />
            <input
              value={data.badgeText}
              onChange={(e) => update({ badgeText: e.target.value })}
              placeholder="You're booked"
              className="flex-1 h-8 px-3 text-[13px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--ods-text-tertiary)]">Preview:</span>
            {(() => {
              const PreviewIcon = BADGE_ICON_MAP[data.badgeIcon] || CheckCircleIcon;
              return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--ods-brand-600)] text-white text-[12px] font-medium">
                  <PreviewIcon className="w-3.5 h-3.5 shrink-0" />
                  {data.badgeText || 'Preview badge'}
                </span>
              );
            })()}
          </div>
        </div>

        {/* TextBlock */}
        <div className="rounded-[6px] border border-[var(--ods-border)] p-4 bg-white">
          <textarea
            value={data.heading}
            onChange={(e) => update({ heading: e.target.value })}
            rows={2}
            className="w-full text-[15px] font-medium text-[#0D2A4C] bg-transparent border-none focus:outline-none focus:ring-0 resize-none"
            placeholder="You've taken your first step..."
          />
        </div>

        {/* Video */}
        <div className="rounded-[8px] border border-[var(--ods-border)] bg-white overflow-hidden">
          <div className="px-3 py-2 bg-[#f8f9fc] border-b border-[var(--ods-border)]">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--ods-text-tertiary)]">Video</span>
          </div>
          <div className="p-3">
            <input
              value={data.video.title}
              onChange={(e) => update({ video: { ...data.video, title: e.target.value } })}
              className="w-full h-8 px-3 text-[13px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
              placeholder="https://.../video.mp4"
            />
          </div>
        </div>

        {/* VideoGridBlock */}
        <div className="rounded-[8px] border border-[var(--ods-border)] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 bg-[#f8f9fc] border-b border-[var(--ods-border)]">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--ods-text-tertiary)]">Video Grid</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--ods-text-tertiary)]">{data.videoGrid.columns} columns</span>
              <FloatingSelect
                value={`${data.videoGrid.columns} columns`}
                onChange={(v) => updateVideoGrid({ columns: parseInt(v) || 2 })}
                options={['1 columns', '2 columns', '3 columns']}
                className="h-7 pl-2 pr-6 text-[11px] min-w-[110px]"
              />
            </div>
          </div>
          <div className={`grid gap-4 p-4 ${data.videoGrid.columns === 1 ? 'grid-cols-1' : data.videoGrid.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {data.videoGrid.items.map((item, idx) => (
              <div key={item.id} className="rounded-[6px] border border-[var(--ods-border)] p-3 space-y-2 bg-[#fafafb]/30">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[var(--ods-text-tertiary)]">{idx + 1}.</span>
                  <input
                    value={item.title}
                    onChange={(e) => updateVideoItem(item.id, { title: e.target.value })}
                    placeholder="Question/title"
                    className="flex-1 h-7 px-2.5 text-[12px] font-medium border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                  />
                  <FloatingSelect
                    value={item.hosting}
                    onChange={(v) => updateVideoItem(item.id, { hosting: v })}
                    options={['Self-hosted', 'YouTube', 'Vimeo', 'Wistia']}
                    className="h-7 pl-2 pr-6 text-[11px] min-w-[110px]"
                  />
                  <button
                    onClick={() => {
                      const next = { ...data, videoGrid: { ...data.videoGrid, items: data.videoGrid.items.filter((x) => x.id !== item.id) } };
                      setData(next);
                      onChange?.(next);
                    }}
                    className="p-1 rounded hover:bg-black/[0.06] text-[var(--ods-text-tertiary)] hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <input
                  value={item.videoTitle}
                  onChange={(e) => updateVideoItem(item.id, { videoTitle: e.target.value })}
                  placeholder="https://.../video.mp4"
                  className="w-full h-8 px-3 text-[12px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                />
              </div>
            ))}
          </div>
          <div className="px-4 pb-3">
            <button
              onClick={() => {
                const next = { ...data, videoGrid: { ...data.videoGrid, items: [...data.videoGrid.items, { id: genId(), title: '', hosting: 'Self-hosted', videoTitle: '' }] } };
                setData(next);
                onChange?.(next);
              }}
              className="w-full h-8 text-[12px] font-medium border border-dashed border-[var(--ods-border)] rounded-[6px] hover:bg-[var(--ods-bg-secondary)] hover:border-[var(--ods-brand-600)] hover:text-[var(--ods-brand-600)] inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Add video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
