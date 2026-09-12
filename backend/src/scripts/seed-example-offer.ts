/**
 * Seed a generic example offer into Twenty. All copy, links, and IDs here
 * are placeholders — replace them with real values for a real offer.
 *
 * Run with: bun run --cwd backend src/scripts/seed-example-offer.ts
 *
 * Requires TWENTY_BASE_URL + TWENTY_API_KEY in .env.local (see .env.example).
 * The agencyOffers object must already exist — run `bun run --cwd backend seed` first.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../.env.local') });

const baseUrl = (process.env.TWENTY_BASE_URL || '').replace(/\/$/, '');
const apiKey = process.env.TWENTY_API_KEY || '';
if (!baseUrl || !apiKey) { console.error('missing env'); process.exit(1); }

// NOTE: placeholder Calendly links — swap in real scheduling URLs per offer.
const qualifiedCalendly = `<!-- Calendly inline widget begin -->
<div class="calendly-inline-widget" data-url="https://calendly.com/your-team/30min" style="min-width:320px;height:700px;"></div>
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
<!-- Calendly inline widget end -->`;

const disqualifiedCalendly = `<!-- Calendly inline widget begin -->
<div class="calendly-inline-widget" data-url="https://calendly.com/your-team/disqualified-call" style="min-width:320px;height:700px;"></div>
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
<!-- Calendly inline widget end -->`;

const payload = {
  title: "How Acme Helps Teams Ship Twice As Fast",
  name: "",
  heroH1: "For Growing Teams Taking On More Work — We'll Help You Ship Twice As Fast",
  heroLede: {
    markdown: "Acme turns rough inputs into clear plans, time estimates, and risk checks — like (like yours) for other teams in {{area}}.",
    blocknote: null,
  },
  videoUrl: {
    primaryLinkLabel: "Watch 2-min demo",
    primaryLinkUrl: "https://example.com/demo.mp4",
    secondaryLinks: [],
  },
  metaPixelId: "",
  calendlyUrl: qualifiedCalendly,
  quizConfig: [
    {
      id: "q1",
      question: "What kind of work does your team do most often?",
      type: "Multiple choice",
      options: [
        { id: "q1o1", text: "Product / Engineering", dq: false, fbLead: true, nextQuestion: "Go to Q2: How much work per month?" },
        { id: "q1o2", text: "Marketing / Creative", dq: false, fbLead: true, nextQuestion: "Go to Q2: How much work per month?" },
        { id: "q1o3", text: "Operations / Support", dq: false, fbLead: true, nextQuestion: "Go to Q2: How much work per month?" },
        { id: "q1o4", text: "Just browsing", dq: true, fbLead: false, nextQuestion: "" },
      ],
    },
    {
      id: "q2",
      question: "How much new work does your team take on per month?",
      type: "Multiple choice",
      options: [
        { id: "q2o1", text: "0-2 projects (just starting)", dq: false, fbLead: true, nextQuestion: "Go to Q3: Do you work in our region?" },
        { id: "q2o2", text: "3-10 projects (growing)", dq: false, fbLead: true, nextQuestion: "Go to Q3: Do you work in our region?" },
        { id: "q2o3", text: "10+ projects (scaling)", dq: false, fbLead: true, nextQuestion: "Go to Q3: Do you work in our region?" },
        { id: "q2o4", text: "None — just researching", dq: true, fbLead: false, nextQuestion: "" },
      ],
    },
    {
      id: "q3",
      question: "Does your team work in the region shown above?",
      type: "Multiple choice",
      options: [
        { id: "q3o1", text: "Yes — our region", dq: false, fbLead: true, nextQuestion: "" },
        { id: "q3o2", text: "No — other market", dq: true, fbLead: false, nextQuestion: "" },
      ],
    },
  ],
  thankYouConfig: {
    badgeIcon: "check",
    badgeText: "You're booked",
    heading: "Watch this while you wait for your call.",
    video: { title: "", hosting: "Self-hosted" },
    videoGrid: {
      columns: 2,
      items: [
        { id: "v1", title: "", hosting: "Self-hosted", videoTitle: "" },
        { id: "v2", title: "", hosting: "Self-hosted", videoTitle: "" },
      ],
    },
  },
  disqualifiedConfig: {
    badgeIcon: "heart",
    badgeText: "Thanks for your interest",
    heading: "Thanks for your time — even though you're not a fit right now, we'd still love to keep you on file.",
    video: { title: "", hosting: "Self-hosted" },
    videoGrid: {
      columns: 2,
      items: [
        { id: "v1", title: "", hosting: "Self-hosted", videoTitle: "" },
        { id: "v2", title: "", hosting: "Self-hosted", videoTitle: "" },
      ],
    },
    calendlyEmbed: disqualifiedCalendly,
  },
  utmSwaps: { default: {}, rules: [] },
};

console.log("Payload JSON to POST to Twenty:");
console.log(JSON.stringify(payload, null, 2));

const url = `${baseUrl.replace(/\/rest$/, "")}/rest/agencyOffers`;
console.log(`\nPOST ${url}`);
const res = await fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const text = await res.text();
console.log(`\nResponse ${res.status} ${res.statusText}:`);
console.log(text.slice(0, 4000));

let json: any;
try { json = JSON.parse(text); } catch {}
if (json) {
  const created = json.data?.createAgencyOffer || json.data?.agencyOffer || json.data;
  console.log("\n=== CREATED OFFER ===");
  console.log(JSON.stringify(created || json, null, 2).slice(0, 4000));

  // Also fetch it back via REST to show full stored object including RAW_JSON
  const id = created?.id;
  if (id) {
    const getRes = await fetch(`${url}/${id}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    const getText = await getRes.text();
    console.log(`\nGET ${url}/${id} ${getRes.status}:`);
    console.log(getText.slice(0, 6000));
  }
}
