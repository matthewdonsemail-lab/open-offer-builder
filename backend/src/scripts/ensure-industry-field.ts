import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../.env.local') });
const baseUrl = (process.env.TWENTY_BASE_URL || '').replace(/\/$/, '');
const apiKey = process.env.TWENTY_API_KEY || '';
if (!baseUrl || !apiKey) { console.error('missing'); process.exit(1); }
const metadataUrl = baseUrl.replace(/\/rest$/, '') + '/metadata';
async function gql(q:string,v:any){const r=await fetch(metadataUrl,{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({query:q,variables:v})});const j:any=await r.json();if(!r.ok||j.errors?.length){console.error(JSON.stringify(j,null,2));throw new Error(JSON.stringify(j.errors))}return j.data}
const data:any=await gql(`query { objects(paging:{first:100}){ edges{ node{ id nameSingular fieldsList{ name } } } } }`,{});
const obj=data.objects.edges.map((e:any)=>e.node).find((o:any)=>o.nameSingular==='agencyOffer');
console.log('found',obj.id, obj.fieldsList.map((f:any)=>f.name).join(',').slice(0,300));
if(obj.fieldsList.some((f:any)=>f.name==='industryId')){console.log('exists')}else{
  const res:any=await gql(`mutation CreateOneFieldMetadataItem($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name type } }`,{input:{field:{objectMetadataId:obj.id,isActive:true,isNullable:true,isUnique:false,name:'industryId',label:'Industry ID',type:'TEXT',description:'Industry urlKey this offer serves (blank = not an industry offer)'}}});
  console.log('created',res.createOneField);
}
// Cleanup: legacy industry offers carried their key in `name` (e.g. "INDUSTRY:detailing").
// Seed industryId from that name (when industryId is empty) and clear the bogus name.
const { twentyClient } = await import('../lib/twenty-client.js');
const offers = await twentyClient.list<any>('agencyOffers', 100);
let changed = 0;
for (const o of offers) {
  const rawName = o.name && typeof o.name === 'object' ? o.name.html ?? o.name.value ?? '' : String(o.name ?? '');
  const m = /^INDUSTRY:(.+)$/i.exec(String(rawName).trim());
  if (!m) continue;
  const key = m[1].trim();
  const rawInd = o.industryId && typeof o.industryId === 'object' ? o.industryId.value ?? '' : String(o.industryId ?? '');
  const patch: Record<string, unknown> = {};
  if (!String(rawInd).trim()) patch.industryId = key;
  patch.name = '';
  const updated = await twentyClient.update('agencyOffers', o.id, patch);
  changed++;
  console.log('cleaned', o.id, { from: rawName, industryId: key, updated: !!updated });
}
console.log(changed ? `cleaned ${changed} legacy industry offer(s)` : 'no legacy industry names found');