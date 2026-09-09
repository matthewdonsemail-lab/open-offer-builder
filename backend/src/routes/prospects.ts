import { Router } from "express";
import { twentyClient, type TwentyRecord } from "../lib/twenty-client.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { createLogger } from "../lib/logger.js";

const router = Router();
const log = createLogger('prospects');

// Supports both agencyProspects and agencyLeads — try prospects first
const OBJECTS = ["agencyProspects", "agencyLeads", "prospects", "leads"];

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    log.info("Listing prospects/leads from Twenty");
    let records: TwentyRecord[] = [];
    let usedObject = "";
    for (const obj of OBJECTS) {
      try {
        const fetched = await twentyClient.list<TwentyRecord>(obj, 100);
        if (fetched.length > 0) {
          records = fetched;
          usedObject = obj;
          break;
        }
        // keep first empty result as fallback
        if (!usedObject) usedObject = obj;
      } catch (e: any) {
        log.warn(`Failed to list ${obj}: ${e.message}`);
      }
    }
    // normalize to display name (keep city/region so preview can resolve {{area}})
    const normalized = records.map((r: any) => ({
      id: r.id,
      displayName: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.first_name ? `${r.first_name} ${r.last_name}`.trim() : (r.name || r.company || r.email || r.id),
      firstName: r.firstName || r.first_name,
      lastName: r.lastName || r.last_name,
      company: r.company,
      email: r.email,
      city: r.city,
      region: r.region,
      raw: r,
    }));
    log.info(`Returning ${normalized.length} prospects from ${usedObject}`);
    res.json(normalized);
  } catch (err: any) {
    log.error("Error listing prospects:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export { router };
export default router;
