import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Load environment variables from project root .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env.local");
const result = config({ path: envPath });
if (result.error) {
  console.warn("[env] failed to load .env.local:", result.error.message);
} else {
  console.log("[env] loaded from", envPath);
}

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import offersRoutes from "./routes/offers.js";
import prospectsRoutes from "./routes/prospects.js";
import leadsRoutes from "./routes/leads.js";
import { getTwentyPgStatus } from "./db/twenty-pg.js";
import { createLogger } from "./lib/logger.js";

const log = createLogger('server');
const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Request logger — prints method, url, body JSON, and response time
app.use((req, _res, next) => {
  const start = Date.now();
  const sanitizedBody = { ...req.body };
  if (sanitizedBody.password) sanitizedBody.password = `***(${String(sanitizedBody.password).length} chars)`;
  console.log(`[http] --> ${req.method} ${req.url} body=${JSON.stringify(sanitizedBody)}`);
  const originalSend = _res.send.bind(_res);
  // log on finish
  _res.on('finish', () => {
    console.log(`[http] <-- ${req.method} ${req.url} ${_res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get("/api/health", (_req, res) => {
  const twentyPg = getTwentyPgStatus();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    twentyCrm: {
      apiKeyConfigured: Boolean(process.env.TWENTY_API_KEY),
      databaseUrlConfigured: twentyPg.configured,
      databaseMessage: twentyPg.message,
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/prospects", prospectsRoutes);
app.use("/api/leads", leadsRoutes);

// Log whether Twenty Postgres is available for login
const twentyPgStatus = getTwentyPgStatus();
if (!twentyPgStatus.configured) {
  log.warn("[auth] Twenty credential verification is unavailable:", twentyPgStatus.message);
} else {
  log.info("[auth] Twenty credential verification is configured.");
}

log.info(`Server running on http://localhost:${PORT}`);
app.listen(PORT, "0.0.0.0", () => {
  log.info(`Server ready on port ${PORT}`);
});
