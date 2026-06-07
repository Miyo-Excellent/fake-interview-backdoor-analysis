# Infrastructure Attribution & Reporting / Atribución de Infraestructura y Denuncia

Passive OSINT collected for an abuse / law-enforcement report on the malicious
"technical test" repository. All data below comes from public DNS/WHOIS/ipinfo
sources — **the attacker's servers were never contacted**. Reproduce with
`docker compose run --rm recon`.

OSINT pasivo recopilado para denunciar el repositorio malicioso ante proveedores
y autoridades. Todos los datos provienen de fuentes públicas (DNS/WHOIS/ipinfo) —
**nunca se contactó a los servidores del atacante**. Reproducible con
`docker compose run --rm recon`.

> ⚠️ Important / Importante: the personal/role contacts shown in WHOIS (e.g.
> "Marvin Kluck") are the **hosting provider's** registry contacts, **not the
> attacker**. Only the hosting provider or law enforcement (with legal process)
> can identify the actual customer behind a rented server. Do **not** accuse or
> contact those individuals. / Los contactos personales en WHOIS son del
> **proveedor de hosting**, **no del atacante**. Solo el proveedor o las
> autoridades (con orden judicial) pueden identificar al cliente real. **No**
> acuses ni contactes a esas personas.

---

## Indicators of Compromise (IOCs)

| Indicator | Type | Role |
| --- | --- | --- |
| `ipcheck-hashed.vercel.app/api/identity/1a6e008f91d4ca2566f4` | URL | C2 / second-stage delivery (needs header `x-secret-header: secret`) |
| `ipcheck-hashed.vercel.app` | Host | C2 endpoint (hosted on Vercel) |
| `64.29.17.3`, `216.198.79.3` | IPv4 | C2 resolved IPs (Vercel/AWS edge, anycast) |
| `87.237.52.168` | IPv4 | Hard-coded backend (`src/config/config.ts`) |
| `violet-coyote-18307.zap.cloud` | Host | rDNS of `87.237.52.168` (ZAP-Hosting VPS) |
| `dispossessor.com` | Domain | Backend candidate (`src/config/config.ts`) — FBI-seized |

---

## Findings per target

### 1. C2 endpoint — `ipcheck-hashed.vercel.app`
- Resolves to `64.29.17.3` / `216.198.79.3` — `AS16509 Amazon.com` (anycast),
  i.e. the **Vercel** serverless platform (Vercel deploys on AWS).
- Behavior (see `../C2_OBSERVATION.md`): returns ~3.5 MB of obfuscated JS only to
  a `POST` carrying `x-secret-header: secret`.
- **Report to:** Vercel — https://vercel.com/abuse (or `abuse@vercel.com`).
  Provide the full URL, the `x-secret-header` trigger, and the payload size.

### 2. Hard-coded backend IP — `87.237.52.168`
- rDNS `violet-coyote-18307.zap.cloud`; `AS206996 ZAP-Hosting GmbH`; located in
  Germany (Aachen / North Rhine-Westphalia).
- RIPE netblock `87.237.52.0 - 87.237.52.255` (`DE-ZAP-HOSTING`).
- **Abuse contact:** `abuse@zap-hosting.com` (from RIPE).
- **Report to:** ZAP-Hosting abuse, with the IP, timestamps, and how it appears in
  the repo (`src/config/config.ts` `BASE_URL`).

### 3. Backend domain — `dispossessor.com`
- Currently has **no A record** and its name servers are
  `NS1.FBI.SEIZED.GOV` / `NS2.FBI.SEIZED.GOV` → the domain has been **seized by
  the U.S. FBI** (consistent with the Aug-2024 takedown of the "Dispossessor"/
  "Radar" ransomware operation).
- Registrar: `NICENIC INTERNATIONAL GROUP` (abuse `abuse@nicenic.net`); created
  2024-01-22.
- **Action:** reference this seizure in your report — it links the lure to a
  known ransomware/extortion actor and is strong supporting evidence.

---

## Where to report / Dónde denunciar

1. **FBI IC3 — https://ic3.gov** (primary). This matches the FBI-tracked
   "fake recruiter / coding-test" malware lures. Attach `SECURITY_REPORT.md`,
   the IOCs above, the LinkedIn handle ("Alessio") and the repo URL.
2. **Your national cybercrime unit / CERT** (in your country of residence).
3. **Germany (hosting location):** BSI / Bundeskriminalamt; abuse to
   `abuse@zap-hosting.com`.
4. **Vercel:** https://vercel.com/abuse — to take down the C2 app.
5. **Registrar NICENIC:** `abuse@nicenic.net` — domain abuse.
6. **LinkedIn:** report the recruiter profile and conversation via the LinkedIn
   Safety Center (even if you were blocked, report the profile URL/handle).
7. **Threat-intel sharing (optional):** submit the URL/IP/domain to
   urlscan.io, VirusTotal and abuse.ch so others are protected.

### Evidence to attach / Evidencia a adjuntar
- `SECURITY_REPORT.md` (+ `.es.md`) — full technical analysis.
- `security/C2_OBSERVATION.md` — proof of the 3.5 MB payload.
- This file (`ATTRIBUTION.md`) — infrastructure & IOCs.
- The annotated source files (the disabled backdoor) as proof of intent.
- Screenshots of the LinkedIn conversation and the block, if you have them.

---

## What NOT to do / Lo que NO hay que hacer
- Do not scan, log in to, or attempt to exploit any of these servers. It is
  illegal and would compromise your own report. / No escanees, ni intentes
  acceder o explotar estos servidores: es ilegal y arruinaría tu denuncia.
- Do not contact the attacker again or "test" their infrastructure. / No
  contactes de nuevo al atacante ni "pruebes" su infraestructura.
- Leave de-anonymization to law enforcement. / Deja la desanonimización a las
  autoridades.
