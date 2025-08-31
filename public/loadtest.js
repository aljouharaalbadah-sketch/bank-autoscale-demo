import http from "k6/http";
import { sleep } from "k6";

export const options = {
  // Simulate a quiet period, then a busy "peak hour", then cool down
  stages: [
    { duration: "1m", target: 10 },   // warm up
    { duration: "3m", target: 120 },  // ramp to peak
    { duration: "3m", target: 250 },  // sustained peak
    { duration: "2m", target: 30 },   // cool down
    { duration: "1m", target: 0 }     // finish
  ]
};

export default function () {
  const base = __ENV.TARGET_URL; // e.g. https://YOUR-SERVICE-URL
  http.get(`${base}/api`, { tags: { name: "api" } });
  // Optionally hammer CPU:
  // http.get(`${base}/stress?ms=800`, { tags: { name: "stress" } });
  sleep(1);
}
