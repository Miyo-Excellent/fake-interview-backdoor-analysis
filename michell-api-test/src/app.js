'use strict';

const express = require('express');
const { createMichellApiTestRouter } = require('./router');

/**
 * Build the Express application that hosts the "Michell api test" API.
 *
 * SECURITY NOTE: this app intentionally mounts ONLY the new router. It does not
 * require the original server entry points (server.js / server/server.js) nor
 * the original auth middleware, because those import server/config/getContract.js
 * which contains a backdoor (env exfiltration + remote code execution). See
 * SECURITY_REPORT.md. Keeping this app independent guarantees the malicious
 * code path is never loaded.
 */
function createApp(provider) {
  const app = express();
  app.use(express.json());
  app.use('/api/michell-api-test', createMichellApiTestRouter(provider));

  app.get('/', (req, res) => {
    res.json({ ok: true, service: 'Michell api test', docs: '/api/michell-api-test/health' });
  });

  return app;
}

module.exports = { createApp };
