# agencyPhone / agencyPhones (read-only from this repo)

Sending-number inventory owned by the dialer side. This repo never writes it;
documented here because the widget's From-selector and the `sms:` drafts depend
on rows existing.

## Expected metadata fields

| Field | Type | Expected values |
|-------|------|-----------------|
| `phoneNumber` | TEXT | E.164 number (fallback: `name`) |
| `countryCode` | TEXT | `IE` / `US` — drives IE→IE, US→US matching |
| `numberType` | SELECT | `LONG_CODE` / `TOLL_FREE` / `SHORT_CODE` |
| `state` | SELECT | `ACTIVE` (only ACTIVE rows are selectable) / `PAUSED` / `DEGRADED` / `RETIRED` |
| `messagingProfileId` | TEXT | Telnyx profile for Phase-2 sends |
| `tenDlcCampaignId` / `tollFreeVerificationId` | TEXT | US compliance registrations |

## Rule

At least one ACTIVE row per sending country (1×IE + 1×US). Empty inventory is a
valid state — the widget shows it explicitly and day-1 sends still work via
manual SMS draft.
