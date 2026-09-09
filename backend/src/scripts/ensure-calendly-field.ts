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
async function main() {
  console.log('Fetching objects...');
  const data: any = await gql(`query { objects(paging:{first:100}){ edges{ node{ id nameSingular fieldsList{ id name type } } } } }`, {});
  const obj = data.objects.edges.map((e:any)=>e.node).find((o:any)=>o.nameSingular==='agencyOffer');
  if (!obj) { console.error('agencyOffer not found'); process.exit(1); }
  console.log(`Found agencyOffer ${obj.id} fields:`, obj.fieldsList.map((f:any)=>`${f.name}:${f.type}`).join(', '));
  const has = obj.fieldsList.some((f:any)=>f.name==='calendlyUrl');
  if (has) { console.log('✓ calendlyUrl already exists'); return; }
  console.log('Creating calendlyUrl TEXT field...');
  const res: any = await gql(`mutation CreateOneFieldMetadataItem($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name type } }`, { input: { field: { objectMetadataId: obj.id, isActive: true, isNullable: true, isUnique: false, name: 'calendlyUrl', label: 'Calendly URL', type: 'TEXT', description: 'Calendly link shown in iframe at end of quiz' } } });
  console.log('Created:', res.createOneField);
  const verify: any = await gql(`query { objects(paging:{first:100}){ edges{ node{ nameSingular fieldsList{ name type } } } } }`, {});
  const vobj = verify.objects.edges.map((e:any)=>e.node).find((o:any)=>o.nameSingular==='agencyOffer');
  console.log('After fields:', vobj.fieldsList.map((f:any)=>`${f.name}:${f.type}`).join(', '));
  console.log('✓ done');
}
main().catch(e=>{ console.error(e); process.exit(1); });
