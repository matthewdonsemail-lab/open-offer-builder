import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../.env.local') });
const { twentyClient } = await import('../lib/twenty-client.js');
const SEL = (v: any) => (v && typeof v === 'object' ? String(v.value ?? '') : String(v ?? ''));
// Map old SELECT-style industryId values to their campaign urlKey (the serve match key).
const campaigns = await twentyClient.list<any>('agencyCampaigns', 50);
const byIndustry: Record<string, string> = {};
for (const c of campaigns) byIndustry[SEL(c.industryId)] = SEL(c.urlKey);
const offers = await twentyClient.list<any>('agencyOffers', 100);
let changed = 0;
for (const o of offers) {
  const ind = SEL(o.industryId);
  if (!ind || !byIndustry[ind]) { console.log('skip', o.id, { ind }); continue; }
  if (ind === byIndustry[ind]) { console.log('already ok', o.id, { ind }); continue; }
  await twentyClient.update('agencyOffers', o.id, { industryId: byIndustry[ind] });
  changed++;
  console.log('fixed', o.id, { from: ind, to: byIndustry[ind] });
}
console.log(`done, ${changed} offer(s) updated`);