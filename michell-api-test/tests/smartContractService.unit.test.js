'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const service = require('../src/smartContractService');

/**
 * Unit tests — fully deterministic, no network.
 *
 * A mocked contract factory is injected so we control exactly what each
 * on-chain call returns. This pins down the service's data shaping (address
 * checksumming, bigint -> string, decimals formatting, enum mapping) without
 * depending on any live RPC.
 */

// Lowercase address on purpose, to prove the service checksums it.
const WXDAI = '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d';
const WXDAI_CHECKSUMMED = '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d';
const HOLDER = '0x0000000000000000000000000000000000000001';

function fakeFactory(values) {
  return () => ({
    name: async () => values.name,
    symbol: async () => values.symbol,
    decimals: async () => values.decimals,
    totalSupply: async () => values.totalSupply,
    balanceOf: async () => values.balance,
    getOfferCount: async () => values.offerCount,
    showOffer: async () => values.offer,
    getInistialOffer: async () => values.offer,
    getTokenType: async () => values.tokenType,
  });
}

test('readToken shapes ERC20 metadata and checksums the address', async () => {
  const contractFactory = fakeFactory({
    name: 'Wrapped XDAI',
    symbol: 'WXDAI',
    decimals: 18n,
    totalSupply: 1234500000000000000000n, // 1234.5 * 1e18
  });

  const out = await service.readToken(WXDAI, { provider: {}, contractFactory });

  assert.equal(out.address, WXDAI_CHECKSUMMED);
  assert.equal(out.name, 'Wrapped XDAI');
  assert.equal(out.symbol, 'WXDAI');
  assert.equal(out.decimals, 18);
  assert.equal(out.totalSupply, '1234500000000000000000');
  assert.equal(out.totalSupplyFormatted, '1234.5');
  assert.equal(out.chain.id, 100);
});

test('readToken rejects an invalid address before any network call', async () => {
  let factoryCalled = false;
  const contractFactory = () => {
    factoryCalled = true;
    return {};
  };

  await assert.rejects(
    () => service.readToken('not-an-address', { provider: {}, contractFactory }),
    (err) => err.code === 'INVALID_ADDRESS'
  );
  assert.equal(factoryCalled, false);
});

test('readBalance formats the raw balance using decimals', async () => {
  const contractFactory = fakeFactory({ symbol: 'WXDAI', decimals: 18n, balance: 2500000000000000000n });
  const out = await service.readBalance(WXDAI, HOLDER, { provider: {}, contractFactory });

  assert.equal(out.token, WXDAI_CHECKSUMMED);
  assert.equal(out.holder, HOLDER);
  assert.equal(out.balance, '2500000000000000000');
  assert.equal(out.balanceFormatted, '2.5');
});

test('readMarketplaceSummary returns the offer count as a number', async () => {
  const contractFactory = fakeFactory({ offerCount: 42n });
  const out = await service.readMarketplaceSummary(WXDAI, { provider: {}, contractFactory });
  assert.equal(out.offerCount, 42);
  assert.equal(typeof out.offerCount, 'number');
});

test('readOffer maps named fields and stringifies big integers', async () => {
  const offer = {
    offerToken: '0x1111111111111111111111111111111111111111',
    buyerToken: '0x2222222222222222222222222222222222222222',
    seller: '0x3333333333333333333333333333333333333333',
    buyer: '0x0000000000000000000000000000000000000000',
    price: 1000000n,
    amount: 5000000000000000000n,
  };
  const contractFactory = fakeFactory({ offer });
  const out = await service.readOffer(WXDAI, 7, { provider: {}, contractFactory });

  assert.equal(out.offerId, 7);
  assert.equal(out.offerToken, offer.offerToken);
  assert.equal(out.price, '1000000');
  assert.equal(out.amount, '5000000000000000000');
});

test('readInitialOffer flags an active offer (non-zero seller)', async () => {
  const offer = {
    offerToken: '0x1111111111111111111111111111111111111111',
    buyerToken: '0x2222222222222222222222222222222222222222',
    seller: '0x3333333333333333333333333333333333333333',
    buyer: '0x0000000000000000000000000000000000000000',
    price: 1000000n,
    amount: 5000000000000000000n,
  };
  const out = await service.readInitialOffer(WXDAI, 7, { provider: {}, contractFactory: fakeFactory({ offer }) });
  assert.equal(out.active, true);
  assert.equal(out.seller, offer.seller);
});

test('readInitialOffer flags an empty offer as inactive (zero seller)', async () => {
  const offer = {
    offerToken: '0x0000000000000000000000000000000000000000',
    buyerToken: '0x0000000000000000000000000000000000000000',
    seller: '0x0000000000000000000000000000000000000000',
    buyer: '0x0000000000000000000000000000000000000000',
    price: 0n,
    amount: 0n,
  };
  const out = await service.readInitialOffer(WXDAI, 0, { provider: {}, contractFactory: fakeFactory({ offer }) });
  assert.equal(out.active, false);
});

test('readTokenType maps the enum index to a human label', async () => {
  const contractFactory = fakeFactory({ tokenType: 1n }); // REALTOKEN
  const out = await service.readTokenType(WXDAI, HOLDER, { provider: {}, contractFactory });
  assert.equal(out.tokenTypeId, 1);
  assert.equal(out.tokenType, 'REALTOKEN');
});

test('assertAddress returns a checksummed address and throws on garbage', () => {
  assert.equal(service.assertAddress(WXDAI), WXDAI_CHECKSUMMED);
  assert.throws(() => service.assertAddress('0x123'), (err) => err.code === 'INVALID_ADDRESS');
});
