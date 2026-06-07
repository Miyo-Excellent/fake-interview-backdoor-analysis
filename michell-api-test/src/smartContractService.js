'use strict';

const { ethers } = require('ethers');
const { ERC20_ABI, ESTOKK_YAM_ABI, TOKEN_TYPE } = require('./abi');
const { rpcUrls, CHAIN } = require('./config');

/**
 * Smart-contract reader service.
 *
 * Every function is dependency-injectable: it accepts a `provider` and an
 * optional `contractFactory`. This keeps the on-chain logic pure and lets the
 * unit tests run fully offline against a mocked contract factory (TDD), while
 * the integration tests exercise the same code path against a live RPC.
 *
 * The service is strictly read-only. It never signs, never sends a transaction,
 * and never touches process.env or any secret.
 */

/** Default factory: a real ethers Contract bound to a provider. */
function defaultContractFactory(address, abi, provider) {
  return new ethers.Contract(address, abi, provider);
}

/**
 * Build a live provider for Gnosis Chain, trying each public RPC until one
 * answers. Throws if none is reachable. Used by the app/demo, not the unit
 * tests (which inject their own provider).
 */
async function getWorkingProvider(urls = rpcUrls(), { timeoutMs = 8000 } = {}) {
  let lastErr;
  for (const url of urls) {
    try {
      const provider = new ethers.JsonRpcProvider(url, CHAIN.id, { staticNetwork: true });
      // A cheap read confirms the endpoint is actually serving the chain.
      // Race against a timeout so a slow/hung RPC falls through to the next one.
      const block = await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), timeoutMs)),
      ]);
      if (typeof block === 'number') {
        return { provider, url, block };
      }
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`No reachable RPC endpoint. Last error: ${lastErr && lastErr.message}`);
}

function assertAddress(address, label = 'address') {
  if (!ethers.isAddress(address)) {
    const err = new Error(`Invalid ${label}: ${address}`);
    err.code = 'INVALID_ADDRESS';
    throw err;
  }
  return ethers.getAddress(address); // checksummed
}

/**
 * Read the public metadata of any ERC20 token (matches the project's IToken
 * interface: name, symbol, decimals, balanceOf).
 */
async function readToken(address, { provider, contractFactory = defaultContractFactory } = {}) {
  const checksummed = assertAddress(address, 'token address');
  const token = contractFactory(checksummed, ERC20_ABI, provider);

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.totalSupply(),
  ]);

  const dec = Number(decimals);
  return {
    address: checksummed,
    chain: CHAIN,
    name,
    symbol,
    decimals: dec,
    totalSupply: totalSupply.toString(),
    totalSupplyFormatted: ethers.formatUnits(totalSupply, dec),
  };
}

/** Read the on-chain balance of `holder` for an ERC20 token. */
async function readBalance(address, holder, { provider, contractFactory = defaultContractFactory } = {}) {
  const tokenAddr = assertAddress(address, 'token address');
  const holderAddr = assertAddress(holder, 'holder address');
  const token = contractFactory(tokenAddr, ERC20_ABI, provider);

  const [raw, decimals, symbol] = await Promise.all([
    token.balanceOf(holderAddr),
    token.decimals(),
    token.symbol(),
  ]);
  const dec = Number(decimals);
  return {
    token: tokenAddr,
    holder: holderAddr,
    symbol,
    balance: raw.toString(),
    balanceFormatted: ethers.formatUnits(raw, dec),
  };
}

/**
 * Read a high-level summary of the EstokkYam marketplace: how many offers it
 * currently holds.
 */
async function readMarketplaceSummary(address, { provider, contractFactory = defaultContractFactory } = {}) {
  const market = assertAddress(address, 'marketplace address');
  const contract = contractFactory(market, ESTOKK_YAM_ABI, provider);
  const offerCount = await contract.getOfferCount();
  return {
    address: market,
    chain: CHAIN,
    offerCount: Number(offerCount),
  };
}

/**
 * Read a single offer from the EstokkYam marketplace (showOffer getter).
 * Returns checksummed addresses and stringified big integers so the payload is
 * JSON-safe.
 */
async function readOffer(address, offerId, { provider, contractFactory = defaultContractFactory } = {}) {
  const market = assertAddress(address, 'marketplace address');
  const contract = contractFactory(market, ESTOKK_YAM_ABI, provider);
  const o = await contract.showOffer(offerId);

  // ethers v6 returns a Result that is both array- and name-indexable.
  return {
    marketplace: market,
    offerId: Number(offerId),
    offerToken: o.offerToken,
    buyerToken: o.buyerToken,
    seller: o.seller,
    buyer: o.buyer,
    price: o.price.toString(),
    amount: o.amount.toString(),
  };
}

/**
 * Read the raw stored fields of an offer (getInistialOffer getter). Unlike
 * showOffer it only reads storage mappings, so it never reverts even for an
 * empty/deleted offer (it returns the zero address / 0 in that case). Useful to
 * probe which offer slots are still active.
 */
async function readInitialOffer(address, offerId, { provider, contractFactory = defaultContractFactory } = {}) {
  const market = assertAddress(address, 'marketplace address');
  const contract = contractFactory(market, ESTOKK_YAM_ABI, provider);
  const o = await contract.getInistialOffer(offerId);
  return {
    marketplace: market,
    offerId: Number(offerId),
    offerToken: o.offerToken,
    buyerToken: o.buyerToken,
    seller: o.seller,
    buyer: o.buyer,
    price: o.price.toString(),
    amount: o.amount.toString(),
    active: o.seller !== ethers.ZeroAddress,
  };
}

/** Resolve the whitelist TokenType the marketplace assigned to a token. */
async function readTokenType(address, token, { provider, contractFactory = defaultContractFactory } = {}) {
  const market = assertAddress(address, 'marketplace address');
  const tokenAddr = assertAddress(token, 'token address');
  const contract = contractFactory(market, ESTOKK_YAM_ABI, provider);
  const t = await contract.getTokenType(tokenAddr);
  const idx = Number(t);
  return { marketplace: market, token: tokenAddr, tokenType: TOKEN_TYPE[idx] ?? `UNKNOWN(${idx})`, tokenTypeId: idx };
}

module.exports = {
  defaultContractFactory,
  getWorkingProvider,
  assertAddress,
  readToken,
  readBalance,
  readMarketplaceSummary,
  readOffer,
  readInitialOffer,
  readTokenType,
};
