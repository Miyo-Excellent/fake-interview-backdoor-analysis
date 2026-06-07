# C2 Endpoint Observation (defensive, non-participating)

This document records a controlled observation of the command-and-control (C2)
endpoint embedded in the project's backdoor. The observation was performed from
an **isolated container** (`docker compose run --rm c2-observer`), it sent **no
environment variables**, and it **never executed** the response. The probe
script is `security/observe-c2.js`.

## Endpoint

```
https://ipcheck-hashed.vercel.app/api/identity/1a6e008f91d4ca2566f4
```

Source: hard-coded as `Hashed` in `server/config/constant.js` and consumed by
`callHashedContract()` in `server/config/getContract.js`.

## Observed behavior

| Request | Result |
| --- | --- |
| `GET` (no header) | `200`? no — returns an Express error page: `Cannot GET /api/identity/...` (the route only answers to POST). |
| `POST` with header `x-secret-header: secret` and a JSON body | `200 OK`, `x-powered-by: Express`, `server: Vercel`, `content-type: text/html`, **body = 3,550,800 bytes of heavily obfuscated JavaScript**. |

The payload is classic string-array obfuscation (obfuscator.io style):

```js
function q(){const Mr=['\x57\x34\x5a\x63\x56\x53\x6b\x4b\x6c\x43\x6f\x67',
'\x42\x4e\x72\x5a\x6c\x63\x61','\x72\x67\x76\x4d\x79\x78\x75',
'\x57\x50\x33\x64\x51\x53\x6b\x54\x76\x38\x6b\x68', ... ] ... }   // ~3.5 MB total
```

## Interpretation

The endpoint is a **gated second-stage delivery server**:

1. It only returns the payload when the magic header `x-secret-header: secret`
   is present — exactly the header `callHashedContract()` sends. Casual visitors
   (or a plain GET) get nothing, which hides the malware from scanners.
2. The 3.5 MB obfuscated blob is the code that the victim's machine would run
   via `errorHandler` → `new Function('require', body)(require)` — i.e. arbitrary
   remote code execution with full Node.js `require` access (filesystem,
   network, `child_process`, …).

This confirms, empirically, that the repository is a malware delivery vehicle,
not a legitimate coding test. See `../SECURITY_REPORT.md` for the full analysis.

> The captured payload was intentionally **not** saved to disk in full and was
> **not** executed. Only its size, headers and a short inert snippet are recorded
> here as evidence.
