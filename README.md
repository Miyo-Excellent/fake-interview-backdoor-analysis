# Contagious Interview — Teardown 🕵️‍♂️🛡️

> **For research and awareness only.** This repository documents a real malware
> campaign that targets developers through fake job interviews. The malicious code
> it includes is **neutralized and annotated** — **no live payload** is stored
> here. Nothing in this project is an invitation to attack anyone. See
> [Ethics & Legal](#️-ethics--legal).
>
> **Solo para investigación y concientización.** Este repositorio documenta una
> campaña real de malware que ataca a desarrolladores mediante falsas entrevistas.
> El código malicioso incluido está **neutralizado y anotado** — **no** se almacena
> ningún payload activo.

## 🔗 Links / Enlaces
- 🧪 **This analysis (findings repo):** https://github.com/Miyo-Excellent/fake-interview-backdoor-analysis
- ☣️ **Upstream malicious repo (EVIDENCE ONLY — do NOT clone & run):**
  https://bitbucket.org/infinnigods/estokkyam/src/master/

---

## ☣️ The malicious repository / El repositorio malicioso

The original "technical test" was distributed from:

> **https://bitbucket.org/infinnigods/estokkyam/src/master/**

⚠️ **Do not clone and run it.** It steals your environment variables and executes
remote code on `npm start` / `node server`. This findings repo includes a copy of
that project **with the backdoor disabled and annotated** (see
`server/config/getContract.js`, `server/middleware/auth.js`,
`server/config/constant.js`) so it can be studied safely. The live second-stage
payload is **not** stored here — it is fetched from the attacker's C2 at runtime,
which we never trigger.

El "reto técnico" original se distribuía desde el enlace de arriba. ⚠️ **No lo
clones ni ejecutes**: roba tus variables de entorno y ejecuta código remoto al
correr `npm start` / `node server`. Este repositorio incluye una copia **con el
backdoor deshabilitado y anotado** para estudiarlo de forma segura; el payload de
segunda etapa **no** se almacena aquí.

---

## 📄 Reports & documents / Reportes y documentos

| Document | Description / Descripción |
| --- | --- |
| [SECURITY_REPORT.md](SECURITY_REPORT.md) · [🇪🇸](SECURITY_REPORT.es.md) | Full technical analysis: backdoor, RCE, impact, deliverable, tests / Análisis técnico completo |
| [security/C2_OBSERVATION.md](security/C2_OBSERVATION.md) · [🇪🇸](security/C2_OBSERVATION.es.md) | Defensive observation of the C2 endpoint (3.5 MB payload) / Observación defensiva del C2 |
| [security/recon/ATTRIBUTION.md](security/recon/ATTRIBUTION.md) | Passive OSINT: infrastructure, IOCs, where to report / OSINT pasivo: infraestructura, IOCs, dónde denunciar |
| [michell-api-test/README.md](michell-api-test/README.md) | The honest deliverable: the clean, tested API / El entregable honesto: la API limpia y probada |

Community: [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) ·
[LICENSE](LICENSE)

Source code of the disabled backdoor (annotated as evidence): /
Código del backdoor deshabilitado (anotado como evidencia):
[`server/config/getContract.js`](server/config/getContract.js) ·
[`server/middleware/auth.js`](server/middleware/auth.js) ·
[`server/config/constant.js`](server/config/constant.js) ·
[`src/config/config.ts`](src/config/config.ts)

---

## 🇬🇧 English

### TL;DR
A "recruiter" on LinkedIn shared a "technical test" repository — a legitimate-
looking DeFi project that secretly **exfiltrates every environment variable** and
**executes remote code** the moment you run it. I audited it before running
anything, built the requested feature safely in an isolated container, and
reported it. This repo is the full teardown so others can recognize and defend
against the pattern (known as **"Contagious Interview"**).

### What happened
1. Unsolicited LinkedIn message: attractive role + a short, time-pressured
   "coding test" + "record a video" + "interview immediately".
2. The shared repo hides a backdoor (details below).
3. I never ran the original project. I reproduced the requested feature in an
   isolated Docker sandbox with no real secrets, documented everything, and sent
   a security report.
4. The "recruiter" blocked me right after receiving the report.

### The backdoor (technical)
- **Credential theft:** a function POSTs the entire `process.env` (every secret /
  API key / token) to an attacker server disguised as an "identity check".
- **Remote code execution:** the server's response is run via
  `new Function('require', body)(require)` — arbitrary code with full Node access.
- **Auto-trigger:** it is an immediately-invoked function in the auth middleware,
  so it fires on import — **just starting the server is enough**, no request
  needed. 15 sibling "blockchain" functions are decoys for camouflage.
- **Gated payload:** the C2 only responds to a `POST` carrying the header
  `x-secret-header: secret`, then returns **~3.5 MB of obfuscated JavaScript**.
- **Bad infrastructure:** the project's "backend" URLs include a raw IP on a
  rented VPS and a domain now **seized by the FBI** (tied to the *Dispossessor*
  ransomware crew).

### Indicators of Compromise (IOCs)
> Defanged on purpose. **Do not visit or contact these** — detection & reporting
> only.

| Indicator | Type | Role |
| --- | --- | --- |
| `ipcheck-hashed[.]vercel[.]app` | host | C2 (payload via POST + `x-secret-header: secret`) |
| `87.237.52[.]168` | IPv4 | hard-coded backend (ZAP-Hosting, DE) |
| `dispossessor[.]com` | domain | backend candidate — FBI-seized |
| `process.env` → network + `new Function()` | technique | exfiltration + RCE, auto-run on import |

### Repository layout
```
server/, src/, resource/      The original malicious project — BACKDOOR NEUTRALIZED
                              + annotated (see server/config/getContract.js,
                              server/middleware/auth.js, server/config/constant.js,
                              src/config/config.ts)
SECURITY_REPORT.md / .es.md   Full technical analysis (EN/ES)
security/C2_OBSERVATION.md     Proof of the gated 3.5 MB payload (no payload included)
security/observe-c2.js         Defensive C2 observer (sends no env, never executes)
security/recon/ATTRIBUTION.md  Passive OSINT: infrastructure & IOCs
security/recon/                Isolated, passive recon (DNS/WHOIS/ipinfo only)
michell-api-test/              The honest deliverable: a clean, tested API
docker-compose.yml             Isolated, hardened reproduction
```

### Reproduce safely
> ⚠️ **Never run the original malicious project** (`npm start` / `node server`).
> Everything below runs in hardened, isolated containers with **no host secrets**
> and no host mounts.

```bash
docker compose run --rm tests         # unit + integration tests for the clean API
docker compose run --rm demo          # console demo against real public contracts
docker compose run --rm c2-observer   # defensive C2 observation (sends no env, never executes)
docker compose run --rm recon         # passive OSINT for reporting
```

### Report it
- **FBI IC3** — https://ic3.gov (this campaign is FBI-tracked)
- Your **national CERT / cybercrime unit**
- **Hosting/registrar abuse** and the **platform** (e.g. Vercel) hosting the C2
- **LinkedIn Safety Center** — report the recruiter profile

### How to contribute (defensive only)
Helpful: detection rules (YARA/Sigma), additional **passive** IOCs, write-ups,
translations, and links to related campaigns. Please open an issue/PR.

Not accepted: any offensive action ("hacking back"), scanning/exploiting attacker
infrastructure, or publishing anyone's personal data. We defend the community and
support law enforcement — we do not attack.

### ⚖️ Ethics & Legal
- This is a **defensive** project. All data was gathered from **public** sources
  and **isolated** observation; the attacker's servers were never accessed.
- WHOIS/registry contacts belong to **hosting providers**, not the attacker —
  they are **not** named or accused here, and you shouldn't either.
- No live malware or runnable payload is distributed. Malicious code is shown
  **disabled and annotated** purely as evidence.
- Unauthorized access to computer systems is illegal even against attackers.
  De-anonymization is for law enforcement.
- Suggested license: **CC BY 4.0** for the docs.

---

## 🇪🇸 Español

### 📄 Reportes y documentos

| Documento | Descripción |
| --- | --- |
| [SECURITY_REPORT.es.md](SECURITY_REPORT.es.md) · [🇬🇧](SECURITY_REPORT.md) | Análisis técnico completo: backdoor, RCE, impacto, entregable, pruebas |
| [security/C2_OBSERVATION.es.md](security/C2_OBSERVATION.es.md) · [🇬🇧](security/C2_OBSERVATION.md) | Observación defensiva del C2 (payload de 3.5 MB) |
| [security/recon/ATTRIBUTION.md](security/recon/ATTRIBUTION.md) | OSINT pasivo: infraestructura, IOCs y dónde denunciar |
| [michell-api-test/README.md](michell-api-test/README.md) | El entregable honesto: la API limpia y probada |

Comunidad: [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) ·
[LICENSE](LICENSE)

Código del backdoor deshabilitado (anotado como evidencia):
[`server/config/getContract.js`](server/config/getContract.js) ·
[`server/middleware/auth.js`](server/middleware/auth.js) ·
[`server/config/constant.js`](server/config/constant.js) ·
[`src/config/config.ts`](src/config/config.ts)

### Resumen
Un "reclutador" en LinkedIn compartió un repo de "prueba técnica" — un proyecto
DeFi de apariencia legítima que en secreto **exfiltra todas las variables de
entorno** y **ejecuta código remoto** en cuanto lo corres. Lo audité antes de
ejecutar nada, implementé la funcionalidad pedida de forma segura en un contenedor
aislado, y lo reporté. Este repo es el análisis completo para que otros reconozcan
y se defiendan del patrón (**"Contagious Interview"**).

### El backdoor (técnico)
- **Robo de credenciales:** una función envía por POST todo `process.env` a un
  servidor del atacante disfrazado de "identity check".
- **Ejecución remota de código:** la respuesta se ejecuta con
  `new Function('require', body)(require)` — acceso total a Node.
- **Autodisparo:** función autoejecutable en el middleware de auth; corre al
  importarse. **Basta con arrancar el servidor.** 15 funciones "blockchain"
  hermanas son señuelos.
- **Payload con compuerta:** el C2 solo responde a un `POST` con la cabecera
  `x-secret-header: secret`, devolviendo **~3.5 MB de JavaScript ofuscado**.
- **Infraestructura maliciosa:** una IP cruda en un VPS alquilado y un dominio hoy
  **incautado por el FBI** (grupo de ransomware *Dispossessor*).

### Reproducir de forma segura
> ⚠️ **Nunca ejecutes el proyecto malicioso original.** Todo corre en contenedores
> endurecidos y aislados, **sin secretos del host**.

```bash
docker compose run --rm tests         # pruebas de la API limpia
docker compose run --rm demo          # demo en consola contra contratos públicos
docker compose run --rm c2-observer   # observación defensiva del C2
docker compose run --rm recon         # OSINT pasivo para la denuncia
```

### Denúncialo
**FBI IC3** (ic3.gov) · tu **CERT / cibercrimen** nacional · **abuse** del
hosting/registrador y la plataforma del C2 · **Centro de Seguridad de LinkedIn**.

### Cómo contribuir (solo defensivo)
Bienvenido: reglas de detección, IOCs **pasivos**, análisis, traducciones.
No se acepta: acción ofensiva, escaneo/explotación de la infraestructura del
atacante, ni publicar datos personales. Defendemos a la comunidad y apoyamos a las
autoridades — no atacamos.

---

### 🙏 Credits / Créditos
Researched and documented by Michell Excellent, so the developer community can
recognize, avoid and report this threat. / Investigado y documentado por Michell
Excellent, para que la comunidad reconozca, evite y denuncie esta amenaza.
