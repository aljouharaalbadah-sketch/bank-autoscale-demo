// server.js
const express = require("express");
const path = require("path");
const os = require("os");
const { randomUUID } = require("crypto");

const app = express();

// simple in-process counters
let requestCount = 0;
const startedAt = Date.now();

// A stable ID for this container (prefer Cloud Run's K_INSTANCE if available)
const INSTANCE_ID = process.env.K_INSTANCE || randomUUID();

// Serve static files (your UI lives in /public)
app.use(express.static(path.join(__dirname, "public")));

// ---- Health -----------------------------------------------------------------
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// ---- Polled by the dashboard ------------------------------------------------
app.get("/api", (_req, res) => {
  requestCount++;
  res.json({
    service: process.env.K_SERVICE || "local",
    revision: process.env.K_REVISION || "dev",

    // Unique identity of THIS running container:
    instanceId: INSTANCE_ID,                // <- use this in the UI to detect autoscaling
    instanceHostname: os.hostname(),        // also return hostname for reference
    pid: process.pid,

    time: new Date().toISOString(),
    requestCountOnThisInstance: requestCount,
  });
});

// ---- Extra runtime metrics for charts --------------------------------------
app.get("/stats", (_req, res) => {
  const mu = process.memoryUsage();
  res.json({
    now: Date.now(),
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    memory: {
      rssMB: +(mu.rss / (1024 * 1024)).toFixed(1),
      heapUsedMB: +(mu.heapUsed / (1024 * 1024)).toFixed(1),
      heapTotalMB: +(mu.heapTotal / (1024 * 1024)).toFixed(1),
    },
    // os.loadavg() is null/zeros on Windows but works in Linux (Cloud Run)
    cpuLoad1m: os.loadavg?.()[0] ?? null,
    platform: process.platform,
    arch: process.arch,
  });
});

// ---- CPU work endpoint to simulate load ------------------------------------
// Example: GET /stress?ms=800  -> busy-loop ~800ms
app.get("/stress", (req, res) => {
  const workMs = Math.max(0, Number(req.query.ms ?? 800));
  const start = Date.now();
  while (Date.now() - start < workMs) {
    // keep the CPU busy
    Math.sqrt(Math.random());
  }
  res.json({ didWorkMs: workMs, at: new Date().toISOString(), instanceId: INSTANCE_ID });
});

// ---- Start server -----------------------------------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`SkyBank demo listening on :${PORT} (instanceId=${INSTANCE_ID})`);
});
