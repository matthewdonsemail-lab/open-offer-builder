/**
 * Vercel serverless entry — re-exports the Express app from backend/src.
 * All /api/* traffic is rewritten here by vercel.json; the frontend's
 * static dist is served for everything else (same origin, so VITE_API_URL
 * stays unset in production).
 */
import { createApp } from "../backend/src/index.js";

const app = createApp();

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}
