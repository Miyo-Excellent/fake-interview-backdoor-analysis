'use strict';

const express = require('express');
const service = require('./smartContractService');
const { DEFAULT_TOKENS, DEFAULT_MARKETPLACE } = require('./config');

/**
 * "Michell api test" — a new, self-contained API for the EstokkYam backend.
 *
 * It fetches information about the project's smart contracts (ERC20 tokens and
 * the P2P offer marketplace) directly from the blockchain and returns it as
 * JSON. It is mounted under /api/michell-api-test.
 *
 * A live provider is injected once at construction time and reused by every
 * request, so each handler stays a thin wrapper around the reader service.
 */
function createMichellApiTestRouter(provider) {
  const router = express.Router();

  // Small helper to keep handlers DRY and to log every call (the logs are the
  // evidence that the API actually talks to the chain).
  const handle = (label, fn) => async (req, res) => {
    const startedAt = Date.now();
    try {
      const data = await fn(req);
      console.log(`[michell-api-test] ${label} OK (${Date.now() - startedAt}ms):`, JSON.stringify(data));
      res.json({ ok: true, data });
    } catch (err) {
      const status = err.code === 'INVALID_ADDRESS' ? 400 : 502;
      console.error(`[michell-api-test] ${label} FAILED (${Date.now() - startedAt}ms):`, err.message);
      res.status(status).json({ ok: false, error: err.message });
    }
  };

  // Liveness / metadata.
  router.get('/health', (req, res) => {
    res.json({
      ok: true,
      service: 'Michell api test',
      description: 'Reads on-chain information from the EstokkYam smart contracts.',
      defaults: { tokens: DEFAULT_TOKENS, marketplace: DEFAULT_MARKETPLACE },
    });
  });

  // ERC20 token metadata (name, symbol, decimals, total supply).
  router.get('/token/:address', handle('token', (req) =>
    service.readToken(req.params.address, { provider })));

  // ERC20 balance of a holder.
  router.get('/token/:address/balance/:holder', handle('balance', (req) =>
    service.readBalance(req.params.address, req.params.holder, { provider })));

  // Marketplace summary (offer count).
  router.get('/marketplace/:address', handle('marketplace', (req) =>
    service.readMarketplaceSummary(req.params.address, { provider })));

  // A single marketplace offer (live view via showOffer).
  router.get('/marketplace/:address/offer/:id', handle('offer', (req) =>
    service.readOffer(req.params.address, req.params.id, { provider })));

  // The raw stored fields of an offer (never reverts; reports `active`).
  router.get('/marketplace/:address/offer/:id/raw', handle('offer-raw', (req) =>
    service.readInitialOffer(req.params.address, req.params.id, { provider })));

  // Whitelist token type for a given token on the marketplace.
  router.get('/marketplace/:address/token-type/:token', handle('token-type', (req) =>
    service.readTokenType(req.params.address, req.params.token, { provider })));

  return router;
}

module.exports = { createMichellApiTestRouter };
