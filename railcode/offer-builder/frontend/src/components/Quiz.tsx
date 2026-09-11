import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveAreaTokens } from '@/lib/resolveTokens';

export type QuizQuestion = { id: string; question: string; options: Array<string | { id?: string; text: string; dq?: boolean; fbLead?: boolean; nextQuestion?: string }> };

export type QuizDoneVideo = {
  url: string;
  title?: string;
};

export type QuizDoneContent = {
  badgeText?: string;
  heading?: string;
  videos?: QuizDoneVideo[];
};

export type MeetingBookedDetail = {
  uri?: string;
  inviteeEmail?: string;
};

type QuizProps = {
  onComplete?: (answers: Record<string, string>) => void;
  onLeadCreated?: (lead: any, qualification: string) => void;
  onQualificationChange?: (q: string) => void;
  onMeetingBooked?: (detail: MeetingBookedDetail) => void;
  questions?: QuizQuestion[];
  /** Quiz intro header. Falls back to defaults when the offer carries none. */
  introTitle?: string;
  introDesc?: string;
  /** Prospect area ("City, Region") for {{area}}/{{city}} tokens in intro copy. */
  area?: string;
  /** Quiz currency symbol (e.g. €) for {{currency}} tokens. From the record. */
  currency?: string;
  calendlyUrl?: string;
  disqualifiedCalendlyUrl?: string;
  offerId?: string;
  prospectId?: string;
  thankYou?: QuizDoneContent | null;
  disqualified?: QuizDoneContent | null;
  fallbackVideos?: QuizDoneVideo[];
  /** Lead-capture endpoint. Defaults to the internal route; the public
   *  funnel at offer.domain.com passes '/api/public/leads'. */
  leadsEndpoint?: string;
};

const QUIZ_INTRO_TITLE_FALLBACK = 'See if your market is available - book a strategy call now';
const QUIZ_INTRO_DESC_FALLBACK = 'We only work with 1 agency per market — answer a few quick questions.';

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: 'impact',
    question: 'What would {{currency}}5000 worth of extra work actually do for your business this month?',
    options: [
      { text: 'Be so useful', fbLead: true },
      { text: 'Light drop in the water' },
      { text: "Wouldn't do anything", dq: true },
      { text: "I'm really struggling" },
    ],
  },
  {
    id: 'authority',
    question: 'Are you the one who calls the shots on marketing?',
    options: [
      { text: "Yeah, that's me", fbLead: true },
      { text: 'I look after the marketing' },
      { text: 'Nah, just having a look', dq: true },
    ],
  },
  {
    id: 'intent',
    question: 'If this brings in work, do you want us to build it out for you?',
    options: [
      { text: 'Yeah — book my call', fbLead: true },
      { text: 'Yeah — send the details first' },
      { text: 'Nah, just curious', dq: true },
    ],
  },
];

