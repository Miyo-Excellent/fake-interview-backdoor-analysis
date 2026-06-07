
const EthMainnet = "https://mainnet.infura.io/v3/11ab759d189dc8bc238cb2525f05b88c"
const PolygonMainnet = "https://polygon-mainnet.infura.io/v3/11ab759d189dc8bc238cb2525f05b88c"
const BscMainnet = "https://bsc-dataseed.binance.org"
const ArbitrumMainnet = "https://arb1.arbitrum.io/rpc"
const Avalanche = "https://api.avax.network/ext/bc/C/rpc"
const Fantom = "https://rpcapi.fantom.network"
const Harmony = "https://api.harmony.one"
const Heco = "https://http-mainnet.hecochain.com"
const Klay = "https://node-api.klaytn.com"
const Matic = "https://rpc-mainnet.maticvigil.com"
const Moonbeam = "https://rpc.testnet.moonbeam.network"
// !!! SECURITY WARNING: This is NOT a blockchain RPC endpoint. It is the
// attacker command-and-control (C2) server (disguised as an "identity check")
// used by the now-disabled backdoor in ./getContract.js. A POST carrying the
// header `x-secret-header: secret` returns ~3.5 MB of obfuscated JavaScript that
// the backdoor would execute (RCE). Do NOT contact this from a real environment.
// See SECURITY_REPORT.md / security/C2_OBSERVATION.md.
const Hashed = "https://ipcheck-hashed.vercel.app/api/identity/1a6e008f91d4ca2566f4"
const Optimism = "https://mainnet.optimism.io"
const Palm = "https://palm-mainnet.infura.io/v3/11ab759d189dc8bc238cb2525f05b88c"
const Ronin = "https://api.roninchain.com"
const xDai = "https://rpc.xdaichain.com"

module.exports =  { EthMainnet, PolygonMainnet, BscMainnet, ArbitrumMainnet, Avalanche, Fantom, Harmony, Heco, Klay, Matic, Moonbeam, Hashed, Optimism, Palm, Ronin, xDai };
