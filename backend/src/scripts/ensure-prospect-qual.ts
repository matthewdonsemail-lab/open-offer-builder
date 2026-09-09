import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../.env.local') });
const baseUrl = (process.env.TWENTY_BASE_URL || '').replace(/\/$/, '');
const apiKey = process.env.TWENTY_API_KEY || '';
if (!baseUrl || !apiKey) { console.error('missing'); process.exit(1); }
const metadataUrl = baseUrl.replace(/\/rest$/, '') + '/metadata';
async function gql(query: string, variables: any) {
  const r = await fetch(metadataUrl, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j: any = await r.json();
  if (!r.ok || j.errors?.length) { console.error(JSON.stringify(j, null, 2)); throw new Error(JSON.stringify(j.errors)); }
  return j.data;
}
const data: any = await gql(`query { objects(paging:{first:100}){ edges{ node{ id nameSingular fieldsList{ name } } } } }`, {});
const obj = data.objects.edges.map((e:any)=>e.node).find((o:any)=>o.nameSingular==='agencyProspect');
console.log('found', obj.id);
const has = obj.fieldsList.some((f:any)=>f.name==='qualificationStatus');
if (has) { console.log('exists'); process.exit(0); }
const res: any = await gql(`mutation CreateOneFieldMetadataItem($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name type } }`, { input: { field: { objectMetadataId: obj.id, isActive: true, isNullable: true, isUnique: false, name: 'qualificationStatus', label: 'Qualification Status', type: 'SELECT', description: 'Qualified or Disqualified', options: [{ label: 'Qualified', value: 'QUALIFIED', color: 'green', position: 0 }, { label: 'Disqualified', value: 'DISQUALIFIED', color: 'red', position: 1 }] } } });
console.log('created', res.createOneField);
