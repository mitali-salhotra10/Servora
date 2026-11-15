/**
 * Servora Database & Environment Probe Utility
 */
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/ready',
  method: 'GET',
  timeout: 10000
};

console.log('[Servora Probe] Testing backend readiness on http://localhost:5000/ready ...');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const isReady = parsed.success && parsed.data?.status === 'ready';
      console.log(`[Servora Probe] HTTP Status: ${res.statusCode}`);
      console.log(`[Servora Probe] Service State: ${parsed.data?.status || 'UNKNOWN'}`);
      console.log(`[Servora Probe] Database Connected: ${parsed.data?.database?.connected ? 'YES' : 'NO'}`);
      console.log(`[Servora Probe] Database Latency: ${parsed.data?.database?.latencyMs ?? 'N/A'}ms`);
      process.exit(isReady ? 0 : 1);
    } catch (e) {
      console.error('[Servora Probe] Failed to parse response JSON:', data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('[Servora Probe] Error connecting to server:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('[Servora Probe] Connection timed out.');
  req.destroy();
  process.exit(1);
});

req.end();
