import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../.env.local') });

const baseUrl = (process.env.TWENTY_BASE_URL || '').replace(/\/$/, '');
const apiKey = process.env.TWENTY_API_KEY || '';
if (!baseUrl || !apiKey) { console.error('missing env'); process.exit(1); }

const qualifiedCalendly = `<!-- Calendly inline widget begin -->
<div class="calendly-inline-widget" data-url="https://calendly.com/matthewdondev/30min" style="min-width:320px;height:700px;"></div>
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
<!-- Calendly inline widget end -->`;

const disqualifiedCalendly = `<!-- Calendly inline widget begin -->
<div class="calendly-inline-widget" data-url="https://calendly.com/matthewdondev/disqualfieid" style="min-width:320px;height:700px;"></div>
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
<!-- Calendly inline widget end -->`;

const payload = {
  title: "How PermitOps Helps Contractors Pull Permits Faster",
  name: "",
  heroH1: "For Philly Contractors Taking On More Jobs — We'll Help You Pull 8-10+ Permits Without the Revisions",
  heroLede: {
    markdown: "PermitOps turns job inputs into permit requirement guidance, fee-estimate signals, and compliance-risk indicators — like (like yours) for other contractors in {{area}}.",
    blocknote: null,
  },
  videoUrl: {
    primaryLinkLabel: "Watch 2-min demo",
    primaryLinkUrl: "https://pub-a08f5a2ef38748ca9d1249279659fc2e.r2.dev/demo/permitops-demo.mp4",
    secondaryLinks: [],
  },
  metaPixelId: "",
  calendlyUrl: qualifiedCalendly,
  quizConfig: [
    {
      id: "q1",
      question: "What type of work do you pull permits for most often?",
      type: "Multiple choice",
      options: [
        { id: "q1o1", text: "Residential / Remodel", dq: false, fbLead: true, nextQuestion: "Go to Q2: How many permits per month?" },
        { id: "q1o2", text: "Commercial / Tenant improvement", dq: false, fbLead: true, nextQuestion: "Go to Q2: How many permits per month?" },
        { id: "q1o3", text: "Electrical / Plumbing / HVAC only", dq: false, fbLead: true, nextQuestion: "Go to Q2: How many permits per month?" },
        { id: "q1o4", text: "Not a contractor", dq: true, fbLead: false, nextQuestion: "" },
      ],
    },
    {
      id: "q2",
      question: "How many permits does your team pull per month?",
      type: "Multiple choice",
      options: [
        { id: "q2o1", text: "0-2 (just starting)", dq: false, fbLead: true, nextQuestion: "Go to Q3: Do you work in Philadelphia / PA?" },
        { id: "q2o2", text: "3-10 (growing)", dq: false, fbLead: true, nextQuestion: "Go to Q3: Do you work in Philadelphia / PA?" },
        { id: "q2o3", text: "10+ (scaling)", dq: false, fbLead: true, nextQuestion: "Go to Q3: Do you work in Philadelphia / PA?" },
        { id: "q2o4", text: "None — just researching", dq: true, fbLead: false, nextQuestion: "" },
      ],
    },
    {
      id: "q3",
      question: "Does your team work in the Philadelphia / PA region?",
      type: "Multiple choice",
      options: [
        { id: "q3o1", text: "Yes — Philly / PA", dq: false, fbLead: true, nextQuestion: "" },
        { id: "q3o2", text: "No — other market", dq: true, fbLead: false, nextQuestion: "" },
      ],
    },
  ],
  thankYouConfig: {
    badgeIcon: "check",
    badgeText: "You're booked",
    heading: "You've taken your first step — now here's your second. Please watch this short video",
    lovableVideo: { title: "", hosting: "Self-hosted" },
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
    lovableVideo: { title: "", hosting: "Self-hosted" },
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
