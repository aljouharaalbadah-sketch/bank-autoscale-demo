import http from 'k6/http';

// Hit the CPU-heavy endpoint, but not extreme
const BASE = __ENV.TARGET_URL;
const PATH = '/stress?ms=800'; // ~0.8s CPU per request

export const options = {
  scenarios: {
    // Gentle ramp up to a modest concurrency
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 40 },  // warm up
        { duration: '60s', target: 80 },  // hold moderate load
        { duration: '30s', target: 120 }, // brief push (should trigger autoscale)
        { duration: '30s', target: 0 },   // ramp down
      ],
      gracefulRampDown: '10s',
    },

    // Keep a steady request rate for a short period
    steady_rate: {
      executor: 'constant-arrival-rate',
      rate: 80,               // ~80 req/sec
      timeUnit: '1s',
      duration: '90s',
      preAllocatedVUs: 120,   // initial VU pool
      maxVUs: 200,
      startTime: '30s',       // starts after ramp begins
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],    // tolerate up to 2% errors
    http_req_duration: ['p(95)<2000'], // 95% under 2s
  },
};

export default function () {
  http.get(`${BASE}${PATH}`);
  // no sleep -> we want enough concurrency, but the scenarios keep it reasonable
}


