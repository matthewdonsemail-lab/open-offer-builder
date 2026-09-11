import { Router } from "express";
import { twentyClient, type TwentyRecord } from "../lib/twenty-client.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { createLogger } from "../lib/logger.js";

const router = Router();
const log = createLogger('industries');

/**
 * GET /api/industries
 * Distinct industry options for the builder's Industry selector, from
 * agencyCampaigns. Each entry: key = the campaign's industryId SELECT value
 * (what gets stored on offer.industryId and what by-prospect matching runs on),
 * label = the campaign name (falls back to the SELECT value).
 */
const sel = (v: unknown): string =>
  (v && typeof v === "object" ? String((v as any).value ?? "") : String(v ?? "")).trim();

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    log.info("Listing industry options from agencyCampaigns");
    const campaigns = await twentyClient.list<TwentyRecord>("agencyCampaigns", 100);
    const seen = new Map<string, { key: string; label: string; urlKey: string }>();
    for (const c of campaigns) {
      const r = c as unknown as Record<string, any>;
      const key = sel(r.industryId);
      if (!key || seen.has(key)) continue;
      const label = sel(r.name) || key;
      seen.set(key, { key, label, urlKey: sel(r.urlKey) });
    }
    const industries = Array.from(seen.values());
    industries.sort((a, b) => a.label.localeCompare(b.label));
    log.info(`Returning ${industries.length} industries`);
    res.json(industries);
  } catch (err: any) {
    log.error("Error listing industries:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export { router };
export default router;