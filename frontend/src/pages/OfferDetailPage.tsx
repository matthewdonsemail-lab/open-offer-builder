import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOffer, useUpdateOffer, useCreateOffer, api } from '@/lib/api';
import { WidgetCard } from '@/components/ui/WidgetCard';
import { Spokes } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { ProspectSelect } from '@/components/ProspectSelect';
import { StatusSelect } from '@/components/common/StatusSelect';
import { QualifierQuiz } from '@/components/QualifierQuiz';
import type { QualifierQuizData } from '@/components/QualifierQuiz';
import { ThankYouEditor } from '@/components/ThankYouEditor';
import type { ThankYouData } from '@/components/ThankYouEditor';
import { DisqualifiedForm } from '@/components/DisqualifiedForm';
import type { DisqualifiedData } from '@/components/DisqualifiedForm';
import { SettingsForm } from '@/components/SettingsForm';
import { RichEditor } from '@/components/RichEditor';
import { resolveAreaTokens } from '@/lib/resolveTokens';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { data: offer, isLoading } = useOffer(isNew ? undefined : id);
  const updateMutation = useUpdateOffer();
  const createMutation = useCreateOffer();

  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [prospectName, setProspectName] = useState(''); // normalized display name
  const [heroH1, setHeroH1] = useState('');
  const [heroLede, setHeroLede] = useState('');
  const [videoUrl, setVideoUrl] = useState({ primaryLinkLabel: '', primaryLinkUrl: '', secondaryLinks: [] as any[] });
  const [status, setStatus] = useState('DRAFT');
  const [ctaType, setCtaType] = useState('CONSULTATION');
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [metaPixelId, setMetaPixelId] = useState('');
  const [saving, setSaving] = useState(false);
  const defaultQuizData: QualifierQuizData = {
    introTitle: '',
    introDesc: '',
    questions: [],
    contactInfo: 'Collect at end',
    onQualified: 'Show embed',
    calendlyEmbed: '',
  };
  const [quizData, setQuizData] = useState<QualifierQuizData>(defaultQuizData);

  type MediaLogo = { src: string; alt?: string; href?: string };
  const [mediaLogos, setMediaLogos] = useState<MediaLogo[]>([]);
  const [carouselHeading, setCarouselHeading] = useState('');
  const [carouselDesc, setCarouselDesc] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandSub, setBrandSub] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  type UtmRule = { id: string; utmSource: string; field: 'heroH1' | 'heroLede' | 'title'; html: string };
  const [utmSwaps, setUtmSwaps] = useState<{ rules: UtmRule[] }>({ rules: [] });  const [thankYouData, setThankYouData] = useState<ThankYouData | undefined>(undefined);
  const [disqualifiedData, setDisqualifiedData] = useState<DisqualifiedData | undefined>(undefined);

  useEffect(() => {
    if (offer) {
      setTitle(offer.title || '');
      setName(offer.name || (offer as any).prospectId || '');
      setHeroH1(offer.heroH1 || '');
      setHeroLede(offer.heroLede?.markdown || '');
      setVideoUrl(offer.videoUrl || { primaryLinkLabel: '', primaryLinkUrl: '', secondaryLinks: [] });
      setStatus((offer.status as string) || 'DRAFT');
      setCtaType(((offer.ctaType as string) || 'CONSULTATION').toUpperCase());
      const cal = (offer as any).calendlyUrl || '';
      setCalendlyUrl(cal);
      setMetaPixelId((offer as any).metaPixelId || '');
      // Reset everything first so switching offers can never leak one
      // record's configs into another — then fill from this record only.
      setQuizData((prev) => ({ ...prev, questions: [], calendlyEmbed: cal }));
      setThankYouData(undefined);
      setDisqualifiedData(undefined);
      // hydrate quiz if stored as JSON string, array (legacy) or object (with intro copy) —
      // normalize string options to new object shape
      const rawQuiz = (offer as any).quizConfig || (offer as any).quiz;
      if (rawQuiz) {
        try {
          const parsed = typeof rawQuiz === 'string' ? JSON.parse(rawQuiz) : rawQuiz;
          const quizObj = !Array.isArray(parsed) && parsed && typeof parsed === 'object' ? parsed : null;
          const list = Array.isArray(parsed) ? parsed : (Array.isArray(quizObj?.questions) ? quizObj.questions : []);
          if (quizObj && (typeof quizObj.introTitle === 'string' || typeof quizObj.introDesc === 'string')) {
            setQuizData((prev) => ({
              ...prev,
              introTitle: typeof quizObj.introTitle === 'string' ? quizObj.introTitle : prev.introTitle,
              introDesc: typeof quizObj.introDesc === 'string' ? quizObj.introDesc : prev.introDesc,
            }));
          }
          if (list.length) {
            const normalized = list.map((q: any) => ({
              id: q.id || `q-${Math.random().toString(36).slice(2,6)}`,
              question: q.question || q.text || '',
              type: q.type || 'Multiple choice',
              options: (q.options || []).map((o: any) =>
                typeof o === 'string'
                  ? { id: `opt-${Math.random().toString(36).slice(2,6)}`, text: o, dq: false, fbLead: true, nextQuestion: '' }
                  : { id: o.id || `opt-${Math.random().toString(36).slice(2,6)}`, text: o.text || o.label || '', dq: !!o.dq, fbLead: o.fbLead ?? true, nextQuestion: o.nextQuestion || '' }
              ),
            }));
            setQuizData((prev) => ({ ...prev, questions: normalized, calendlyEmbed: cal || prev.calendlyEmbed }));
          }
        } catch {}
      }
      const rawThank = (offer as any).thankYouConfig;
      if (rawThank) {
        try {
          const parsed = typeof rawThank === 'string' ? JSON.parse(rawThank) : rawThank;
          if (parsed && typeof parsed === 'object') setThankYouData(parsed);
        } catch {}
      }
      // Media logos: [{src, alt}] (legacy: bare string array)
      const rawLogos = (offer as any).mediaLogos;
      if (rawLogos) {
        try {
          const parsed = typeof rawLogos === 'string' ? JSON.parse(rawLogos) : rawLogos;
          const list = Array.isArray(parsed) ? parsed : parsed?.logos;
          if (Array.isArray(list)) {
            setMediaLogos(
              list
                .filter((l: any) => l && (typeof l === 'string' || typeof l.src === 'string'))
                .map((l: any) => typeof l === 'string'
                  ? { src: l }
                  : {
                    src: l.src,
                    ...(typeof l.alt === 'string' ? { alt: l.alt } : {}),
                    ...(typeof l.href === 'string' ? { href: l.href } : {}),
                  }),
            );
          }
        } catch {}
      }
      // Carousel copy (RichEditor-managed like hero copy)
      if (typeof (offer as any).carouselHeading === 'string') {
        setCarouselHeading((offer as any).carouselHeading);
      }
      const rawCarouselDesc = (offer as any).carouselDesc;
      if (typeof rawCarouselDesc === 'string') {
        setCarouselDesc(rawCarouselDesc);
      } else if (rawCarouselDesc && typeof rawCarouselDesc.markdown === 'string') {
        setCarouselDesc(rawCarouselDesc.markdown);
      }
      // Brand header above the hero H1 (logo left, name right, sub beneath)
      if (typeof (offer as any).brandName === 'string') setBrandName((offer as any).brandName);
      if (typeof (offer as any).brandSub === 'string') setBrandSub((offer as any).brandSub);
      if (typeof (offer as any).brandLogoUrl === 'string') setBrandLogoUrl((offer as any).brandLogoUrl);
      const rawDisq = (offer as any).disqualifiedConfig;
      if (rawDisq) {
        try {
          const parsed = typeof rawDisq === 'string' ? JSON.parse(rawDisq) : rawDisq;
          if (parsed && typeof parsed === 'object') setDisqualifiedData(parsed);
        } catch {}
      }
      // UTM swaps: { rules: [{ utmSource, field, html }] } (legacy: bare array)
      const rawUtm = (offer as any).utmSwaps;
      if (rawUtm) {
        try {
          const parsed = typeof rawUtm === 'string' ? JSON.parse(rawUtm) : rawUtm;
          const list = Array.isArray(parsed) ? parsed : parsed?.rules;
          if (Array.isArray(list)) {
            setUtmSwaps({
              rules: list
                .filter((r: any) => r && typeof r === 'object')
                .map((r: any) => ({
                  id: typeof r.id === 'string' ? r.id : `utm-${Math.random().toString(36).slice(2, 8)}`,
                  utmSource: typeof r.utmSource === 'string' ? r.utmSource : '',
                  field: r.field === 'heroLede' || r.field === 'title' ? r.field : 'heroH1',
                  html: typeof r.html === 'string' ? r.html : '',
                })),
            });
          }
        } catch {}
      }
    }
  }, [offer]);

  const [activeTab, setActiveTab] = useState<'landing'|'thankyou'|'disqualified'|'settings'|'utm'>('landing');
  const TABS: Array<{id:'landing'|'thankyou'|'disqualified'|'settings'|'utm', label:string}> = [
    { id: 'landing', label: 'Landing page' },
    { id: 'thankyou', label: 'Thank-you' },
    { id: 'disqualified', label: 'Disqualified' },
    { id: 'settings', label: 'Settings' },
    { id: 'utm', label: 'UTM swaps' },
  ];
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    // Try full payload first, then retry without Twenty-missing fields (status/ctaType/quiz) on 400
    const buildData = (includeExtras: boolean): any => {
      const base: any = {
        ...(title && { title }),
        ...(name && { name }),
        ...(heroH1 && { heroH1 }),
        ...(heroLede && { heroLede: { blocknote: null, markdown: heroLede } }),
        videoUrl,
        prospectId: name || undefined,
        quizConfig: {
          introTitle: quizData.introTitle || undefined,
          introDesc: quizData.introDesc || undefined,
          questions: quizData.questions,
        },
        thankYouConfig: thankYouData || undefined,
        disqualifiedConfig: disqualifiedData || undefined,
        ...(mediaLogos.length > 0 && { mediaLogos }),
        ...(carouselHeading.trim() && { carouselHeading }),
        ...(carouselDesc.trim() && { carouselDesc: { blocknote: null, markdown: carouselDesc } }),
        ...(brandName.trim() && { brandName }),
        ...(brandSub.trim() && { brandSub }),
        ...(brandLogoUrl.trim() && { brandLogoUrl }),
        ...(utmSwaps.rules.length > 0 && { utmSwaps: { rules: utmSwaps.rules } }),
        // prefer QualifierQuiz's calendlyEmbed, fallback to separate state
        ...( (quizData.calendlyEmbed || calendlyUrl) && { calendlyUrl: quizData.calendlyEmbed || calendlyUrl }),
      };
      if (includeExtras) {
        base.status = status;
        base.ctaType = ctaType;
      }
      return base;
    };
    const attempt = async (includeExtras: boolean) => {
      const data = buildData(includeExtras);
      console.log('[OfferDetail] saving', isNew ? 'create' : 'update', includeExtras ? 'with extras' : 'without extras', { id, data });
      console.log('[OfferDetail] JSON:', JSON.stringify(data, null, 2));
      if (isNew) return createMutation.mutateAsync(data);
      if (id) return updateMutation.mutateAsync({ id, data });
      throw new Error('No id');
    };
    try {
      let res;
      try {
        res = await attempt(true);
      } catch (e: any) {
        const msg = e?.message || '';
        if (msg.includes("doesn't have any") && msg.includes('status')) {
          console.warn('[OfferDetail] Twenty missing status/quiz fields — retrying without extras', msg);
          res = await attempt(false);
        } else throw e;
      }
      console.log('[OfferDetail] saved:', res);
      // Save → preview bridge: notify embedded preview tabs/iframes.
      // PreviewPage also polls every 20s (covers cross-origin Twenty iframes).
      const savedId = (res as any)?.id || (!isNew ? id : undefined);
      if (savedId) {
        try {
          localStorage.setItem(`offer:saved:${savedId}`, String(Date.now()));
          window.parent.postMessage({ type: 'offer:saved', id: savedId }, '*');
          console.log('[OfferDetail] broadcast offer:saved', savedId);
        } catch {}
      }
      navigate('/offers');
    } catch (err: any) {
      console.error('[OfferDetail] Failed to save offer:', err);
      console.log('[OfferDetail] error JSON:', JSON.stringify(err, null, 2));
      setSaveError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate('/offers');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spokes className="h-8 w-8 text-[var(--ods-brand-600)] mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-10 px-4 border-b border-[var(--ods-border)] flex items-center justify-between shrink-0">
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 text-[13px] text-[var(--ods-text-secondary,#575757)] hover:text-[var(--ods-text-primary,#18181b)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--ods-text-tertiary,#8a8a93)]">
            {isNew ? 'New Offer' : offer?.title || 'Edit Offer'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isNew ? (
            <button
              disabled
              title="Save first to preview"
              className="h-7 px-3 text-[13px] text-[var(--ods-text-tertiary,#8a8a93)] border border-[var(--ods-border,#e5e5ea)] rounded-[4px] bg-[var(--ods-bg-secondary)] cursor-not-allowed opacity-60"
            >
              Preview
            </button>
          ) : (
            <button
              onClick={() => window.open(`/preview/general/${id}`, '_blank')}
              className="h-7 px-3 text-[13px] text-[var(--ods-text-secondary,#575757)] border border-[var(--ods-border,#e5e5ea)] rounded-[4px] hover:bg-[var(--ods-bg-secondary,#f0f0f3)] transition-colors"
            >
              Preview
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 h-7 px-3 text-[13px] font-medium bg-[var(--ods-brand-600,#2563eb)] text-white rounded-[4px] hover:bg-[var(--ods-brand-600,#1d4ed8)] transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* Top-level offer tabs */}
      <div role="tablist" aria-label="Offer sections" className="flex items-center gap-6 h-10 px-4 border-b border-[var(--ods-border,#e5e5ea)] shrink-0 overflow-x-auto bg-[var(--ods-bg-primary,#ffffff)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`h-full shrink-0 border-b-2 text-[13px] font-medium whitespace-nowrap -mb-px transition-colors ${activeTab === t.id ? 'border-[var(--ods-text-primary,#1e2126)] text-[var(--ods-text-primary,#1e2126)]' : 'border-transparent text-[var(--ods-text-secondary,#6b7280)] hover:text-[var(--ods-text-primary,#1e2126)]'}`}
            style={{ fontFamily: "'Satoshi', system-ui, sans-serif" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {saveError && (
          <div className="mx-auto max-w-4xl flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 p-3 rounded-[6px] text-sm">
            <span className="font-medium">Save failed:</span> {saveError}
          </div>
        )}
        {activeTab === 'landing' && (
        <div className="flex flex-col gap-4">
          {/* Basic Info */}
          <WidgetCard title="Basic Info">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary,#8a8a93)] mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., How Acme Added $10K MRR"
                  className="w-full h-10 px-3 text-[13px] border border-[var(--ods-border,#e5e5ea)] rounded-[4px] bg-[var(--ods-bg-primary,#ffffff)] text-[var(--ods-text-primary,#18181b)] focus:outline-none focus:border-[var(--ods-brand-600,#2563eb)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary,#8a8a93)] mb-1.5">
                  Prospect / Lead — normalized name
                </label>
                <ProspectSelect
                  value={name}
                  onChange={(id, displayName) => {
                    setName(id);
                    setProspectName(displayName);
                    console.log('[OfferDetail] selected prospect:', { id, displayName });
                  }}
                />
                {name && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="blue">
                      {prospectName ? `Selected: ${prospectName}` : `Selected: ${name.slice(0, 8)}…`}
                    </Badge>
                    <span className="text-[11px] text-[var(--ods-text-tertiary,#8a8a93)]">
                      normalized — stored as <code className="bg-[var(--ods-bg-secondary)] px-1 py-0.5 rounded-[3px] border border-[var(--ods-border)]">name</code>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </WidgetCard>

          {/* Hero Section — free input with separate toolbars + live preview */}
          <WidgetCard title="Hero Section — free input">
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-semibold tracking-wider text-[var(--ods-text-tertiary)] mb-1.5">
                  Hero H1 — free input (no {'{{area}}'} token)
                </label>
                <RichEditor
                  value={heroH1}
                  onChange={setHeroH1}
                  placeholder="Main headline — select text then apply color/highlight (e.g., We'll Send You an Additional 8-10+ Qualified Veteran Referrals Per Day)"
                  showAreaToken={false}
                  minHeight="48px"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-widest uppercase text-[var(--ods-text-tertiary)] mb-1.5">
                  Hero Lede — free input (template vs tailored)
                </label>
                <RichEditor
                  value={heroLede}
                  onChange={setHeroLede}
                  placeholder="Supporting text — use {{area}} for personalization (e.g., Acme turns rough inputs into clear plans and estimates — like (like yours) for other teams in {{area}}.)"
                  showAreaToken={true}
                  minHeight="80px"
                />
                <p className="mt-1 text-[11px] text-[var(--ods-text-tertiary)]">
                  {"{{area}}"} = template · real city = tailored.
                </p>
              </div>
              {/* Live preview inside builder — shows inferred Twenty HTML */}
              <div className="rounded-[6px] border border-dashed border-[var(--ods-border)] bg-[#fafafb]/50 p-3">
                <span className="block text-[11px] font-semibold tracking-widest uppercase text-[var(--ods-text-tertiary)] mb-2">Live preview</span>
                <h3
                  className="text-[18px] font-bold leading-tight text-[#0D2A4C] mb-2"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                  dangerouslySetInnerHTML={{ __html: heroH1 || '<span class="text-[var(--ods-text-tertiary)]">Hero H1 preview…</span>' }}
                />
                <div
                  className="text-[13px] leading-relaxed text-[#0D2A4C]/70"
                  dangerouslySetInnerHTML={{
                    __html: resolveAreaTokens(heroLede || '', {
                      area: (() => {
                        try {
                          return new URLSearchParams(window.location.search).get('area') || '';
                        } catch {
                          return '';
                        }
                      })(),
                      keepTokenIfMissing: true,
                    }) || '<span class="text-[var(--ods-text-tertiary)]">Hero lede preview…</span>',
                  }}
                />
                <p className="mt-2 text-[11px] text-[var(--ods-text-tertiary)]">
                  Matches PreviewPage.
                </p>
              </div>
            </div>
          </WidgetCard>

          {/* Video URL */}
          <WidgetCard title="Video URL">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary,#8a8a93)] mb-1.5">
                  Primary Link Label
                </label>
                <input
                  type="text"
                  value={videoUrl.primaryLinkLabel}
                  onChange={(e) => setVideoUrl({ ...videoUrl, primaryLinkLabel: e.target.value })}
                  placeholder="e.g., Watch Video"
                  className="w-full h-10 px-3 text-[13px] border border-[var(--ods-border,#e5e5ea)] rounded-[4px] bg-[var(--ods-bg-primary,#ffffff)] text-[var(--ods-text-primary,#18181b)] focus:outline-none focus:border-[var(--ods-brand-600,#2563eb)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary,#8a8a93)] mb-1.5">
                  Primary Link URL
                </label>
                <input
                  type="url"
                  value={videoUrl.primaryLinkUrl}
                  onChange={(e) => setVideoUrl({ ...videoUrl, primaryLinkUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-10 px-3 text-[13px] border border-[var(--ods-border,#e5e5ea)] rounded-[4px] bg-[var(--ods-bg-primary,#ffffff)] text-[var(--ods-text-primary,#18181b)] focus:outline-none focus:border-[var(--ods-brand-600,#2563eb)]"
                />
              </div>
            </div>
          </WidgetCard>
        </div>
        )}

        {activeTab === 'thankyou' && (
          <ThankYouEditor
            value={thankYouData}
            onChange={(next) => {
              setThankYouData(next);
              console.log('[OfferDetail] thankYou change', JSON.stringify(next, null, 2).slice(0, 400));
            }}
          />
        )}
        {activeTab === 'disqualified' && (
          <DisqualifiedForm
            value={disqualifiedData}
            onChange={(next) => {
              setDisqualifiedData(next as any);
              console.log('[OfferDetail] disqualified change', JSON.stringify(next, null, 2).slice(0, 400));
            }}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsForm
            value={{ metaPixelId, status, ctaType }}
            onChange={(next) => {
              setMetaPixelId(next.metaPixelId);
              setStatus(next.status);
              setCtaType(next.ctaType);
            }}
            title={title}
          />
        )}
        {activeTab === 'utm' && (
          <WidgetCard title="UTM swaps — per-source hero overrides">
            <div className="space-y-3">
              <p className="text-[12px] text-[var(--ods-text-secondary)]">
                When a visitor arrives with <code className="bg-[var(--ods-bg-secondary)] px-1 py-0.5 rounded-[3px] border border-[var(--ods-border)]">?utm_source=X</code> matching
                a rule, that hero field swaps for their visit only. First match wins; no match leaves base copy untouched.
              </p>
              {utmSwaps.rules.map((rule) => (
                <div key={rule.id} className="rounded-[8px] border border-[var(--ods-border,#e5e5ea)] bg-white p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">utm_source</label>
                      <input
                        type="text"
                        value={rule.utmSource}
                        onChange={(e) => setUtmSwaps((prev) => ({
                          rules: prev.rules.map((r) => r.id === rule.id ? { ...r, utmSource: e.target.value } : r),
                        }))}
                        placeholder="e.g. meta, google"
                        className="w-full h-9 px-3 text-[13px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">Field</label>
                      <StatusSelect
                        value={rule.field}
                        onChange={(v) => setUtmSwaps((prev) => ({
                          rules: prev.rules.map((r) => r.id === rule.id ? { ...r, field: (v as UtmRule['field']) } : r),
                        }))}
                        options={[
                          { value: 'heroH1', label: 'Hero H1', dotColor: 'bg-blue-500', bgTint: 'bg-blue-500/10', textColor: 'text-blue-700' },
                          { value: 'heroLede', label: 'Hero lede', dotColor: 'bg-emerald-500', bgTint: 'bg-emerald-500/10', textColor: 'text-emerald-700' },
                          { value: 'title', label: 'Title', dotColor: 'bg-gray-500', bgTint: 'bg-gray-500/10', textColor: 'text-gray-700' },
                        ]}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">Replacement (RichEditor styling + tokens supported)</label>
                    <RichEditor
                      value={rule.html}
                      onChange={(html) => setUtmSwaps((prev) => ({
                        rules: prev.rules.map((r) => r.id === rule.id ? { ...r, html } : r),
                      }))}
                      placeholder="Replacement copy for this source…"
                      showAreaToken
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setUtmSwaps((prev) => ({ rules: prev.rules.filter((r) => r.id !== rule.id) }))}
                      className="px-3 h-8 text-[12px] font-medium text-red-600 border border-[var(--ods-border)] rounded-[6px] bg-white hover:bg-red-500/10 transition-colors"
                    >
                      Delete rule
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setUtmSwaps((prev) => ({
                  rules: [...prev.rules, {
                    id: `utm-${Math.random().toString(36).slice(2, 8)}`,
                    utmSource: '',
                    field: 'heroH1' as const,
                    html: '',
                  }],
                }))}
                className="px-3 h-9 text-[13px] font-medium text-[var(--ods-brand-600)] border border-dashed border-[var(--ods-brand-500)] rounded-[6px] bg-white hover:bg-[var(--ods-bg-secondary)] transition-colors"
              >
                + Add rule
              </button>
            </div>
          </WidgetCard>
        )}
        {activeTab === 'landing' && (
          <QualifierQuiz
            value={quizData}
            onChange={(next) => {
              setQuizData(next);
              setCalendlyUrl(next.calendlyEmbed);
              console.log('[OfferDetail] qualifier quiz change', JSON.stringify(next, null, 2).slice(0, 400));
            }}
          />
        )}
        {activeTab === 'landing' && (
          <WidgetCard title="Brand header — above hero H1">
            <div className="space-y-3">
              <p className="text-[12px] text-[var(--ods-text-secondary)]">
                Logo left, name right, subheading beneath — all rendered from this offer.
              </p>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">Brand name</label>
                <RichEditor
                  value={brandName}
                  onChange={setBrandName}
                  placeholder="e.g. ListeningKit"
                  showAreaToken={false}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">Brand subheading (service line)</label>
                <RichEditor
                  value={brandSub}
                  onChange={setBrandSub}
                  placeholder="e.g. More repair jobs every single month"
                  showAreaToken={false}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">Brand logo URL</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={brandLogoUrl}
                      onChange={(e) => setBrandLogoUrl(e.target.value)}
                      placeholder="https://…/logo.svg"
                      className="flex-1 h-9 px-3 text-[13px] font-mono border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                    />
                    <label
                      className={`inline-flex items-center px-3 h-9 text-[13px] font-medium border border-dashed border-[var(--ods-brand-500)] rounded-[6px] bg-white transition-colors ${logoUploading ? 'opacity-60 pointer-events-none' : 'cursor-pointer hover:bg-[var(--ods-bg-secondary)] text-[var(--ods-brand-600)]'}`}
                    >
                      {logoUploading ? 'Uploading…' : 'Upload file'}
                      <input
                        type="file"
                        accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        disabled={logoUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          setLogoUploading(true);
                          try {
                            const { url } = await api.offers.uploadLogo(file);
                            setBrandLogoUrl(url);
                            toastSuccess('Logo uploaded', 'URL filled in — save the offer to keep it');
                          } catch (err: any) {
                            toastError('Upload failed', err?.message || 'Could not upload logo');
                          } finally {
                            setLogoUploading(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {brandLogoUrl && (
                    <div className="flex items-center gap-3 rounded-[6px] border border-[var(--ods-border)] bg-[#F9FCFE] p-3">
                      <img
                        src={brandLogoUrl}
                        alt="Brand logo preview"
                        className="size-11 shrink-0 rounded-[10px] object-contain bg-white border border-[var(--ods-border)]"
                      />
                      <span className="text-[11px] text-[var(--ods-text-tertiary)] font-mono truncate">{brandLogoUrl}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </WidgetCard>
        )}
        {activeTab === 'landing' && (
          <WidgetCard title="Worked-with logos — quiz carousel">
            <div className="space-y-3">
              <p className="text-[12px] text-[var(--ods-text-secondary)]">
                SVG / image URLs, passed straight through as <code className="bg-[var(--ods-bg-secondary)] px-1 py-0.5 rounded-[3px] border border-[var(--ods-border)]">src</code> and
                tinted navy on the funnel. Monochrome art works best. Optional link per logo renders the image as a link.
              </p>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">Carousel heading</label>
                <RichEditor
                  value={carouselHeading}
                  onChange={setCarouselHeading}
                  placeholder="e.g. We've worked with"
                  showAreaToken={false}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">Carousel description (under the marquee)</label>
                <RichEditor
                  value={carouselDesc}
                  onChange={setCarouselDesc}
                  placeholder="Supporting line under the logos ({{area}} resolves to prospect city)"
                  showAreaToken
                />
              </div>
              {mediaLogos.map((logo, idx) => (
                <div key={`${logo.src}-${idx}`} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_1fr_auto] gap-2 items-center rounded-[8px] border border-[var(--ods-border,#e5e5ea)] bg-white p-3">
                  <input
                    type="text"
                    value={logo.src}
                    onChange={(e) => setMediaLogos((prev) => prev.map((l, i) => i === idx ? { ...l, src: e.target.value } : l))}
                    placeholder="https://…/logo.svg"
                    className="h-9 px-3 text-[13px] font-mono border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                  />
                  <input
                    type="text"
                    value={logo.alt || ''}
                    onChange={(e) => setMediaLogos((prev) => prev.map((l, i) => i === idx ? { ...l, alt: e.target.value } : l))}
                    placeholder="Alt text"
                    className="h-9 px-3 text-[13px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                  />
                  <input
                    type="text"
                    value={logo.href || ''}
                    onChange={(e) => setMediaLogos((prev) => prev.map((l, i) => i === idx ? { ...l, href: e.target.value } : l))}
                    placeholder="Link URL (optional)"
                    className="h-9 px-3 text-[13px] font-mono border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                  />
                  <button
                    onClick={() => setMediaLogos((prev) => prev.filter((_, i) => i !== idx))}
                    className="px-3 h-9 text-[12px] font-medium text-red-600 border border-[var(--ods-border)] rounded-[6px] bg-white hover:bg-red-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
              <button
                onClick={() => setMediaLogos((prev) => [...prev, { src: '' }])}
                className="px-3 h-9 text-[13px] font-medium text-[var(--ods-brand-600)] border border-dashed border-[var(--ods-brand-500)] rounded-[6px] bg-white hover:bg-[var(--ods-bg-secondary)] transition-colors"
              >
                + Add logo
              </button>
            </div>
          </WidgetCard>
        )}
      </div>
    </div>
  );
}
