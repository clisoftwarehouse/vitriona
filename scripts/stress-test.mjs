import autocannon from 'autocannon';

// ─── Configuration ───────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3000';
const BUSINESS_SLUG = 'don-pastel';
const PRODUCT_SLUGS = [
  'arroz-premium-1kg',
  'frijoles-negros-500g',
  'aceite-de-oliva-500ml',
  'pasta-spaghetti-500g',
  'salsa-de-tomate-400g',
];

// Test profiles: { name, url, duration (sec), connections, pipelining, method, body?, headers? }
const tests = [
  // ── 1. Storefront Home (default catalog) ──
  {
    name: '🏪 Storefront Home',
    url: `${BASE_URL}/${BUSINESS_SLUG}`,
    duration: 15,
    connections: 50,
    pipelining: 1,
  },

  // ── 2. Storefront Home with search ──
  {
    name: '🔍 Storefront Search',
    url: `${BASE_URL}/${BUSINESS_SLUG}?buscar=arroz`,
    duration: 15,
    connections: 50,
    pipelining: 1,
  },

  // ── 3. Product Detail (rotates across product slugs) ──
  {
    name: '📦 Product Detail',
    url: `${BASE_URL}/${BUSINESS_SLUG}/producto/${PRODUCT_SLUGS[0]}`,
    duration: 15,
    connections: 50,
    pipelining: 1,
  },

  // ── 4. Checkout Page ──
  {
    name: '🛒 Checkout Page',
    url: `${BASE_URL}/${BUSINESS_SLUG}/checkout`,
    duration: 15,
    connections: 50,
    pipelining: 1,
  },

  // ── 5. Auth Login Page ──
  {
    name: '🔐 Auth Login',
    url: `${BASE_URL}/auth/login`,
    duration: 10,
    connections: 30,
    pipelining: 1,
  },

  // ── 6. Spike test — Storefront Home with higher concurrency ──
  {
    name: '⚡ SPIKE: Storefront Home (100 conn)',
    url: `${BASE_URL}/${BUSINESS_SLUG}`,
    duration: 10,
    connections: 100,
    pipelining: 1,
  },

  // ── 7. Spike test — Product Detail high concurrency ──
  {
    name: '⚡ SPIKE: Product Detail (100 conn)',
    url: `${BASE_URL}/${BUSINESS_SLUG}/producto/${PRODUCT_SLUGS[1]}`,
    duration: 10,
    connections: 100,
    pipelining: 1,
  },

  // ── 8. Sustained load — Storefront 30s ──
  {
    name: '🏋️ SUSTAINED: Storefront (30s, 80 conn)',
    url: `${BASE_URL}/${BUSINESS_SLUG}`,
    duration: 30,
    connections: 80,
    pipelining: 1,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function printResult(name, result) {
  const { requests, latency, throughput, errors, timeouts, non2xx } = result;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Requests:`);
  console.log(`    Total:   ${requests.total}`);
  console.log(`    Avg/sec: ${requests.average}`);
  console.log(`    Min/sec: ${requests.min}`);
  console.log(`    Max/sec: ${requests.max}`);
  console.log(`  Latency (ms):`);
  console.log(`    Avg:     ${latency.average}`);
  console.log(`    p50:     ${latency.p50}`);
  console.log(`    p90:     ${latency.p90}`);
  console.log(`    p99:     ${latency.p99}`);
  console.log(`    Max:     ${latency.max}`);
  console.log(`  Throughput: ${formatBytes(throughput.average)}/sec`);
  console.log(`  Errors:    ${errors} | Timeouts: ${timeouts} | Non-2xx: ${non2xx}`);

  // Health verdict
  const healthy = errors === 0 && timeouts === 0 && non2xx === 0 && latency.p99 < 3000;
  console.log(`  Status:    ${healthy ? '✅ HEALTHY' : '⚠️  DEGRADED'}`);
}

// ─── Runner ──────────────────────────────────────────────────────────────────
async function runTest(config) {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: config.url,
      duration: config.duration,
      connections: config.connections,
      pipelining: config.pipelining || 1,
      method: config.method || 'GET',
      ...(config.body ? { body: JSON.stringify(config.body) } : {}),
      ...(config.headers ? { headers: config.headers } : {}),
    });

    autocannon.track(instance, { renderProgressBar: true });
    instance.on('done', resolve);
    instance.on('error', reject);
  });
}

async function main() {
  console.log('\n🚀 Vitriona Stress Test Suite');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Business: ${BUSINESS_SLUG}`);
  console.log(`   Tests: ${tests.length}\n`);

  const summary = [];

  for (const test of tests) {
    console.log(`\n▶ Running: ${test.name}  (${test.connections} conn × ${test.duration}s)`);
    console.log(`  URL: ${test.url}\n`);

    try {
      const result = await runTest(test);
      printResult(test.name, result);
      summary.push({
        name: test.name,
        rps: result.requests.average,
        latP50: result.latency.p50,
        latP99: result.latency.p99,
        errors: result.errors + result.timeouts + result.non2xx,
      });
    } catch (err) {
      console.error(`  ❌ Test failed: ${err.message}`);
      summary.push({ name: test.name, rps: 0, latP50: 0, latP99: 0, errors: -1 });
    }
  }

  // ─── Final Summary Table ────────────────────────────────────────────
  console.log(`\n\n${'═'.repeat(80)}`);
  console.log('  📊 SUMMARY');
  console.log(`${'═'.repeat(80)}`);
  console.log(
    '  ' +
      'Test'.padEnd(42) +
      'RPS'.padStart(8) +
      'p50(ms)'.padStart(10) +
      'p99(ms)'.padStart(10) +
      'Errors'.padStart(8)
  );
  console.log(`  ${'─'.repeat(78)}`);

  for (const s of summary) {
    const status = s.errors === 0 ? '✅' : s.errors === -1 ? '❌' : '⚠️';
    console.log(
      `  ${status} ${s.name.padEnd(39)}${String(s.rps).padStart(8)}${String(s.latP50).padStart(10)}${String(s.latP99).padStart(10)}${String(s.errors).padStart(8)}`
    );
  }

  console.log(`${'═'.repeat(80)}\n`);
}

main().catch(console.error);
