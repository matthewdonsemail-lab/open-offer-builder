import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../.env.local') });
const baseUrl = process.env.TWENTY_BASE_URL?.replace(/\/$/, '') || '';
const apiKey = process.env.TWENTY_API_KEY || '';
if (!baseUrl || !apiKey) { console.error('TWENTY_BASE_URL and TWENTY_API_KEY required'); process.exit(1); }
const metadataUrl = baseUrl.replace(/\/rest$/, '') + '/metadata';
async function gql(query: string, variables: any) {
  const res = await fetch(metadataUrl, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const json: any = await res.json();
  if (!res.ok || json.errors?.length) { console.error('METADATA ERRORS', JSON.stringify(json, null, 2)); throw new Error(JSON.stringify(json.errors) ?? `metadata ${res.status}`); }
  return json.data;
}
async function ensureField(obj: any, field: any) {
  if (obj.fieldsList.some((f: any) => f.name === field.name)) {
    console.log(`✓ ${field.name} already exists`);
    return;
  }
  console.log(`Creating ${field.name} SELECT field...`);
  const res: any = await gql(`mutation CreateOneFieldMetadataItem($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name type } }`, { input: { field: { objectMetadataId: obj.id, isActive: true, isNullable: true, isUnique: false, ...field } } });
  console.log('Created:', res.createOneField);
}
async function main() {
  console.log('Fetching objects...');
  const data: any = await gql(`query { objects(paging:{first:100}){ edges{ node{ id nameSingular fieldsList{ id name type label options } } } } }`, {});
  const obj = data.objects.edges.map((e: any) => e.node).find((o: any) => o.nameSingular === 'agencyOffer');
  if (!obj) { console.error('agencyOffer not found'); process.exit(1); }
  console.log(`Found agencyOffer ${obj.id} fields:`, obj.fieldsList.map((f: any) => `${f.name}:${f.type}`).join(', '));
  await ensureField(obj, { name: 'status', label: 'Status', type: 'SELECT', description: 'DRAFT / ACTIVE / PAUSED', options: [{ label: 'Draft', value: 'DRAFT', color: 'gray', position: 0 }, { label: 'Active', value: 'ACTIVE', color: 'green', position: 1 }, { label: 'Paused', value: 'PAUSED', color: 'yellow', position: 2 }] });
  await ensureField(obj, { name: 'ctaType', label: 'CTA Type', type: 'SELECT', description: 'CONSULTATION / PRICING / CUSTOM (Twenty requires UPPER_CASE values)', options: [{ label: 'Consultation', value: 'CONSULTATION', color: 'blue', position: 0 }, { label: 'Pricing', value: 'PRICING', color: 'green', position: 1 }, { label: 'Custom', value: 'CUSTOM', color: 'gray', position: 2 }] });
  const verify: any = await gql(`query { objects(paging:{first:100}){ edges{ node{ nameSingular fieldsList{ name type options } } } } }`, {});
  const vobj = verify.objects.edges.map((e: any) => e.node).find((o: any) => o.nameSingular === 'agencyOffer');
  console.log('After fields:', vobj.fieldsList.map((f: any) => `${f.name}:${f.type}${f.options ? `(${f.options.map((o: any) => o.value).join(',')})` : ''}`).join(', '));
  console.log('✓ done');
}
main().catch(e => { console.error(e); process.exit(1); });
