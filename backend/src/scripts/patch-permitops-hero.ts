import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../.env.local') });

const baseUrl = (process.env.TWENTY_BASE_URL || '').replace(/\/$/, '');
const apiKey = process.env.TWENTY_API_KEY || '';
if (!baseUrl || !apiKey) { console.error('missing env'); process.exit(1); }

const id = 'cd562760-b2d8-4b05-a261-4fe5f7c87e0e';
const restBase = baseUrl.replace(/\/rest$/, '') + '/rest';

const patch = {
  heroH1: `For Philly Contractors Taking On More Jobs — We'll Help You Pull <span style="color:#2563eb">8-10+ Permits</span> <mark style="background:#FFEB3B; border-radius:2px; padding:0 2px">Without the Revisions</mark>`,
  heroLede: {
    markdown: `PermitOps turns job inputs into permit requirement guidance, fee-estimate signals, and compliance-risk indicators <mark style="background:#FFEB3B; border-radius:2px; padding:0 2px">like (like yours)</mark> for other contractors in <span style="text-decoration:underline; text-decoration-color:#1D5BBF; text-underline-offset:4px; font-weight:700">{{area}}</span>.`,
    blocknote: null,
  },
};

console.log('PATCH payload:');
console.log(JSON.stringify(patch, null, 2));

const url = `${restBase}/agencyOffers/${id}`;
console.log(`\nPATCH ${url}`);
const res = await fetch(url, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(patch),
});
const text = await res.text();
console.log(`Response ${res.status} ${res.statusText}:`);
console.log(text.slice(0, 4000));

if (res.ok) {
  const getRes = await fetch(`${restBase}/agencyOffers/${id}`, { headers: { Authorization: `Bearer ${apiKey}` } });
  const getText = await getRes.text();
  console.log(`\nGET ${restBase}/agencyOffers/${id} ${getRes.status}:`);
  const j = JSON.parse(getText);
  const o = j.data?.agencyOffer || j.data;
  console.log('heroH1:', o.heroH1?.slice(0, 200));
  console.log('heroLede.markdown:', o.heroLede?.markdown?.slice(0, 400));
}
