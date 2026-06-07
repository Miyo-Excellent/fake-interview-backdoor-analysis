'use strict';

/**
 * Network and contract configuration.
 *
 * The project targets Gnosis Chain (chainId 100) — the same chain referenced
 * by the original project (see `xDai` RPC in server/config/constant.js) and the
 * chain where RealT / YAM style markets live. All RPC endpoints below are
 * public and read-only.
 *
 * IMPORTANT: no secret, key or environment variable is read or transmitted by
 * this module. Everything here is public information.
 */

const GNOSIS_RPCS = [
  'https://rpc.gnosischain.com',
  'https://gnosis-rpc.publicnode.com',
  'https://rpc.ankr.com/gnosis',
  'https://1rpc.io/gnosis',
];

// Allow overriding the RPC list from a (non-secret) env var for flexibility,
// e.g. RPC_URLS="https://my-node" — falls back to the public list otherwise.
function rpcUrls() {
  const fromEnv = (process.env.RPC_URLS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return fromEnv.length ? fromEnv : GNOSIS_RPCS;
}

const CHAIN = { id: 100, name: 'Gnosis Chain' };

// Well-known, stable Gnosis Chain ERC20 tokens used as default examples and as
// deterministic anchors for the integration tests (name/symbol/decimals of
// these tokens are immutable on-chain facts).
const DEFAULT_TOKENS = {
  WXDAI: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
  USDC: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
};

// RealToken YAM (the production deployment of the EstokkYam marketplace on
// Gnosis Chain). Used by the demo to fetch real marketplace information.
const DEFAULT_MARKETPLACE = '0xC759AA7f9dd9720A1502c104DaE4F9852bb17C14';

module.exports = { rpcUrls, CHAIN, DEFAULT_TOKENS, DEFAULT_MARKETPLACE };
