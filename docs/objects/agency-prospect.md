# agencyProspect / agencyProspects (read-only from this repo)

Prospects are owned by the ingest/enrich pipeline (ui-kit). This repo **reads**
them for tailoring and attribution, and writes only `outboundLabel` (sent logging).
Never add prospect fields from here — propose them in ui-kit.

## Fields this repo touches

| Field | Type | Expected values / rules |
|-------|------|-------------------------|
| `id` / `slug` | UUID / TEXT | `:key` for `by-prospect` and funnel URLs; slug lines up `/offer/:industry/:slug` with template sites |
| `name` | TEXT | **Business** name — never split into a person |
| `label` | SELECT | `AUTO_PAINT_AND_BODY_SHOPS` / `WINDOW_TINTING` / `AUTO_DETAILING` / `GENERAL_TRADES` — canonical industry; raw `niche` is display-only |
| `city` / `region` | TEXT | `{{area}}` resolution (`city, region`) |
| `quizCurrency` | TEXT | `€` / `$` / `£` — stamped at enrichment for `{{currency}}`; render reads it verbatim |
| `videoUrl` | LINKS | Default funnel video (`videoMode=PROSPECT`) |
| `campaignId` | RELATION | → industry `agencyCampaign` (preferred routing source) |
| `outboundLabel` | SELECT | This repo advances pre-send states → `SMS_IN_PROGRESS` on sent log |
| `phone` | TEXT | Legacy fallback; prefer `phoneNumber` composite upstream |

## Readers

`by-prospect` (label → industry, city/region/currency tailoring, video default),
`/prospects/:key` allowlist (`id/name/city/region/niche/quizCurrency` — no PII),
`Quiz` attribution (`prospectId` into agencyLead).
