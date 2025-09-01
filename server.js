// server.js
const express = require("express");
const path = require("path");
const os = require("os");

const app = express();
let requestCount = 0;
const startedAt = Date.now();

app.use(express.static(path.join(__dirname, "public")));

// Simple health
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// Polled by dashboard
app.get("/api", (_req, res) => {
  requestCount++;
  res.json({
    service: process.env.K_SERVICE || "local",
    revision: process.env.K_REVISION || "dev",
    instanceHostname: os.hostname(),         // real container id
    pid: process.pid,
    time: new Date().toISOString(),
    requestCountOnThisInstance: requestCount
  });
});

// Extra runtime metrics for charts
app.get("/stats", (_req, res) => {
  const mu = process.memoryUsage();
  res.json({
    now: Date.now(),
    uptimeSec: Math.round(process.uptime()),
    memory: {
      rssMB: +(mu.rss / (1024 * 1024)).toFixed(1),
      heapUsedMB: +(mu.heapUsed / (1024 * 1024)).toFixed(1),
      heapTotalMB: +(mu.heapTotal / (1024 * 1024)).toFixed(1)
    },
    cpu: os.loadavg?.()[0] ?? null,          // null on Windows containers
    platform: process.platform,
    arch: process.arch
  });
});

// Optional CPU work to create heavier load: /stress?ms=800
app.get("/stress", (req, res) => {
  const workMs = Number(req.query.ms ?? 800);
  const start = Date.now();
  while (Date.now() - start < workMs) Math.sqrt(Math.random());
  res.json({ didWorkMs: workMs, at: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`SkyBank demo listening on ${PORT}`));
