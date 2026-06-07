'use strict';

/**
 * Console demonstration of the "Michell api test" API.
 *
 * It boots the real Express app, then calls the API over HTTP exactly like an
 * external client would, and prints every response to the console. This is the
 * evidence that the new API fetches information from the EstokkYam smart
 * contracts on Gnosis Chain. No front-end is involved.
 */

const { createApp } = require('./src/app');
const { getWorkingProvider } = require('./src/smartContractService');
const { DEFAULT_TOKENS, DEFAULT_MARKETPLACE } = require('./src/config');

function line() {
  console.log('-'.repeat(72));
}

async function call(base, pathname) {
  const url = `${base}${pathname}`;
  const res = await fetch(url);
  const body = await res.json();
  console.log(`GET ${pathname}  ->  ${res.status}`);
  console.log(JSON.stringify(body, null, 2));
  line();
  return body;
}

async function main() {
  line();
  console.log('Michell api test — EstokkYam smart-contract reader (console demo)');
  line();

  const { provider, url, block } = await getWorkingProvider();
  console.log(`Connected to Gnosis Chain via ${url} (current block #${block})`);
  line();

  const app = createApp(provider);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    await call(base, '/api/michell-api-test/health');

    console.log('>> ERC20 token info (WXDAI):');
    await call(base, `/api/michell-api-test/token/${DEFAULT_TOKENS.WXDAI}`);

    console.log('>> ERC20 token info (USDC):');
    await call(base, `/api/michell-api-test/token/${DEFAULT_TOKENS.USDC}`);

    console.log('>> EstokkYam marketplace summary:');
    const summary = await call(base, `/api/michell-api-test/marketplace/${DEFAULT_MARKETPLACE}`);

    if (summary.ok && summary.data.offerCount > 0) {
      // Offers get deleted as they are accepted, so slots can be empty. Probe a
      // few of the most recent slots (via the non-reverting raw getter) and show
      // the first active one with the live showOffer view.
      const count = summary.data.offerCount;
      console.log(`>> Probing offers to find an active one (count=${count})…`);

      // showOffer reverts for empty/deleted slots (it calls balanceOf on the
      // zeroed seller). Probe recent ids concurrently and stop at the first slot
      // that returns successfully — that is a live, active offer.
      const probe = async (id) => {
        const res = await fetch(`${base}/api/michell-api-test/marketplace/${DEFAULT_MARKETPLACE}/offer/${id}`).then((r) => r.json());
        return res.ok ? id : null;
      };
      let activeId = null;
      const WINDOW = 1000;
      const BATCH = 25;
      for (let hi = count - 1; hi >= 0 && hi > count - WINDOW && activeId === null; hi -= BATCH) {
        const ids = [];
        for (let id = hi; id > hi - BATCH && id >= 0; id--) ids.push(id);
        const found = (await Promise.all(ids.map(probe))).filter((x) => x !== null);
        if (found.length) activeId = Math.max(...found);
      }

      if (activeId !== null) {
        console.log(`>> Found active offer #${activeId}. Live view (showOffer):`);
        await call(base, `/api/michell-api-test/marketplace/${DEFAULT_MARKETPLACE}/offer/${activeId}`);
      } else {
        console.log('No active offer found in the probed window.');
      }
    }
  } finally {
    server.close();
  }

  console.log('Demo finished successfully.');
}

main().catch((err) => {
  console.error('Demo failed:', err.message);
  process.exit(1);
});
