import React, { useRef, useEffect } from 'react';

type RichEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  showAreaToken?: boolean;
  minHeight?: string;
};

function wrapSelection(ref: React.RefObject<HTMLDivElement>, tag: string, style?: string, className?: string) {
  const el = ref.current;
  if (!el) return;
  el.focus();
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !el.contains(sel.anchorNode)) return;
  const range = sel.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return;
  const wrapper = document.createElement(tag);
  if (style) wrapper.setAttribute('style', style);
  if (className) wrapper.className = className;
  try {
    range.surroundContents(wrapper);
  } catch {
    const frag = range.extractContents();
    wrapper.appendChild(frag);
    range.insertNode(wrapper);
  }
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  newRange.collapse(false);
  sel.addRange(newRange);
  return el.innerHTML;
}

function insertTextAtCursor(ref: React.RefObject<HTMLDivElement>, text: string) {
  const el = ref.current;
  if (!el) return;
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  // If no selection inside editor, append
  if (!el.contains(sel.anchorNode as Node)) {
    el.focus();
    document.execCommand('insertText', false, text);
  } else {
    document.execCommand('insertText', false, text);
  }
  return el.innerHTML;
}

export function RichEditor({ value, onChange, placeholder, showAreaToken, minHeight = '40px' }: RichEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleWrap = (tag: string, style?: string, cls?: string) => {
    const html = wrapSelection(ref, tag, style, cls);
    if (html !== undefined && ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-[6px] border border-[var(--ods-border)] bg-[#fafafb]/80">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleWrap('strong')}
          className="h-6 px-2 text-[11px] font-bold border border-[var(--ods-border)] rounded-[4px] bg-white hover:bg-[var(--ods-bg-secondary)]"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleWrap('span', 'color:#2563eb')}
          className="h-6 px-2 text-[11px] font-medium border border-[var(--ods-border)] rounded-[4px] bg-white hover:bg-[var(--ods-bg-secondary)] text-[#2563eb]"
          title="Blue color"
        >
          A<span className="text-[#2563eb]">●</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleWrap('span', 'color:#0D2A4C')}
          className="h-6 px-2 text-[11px] font-medium border border-[var(--ods-border)] rounded-[4px] bg-white hover:bg-[var(--ods-bg-secondary)] text-[#0D2A4C]"
          title="Dark color"
        >
          A<span className="text-[#0D2A4C]">●</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleWrap('mark', undefined, 'bg-[#FFEB3B] rounded px-0.5')}
          className="h-6 px-2 text-[11px] font-medium border border-[var(--ods-border)] rounded-[4px] bg-white hover:bg-[#fef9c3]"
          title="Highlight (yellow)"
        >
          <span className="bg-[#FFEB3B] px-1 rounded">H</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleWrap('span', 'text-decoration:underline; text-decoration-color:#1D5BBF; text-underline-offset:4px; font-weight:700')}
          className="h-6 px-2 text-[11px] font-medium border border-[var(--ods-border)] rounded-[4px] bg-white hover:bg-[var(--ods-bg-secondary)] underline decoration-[#1D5BBF] underline-offset-4"
          title="Underline (for Your Area)"
        >
          U
        </button>
        {showAreaToken && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const html = insertTextAtCursor(ref, '{{area}}');
              if (html !== undefined && ref.current) onChange(ref.current.innerHTML);
            }}
            className="h-6 px-2.5 text-[11px] font-medium border border-dashed border-[var(--ods-border)] rounded-[4px] bg-white hover:bg-[#f0f6ff] hover:border-[#2563eb] hover:text-[#2563eb]"
          >
            + {'{{area}}'}
          </button>
        )}
        <span className="ml-auto text-[10px] text-[var(--ods-text-tertiary)] hidden sm:inline">Select text then click a style</span>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="w-full p-3 text-[13px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)] min-h-[40px] empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--ods-text-tertiary)] empty:before:text-[13px]"
        style={{ minHeight }}
      />
      <p className="text-[11px] text-[var(--ods-text-tertiary)]">Select text, then pick a style.</p>
    </div>
  );
}
