# agencyOffer / agencyOffers

The funnel content object. One row per industry (`name = INDUSTRY:{urlKey}`)
is served; per-prospect `name == prospectId` rows are builder history only.

## How to make it

- First run: `bun run --cwd backend seed` (creates the object + every field below, skips what exists).
- Industry rows: `bun` script in ui-kit (`ensure-industry-canonical.ts`), or editor → new offer with `name = INDUSTRY:{id}`.
- Never hand-create fields in the Twenty UI — names/types below are contractual.

## Expected metadata fields

| Field | Type | Expected values |
|-------|------|-----------------|
| `name` | TEXT | `INDUSTRY:autobody` \| `tint` \| `detailing` \| `general`, or a prospect UUID (legacy) |
| `industryId` | SELECT | `AUTO_PAINT_AND_BODY_SHOPS` / `WINDOW_TINTING` / `AUTO_DETAILING` / `GENERAL_TRADES` (UPPER_CASE) |
| `videoMode` | SELECT | `PROSPECT` (serve prospect `videoUrl`) / `CUSTOM` (serve this row's `videoUrl` industry-wide) |
| `title` | TEXT | SEO title — never mentions the industry |
| `heroH1` | TEXT | Raw editor HTML, rendered verbatim |
| `heroLede` | RICH_TEXT | `{markdown, blocknote}` — HTML + `{{area}}` token |
| `videoUrl` | LINKS | `{primaryLinkLabel, primaryLinkUrl, secondaryLinks[]}` |
| `status` | SELECT | `DRAFT` / `ACTIVE` / `PAUSED` (UPPER_CASE) |
| `ctaType` | SELECT | `CONSULTATION` / `PRICING` / `CUSTOM` (stored; funnel always ends in booking) |
| `quizConfig` | RAW_JSON | `{ introTitle, introDesc, questions[] }` — intro rendered as HTML with `{{area}}`/`{{currency}}` |
| `thankYouConfig` | RAW_JSON | badge, heading, `video` URL, video grid |
| `disqualifiedConfig` | RAW_JSON | same + `calendlyEmbed` (full inline widget HTML) |
| `calendlyUrl` | TEXT | qualified Calendly embed HTML (or bare URL) |
| `metaPixelId` | TEXT | per-offer pixel; empty = disabled |
| `utmSwaps` | RAW_JSON | `{ rules: [{ utmSource, field: heroH1\|heroLede\|title, html }] }` |
| `mediaLogos` | RAW_JSON | `[{ src, alt?, href? }]` — worked-with carousel |
| `carouselHeading` | TEXT | carousel H1 HTML (blank falls back) |
| `carouselDesc` | RICH_TEXT | `{markdown}` supporting line, `{{area}}`-resolved |
| `brandName` / `brandSub` / `brandLogoUrl` | TEXT | brand header above hero H1 (logo left, name right, sub beneath) |

## Relations

- None into other objects by design (industry linkage is by SELECT value + `INDUSTRY:` name convention, not RELATION fields).
- Read by: `by-prospect` endpoint, `PreviewPage`, dialer `website-status`, ui-kit `offers-render`.

## Serve contract

`GET /api/public/offers/by-prospect/:key` (`:key` = prospect id or slug) returns the
`INDUSTRY:{urlKey}` row with `prospectId`/`industryId` stamped on, video resolved
(`CUSTOM` override else prospect video). Explicit 404s, no generic fallback.
