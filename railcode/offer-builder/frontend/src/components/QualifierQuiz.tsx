import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RichEditor } from '@/components/RichEditor';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal,
} from '@floating-ui/react';

function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });
  return (
    <>
      <div
        ref={refs.setReference}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </div>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-[70] max-w-[280px] rounded-[6px] border border-[var(--ods-border,#e5e7eb)] bg-[#1e2126] px-3 py-2 text-[11px] leading-relaxed text-white shadow-lg"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

function FloatingSelect({
  value,
  onChange,
  options,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });
  const display = value || placeholder || options[0] || '';
  return (
    <>
      <button
        ref={refs.setReference}
        onClick={() => setOpen((v) => !v)}
        type="button"
        className={cn(
          'flex items-center justify-between gap-2 text-left border border-[var(--ods-border)] rounded-[6px] bg-white hover:border-[var(--ods-border-strong)] focus:outline-none focus:border-[var(--ods-brand-600)] transition-colors',
          className
        )}
      >
        <span className="truncate">{display}</span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[var(--ods-text-tertiary)] opacity-70" />
      </button>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-[60] min-w-[180px] max-h-[220px] overflow-y-auto py-1 bg-[var(--ods-bg-primary,#ffffff)] border border-[var(--ods-border,#e5e5ea)] rounded-[6px] shadow-lg flex flex-col gap-0.5"
          >
            {options.map((opt) => (
              <button
                key={opt || '__empty__'}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`mx-1 h-7 px-2.5 rounded-[4px] flex items-center text-[12px] text-left transition-colors ${
                  opt === value
                    ? 'bg-[var(--ods-bg-secondary)] font-medium text-[var(--ods-text-primary)]'
                    : 'text-[var(--ods-text-secondary)] hover:bg-[var(--ods-bg-secondary)] hover:text-[var(--ods-text-primary)]'
                }`}
              >
                <span className="truncate">{opt || '—'}</span>
              </button>
            ))}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export type QuizOption = {
  id: string;
  text: string;
  dq: boolean;
  fbLead: boolean;
  nextQuestion: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  type: string;
  options: QuizOption[];
};

export type QualifierQuizData = {
  introTitle: string;
  introDesc: string;
  questions: QuizQuestion[];
  contactInfo: string;
  onQualified: string;
  calendlyEmbed: string;
};

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What would {{currency}}5000 worth of extra work actually do for your business this month?',
    type: 'Multiple choice',
    options: [
      { id: 'q1o1', text: 'Be so useful', dq: false, fbLead: true, nextQuestion: '' },
      { id: 'q1o2', text: 'Light drop in the water', dq: false, fbLead: false, nextQuestion: '' },
      { id: 'q1o3', text: "Wouldn't do anything", dq: true, fbLead: false, nextQuestion: '' },
      { id: 'q1o4', text: "I'm really struggling", dq: false, fbLead: false, nextQuestion: '' },
    ],
  },
  {
    id: 'q2',
    question: 'Are you the one who calls the shots on marketing?',
    type: 'Multiple choice',
    options: [
      { id: 'q2o1', text: "Yeah, that's me", dq: false, fbLead: true, nextQuestion: '' },
      { id: 'q2o2', text: 'I look after the marketing', dq: false, fbLead: false, nextQuestion: '' },
      { id: 'q2o3', text: 'Nah, just having a look', dq: true, fbLead: false, nextQuestion: '' },
    ],
  },
  {
    id: 'q3',
    question: 'If this brings in work, do you want us to build it out for you?',
    type: 'Multiple choice',
    options: [
      { id: 'q3o1', text: 'Yeah — book my call', dq: false, fbLead: true, nextQuestion: '' },
      { id: 'q3o2', text: 'Yeah — send the details first', dq: false, fbLead: false, nextQuestion: '' },
      { id: 'q3o3', text: 'Nah, just curious', dq: true, fbLead: false, nextQuestion: '' },
    ],
  },
];

const DEFAULT_DATA: QualifierQuizData = {
  introTitle: 'See if your market is available - book a strategy call now',
  introDesc: 'We only work with 1 agency per market — answer a few quick questions.',
  questions: DEFAULT_QUESTIONS,
  contactInfo: 'Collect at end',
  onQualified: 'Show embed',
  calendlyEmbed: '',
};

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

interface Props {
  value?: Partial<QualifierQuizData> & { questions?: QuizQuestion[] } | QuizQuestion[];
  onChange?: (data: QualifierQuizData) => void;
}

export function QualifierQuiz({ value, onChange }: Props) {
  const normalized: QualifierQuizData = (() => {
    if (Array.isArray(value)) {
      return { ...DEFAULT_DATA, questions: value as QuizQuestion[] };
    }
    if (value && typeof value === 'object' && 'questions' in value) {
      return { ...DEFAULT_DATA, ...(value as QualifierQuizData) };
    }
    return DEFAULT_DATA;
  })();

  const [data, setData] = useState<QualifierQuizData>(normalized);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!value) return;
    const next = Array.isArray(value)
      ? { ...DEFAULT_DATA, questions: value as QuizQuestion[] }
      : { ...DEFAULT_DATA, ...(value as QualifierQuizData) };
    // avoid loop if same
    setData((prev) => {
      const a = JSON.stringify(prev);
      const b = JSON.stringify(next);
      return a === b ? prev : next;
    });
  }, [value]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    onChange?.(data);
  }, [data]);

  const update = (patch: Partial<QualifierQuizData>) => setData((d) => ({ ...d, ...patch }));

  const updateQuestion = (qid: string, patch: Partial<QuizQuestion>) =>
    setData((d) => ({ ...d, questions: d.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)) }));

  const updateOption = (qid: string, oid: string, patch: Partial<QuizOption>) =>
    setData((d) => ({
      ...d,
      questions: d.questions.map((q) =>
        q.id === qid ? { ...q, options: q.options.map((o) => (o.id === oid ? { ...o, ...patch } : o)) } : q
      ),
    }));

  const addQuestion = () =>
    setData((d) => ({
      ...d,
      questions: [
        ...d.questions,
        { id: genId(), question: '', type: 'Multiple choice', options: [{ id: genId(), text: '', dq: false, fbLead: true, nextQuestion: '' }] },
      ],
    }));

  const addOption = (qid: string) =>
    setData((d) => ({
      ...d,
      questions: d.questions.map((q) =>
        q.id === qid ? { ...q, options: [...q.options, { id: genId(), text: '', dq: false, fbLead: true, nextQuestion: '' }] } : q
      ),
    }));

  return (
    <div className="rounded-[8px] border border-[var(--ods-border,#e5e7eb)] bg-white">
      {/* Section label */}
      <div className="px-4 py-3 border-b border-[var(--ods-border,#e5e7eb)]">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--ods-text-tertiary,#8a8a93)]">Qualifier Quiz</span>
      </div>

      {/* Intro / qualification headline (RichEditor: same styling + {{area}} tokens as hero copy) */}
      <div className="p-4 border-b border-[var(--ods-border,#e5e7eb)] bg-[#fafafb]/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[var(--ods-text-tertiary)] mb-1">Intro headline</label>
            <RichEditor
              value={data.introTitle}
              onChange={(html) => update({ introTitle: html })}
              placeholder="Intro / qualification headline"
              showAreaToken={false}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--ods-text-tertiary)] mb-1">Supporting description</label>
            <RichEditor
              value={data.introDesc}
              onChange={(html) => update({ introDesc: html })}
              placeholder="Supporting description ({{area}} resolves to prospect city)"
              showAreaToken
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="p-4 space-y-4 bg-white">
        {data.questions.map((q, idx) => (
          <div key={q.id} className="rounded-[8px] border border-[var(--ods-border,#e5e7eb)] bg-white overflow-hidden">
            {/* Question header */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-[#f8f9fc] border-b border-[var(--ods-border,#e5e7eb)]">
              <span className="text-[11px] font-bold text-[var(--ods-text-tertiary)]">Q{idx + 1}</span>
              <input
                value={q.question}
                onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                placeholder="Question text"
                className="flex-1 h-8 px-3 text-[13px] font-medium border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
              />
              <FloatingSelect
                value={q.type}
                onChange={(v) => updateQuestion(q.id, { type: v })}
                options={['Multiple choice', 'Yes / No', 'Text']}
                className="h-8 pl-3 pr-2 text-[12px] font-medium min-w-[140px]"
              />
              <button
                onClick={() => setData((d) => ({ ...d, questions: d.questions.filter((x) => x.id !== q.id) }))}
                className="p-1.5 rounded hover:bg-black/[0.06] text-[var(--ods-text-tertiary)] hover:text-red-600 transition-colors"
                title="Delete question"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Options */}
            <div className="p-3 space-y-2 bg-white">
              {q.options.map((opt) => (
                <div key={opt.id} className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2 items-center">
                  <input
                    value={opt.text}
                    onChange={(e) => updateOption(q.id, opt.id, { text: e.target.value })}
                    placeholder="Answer option"
                    className="h-8 px-3 text-[13px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tooltip content="DQ — Disqualify. When checked, selecting this answer marks the prospect as disqualified and routes them to the Disqualified page. Use for answers that indicate a poor fit (e.g., “No” or “0-15 clients” if you only want larger agencies).">
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--ods-text-secondary)] border border-[var(--ods-border)] rounded-[6px] px-2 h-8 bg-white cursor-pointer hover:bg-[var(--ods-bg-secondary)]">
                        <input
                          type="checkbox"
                          checked={opt.dq}
                          onChange={(e) => updateOption(q.id, opt.id, { dq: e.target.checked })}
                          className="w-3 h-3 rounded border-[var(--ods-border)] accent-red-600"
                        />
                        DQ
                      </label>
                    </Tooltip>
                    <Tooltip content="Facebook lead event — when checked, selecting this answer fires a Facebook Pixel ‘Lead’ event for ad optimization and conversion tracking. Uncheck for answers that should not count as a lead (e.g., disqualified answers like ‘No’).">
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--ods-text-secondary)] border border-[var(--ods-border)] rounded-[6px] px-2 h-8 bg-white cursor-pointer hover:bg-[var(--ods-bg-secondary)]">
                        <input
                          type="checkbox"
                          checked={opt.fbLead}
                          onChange={(e) => updateOption(q.id, opt.id, { fbLead: e.target.checked })}
                          className="w-3 h-3 rounded border-[var(--ods-border)] accent-blue-600"
                        />
                        {opt.fbLead ? 'FB lead event' : 'No FB lead'}
                      </label>
                    </Tooltip>
                    <FloatingSelect
                      value={opt.nextQuestion || 'No routing'}
                      onChange={(v) => updateOption(q.id, opt.id, { nextQuestion: v === 'No routing' ? '' : v })}
                      options={[
                        'No routing',
                        ...data.questions.map((qq, qi) => `Go to Q${qi + 1}: ${qq.question.slice(0, 30) || `Question ${qi + 1}`}`),
                        'Go to Q2: Do you have $5,000 (cash o',
                        'Go to Q3: Does your home care agency',
                      ]}
                      className="h-8 pl-2 pr-6 text-[11px] font-medium min-w-[200px]"
                    />
                    <button
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          questions: d.questions.map((qq) =>
                            qq.id === q.id ? { ...qq, options: qq.options.filter((o) => o.id !== opt.id) } : qq
                          ),
                        }))
                      }
                      className="p-1.5 rounded hover:bg-black/[0.06] text-[var(--ods-text-tertiary)] hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addOption(q.id)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[12px] font-medium text-[var(--ods-text-secondary)] hover:text-[var(--ods-text-primary)] transition-colors"
              >
                <Plus className="w-3 h-3" /> Add option
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full h-9 text-[13px] font-medium border border-dashed border-[var(--ods-border)] rounded-[6px] hover:bg-[var(--ods-bg-secondary)] hover:border-[var(--ods-brand-600)] hover:text-[var(--ods-brand-600)] transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add question
        </button>
      </div>

      {/* Bottom configs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border-t border-[var(--ods-border,#e5e7eb)] bg-[#fafafb]/50">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--ods-text-tertiary)] mb-1.5">Contact Info</label>
          <FloatingSelect
            value={data.contactInfo}
            onChange={(v) => update({ contactInfo: v })}
            options={['Collect at end', 'Collect at start', 'Do not collect']}
            className="w-full h-9 pl-3 pr-8 text-[13px]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--ods-text-tertiary)] mb-1.5">On Qualified</label>
          <FloatingSelect
            value={data.onQualified}
            onChange={(v) => update({ onQualified: v })}
            options={['Show embed', 'Redirect', 'Show message']}
            className="w-full h-9 pl-3 pr-8 text-[13px]"
          />
        </div>
      </div>
    </div>
  );
}
