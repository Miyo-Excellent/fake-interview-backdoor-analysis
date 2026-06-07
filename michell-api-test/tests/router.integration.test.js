'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { createApp } = require('../src/app');
const { getWorkingProvider } = require('../src/smartContractService');
const { DEFAULT_TOKENS, DEFAULT_MARKETPLACE } = require('../src/config');

/**
 * Integration tests — boot the real Express app and call it over HTTP against a
 * live Gnosis Chain RPC. Assertions rely only on immutable on-chain facts
 * (a token's symbol and decimals never change), so the test is deterministic
 * even though the data is fetched live.
 *
 * If no public RPC is reachable (offline CI), the suite is skipped rather than
 * reported as a failure.
 */

let server;
let base;
let online = true;

before(async () => {
  try {
    const { provider } = await getWorkingProvider();
    const app = createApp(provider);
    server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    base = `http://127.0.0.1:${server.address().port}`;
  } catch (err) {
    online = false;
    console.warn('Skipping integration tests, no RPC reachable:', err.message);
  }
});

after(() => {
  if (server) server.close();
});

async function get(pathname) {
  const res = await fetch(`${base}${pathname}`);
  return { status: res.status, body: await res.json() };
}

test('GET /health returns service metadata', async (t) => {
  if (!online) return t.skip('no RPC reachable');
  const { status, body } = await get('/api/michell-api-test/health');
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, 'Michell api test');
});

test('GET /token/:address returns live WXDAI metadata', async (t) => {
  if (!online) return t.skip('no RPC reachable');
  const { status, body } = await get(`/api/michell-api-test/token/${DEFAULT_TOKENS.WXDAI}`);
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.symbol, 'WXDAI');
  assert.equal(body.data.decimals, 18);
  assert.ok(typeof body.data.name === 'string' && body.data.name.length > 0);
  assert.ok(BigInt(body.data.totalSupply) > 0n);
});

test('GET /token/:address returns live USDC metadata (6 decimals)', async (t) => {
  if (!online) return t.skip('no RPC reachable');
  const { status, body } = await get(`/api/michell-api-test/token/${DEFAULT_TOKENS.USDC}`);
  assert.equal(status, 200);
  assert.equal(body.data.decimals, 6);
  assert.equal(body.data.symbol, 'USDC');
});

test('GET /token/:address rejects an invalid address with 400', async (t) => {
  if (!online) return t.skip('no RPC reachable');
  const { status, body } = await get('/api/michell-api-test/token/0x123');
  assert.equal(status, 400);
  assert.equal(body.ok, false);
});

test('GET /marketplace/:address returns a positive offer count', async (t) => {
  if (!online) return t.skip('no RPC reachable');
  const { status, body } = await get(`/api/michell-api-test/marketplace/${DEFAULT_MARKETPLACE}`);
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(typeof body.data.offerCount, 'number');
  assert.ok(body.data.offerCount > 0);
});
