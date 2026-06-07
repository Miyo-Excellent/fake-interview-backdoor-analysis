'use strict';

/**
 * Minimal, human-readable ABIs for the contracts used by this project.
 *
 * ERC20_ABI mirrors the read methods declared in the project's IToken
 * interface (resource/SmartContract/smart contract/IToken.sol).
 *
 * ESTOKK_YAM_ABI mirrors the external `view` getters of the EstokkYam
 * marketplace (resource/SmartContract/smart contract/EstokkTokenYam.sol).
 * Only read-only methods are included on purpose: this API never sends a
 * transaction, it only fetches information.
 */

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

const ESTOKK_YAM_ABI = [
  'function getOfferCount() view returns (uint256)',
  'function getTokenType(address token) view returns (uint8)',
  'function tokenInfo(address tokenAddr) view returns (uint256 decimals, string symbol, string name)',
  'function getInistialOffer(uint256 offerId) view returns (address offerToken, address buyerToken, address seller, address buyer, uint256 price, uint256 amount)',
  'function showOffer(uint256 offerId) view returns (address offerToken, address buyerToken, address seller, address buyer, uint256 price, uint256 amount)',
  'function pricePreview(uint256 offerId, uint256 amount) view returns (uint256)',
];

// Human readable label for the TokenType enum defined in EstokkTokenYam.sol.
const TOKEN_TYPE = ['NOTWHITELISTEDTOKEN', 'REALTOKEN', 'ERC20WITHPERMIT', 'ERC20WITHOUTPERMIT'];

module.exports = { ERC20_ABI, ESTOKK_YAM_ABI, TOKEN_TYPE };
