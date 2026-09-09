import { Router } from "express";
import { twentyClient, type TwentyRecord } from "../lib/twenty-client.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { createLogger } from "../lib/logger.js";

const router = Router();
const log = createLogger('offers');
const OBJECT_NAME = "agencyOffers";

/**
 * GET /api/offers
 * List all agencyOffers from Twenty CRM
 */
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    log.info("Listing offers from Twenty CRM");
    const offers = await twentyClient.list<TwentyRecord>(OBJECT_NAME, 100);
    log.info(`Returning ${offers.length} offers`);
    res.json(offers);
  } catch (err: any) {
    log.error("Error listing offers:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/offers/:id
 * Get a single offer by ID
 */
router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    log.info(`Fetching offer ${id}`);
    const offer = await twentyClient.get<TwentyRecord>(OBJECT_NAME, id);
    res.json(offer);
  } catch (err: any) {
    log.error(`Error fetching offer ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/offers
 * Create a new offer
 */
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, name, heroH1, heroLede, videoUrl, status, ctaType, prospectId, quizConfig, quiz, calendlyUrl, thankYouConfig, disqualifiedConfig, metaPixelId, utmSwaps } = req.body;
    
    const data: Record<string, any> = {
      ...(title && { title }),
      ...(name && { name }),
      ...(heroH1 && { heroH1 }),
      ...(heroLede && { heroLede }),
      ...(videoUrl && { videoUrl }),
      ...(status && { status }),
      ...(ctaType && { ctaType }),
      ...(prospectId && { prospectId }),
      ...(prospectId && { name: prospectId }),
      ...((quizConfig !== undefined) && { quizConfig }),
      ...((quiz !== undefined) && { quizConfig: quiz }),
      ...(calendlyUrl !== undefined && { calendlyUrl }),
      ...(thankYouConfig !== undefined && { thankYouConfig }),
      ...(disqualifiedConfig !== undefined && { disqualifiedConfig }),
      ...(metaPixelId !== undefined && { metaPixelId }),
      ...(utmSwaps !== undefined && { utmSwaps }),
    };

    log.info(`Creating offer: ${JSON.stringify(data).substring(0, 200)}`);
    const offer = await twentyClient.create<TwentyRecord>(OBJECT_NAME, data);
    log.info(`Created offer ${offer.id}`);
    res.status(201).json(offer);
  } catch (err: any) {
    log.error("Error creating offer:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/offers/:id
 * Update an existing offer
 */
router.patch("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { title, name, heroH1, heroLede, videoUrl, status, ctaType, prospectId, quizConfig, quiz, calendlyUrl, thankYouConfig, disqualifiedConfig, metaPixelId, utmSwaps } = req.body;
    
    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title;
    if (name !== undefined) data.name = name;
    if (heroH1 !== undefined) data.heroH1 = heroH1;
    if (heroLede !== undefined) data.heroLede = heroLede;
    if (videoUrl !== undefined) data.videoUrl = videoUrl;
    if (status !== undefined) data.status = status;
    if (ctaType !== undefined) data.ctaType = ctaType;
    if (prospectId !== undefined) {
      data.prospectId = prospectId;
      data.name = prospectId;
    }
    if (quizConfig !== undefined) data.quizConfig = quizConfig;
    if (quiz !== undefined) data.quizConfig = quiz;
    if (calendlyUrl !== undefined) data.calendlyUrl = calendlyUrl;
    if (thankYouConfig !== undefined) data.thankYouConfig = thankYouConfig;
    if (disqualifiedConfig !== undefined) data.disqualifiedConfig = disqualifiedConfig;
    if (metaPixelId !== undefined) data.metaPixelId = metaPixelId;
    if (utmSwaps !== undefined) data.utmSwaps = utmSwaps;

    log.info(`Updating offer ${id}: ${JSON.stringify(data).substring(0, 200)}`);
    const offer = await twentyClient.update<TwentyRecord>(OBJECT_NAME, id, data);
    log.info(`Updated offer ${id}`);
    res.json(offer);
  } catch (err: any) {
    log.error(`Error updating offer ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/offers/:id
 * Delete an offer
 */
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    log.info(`Deleting offer ${id}`);
    await twentyClient.delete(OBJECT_NAME, id);
    log.info(`Deleted offer ${id}`);
    res.json({ success: true });
  } catch (err: any) {
    log.error(`Error deleting offer ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

export { router };
export default router;
