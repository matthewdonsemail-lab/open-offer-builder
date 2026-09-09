import { Hono } from 'hono'
import { ctx, secrets } from '@railcode/sdk'

// Offer Builder worker (Railcode edition). Same Twenty-backed API as the
// Express backend, minus what the platform now owns:
// - Auth is the verified Railcode org caller (ctx.user). No JWT, no Postgres
//   password check (the tailnet PG is unreachable from the worker anyway).
// - Public funnel routes (/api/public/*) are intentionally absent: Railcode
//   apps are org-members-only, so anonymous prospect capture stays on Vercel.
// - TWENTY_API_KEY comes from worker secrets; the Twenty host is a constant.

const TWENTY_BASE_URL = 'https://twenty.inferencesaver.com'
const OFFERS_OBJECT = 'agencyOffers'
const LEADS_OBJECT = 'agencyLeads'

type TwentyRecord = { id: string; [key: string]: unknown }

function apiKey(): string {
  const key = (secrets as any).TWENTY_API_KEY as string | undefined
  if (!key) throw new Error('TWENTY_API_KEY secret is not set (railcode secrets set TWENTY_API_KEY)')
  return key
}

function toCamelCase(str: string): string {
  return str.replace(/[-_]([a-z])/g, (_, c: string) => c.toUpperCase())
}

function toSingular(str: string): string {
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y'
  if (str.endsWith('s') && !str.endsWith('ss')) return str.slice(0, -1)
  return str
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

function unwrapTwentyList<T>(payload: any, path: string): T[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  const data = payload.data?.data ? payload.data.data : payload.data
  if (!data) return Array.isArray(payload.rows) ? payload.rows : []
  if (Array.isArray(data)) return data
  const cleanPath = path.replace(/^\//, '').split('?')[0].split('/')[0]
  const objectName = toCamelCase(cleanPath)
  const singularName = toSingular(objectName)
  if (Array.isArray(data[objectName])) return data[objectName]
  if (Array.isArray(data[cleanPath])) return data[cleanPath]
  if (Array.isArray(data[singularName])) return data[singularName]
  if (Array.isArray(data.rows)) return data.rows
  if (Array.isArray(data.edges)) return data.edges.map((e: any) => e?.node).filter((n: any) => n !== undefined)
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key])) return data[key]
  }
  return []
}

function unwrapTwentyItem<T>(payload: any, path: string): T {
  if (!payload) return payload
  const data = payload.data?.data ? payload.data.data : (payload.data ?? payload)
  const cleanPath = path.replace(/^\//, '').split('?')[0].split('/')[0]
  const objectName = toCamelCase(cleanPath)
  const singularName = toSingular(objectName)
  const pascalSingular = toPascalCase(singularName)
  let record: any = null
  if (data && typeof data === 'object') {
    if (data[singularName] && typeof data[singularName] === 'object') record = data[singularName]
    else if (data[objectName] && typeof data[objectName] === 'object' && !Array.isArray(data[objectName])) record = data[objectName]
    else if (data[`create${pascalSingular}`] && typeof data[`create${pascalSingular}`] === 'object') record = data[`create${pascalSingular}`]
    else if (data[`update${pascalSingular}`] && typeof data[`update${pascalSingular}`] === 'object') record = data[`update${pascalSingular}`]
    else if ('id' in data) record = data
    else {
      for (const val of Object.values(data)) {
        if (val && typeof val === 'object' && 'id' in (val as any)) {
          record = val
          break
        }
      }
    }
  }
  return (record || data || payload) as T
}

async function twentyList(path: string, limit = 100): Promise<TwentyRecord[]> {
  const clean = path.startsWith('/') ? path.slice(1) : path
  const url = `${TWENTY_BASE_URL}/rest/${clean}?limit=${limit}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' } })
  if (!res.ok) throw new Error(`Failed to list ${clean}: ${res.status}`)
  return unwrapTwentyList<TwentyRecord>(await res.json(), clean)
}

async function twentyGet(path: string, id: string): Promise<TwentyRecord> {
  const clean = path.startsWith('/') ? path.slice(1) : path
  const res = await fetch(`${TWENTY_BASE_URL}/rest/${clean}/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Failed to get ${clean}/${id}: ${res.status}`)
  return unwrapTwentyItem<TwentyRecord>(await res.json(), clean)
}

async function twentyCreate(path: string, data: Record<string, any>): Promise<TwentyRecord> {
  const clean = path.startsWith('/') ? path.slice(1) : path
  const res = await fetch(`${TWENTY_BASE_URL}/rest/${clean}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to create ${clean}: ${res.status} - ${(await res.text()).slice(0, 300)}`)
  return unwrapTwentyItem<TwentyRecord>(await res.json(), clean)
}

async function twentyUpdate(path: string, id: string, data: Record<string, any>): Promise<TwentyRecord> {
  const clean = path.startsWith('/') ? path.slice(1) : path
  const res = await fetch(`${TWENTY_BASE_URL}/rest/${clean}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to update ${clean}/${id}: ${res.status} - ${(await res.text()).slice(0, 300)}`)
  return unwrapTwentyItem<TwentyRecord>(await res.json(), clean)
}

async function twentyDelete(path: string, id: string): Promise<void> {
  const clean = path.startsWith('/') ? path.slice(1) : path
  const res = await fetch(`${TWENTY_BASE_URL}/rest/${clean}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey()}` },
  })
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete ${clean}/${id}: ${res.status}`)
}

