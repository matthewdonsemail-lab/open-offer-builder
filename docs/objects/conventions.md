# Twenty conventions (all agency objects)

## Making objects and fields

- Schema via the **Metadata API** (`POST /metadata`, GraphQL `createOneObject` /
  `createOneField`); records via the **REST API** (`/rest/...`). Mixing them up
  is the most common source of 400s.
- Fields are created by idempotent ensure scripts (`backend/src/scripts/seed.ts`
  here; `ensure-industry-canonical.ts` in ui-kit) — never hand-created in the UI.
- SELECT option `value`s **must** be UPPER_CASE. Field creation needs the
  object's metadata id — scripts always list-then-find first.

## Reading data

- Industry linkage is by SELECT value + `INDUSTRY:{urlKey}` name convention, not
  RELATION fields (relations already burned us once).
- Runtime code reads rows and surfaces explicit states for missing data — hosts,
  keys, and copy are never hardcoded and never defaulted. Seed scripts hold
  initial values only.
- `name` on prospects is the business name. Tokens: `{{area}}`/`{{city}}`
  resolve per prospect; `{{currency}}` reads the record; `{{name}}` is left
  untouched. Styling is inline `style="…"` (classes don't resolve in
  Twenty-stored HTML), except yellow `<mark>` which the resolver normalises.
