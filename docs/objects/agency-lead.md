# agencyLead / agencyLeads (funnel-created)

Created by funnel submissions. The contact record for booked/disqualified prospects.

## How to make it

- Created via `POST /api/leads` (internal preview) or `POST /api/public/leads`
  (public funnel). Never hand-created.

## Expected metadata fields

| Field | Type | Expected values |
|-------|------|-----------------|
| `qualificationStatus` | SELECT | `QUALIFIED` (green) / `DISQUALIFIED` (red) |
| `status` | SELECT | mirrors qualification (`QUALIFIED` → `QUALIFIED`, `DISQUALIFIED` → `LOST`) |
| `note` | TEXT | contact details + quiz answers JSON (EMAILS type is finicky, so contact lives in `note`) |
| `agencyProspect` | RELATION | → source prospect (from `prospectId`) |
| `campaignId` | RELATION | → campaign when known |
| `offerId` | stored in note | originating offer (see lead-capture payload) |

## Capture payload (`POST /api/public/leads`)

`{ offerId, firstName?, lastName?, email?, phone?, quizAnswers?, contact?,
qualificationStatus?, sourceUrl?, visitorId?, utmSource/Medium/Campaign/Content/Term?,
fbclid?, gclid?, prospectId?, source? }` → `{ success, leadId }`.
