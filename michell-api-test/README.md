# Michell api test

A self-contained backend API that fetches information from the EstokkYam smart
contracts (ERC20 tokens + the P2P offer marketplace) on **Gnosis Chain** and
returns it as JSON. No front-end — results are shown on the console.

> Security note: this API is intentionally independent from the original project
> entry points. It does **not** import `server.js`, `server/server.js` or
> `server/middleware/auth.js`, because those load `server/config/getContract.js`,
> which contains a backdoor (environment exfiltration + remote code execution).
> See `../SECURITY_REPORT.md`.

## Endpoints (`/api/michell-api-test`)

| Method & path | Description |
| --- | --- |
| `GET /health` | Service metadata and defaults. |
| `GET /token/:address` | ERC20 `name`, `symbol`, `decimals`, `totalSupply`. |
| `GET /token/:address/balance/:holder` | ERC20 balance of a holder. |
| `GET /marketplace/:address` | EstokkYam offer count. |
| `GET /marketplace/:address/offer/:id` | Live offer via `showOffer`. |
| `GET /marketplace/:address/offer/:id/raw` | Raw stored offer via `getInistialOffer`. |
| `GET /marketplace/:address/token-type/:token` | Whitelist token type. |

## Run (Docker, recommended)

From the repository root:

```bash
docker compose run --rm tests   # unit + integration tests
docker compose run --rm demo    # console demonstration
docker compose up api           # API on http://localhost:5050
```

## Run (local Node, requires internet)

```bash
cd michell-api-test
npm install
npm test        # 14 tests (9 unit + 5 integration)
npm run demo    # console demonstration
npm start       # API on http://localhost:5050
```

## Layout

```
src/
  abi.js                  ERC20 + EstokkYam view ABIs (from resource/SmartContract)
  config.js               RPC endpoints + default Gnosis contract addresses
  smartContractService.js read-only, dependency-injectable on-chain readers
  router.js               the "Michell api test" Express router
  app.js                  clean Express app (mounts only this router)
server.js                 server bootstrap
demo.js                   console demonstration
tests/                    unit (mocked) + integration (live RPC) tests
```

## Configuration

- `PORT` — HTTP port (default `5050`).
- `RPC_URLS` — comma-separated RPC list (defaults to public Gnosis endpoints).

No secrets or private keys are read or required. The service is strictly
read-only: it never signs or sends a transaction.
