/**
 * Single resolver for {{area}} / {{city}} tokens.
 * Source of truth is the HTML stored from RichEditor in Twenty.
 * Never hardcodes "Your Area" — when no area is known the token
 * stays visible as a dashed placeholder so template vs tailored is obvious.
 */

export function resolveAreaTokens(
  html: string,
  opts: { area?: string; keepTokenIfMissing?: boolean } = {},
): string {
  if (!html) return html;
  const area = (opts.area || '').trim();
  const keepToken = opts.keepTokenIfMissing !== false;

  // 1. FIRST: resolve {{area}} already wrapped in a styled underline span
  // in Twenty-stored HTML. Must run before the bare-token pass, otherwise
  // the bare-token pass converts the inner {{area}} into a nested span
  // (previous bug: nested <span><span> output + leaked style text).
  let out = html.replace(
    /<span([^>]*text-decoration:\s*underline[^>]*)>\{\{\s*area\s*\}\}<\/span>/gi,
    (_m, attrs: string) => {
      const cleanAttrs = attrs
        .replace(/\s*style\s*=\s*"[^"]*"/gi, '')
        .replace(/\s*style\s*=\s*'[^']*'/gi, '')
        .replace(/\s*data-token\s*=\s*"[^"]*"/gi, '')
        .replace(/\s*data-token\s*=\s*'[^']*'/gi, '');
      if (area) return `<span${cleanAttrs} style="text-decoration:underline; text-decoration-color:#1D5BBF; text-underline-offset:4px; font-weight:700">${area}</span>`;
      if (keepToken)
        return `<span${cleanAttrs} data-token="area" style="text-decoration:underline dashed; text-decoration-color:#1D5BBF; text-underline-offset:4px; font-weight:700; opacity:0.7">{{area}}</span>`;
      return `<span${cleanAttrs} style="text-decoration:underline; text-decoration-color:#1D5BBF; text-underline-offset:4px; font-weight:700">Your Area</span>`;
    },
  );

  // 2. THEN: bare tokens in text nodes only (split tags out so replaces
  // never touch attributes — previous bug leaked style="..." as text).
  // Track underline-span depth so we never nest inside the span step 1
  // just emitted (its inner {{area}} becomes plain text, wrapper exists).
  // Note: data-token uses "area" (no braces) so this never re-matches output.
  const parts = out.split(/(<[^>]*>)/g);
  let underlineDepth = 0;
  out = parts
    .map((part) => {
      if (part.startsWith('<')) {
        if (/^<span[^>]*underline/i.test(part)) underlineDepth += 1;
        else if (/^<\/span/i.test(part)) underlineDepth = Math.max(0, underlineDepth - 1);
        return part; // tag — leave untouched
      }
      if (underlineDepth > 0) {
        // Inside an underline wrapper step 1 emitted: plain text only, no new span.
        return part.replace(/\{\{\s*(area|city)\s*\}\}/gi, () => area || '{{area}}');
      }
      return part.replace(/\{\{\s*(area|city)\s*\}\}/gi, () => {
        if (area)
          return `<span style="text-decoration:underline; text-decoration-color:#1D5BBF; text-underline-offset:4px; font-weight:700">${area}</span>`;
        return `<span data-token="area" style="text-decoration:underline dashed; text-decoration-color:#1D5BBF; text-underline-offset:4px; font-weight:700; opacity:0.7">{{area}}</span>`;
      });
    })
    .join('');

  // 3. Highlight bare "(like yours)" — skip occurrences already inside <mark>
  // by splitting and tracking mark depth.
  const markParts = out.split(/(<\/?mark[^>]*>)/gi);
  let depth = 0;
  out = markParts
    .map((p) => {
      if (/^<mark[\s>]/i.test(p)) {
        depth += 1;
        return p;
      }
      if (/^<\/mark\s*>/i.test(p)) {
        depth = Math.max(0, depth - 1);
        return p;
      }
      if (p.startsWith('<')) return p;
      if (depth > 0) return p;
      return p.replace(
        /\(like yours\)/g,
        '<mark style="background:#FFEB3B; border-radius:2px; padding:0 2px">(like yours)</mark>',
      );
    })
    .join('');

  return out;
}
