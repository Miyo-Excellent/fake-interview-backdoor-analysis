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

### ▶️ Safe execution — step by step

> 🧠 **Golden rule: read before you run.** Read this README, the
> [reports](#-reports--documents--reportes-y-documentos) and the **annotated
> backdoor source** BEFORE executing any audit. Understanding what each command
> does is the single control that keeps you safe.
>
> ⚠️ **Never run the original malicious project** — do not run `npm install`,
> `npm start` or `node server` at the repo root. The backdoor is neutralized here,
> but **do not re-enable it**. Only the hardened containers below are meant to run.

**Step 0 — Read first (no execution).**
Read [SECURITY_REPORT.md](SECURITY_REPORT.md), [security/C2_OBSERVATION.md](security/C2_OBSERVATION.md)
and [security/recon/ATTRIBUTION.md](security/recon/ATTRIBUTION.md). Then read the
disabled backdoor itself: [`server/config/getContract.js`](server/config/getContract.js),
[`server/middleware/auth.js`](server/middleware/auth.js),
[`server/config/constant.js`](server/config/constant.js),
[`src/config/config.ts`](src/config/config.ts).

**Step 1 — Isolate.** Use a disposable VM (or a clean machine) with **no real
credentials** — no SSH keys, wallets, cloud tokens or `.env` files. Install Docker
and make sure it is running.

**Step 2 — Get the code, don't run it.**
```bash
git clone https://github.com/Miyo-Excellent/fake-interview-backdoor-analysis
cd fake-interview-backdoor-analysis
# Do NOT run npm install / npm start at the repo root.
```

**Step 3 — Review the runners before building.** Read
[`docker-compose.yml`](docker-compose.yml),
[`michell-api-test/Dockerfile`](michell-api-test/Dockerfile) and
[`security/recon/recon.sh`](security/recon/recon.sh). Every service uses no host
secrets, no host mounts, drops all Linux capabilities and runs read-only.

**Step 4 — Run the hardened audits (each is isolated).**
```bash
docker compose run --rm tests         # 14 tests (unit + live integration) for the clean API
docker compose run --rm demo          # reads REAL public contracts on Gnosis, prints to console
docker compose run --rm c2-observer   # documents the C2 — sends NO env, NEVER executes the reply
docker compose run --rm recon         # passive DNS/WHOIS/ipinfo OSINT — never contacts the attacker
```

**Step 5 — Verify & clean up.** Confirm the tests pass and compare the
demo/observer output against the reports. Optionally remove images with
`docker compose down --rmi local`, then discard the VM.

> 🌐 **Network note (informed consent):** `tests`/`demo` reach **public** RPCs;
> `recon` queries **public** DNS/WHOIS/ipinfo (never the attacker). `c2-observer`
> makes **one controlled request to the attacker's C2** purely to document it —
> with no environment data and without executing the response. If you want zero
> contact with attacker infrastructure, **skip `c2-observer`** and rely on the
> already-captured results in [security/C2_OBSERVATION.md](security/C2_OBSERVATION.md).

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

### ▶️ Ejecución segura — paso a paso

> 🧠 **Regla de oro: lee antes de ejecutar.** Lee este README, los
> [reportes](#-reportes-y-documentos) y el **código del backdoor anotado** ANTES de
> ejecutar cualquier auditoría. Entender qué hace cada comando es el único control
> que te mantiene seguro.
>
> ⚠️ **Nunca ejecutes el proyecto malicioso original** — no corras `npm install`,
> `npm start` ni `node server` en la raíz del repo. Aquí el backdoor está
> neutralizado, pero **no lo reactives**. Solo los contenedores endurecidos de
> abajo están pensados para ejecutarse.

**Paso 0 — Lee primero (sin ejecutar).**
Lee [SECURITY_REPORT.es.md](SECURITY_REPORT.es.md),
[security/C2_OBSERVATION.es.md](security/C2_OBSERVATION.es.md) y
[security/recon/ATTRIBUTION.md](security/recon/ATTRIBUTION.md). Luego lee el propio
backdoor deshabilitado: [`server/config/getContract.js`](server/config/getContract.js),
[`server/middleware/auth.js`](server/middleware/auth.js),
[`server/config/constant.js`](server/config/constant.js),
[`src/config/config.ts`](src/config/config.ts).

**Paso 1 — Aísla.** Usa una VM desechable (o una máquina limpia) **sin credenciales
reales** — sin llaves SSH, wallets, tokens de nube ni archivos `.env`. Instala
Docker y verifica que esté corriendo.

**Paso 2 — Obtén el código, no lo ejecutes.**
```bash
git clone https://github.com/Miyo-Excellent/fake-interview-backdoor-analysis
cd fake-interview-backdoor-analysis
# NO ejecutes npm install / npm start en la raíz del repo.
```

**Paso 3 — Revisa los runners antes de construir.** Lee
[`docker-compose.yml`](docker-compose.yml),
[`michell-api-test/Dockerfile`](michell-api-test/Dockerfile) y
[`security/recon/recon.sh`](security/recon/recon.sh). Cada servicio no usa secretos
del host, no monta nada del host, elimina todas las capacidades de Linux y corre en
solo lectura.

**Paso 4 — Ejecuta las auditorías endurecidas (cada una aislada).**
```bash
docker compose run --rm tests         # 14 pruebas (unitarias + integración en vivo) de la API limpia
docker compose run --rm demo          # lee contratos públicos REALES en Gnosis, imprime en consola
docker compose run --rm c2-observer   # documenta el C2 — NO envía env, NUNCA ejecuta la respuesta
docker compose run --rm recon         # OSINT pasivo DNS/WHOIS/ipinfo — nunca contacta al atacante
```

**Paso 5 — Verifica y limpia.** Confirma que las pruebas pasan y compara la salida
de demo/observer con los reportes. Opcionalmente elimina las imágenes con
`docker compose down --rmi local`, y descarta la VM.

> 🌐 **Nota de red (consentimiento informado):** `tests`/`demo` acceden a RPCs
> **públicos**; `recon` consulta DNS/WHOIS/ipinfo **públicos** (nunca al atacante).
> `c2-observer` hace **una petición controlada al C2 del atacante** solo para
> documentarlo — sin datos de entorno y sin ejecutar la respuesta. Si quieres cero
> contacto con la infraestructura del atacante, **omite `c2-observer`** y usa los
> resultados ya capturados en
> [security/C2_OBSERVATION.es.md](security/C2_OBSERVATION.es.md).

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
