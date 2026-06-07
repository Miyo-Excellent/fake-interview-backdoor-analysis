'use strict';

const { createApp } = require('./src/app');
const { getWorkingProvider } = require('./src/smartContractService');

const PORT = process.env.PORT || 5050;

async function main() {
  console.log('[michell-api-test] starting…');
  const { provider, url, block } = await getWorkingProvider();
  console.log(`[michell-api-test] connected to RPC ${url} (block #${block})`);

  const app = createApp(provider);
  app.listen(PORT, () => {
    console.log(`[michell-api-test] listening on http://localhost:${PORT}`);
    console.log('[michell-api-test] try: GET /api/michell-api-test/health');
  });
}

main().catch((err) => {
  console.error('[michell-api-test] fatal:', err.message);
  process.exit(1);
});