async function createAgencyLead(input: {
  offerId?: string
  answers?: Record<string, string>
  contact?: { name?: string; fullName?: string; email?: string; phone?: string }
  qualificationStatus?: string
  source?: string
  prospectId?: string
  quizData?: any
  sourceUrl?: string
  utmSource?: string
  fbclid?: string
}): Promise<TwentyRecord> {
  const { offerId, answers, contact, qualificationStatus, source, prospectId, quizData, sourceUrl, utmSource, fbclid } = input
  const finalQualification = qualificationStatus || (answers ? 'QUALIFIED' : undefined)
  const contactName = contact?.name || contact?.fullName || ''
  const email = contact?.email || ''
  const phone = contact?.phone || ''
  const noteParts: string[] = []
  if (answers) noteParts.push(`Quiz answers: ${JSON.stringify(answers, null, 2)}`)
  if (quizData) noteParts.push(`Quiz detail: ${JSON.stringify(quizData, null, 2)}`)
  if (offerId) noteParts.push(`OfferId: ${offerId}`)
  if (sourceUrl) noteParts.push(`Source URL: ${sourceUrl}`)
  if (utmSource) noteParts.push(`UTM source: ${utmSource}`)
  if (fbclid) noteParts.push(`fbclid: ${fbclid}`)
  const contactNote = [`Name: ${contactName || '—'}`, `Email: ${email || '—'}`, `Phone: ${phone || '—'}`].join('\n')
  const fullNote = [contactNote, noteParts.join('\n\n')].filter(Boolean).join('\n\n').slice(0, 9000)
  const data: Record<string, any> = {
    ...(contactName && { contactName }),
    ...(fullNote && { note: fullNote }),
    ...(source && { source }),
    ...(finalQualification && { qualificationStatus: finalQualification }),
    ...(finalQualification === 'QUALIFIED'
      ? { status: 'QUALIFIED' }
      : finalQualification === 'DISQUALIFIED'
        ? { status: 'LOST' }
        : {}),
    name: contactName || email || `Lead ${new Date().toISOString().slice(0, 10)}`,
  }
  if (prospectId) (data as any).agencyProspect = { connect: { id: prospectId } }
  return twentyCreate(LEADS_OBJECT, data)
}

const app = new Hono()

app.get('/api/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    twentyCrm: { apiKeyConfigured: true, auth: 'railcode-org-session' },
  }),
)

// org gate: every /api route below requires a signed-in caller
app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/health') return next()
  if (!ctx.user) return c.json({ error: 'Sign in with Railcode to use the builder' }, 401)
  await next()
})

app.get('/api/auth/me', (c) => c.json({ user: ctx.user ?? null }))
app.post('/api/auth/login', (c) =>
  c.json({ error: 'Password login is retired on Railcode — sign in with your org account.' }, 410),
)

// ── offers ───────────────────────────────────────────────────────────────
app.get('/api/offers', async (c) => {
  try {
    return c.json(await twentyList(OFFERS_OBJECT, 100))
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.get('/api/offers/:id', async (c) => {
  try {
    return c.json(await twentyGet(OFFERS_OBJECT, c.req.param('id')))
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

const OFFER_FIELDS = [
  'title', 'name', 'heroH1', 'heroLede', 'videoUrl', 'status', 'ctaType',
  'prospectId', 'quizConfig', 'quiz', 'calendlyUrl', 'thankYouConfig',
  'disqualifiedConfig', 'metaPixelId', 'utmSwaps',
] as const

function pickOfferFields(body: any): Record<string, any> {
  const data: Record<string, any> = {}
  for (const key of OFFER_FIELDS) {
    if (body?.[key] !== undefined) data[key] = body[key]
  }
  if (data.quiz !== undefined && data.quizConfig === undefined) data.quizConfig = data.quiz
  delete (data as any).quiz
  if (data.prospectId !== undefined) data.name = data.prospectId
  return data
}

app.post('/api/offers', async (c) => {
  try {
    const created = await twentyCreate(OFFERS_OBJECT, pickOfferFields(await c.req.json().catch(() => ({}))))
    return c.json(created, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.patch('/api/offers/:id', async (c) => {
  try {
    const updated = await twentyUpdate(
      OFFERS_OBJECT,
      c.req.param('id'),
      pickOfferFields(await c.req.json().catch(() => ({}))),
    )
    return c.json(updated)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.delete('/api/offers/:id', async (c) => {
  try {
    await twentyDelete(OFFERS_OBJECT, c.req.param('id'))
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ── leads (internal funnel; anonymous capture stays on Vercel) ────────────
app.post('/api/leads', async (c) => {
  try {
    const created = await createAgencyLead(await c.req.json().catch(() => ({})))
    return c.json(created, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.get('/api/leads', async (c) => {
  try {
    return c.json(await twentyList(LEADS_OBJECT, 100))
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.delete('/api/leads/:id', async (c) => {
  try {
    await twentyDelete(LEADS_OBJECT, c.req.param('id'))
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ── prospects ────────────────────────────────────────────────────────────
app.get('/api/prospects', async (c) => {
  try {
    let records: TwentyRecord[] = []
    for (const obj of ['agencyProspects', 'agencyLeads', 'prospects', 'leads']) {
      try {
        const fetched = await twentyList(obj, 100)
        if (fetched.length > 0) {
          records = fetched
          break
        }
      } catch {
        // try next object
      }
    }
    return c.json(
      records.map((r: any) => ({
        id: r.id,
        displayName:
          [r.firstName, r.lastName].filter(Boolean).join(' ') ||
          (r.first_name ? `${r.first_name} ${r.last_name}`.trim() : r.name || r.company || r.email || r.id),
        firstName: r.firstName || r.first_name,
        lastName: r.lastName || r.last_name,
        company: r.company,
        email: r.email,
        city: r.city,
        region: r.region,
        raw: r,
      })),
    )
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default app
