import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Quiz } from '@/components/Quiz';
import { resolveAreaTokens } from '@/lib/resolveTokens';

interface OfferData {
  id: string;
  title?: string;
  name?: string;
  heroH1?: string;
  heroLede?: { markdown?: string; blocknote?: string | null };
  videoUrl?: {
    primaryLinkLabel?: string;
    primaryLinkUrl?: string;
    secondaryLinks?: any[];
  };
  createdAt?: string;
  status?: string;
  ctaType?: string;
  prospectId?: string;
  quizConfig?: any;
  quiz?: any;
  calendlyUrl?: string;
  metaPixelId?: string;
}

export function PreviewPage({ mode = 'preview', slug = 'default' }: { mode?: 'public' | 'preview'; slug?: string } = {}) {
  const { id, industryId } = useParams<{ id: string; industryId: string }>();
  const [offer, setOffer] = React.useState<OfferData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [quizKey, setQuizKey] = React.useState(0);
  const [qualification, setQualification] = React.useState<string | null>(null);
  const [leadId, setLeadId] = React.useState<string | null>(null);
  const [meetingBooked, setMeetingBooked] = React.useState(false);
  const [refreshTick, setRefreshTick] = React.useState(0);
  // Public funnel has no :id param — fall back to the loaded offer id, then slug.
  const storageId = id || offer?.id || slug;

  const prospectKey = (() => {
    try {
      return new URLSearchParams(window.location.search).get('prospect') || '';
    } catch {
      return '';
    }
  })();

  const [prospect, setProspect] = React.useState<{
    id?: string;
    city?: string | null;
    region?: string | null;
    name?: string | null;
    niche?: string | null;
  } | null>(null);

  React.useEffect(() => {
    async function fetchOffer() {
      try {
        const isPublic = mode === 'public';
        const offerPath = isPublic && prospectKey
          ? `/api/public/offers/${slug}?prospect=${encodeURIComponent(prospectKey)}`
          : isPublic
            ? `/api/public/offers/${slug}`
            : `/api/offers/${id}`;
        const url = offerPath;
        const token = isPublic ? null : localStorage.getItem('offer-builder-token');
        console.log('[PreviewPage] fetching offer', isPublic ? slug : id, 'industry', industryId, 'mode:', mode, 'token present:', !!token);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(url, { headers });
        console.log('[PreviewPage] response', response.status, response.statusText);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          console.error('[PreviewPage] error body:', body);
          throw new Error(body.error || 'Failed to fetch offer');
        }
        const data = await response.json();
        console.log('[PreviewPage] offer JSON:', data);
        setOffer(data);
      } catch (err) {
        console.error('[PreviewPage] fetch failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchOffer();
  }, [id, industryId, mode, slug, prospectKey, refreshTick]);

  // Industry pages pass ?prospect=<id|slug> so copy tailors to the record.
  React.useEffect(() => {
    if (mode !== 'public' || !prospectKey) return;
    let cancelled = false;
    fetch(`/api/public/prospects/${encodeURIComponent(prospectKey)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!cancelled && p) {
          setProspect(p);
          console.log('[Preview] prospect tailored', { city: p.city, niche: p.niche });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mode, prospectKey]);

  // Save → preview bridge (preview mode only): the editor broadcasts
  // `offer:saved:<id>` on save via localStorage + postMessage; the 20s poll
  // covers the cross-origin Twenty-iframe case where neither can reach us.
  React.useEffect(() => {
    if (mode !== 'preview' || !storageId) return;
    const refresh = () => {
      setRefreshTick((t) => t + 1);
      setQuizKey((k) => k + 1);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === `offer:saved:${storageId}`) {
        console.log('[Preview] editor save detected via storage', storageId);
        refresh();
      }
    };
    const onMessage = (e: MessageEvent) => {
      if (e?.data?.type === 'offer:saved' && (!e.data.id || e.data.id === storageId)) {
        console.log('[Preview] editor save detected via postMessage', e.data);
        refresh();
      }
    };
    const poll = window.setInterval(() => setRefreshTick((t) => t + 1), 20000);
    window.addEventListener('storage', onStorage);
    window.addEventListener('message', onMessage);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('message', onMessage);
    };
  }, [mode, storageId]);

  React.useEffect(() => {
    if (!storageId) return;
    const key = `quiz_qualification_${storageId}`;
    const stored = localStorage.getItem(key) || document.cookie.split('; ').find((c) => c.trim().startsWith(key + '='))?.split('=')[1];
    if (stored) setQualification(stored);
    try {
      if (localStorage.getItem(`quiz_booking_${storageId}`)) setMeetingBooked(true);
    } catch {}
  }, [storageId]);

  // Once booking completes, scroll to the booked main video.
  React.useEffect(() => {
    if (!meetingBooked) return;
    const t = window.setTimeout(() => {
      const el =
        document.getElementById('booked-main-video') ||
        document.getElementById('offer-heading');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log('[Preview] scrolled to booked video');
    }, 350);
    return () => window.clearTimeout(t);
  }, [meetingBooked]);

  // Testing control: simulate the Calendly event_scheduled without a real
  // booking, so the booked thank-you + videos can be previewed. Writes the
  // same booking flag the real widget event would write.
  const handleSimulateBooking = () => {
    if (!storageId) return;
    try {
      localStorage.setItem(`quiz_booking_${storageId}`, JSON.stringify({ at: new Date().toISOString(), uri: null, simulated: true }));
      document.cookie = `quiz_booking_${storageId}=1; path=/; max-age=2592000`;
    } catch {}
    if (!qualification) handleQualificationChange('QUALIFIED');
    setMeetingBooked(true);
    console.log('[Preview] simulated calendly booking', storageId);
  };

  // Inject Meta Pixel base code per offer (PageView) — as per https://developers.facebook.com/docs/meta-pixel/get-started
  React.useEffect(() => {
    const pixelId = (offer as any)?.metaPixelId?.trim();
    if (!pixelId) return;
    if (document.querySelector(`script[data-pixel-id="${pixelId}"]`)) return;
    console.log('[Preview] injecting Meta Pixel', pixelId);
    // base code
    (function (f: any, b: any, e: string, v: string, n: any, t: any, s: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        (n as any).callMethod ? (n as any).callMethod.apply(n, arguments) : (n as any).queue.push(arguments);
      };
      if (!(f as any)._fbq) (f as any)._fbq = n;
      (n as any).push = n;
      (n as any).loaded = true;
      (n as any).version = '2.0';
      (n as any).queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      t.setAttribute('data-pixel-id', pixelId);
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window as any, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js', 'fbq' as any, null as any, null as any);
    (window as any).fbq('init', pixelId);
    (window as any).fbq('track', 'PageView');
    // noscript fallback
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    (img as any).style = 'display:none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.head.appendChild(noscript);
  }, [offer]);

  const handleQualificationChange = (q: string) => {
    if (!storageId) return;
    const key = `quiz_qualification_${storageId}`;
    localStorage.setItem(key, q);
    document.cookie = `${key}=${q}; path=/; max-age=604800`;
    setQualification(q);
    console.log('[Preview] qualification cookie set', key, q);
  };

  const handleLeadCreated = (lead: any, q: string) => {
    setLeadId(lead.id);
    handleQualificationChange(q);
  };

  const handleReset = async () => {
    if (!storageId) return;
    const key = `quiz_qualification_${storageId}`;
    if (leadId) {
      try {
        const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
        console.log('[Preview] cleared lead from Twenty', leadId, res.status);
      } catch (e) {
        console.error('[Preview] delete lead failed', e);
      }
    }
    localStorage.removeItem(key);
    document.cookie = `${key}=; path=/; max-age=0`;
    const bookingKey = `quiz_booking_${storageId}`;
    localStorage.removeItem(bookingKey);
    document.cookie = `${bookingKey}=; path=/; max-age=0`;
    setQualification(null);
    setLeadId(null);
    setMeetingBooked(false);
    setQuizKey((k) => k + 1);
    console.log('[Preview] reset quiz and cleared cookie', key);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F9FCFE]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-[#2A8CFF]/20 border-t-[#2A8CFF]" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 bg-[#F9FCFE]">
        <h1 className="font-heading text-2xl font-medium text-[#0D2A4C] md:text-3xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          Offer Not Found
        </h1>
        <p className="mt-2 text-base text-neutral-500">
          {error || 'This offer page is not available or has not been configured.'}
        </p>
        {mode === 'preview' && (
          <Link to="/offers" className="inline-flex h-12 items-center px-6 font-medium text-[#1D5BBF] transition-colors hover:text-[#154797]">
            ← Back to Offers
          </Link>
        )}
      </div>
    );
  }

  const buildDoneContent = (raw: any) => {
    if (!raw) return undefined;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
      const videos: Array<{ url: string; title?: string }> = [];
      const pushUrl = (url: any, title?: any) => {
        if (typeof url === 'string' && url.trim()) {
          videos.push({ url: url.trim(), title: typeof title === 'string' && title.trim() ? title : undefined });
        }
      };
      pushUrl(parsed.video?.title);
      const items = parsed.videoGrid?.items;
      if (Array.isArray(items)) items.forEach((it: any) => pushUrl(it?.videoTitle, it?.title));
      return { badgeText: parsed.badgeText, heading: parsed.heading, videos };
    } catch { return undefined; }
  };
  const thankYouCfg = buildDoneContent((offer as any).thankYouConfig);
  const disqualifiedCfg = buildDoneContent((offer as any).disqualifiedConfig);
  const activeDoneCfg = qualification === 'DISQUALIFIED' ? disqualifiedCfg : thankYouCfg;
  // Fall back to the offer's main video so the booked step always has video
  // cards even when the Twenty videoGrid fields are still blank.
  const fallbackVideos: Array<{ url: string; title?: string }> = offer.videoUrl?.primaryLinkUrl
    ? [{ url: offer.videoUrl.primaryLinkUrl }]
    : [];
  const bookedVideos = (activeDoneCfg?.videos?.length || 0) > 0 ? activeDoneCfg!.videos! : fallbackVideos;

  const heroHeadline = meetingBooked && activeDoneCfg?.heading ? (
    <span>{activeDoneCfg.heading}</span>
  ) : offer.heroH1 ? (
    <span dangerouslySetInnerHTML={{ __html: offer.heroH1 }} />
  ) : (
    offer.title || 'Your Trusted Offer'
  );

  const areaParam = (() => {
    try {
      return new URLSearchParams(window.location.search).get('area') || '';
    } catch {
      return '';
    }
  })();

  // {{area}} priority: explicit ?area= → linked prospect record → dashed
  // token placeholder. Industry iframes send ?prospect= so the funnel reads
  // the actual row instead of generic copy.
  const area = areaParam || prospect?.city || '';
  const heroLedeHtml = (offer.heroLede as any)?.markdown
    ? resolveAreaTokens((offer.heroLede as any).markdown, { area, keepTokenIfMissing: true })
    : null;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
      {/* ===== HERO — literal copy of ui-kit/apps/web/src/pages/offer-funnel-page.tsx ===== */}
      <section
        id="offer-hero"
        className="relative overflow-hidden rounded-b-[60px] px-6 pb-24 pt-20 md:pb-32 md:pt-28"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(45,141,255,0.14) 0%, rgba(45,141,255,0) 60%), #F9FCFE",
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 text-center">
          <h1 id="offer-heading" className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-[#0D2A4C] sm:text-5xl md:text-6xl lg:text-7xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {heroHeadline}
          </h1>

          {heroLedeHtml ? (
            <p className="max-w-2xl text-xl text-[#0D2A4C]/60 md:text-2xl">
              <span dangerouslySetInnerHTML={{ __html: heroLedeHtml }} />
            </p>
          ) : null}

          {!meetingBooked && (
            <div id="top-video" className="mx-auto w-full max-w-5xl scroll-mt-6">
              <h2 className="mb-6 font-heading text-3xl font-bold text-[#0D2A4C] md:text-4xl lg:text-5xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Check out the breakdown below
              </h2>
              <div className="overflow-hidden rounded-[24px] bg-[#F8F9FB] shadow-[0_12px_0_#F7F7F7,0_12px_20px_rgba(35,35,35,0.2)]" style={{ aspectRatio: "16/10" }}>
                {offer.videoUrl?.primaryLinkUrl ? (
                  <video
                    src={offer.videoUrl.primaryLinkUrl}
                    className="size-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <div className="flex size-full min-h-[400px] items-center justify-center text-[#0D2A4C]/20">
                    <svg className="size-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}

          {meetingBooked ? (
            <div id="booked-content" className="mx-auto w-full max-w-5xl">
              {bookedVideos.length > 0 && (
                <>
                  {(() => {
                    const [main, ...rest] = bookedVideos;
                    const grid = rest.slice(0, 4);
                    return (
                      <>
                        <div id="booked-main-video" className="overflow-hidden rounded-[24px] bg-[#F8F9FB] shadow-[0_12px_0_#F7F7F7,0_12px_20px_rgba(35,35,35,0.2)] scroll-mt-6">
                          {main.title && (
                            <p className="px-5 pt-4 text-left text-[15px] font-semibold text-[#0D2A4C]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                              {main.title}
                            </p>
                          )}
                          <video src={main.url} controls playsInline preload="metadata" className="w-full aspect-video" />
                        </div>
                        {grid.length > 0 && (
                          <>
                            <h2 id="booked-faq-heading" className="mt-12 mb-6 text-center font-heading text-3xl font-bold text-[#0D2A4C] md:text-4xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                              Frequently Asked Questions
                            </h2>
                            <div id="booked-videos" className="grid gap-6 sm:grid-cols-2">
                              {grid.map((v, i) => (
                                <div key={i}>
                                  <h3 className="mb-2 text-left text-[17px] font-bold text-[#0D2A4C]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                    {v.title || `Frequently Asked Question ${i + 1}`}
                                  </h3>
                                  <div className="overflow-hidden rounded-[24px] bg-[#F8F9FB] shadow-[0_12px_0_#F7F7F7,0_12px_20px_rgba(35,35,35,0.2)]">
                                    <video src={v.url} controls playsInline preload="metadata" className="w-full aspect-video" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          ) : (
          <Quiz
            key={quizKey}
            questions={(() => {
              const raw = (offer as any).quizConfig || (offer as any).quiz;
              if (!raw) return undefined;
              try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return Array.isArray(parsed) && parsed.length ? parsed : undefined;
              } catch { return undefined; }
            })()}
            calendlyUrl={(offer as any).calendlyUrl}
            disqualifiedCalendlyUrl={(() => {
              const raw = (offer as any).disqualifiedConfig;
              if (!raw) return undefined;
              try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return parsed?.calendlyEmbed || (typeof parsed === 'string' ? parsed : undefined) || (offer as any).disqualifiedCalendlyUrl;
              } catch { return undefined; }
            })()}
            offerId={offer.id}
            leadsEndpoint={mode === 'public' ? '/api/public/leads' : '/api/leads'}
            prospectId={(offer as any).prospectId || (offer as any).name}
            onQualificationChange={handleQualificationChange}
            onLeadCreated={handleLeadCreated}
            onMeetingBooked={() => setMeetingBooked(true)}
            thankYou={thankYouCfg}
            disqualified={disqualifiedCfg}
            fallbackVideos={fallbackVideos}
          />
          )}
        </div>
      </section>

      {mode === 'preview' && (
        <div className="max-w-6xl mx-auto px-4 pb-8 text-center">
          <div className="text-[11px] text-[#0D2A4C]/40">Preview • {offer.title || offer.heroH1 || 'Untitled'} • {offer.id}</div>
        </div>
      )}

      {/* Hovering reset button — preview only, never on the public funnel */}
      {mode === 'preview' && (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[var(--ods-border,#e5e5ea)] bg-white px-3 h-10 shadow-[0_4px_14px_rgba(0,0,0,0.12)]">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            qualification === 'QUALIFIED'
              ? 'bg-green-500/10 text-green-700 border-green-200'
              : qualification === 'DISQUALIFIED'
                ? 'bg-red-500/10 text-red-700 border-red-200'
                : 'bg-gray-500/10 text-gray-600 border-gray-200'
          }`}
        >
          {qualification || 'Not started'}
        </span>
        <span className="text-[11px] text-[var(--ods-text-tertiary)] hidden sm:inline">
          {leadId ? `Lead ${leadId.slice(0, 8)}…` : 'No lead yet'}
        </span>
        {!meetingBooked && (
          <button
            onClick={handleSimulateBooking}
            className="ml-1 h-7 px-3 text-[11px] font-medium bg-[var(--ods-brand-600,#2563eb)] text-white rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
            title="Simulate the Calendly event_scheduled without a real booking"
          >
            Simulate booking
          </button>
        )}
        <button
          onClick={handleReset}
          className="ml-1 h-7 px-3 text-[11px] font-medium bg-[var(--ods-text-primary,#1e2126)] text-white rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
          title="Clear agencyLead in Twenty and reset quiz to try again"
        >
          Reset quiz
        </button>
      </div>
      )}
    </div>
  );
}
