import { Router } from "express";
import { twentyClient, type TwentyRecord } from "../lib/twenty-client.js";
import { createAgencyLead } from "./leads.js";
import { createLogger } from "../lib/logger.js";

const router = Router();
const log = createLogger('public');
const OBJECT_NAME = "agencyOffers";

/**
 * Visual-only payload keys exposed to the unauthenticated public funnel.
 * Internal agency metadata (createdBy/updatedBy/source internals, search
 * vectors, positions, etc.) is stripped before responding.
 */
const VISUAL_KEYS = [
  "id",
  "title",
  "name",
  "heroH1",
  "heroLede",
  "videoUrl",
  "quizConfig",
  "quiz",
  "thankYouConfig",
  "disqualifiedConfig",
  "calendlyUrl",
  "disqualifiedCalendlyUrl",
  "metaPixelId",
  "status",
  "utmSwaps",
] as const;

function toVisualPayload(record: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key of VISUAL_KEYS) {
    if (record[key] !== undefined) out[key] = record[key];
  }
  return out;
}

function slugify(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * GET /api/public/offers/:slug
 * Unauthenticated visual payload for the public funnel at offer.domain.com.
 * :slug may be a Twenty record id, a slugified title/name, or "default"
 * (first ACTIVE offer, else first offer).
 */
router.get("/offers/:slug", async (req, res) => {
  try {
    const slug = req.params.slug as string;
    let offer: TwentyRecord | null = null;

    if (slug === "default") {
      const offers = await twentyClient.list<TwentyRecord>(OBJECT_NAME, 100);
      offer =
        offers.find((o) => String((o as any).status || "").toUpperCase() === "ACTIVE") ??
        offers[0] ??
        null;
    } else if (isUuid(slug)) {
      try {
        offer = await twentyClient.get<TwentyRecord>(OBJECT_NAME, slug);
      } catch {
        offer = null;
      }
    } else {
      const offers = await twentyClient.list<TwentyRecord>(OBJECT_NAME, 100);
      offer =
        offers.find(
          (o) => slugify((o as any).title) === slug || slugify((o as any).name) === slug
        ) ?? null;
    }

    if (!offer) {
      res.status(404).json({ error: "Offer not found" });
      return;
    }
    log.info(`Serving public offer payload for ${slug} -> ${(offer as any).id}`);
    res.json(toVisualPayload(offer as unknown as Record<string, any>));
  } catch (err: any) {
    log.error(`Error serving public offer ${req.params.slug}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/public/leads
 * Unauthenticated lead capture for the public funnel.
 * Body: { offerId, firstName?, lastName?, email?, phone?, quizAnswers?,
 *   answers?, contact?, qualificationStatus?, sourceUrl?, visitorId?,
 *   utmSource?, utmMedium?, utmCampaign?, utmContent?, utmTerm?,
 *   fbclid?, gclid?, prospectId?, source? }
 * Returns { success, leadId } for Calendly routing on the client.
 */
router.post("/leads", async (req, res) => {
  try {
    const {
      offerId,
      firstName,
      lastName,
      email,
      phone,
      quizAnswers,
      answers,
      contact,
      qualificationStatus,
      sourceUrl,
      visitorId,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      fbclid,
      gclid,
      prospectId,
      source,
      quizData,
    } = req.body ?? {};

    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const mergedContact = contact ?? {
      ...(fullName && { name: fullName }),
      ...(email && { email }),
      ...(phone && { phone }),
    };

    if (!mergedContact?.email && !mergedContact?.phone) {
      res.status(400).json({ error: "Email or phone required" });
      return;
    }

    const created = await createAgencyLead({
      offerId,
      answers: answers ?? quizAnswers,
      contact: mergedContact,
      qualificationStatus,
      source: source ?? "public",
      prospectId,
      quizData,
      sourceUrl,
      visitorId,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      fbclid,
      gclid,
    });
    res.status(201).json({ success: true, leadId: created.id });
  } catch (err: any) {
    log.error("Error creating public lead:", err.message);
    console.error('[public] error', err);
    res.status(500).json({ error: err.message });
  }
});

export { router };
export default router;
