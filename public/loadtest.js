import http from "k6/http";
import { sleep } from "k6";

// Stages cross the 30, 60, 90 concurrency thresholds (approx)
export const options = {
  stages: [
    { duration: "30s", target: 20 },  // below 30 -> ~1 instance
    { duration: "30s", target: 40 },  // around 40 -> ~2 instances
    { duration: "30s", target: 70 },  // around 70 -> ~3 instances
    { duration: "30s", target: 100 }, // around 100 -> ~4 instances
    { duration: "30s", target: 0 },   // cool down
  ]
};

export default function () {
  const base = __ENV.TARGET_URL;
  http.get(`${base}/stress?ms=1000`); // ~1 second per request
  // 1s request time + ~1 iteration/sec per VU ≈ VUs ≈ concurrent requests
  // With concurrency target 30, expect ~1 instance per ~30 VUs.
  sleep(0);
}