export function Quiz({ onComplete, onLeadCreated, onQualificationChange, onMeetingBooked, questions, introTitle, introDesc, area, currency, calendlyUrl, disqualifiedCalendlyUrl, offerId, prospectId, thankYou, disqualified, fallbackVideos, leadsEndpoint = '/api/leads' }: QuizProps) {
  const qs = questions && questions.length ? questions : DEFAULT_QUESTIONS;
  const introHeading = introTitle && introTitle.trim().length > 0 ? introTitle : QUIZ_INTRO_TITLE_FALLBACK;
  const introLede = introDesc && introDesc.trim().length > 0 ? introDesc : QUIZ_INTRO_DESC_FALLBACK;
  // Same RichEditor pipeline as hero copy: stored HTML + per-prospect tokens.
  // {{currency}} resolves first (plain glyph, tag-safe), then area tokens.
  const currencyToken = currency && currency.trim().length > 0 ? currency : '$';
  const withCurrency = (html: string) => html.replace(/\{\{\s*currency\s*\}\}/gi, currencyToken);
  const introHeadingHtml = resolveAreaTokens(withCurrency(introHeading), { area, keepTokenIfMissing: true });
  const introLedeHtml = resolveAreaTokens(withCurrency(introLede), { area, keepTokenIfMissing: true });
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [leadCreated, setLeadCreated] = useState<any>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [meetingBooked, setMeetingBooked] = useState(false);

  // Rehydrate booked state so a refresh never resurrects the form.
  useEffect(() => {
    if (!offerId) return;
    try {
      if (localStorage.getItem(`quiz_booking_${offerId}`)) {
        setDone(true);
        setMeetingBooked(true);
        console.log('[Quiz] rehydrated booked state', offerId);
      }
    } catch {}
  }, [offerId]);

  // Capture the Calendly meeting-booked event. The inline widget posts
  // { event: 'calendly.event_scheduled' } to window on booking.
  useEffect(() => {
    if (!done || !leadCreated || meetingBooked) return;
    const handler = (e: MessageEvent) => {
      if (e.origin !== 'https://calendly.com') return;
      const data = e.data as any;
      if (!data || data.event !== 'calendly.event_scheduled') return;
      const uri = data.payload?.event?.uri || data.payload?.uri;
      const inviteeEmail = data.payload?.invitee?.email;
      console.log('[Quiz] calendly meeting booked', { uri });
      try {
        if (offerId) {
          localStorage.setItem(`quiz_booking_${offerId}`, JSON.stringify({ at: new Date().toISOString(), uri: uri || null }));
          document.cookie = `quiz_booking_${offerId}=1; path=/; max-age=2592000`;
        }
      } catch {}
      setMeetingBooked(true);
      onMeetingBooked?.({ uri, inviteeEmail });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [done, leadCreated, meetingBooked, offerId, onMeetingBooked]);

  // Standalone fallback: when Quiz stays mounted (parent doesn't unmount it),
  // scroll to the booked video on completion.
  useEffect(() => {
    if (!meetingBooked) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById('quiz-booked-video') || document.getElementById('quiz-booked');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      console.log('[Quiz] scrolled to booked video');
    }, 350);
    return () => window.clearTimeout(t);
  }, [meetingBooked]);

  const progress = done ? 100 : (current / qs.length) * 100;
  const q = qs[current];

  const isEmbed = !!calendlyUrl && (calendlyUrl.includes('calendly-inline-widget') || calendlyUrl.includes('data-url='));
  const embedSrc = calendlyUrl ? (calendlyUrl.match(/data-url="([^"]+)"/)?.[1] || calendlyUrl) : undefined;
  const isEmbedDisqualified = !!disqualifiedCalendlyUrl && (disqualifiedCalendlyUrl.includes('calendly-inline-widget') || disqualifiedCalendlyUrl.includes('data-url='));
  const embedSrcDisqualified = disqualifiedCalendlyUrl ? (disqualifiedCalendlyUrl.match(/data-url="([^"]+)"/)?.[1] || disqualifiedCalendlyUrl) : undefined;
  const activeIsEmbed = isDisqualified ? isEmbedDisqualified : isEmbed;
  const activeEmbedSrc = isDisqualified ? embedSrcDisqualified : embedSrc;
  const activeCalendlyUrl = isDisqualified ? (disqualifiedCalendlyUrl || calendlyUrl) : calendlyUrl;

  useEffect(() => {
    const srcToInject = isDisqualified ? embedSrcDisqualified : embedSrc;
    const injectNeeded = isDisqualified ? isEmbedDisqualified : isEmbed;
    if (done && injectNeeded && srcToInject && !document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      document.body.appendChild(s);
      console.log('[Quiz] injected Calendly widget.js for', srcToInject);
    }
  }, [done, isEmbed, embedSrc, isEmbedDisqualified, embedSrcDisqualified, isDisqualified]);

  // The inline-widget div only mounts AFTER the lead is created, long after
  // widget.js scans the DOM — so explicitly init it on mount. Without this
  // the div sits blank with just its data-url attribute.
  const embedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!leadCreated || !activeIsEmbed || !activeEmbedSrc) return;
    const init = () => {
      const w = (window as any).Calendly;
      const el = embedRef.current;
      if (w && el && typeof w.initInlineWidget === 'function') {
        try {
          el.innerHTML = '';
          w.initInlineWidget({ url: activeEmbedSrc, parentElement: el });
          console.log('[Quiz] Calendly initInlineWidget ok', activeEmbedSrc);
          return true;
        } catch (e) {
          console.warn('[Quiz] Calendly init failed', e);
        }
      }
      return false;
    };
    if (init()) return;
    let s = document.querySelector<HTMLScriptElement>('script[src="https://assets.calendly.com/assets/external/widget.js"]');
    if (!s) {
      s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      document.body.appendChild(s);
    }
    s.addEventListener('load', init, { once: true });
    const t = window.setTimeout(init, 2000);
    return () => {
      window.clearTimeout(t);
      s?.removeEventListener('load', init);
    };
  }, [leadCreated, activeIsEmbed, activeEmbedSrc]);

  function handleSelect(rawOpt: string | any) {
    const text = typeof rawOpt === 'string' ? rawOpt : rawOpt?.text || String(rawOpt);
    const dq = typeof rawOpt === 'object' ? !!rawOpt?.dq : false;
    const fbLead = typeof rawOpt === 'object' ? (rawOpt?.fbLead ?? true) : true;
    console.log('[Quiz] selected', { text, dq, fbLead, question: q?.question, current, qsLen: qs.length });
    if (fbLead && (window as any).fbq) {
      try {
        (window as any).fbq('track', 'Lead', { content_name: q?.question || offerId || 'quiz', content_category: text, value: 1.0, currency: 'USD' });
        console.log('[Quiz] fbq Lead fired', { content_name: q?.question, content_category: text });
      } catch (e) {
        console.warn('[Quiz] fbq failed', e);
      }
    }
    const nextAnswers = { ...answers, [q.id]: text };
    setAnswers(nextAnswers);
    const willDisqualify = dq || isDisqualified;
    if (dq) setIsDisqualified(true);
    if (willDisqualify) onQualificationChange?.('DISQUALIFIED');
    if (current + 1 < qs.length) {
      setCurrent((c) => {
        const next = c + 1;
        console.log('[Quiz] advancing to', next);
        return next;
      });
    } else {
      setDone(true);
      const finalQual = willDisqualify ? 'DISQUALIFIED' : 'QUALIFIED';
      console.log('[Quiz] done', nextAnswers, 'disqualified:', finalQual);
      onComplete?.(nextAnswers);
      onQualificationChange?.(finalQual);
    }
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.email && !contact.phone) {
      setLeadError('Email or phone required');
      return;
    }
    setSubmitting(true);
    setLeadError(null);
    const qualificationStatus = isDisqualified ? 'DISQUALIFIED' : 'QUALIFIED';
    console.log('[Quiz] pushing lead', { offerId, prospectId, answers, contact, qualificationStatus, qs });
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch(leadsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId,
          prospectId,
          answers,
          quizAnswers: answers,
          contact,
          qualificationStatus,
          quizData: qs,
          source: 'offer-quiz',
          sourceUrl: window.location.href,
          visitorId: params.get('visitor_id') || undefined,
          utmSource: params.get('utm_source') || undefined,
          utmMedium: params.get('utm_medium') || undefined,
          utmCampaign: params.get('utm_campaign') || undefined,
          utmContent: params.get('utm_content') || undefined,
          utmTerm: params.get('utm_term') || undefined,
          fbclid: params.get('fbclid') || undefined,
          gclid: params.get('gclid') || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create lead');
      console.log('[Quiz] lead created', data);
      setLeadCreated(data);
      onLeadCreated?.(data, qualificationStatus);
      onQualificationChange?.(qualificationStatus);
    } catch (err: any) {
      console.error('[Quiz] lead push failed', err);
      setLeadError(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="quiz" className="mt-8">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-4 max-w-2xl rounded-2xl border border-[var(--ods-border,#e5e7eb)] bg-white p-6 shadow-sm md:p-8"
      >
        {!meetingBooked && (
          <div className="text-center">
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-bold text-[#0D2A4C] md:text-2xl"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              <span dangerouslySetInnerHTML={{ __html: introHeadingHtml }} />
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
              className="mt-2 text-sm text-[#0D2A4C]/60 md:text-[15px]"
            >
              <span dangerouslySetInnerHTML={{ __html: introLedeHtml }} />
            </motion.p>
          </div>
        )}

        {!meetingBooked && (
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[var(--ods-bg-secondary,#f0f0f3)]">
            <motion.div
              className="h-full rounded-full bg-[#2563eb]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        )}

        <div className="mt-8 min-h-[180px]">
          <AnimatePresence mode="wait">
            {done && meetingBooked ? (
              <motion.div
                key="booked"
                id="quiz-booked"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-center py-2"
              >
                {(() => {
                  const cfg = isDisqualified ? disqualified : thankYou;
                  const heading =
                    cfg?.heading ||
                    (isDisqualified
                      ? 'Thanks for your time — we’ll review your details and be in touch.'
                      : 'Thanks — your call is booked. Watch this short video while you wait.');
                  const allVideos = (cfg?.videos?.length || 0) > 0 ? cfg!.videos! : (fallbackVideos || []);
                  const [mainVideo, ...restVideos] = allVideos;
                  const gridVideos = restVideos.slice(0, 4);
                  const VideoCard = ({ v, videoId }: { v: { url: string; title?: string }; videoId?: string }) => (
                    <div id={videoId} className="overflow-hidden rounded-xl border border-[var(--ods-border,#e5e7eb)] bg-black scroll-mt-6">
                      <video src={v.url} controls playsInline preload="metadata" className="w-full aspect-video" />
                    </div>
                  );
                  const faqTitle = (v: { title?: string }, i: number) =>
                    v.title || `Frequently Asked Question ${i + 1}`;
                  return (
                    <>
                      <p className="text-[16px] font-semibold text-[#0D2A4C]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        {heading}
                      </p>
                      {mainVideo && (
                        <div className="mt-6 text-left">
                          <VideoCard v={mainVideo} videoId="quiz-booked-video" />
                        </div>
                      )}
                      {gridVideos.length > 0 && (
                        <>
                          <h2 id="quiz-faq-heading" className="mt-8 mb-4 text-center text-xl font-bold text-[#0D2A4C]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            Frequently Asked Questions
                          </h2>
                          <div id="quiz-booked-videos" className="grid gap-4 text-left sm:grid-cols-2">
                            {gridVideos.map((v, i) => (
                              <div key={i}>
                                <h3 className="mb-2 text-left text-[15px] font-bold text-[#0D2A4C]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                  {faqTitle(v, i)}
                                </h3>
                                <VideoCard v={v} />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            ) : done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-center py-2"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                  className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mb-4"
                >
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h4 id="quiz-done-heading" className="text-lg font-bold text-[#0D2A4C] md:text-xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  {isDisqualified ? 'Thanks for your interest' : "You're a great fit — let's talk!"}
                </h4>
                <p className="mt-1 text-sm text-[#0D2A4C]/60">{isDisqualified ? 'Based on your answers you may not be a fit right now, but leave your details and we’ll review.' : 'Your market may still be available. Book your strategy call below.'}</p>

                {!leadCreated ? (
                  <form id="quiz-contact-form" onSubmit={handleLeadSubmit} className="mt-6 text-left space-y-3 max-w-md mx-auto">
                    <div>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">Full name</label>
                      <input
                        value={contact.name}
                        onChange={(e) => setContact({ ...contact, name: e.target.value })}
                        placeholder="Jane Doe"
                        className="w-full h-9 px-3 text-[13px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">Email</label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) => setContact({ ...contact, email: e.target.value })}
                          placeholder="you@company.com"
                          className="w-full h-9 px-3 text-[13px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ods-text-tertiary)] mb-1">Phone</label>
                        <input
                          value={contact.phone}
                          onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                          className="w-full h-9 px-3 text-[13px] border border-[var(--ods-border)] rounded-[6px] bg-white focus:outline-none focus:border-[var(--ods-brand-600)]"
                        />
                      </div>
                    </div>
                    {leadError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{leadError}</p>}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-10 inline-flex items-center justify-center gap-2 text-[13px] font-semibold bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors shadow-[0_4px_14px_rgba(37,99,235,0.3)]"
                    >
                      {submitting ? 'Submitting...' : isDisqualified ? 'Submit for review' : 'Submit & Continue →'}
                    </button>
                  </form>
                ) : (
                  <div className="mt-4 p-4 rounded-xl border border-[var(--ods-border,#e5e7eb)] bg-[var(--ods-bg-secondary,#f8f9fc)] text-center">
                    {(() => {
                      const cfg = isDisqualified ? disqualified : thankYou;
                      const badge = cfg?.badgeText || (isDisqualified ? 'Thanks for your interest' : "You're booked");
                      const heading =
                        cfg?.heading ||
                        (isDisqualified
                          ? 'Thanks for your time — we’ll review your details and be in touch.'
                          : 'Thanks — you can now book your call below.');
                      return (
                        <>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--ods-brand-600,#2563eb)] text-white text-[12px] font-medium">
                            {badge}
                          </span>
                          <p className="mt-2 text-[14px] font-medium text-[#0D2A4C]">{heading}</p>
                        </>
                      );
                    })()}
                  </div>
                )}

                {leadCreated && activeIsEmbed && activeEmbedSrc ? (
                  <div className="mt-5 rounded-xl overflow-hidden border border-[var(--ods-border,#e5e5ea)] bg-white" style={{ minWidth: 320, height: 700 }}>
                    <div ref={embedRef} className="calendly-inline-widget" data-url={activeEmbedSrc} style={{ minWidth: 320, height: 700 }} />
                  </div>
                ) : leadCreated && activeCalendlyUrl ? (
                  <div className="mt-5 rounded-xl overflow-hidden border border-[var(--ods-border,#e5e5ea)] bg-white" style={{ height: '640px' }}>
                    <iframe
                      src={activeEmbedSrc}
                      className="w-full h-full"
                      frameBorder={0}
                      title="Schedule a call"
                      allow="fullscreen"
                    />
                  </div>
                ) : leadCreated && !isDisqualified && (thankYou as any)?.hideBookingCta ? (
                  <div className="mt-5 rounded-xl border border-[var(--ods-border,#e5e5ea)] bg-[var(--ods-bg-secondary,#f8f9fc)] px-6 py-5 text-center">
                    <p className="text-[14px] font-semibold text-[#0D2A4C]">
                      {(thankYou as any)?.callbackNote || "Request received — we'll call you at your preferred time."}
                    </p>
                  </div>
                ) : leadCreated && !isDisqualified ? (
                  <div className="mt-5 rounded-xl border border-[var(--ods-border,#e5e5ea)] bg-[var(--ods-bg-secondary,#f8f9fc)] px-6 py-5 text-center">
                    <p className="text-[14px] font-semibold text-[#0D2A4C]">
                      Thanks — we'll be in touch shortly to schedule your call.
                    </p>
                  </div>
                ) : null}

              </motion.div>
            ) : (
              <motion.div
                key={q.id}
                id="quiz-questions"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-center text-xs font-medium uppercase tracking-wider text-[#0D2A4C]/40 mb-2">
                  Question {current + 1} of {qs.length}
                </p>
                <p className="text-center text-lg font-bold text-[#0D2A4C] md:text-xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  {withCurrency(q.question)}
                </p>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {q.options.map((rawOpt, i) => {
                    const text = typeof rawOpt === 'string' ? rawOpt : (rawOpt as any).text;
                    const key = typeof rawOpt === 'string' ? rawOpt : (rawOpt as any).id || text;
                    // Odd-count orphan (e.g. 3rd of 3): center it as a half-width
                    // tile instead of stranding it in row-2 col-1.
                    const isOrphan = q.options.length % 2 === 1 && i === q.options.length - 1;
                    return (
                      <motion.button
                        key={key}
                        type="button"
                        onClick={() => handleSelect(rawOpt as any)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.3 }}
                        whileHover={{ scale: 1.04, y: -2, transition: { duration: 0.12, ease: "easeOut" } as any }}
                        whileTap={{ scale: 0.97, transition: { duration: 0.08 } as any }}
                        style={{ boxShadow: '0 0 7.0px hsl(217 91% 60% / 0.5), 0 0 19.0px hsl(217 91% 60% / 0.25)' }}
                        className={`rounded-xl border border-[var(--ods-border,#e5e7eb)] bg-white px-5 py-4 text-[14px] font-semibold text-[#0D2A4C] hover:bg-[#f0f6ff] hover:border-[#2563eb]/40 hover:shadow-[0_0_14px_hsl(217_91%_60%_/_0.35),0_4px_12px_rgba(37,99,235,0.15)] text-left sm:text-center leading-tight transform-gpu will-change-transform${isOrphan ? ' sm:col-span-2 sm:mx-auto sm:w-[calc(50%-6px)]' : ''}`}
                      >
                        {text}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
