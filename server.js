const express = require("express");
const path = require("path");

const app = express();
let requestCount = 0;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api", (_req, res) => {
  requestCount++;
  res.json({
    service: process.env.K_SERVICE || "local",
    revision: process.env.K_REVISION || "dev",
    instanceHostname: process.env.HOSTNAME || "local",
    pid: process.pid,
    time: new Date().toISOString(),
    requestCountOnThisInstance: requestCount
  });
});

// Optional CPU work to create heavier load: /stress?ms=800
app.get("/stress", (req, res) => {
  const workMs = Number(req.query.ms || 500);
  const start = Date.now();
  while (Date.now() - start < workMs) Math.sqrt(Math.random());
  res.json({ didWorkMs: workMs, at: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Bank autoscale demo listening on ${PORT}`);
});
