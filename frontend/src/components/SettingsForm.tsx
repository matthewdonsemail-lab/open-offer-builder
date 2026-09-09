import { WidgetCard } from '@/components/ui/WidgetCard';
import { StatusSelect } from '@/components/common/StatusSelect';

export type SettingsFormData = {
  metaPixelId: string;
  status: string;
  ctaType: string;
};

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', dotColor: 'bg-gray-500', bgTint: 'bg-gray-500/10', textColor: 'text-gray-700' },
  { value: 'ACTIVE', label: 'Active', dotColor: 'bg-green-500', bgTint: 'bg-green-500/10', textColor: 'text-green-700' },
  { value: 'PAUSED', label: 'Paused', dotColor: 'bg-yellow-500', bgTint: 'bg-yellow-500/10', textColor: 'text-yellow-700' },
];

const CTA_OPTIONS = [
  { value: 'consultation', label: 'Consultation', dotColor: 'bg-blue-500', bgTint: 'bg-blue-500/10', textColor: 'text-blue-700' },
  { value: 'pricing', label: 'Pricing', dotColor: 'bg-green-500', bgTint: 'bg-green-500/10', textColor: 'text-green-700' },
  { value: 'custom', label: 'Custom', dotColor: 'bg-gray-500', bgTint: 'bg-gray-500/10', textColor: 'text-gray-700' },
];

interface Props {
  value: SettingsFormData;
  onChange: (next: SettingsFormData) => void;
  title?: string;
}

export function SettingsForm({ value, onChange, title }: Props) {
  const update = (patch: Partial<SettingsFormData>) => onChange({ ...value, ...patch });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <WidgetCard title="Tracking — Meta Pixel">
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1.5">Meta Pixel ID</label>
            <input
              value={value.metaPixelId}
              onChange={(e) => update({ metaPixelId: e.target.value })}
              placeholder="123456789012345"
              className="w-full h-9 px-3 text-[13px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)] font-mono"
            />
            <p className="mt-1.5 text-[11px] text-[var(--ods-text-tertiary)]">
              Base code fires <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">fbq('init', id)</code> + <code className="bg-[var(--ods-bg-secondary)] px-1 rounded">PageView</code> in head. Per-offer overrides global. Leave empty to disable.
            </p>
            {value.metaPixelId && (
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-500/10 text-blue-700 border border-blue-200 text-[11px] font-medium">Pixel: {value.metaPixelId}</span>
                <button
                  onClick={() => {
                    (window as any).fbq && (window as any).fbq('track', 'Lead', { content_name: title || 'offer', content_category: 'quiz' });
                    console.log('[SettingsForm] test Lead fired');
                  }}
                  className="h-7 px-2.5 text-[11px] border border-[var(--ods-border)] rounded-[6px] bg-white hover:bg-[var(--ods-bg-secondary)]"
                >
                  Test Lead event →
                </button>
              </div>
            )}
          </div>
          <div className="rounded-[6px] border border-dashed border-[var(--ods-border)] bg-amber-50 p-3 text-[11px] text-amber-800">
            Implementation: injected via PreviewPage head as<br />
            <code className="bg-white px-1 rounded border text-[11px] font-mono">{"!function(f,b,e,v,n,t,s){...}fbq('init','{id}'); fbq('track','PageView')"}</code><br />
            Quiz options with <strong>FB lead event</strong> checked fire <code className="bg-white px-1 rounded border">fbq('track','Lead',{'{'}content_name, content_category{'}'})</code> on select.
          </div>
        </div>
      </WidgetCard>
      <WidgetCard title="General Settings">
        <p className="text-[13px] text-[var(--ods-text-secondary)]">Offer-level settings migrated from Basic Info — status/CTA now live here. (Future: slug, SEO, GTM.)</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1.5">Status</label>
            <StatusSelect value={value.status} onChange={(v) => update({ status: v })} options={STATUS_OPTIONS} />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1.5">CTA Type</label>
            <StatusSelect value={value.ctaType} onChange={(v) => update({ ctaType: v })} options={CTA_OPTIONS} />
          </div>
        </div>
      </WidgetCard>
    </div>
  );
}
