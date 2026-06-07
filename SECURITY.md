# Security Policy / Política de Seguridad

## 🇬🇧 English

### ⚠️ This repository intentionally contains neutralized malware
This is a **defensive security / awareness** project. It includes a copy of a
malicious "technical test" project **with its backdoor disabled and annotated**,
reproduced as evidence. Automated scanners (GitHub secret scanning, Dependabot,
AV) may therefore flag this repository — that is expected. **No live second-stage
payload is stored here**; it is served by the attacker's C2 at runtime, which this
project never triggers.

Do **not** re-enable, un-comment, or run the original project
(`npm start` / `node server`). See [README.md](README.md) and
[SECURITY_REPORT.md](SECURITY_REPORT.md).

### Reporting
- **A new indicator, variant or related campaign?** Open a GitHub issue with the
  `threat-intel` label, or email **info@vionest-services.com**. Please defang
  indicators (e.g. `evil[.]com`) and never attach live payloads.
- **A problem with this repo** (e.g. an accidentally committed secret, a file that
  is *not* properly neutralized)? Email **info@vionest-services.com** privately
  instead of opening a public issue, so it can be fixed first.

### Reporting the actual attack (to authorities)
If you were targeted by this campaign, report it — do not engage the attacker:
- **FBI IC3** — https://ic3.gov (this "fake recruiter / coding test" pattern is
  FBI-tracked, a.k.a. *Contagious Interview*).
- Your **national CERT / cybercrime unit**.
- **Hosting / registrar abuse** contacts and the **platform** hosting the C2.
- **LinkedIn Safety Center** — report the recruiter profile.

Indicators of compromise (IOCs) and abuse contacts are listed in
[security/recon/ATTRIBUTION.md](security/recon/ATTRIBUTION.md).

### Scope — what is NOT acceptable
This project is strictly defensive. The following are out of scope and will not be
accepted or assisted: hacking back, scanning or exploiting attacker
infrastructure, deanonymizing individuals, or publishing personal data. Those are
for law enforcement.

---

## 🇪🇸 Español

### ⚠️ Este repositorio contiene malware neutralizado de forma intencional
Es un proyecto de **seguridad defensiva / concientización**. Incluye una copia de
un proyecto malicioso de "prueba técnica" **con su backdoor deshabilitado y
anotado**, reproducido como evidencia. Es esperable que los escáneres automáticos
(secret scanning de GitHub, Dependabot, antivirus) marquen este repositorio. **No
se almacena aquí ningún payload activo de segunda etapa**; lo sirve el C2 del
atacante en tiempo de ejecución, algo que este proyecto nunca dispara.

**No** reactives, descomentes ni ejecutes el proyecto original
(`npm start` / `node server`). Ver [README.md](README.md) y
[SECURITY_REPORT.es.md](SECURITY_REPORT.es.md).

### Cómo reportar
- **¿Un nuevo indicador, variante o campaña relacionada?** Abre un issue en GitHub
  con la etiqueta `threat-intel`, o escribe a **info@vionest-services.com**.
  Ofusca los indicadores (p. ej. `evil[.]com`) y nunca adjuntes payloads activos.
- **¿Un problema con este repo** (p. ej. un secreto subido por error, un archivo
  *no* bien neutralizado)? Escribe en privado a **info@vionest-services.com** en
  lugar de abrir un issue público, para poder corregirlo primero.

### Denunciar el ataque real (a las autoridades)
Si fuiste objetivo de esta campaña, denúnciala — no interactúes con el atacante:
- **FBI IC3** — https://ic3.gov (patrón rastreado por el FBI, "Contagious
  Interview").
- Tu **CERT / unidad de cibercrimen** nacional.
- Contactos de **abuse** del hosting/registrador y la **plataforma** del C2.
- **Centro de Seguridad de LinkedIn** — reporta el perfil del reclutador.

Los IOCs y contactos de abuse están en
[security/recon/ATTRIBUTION.md](security/recon/ATTRIBUTION.md).

### Alcance — lo que NO es aceptable
Proyecto estrictamente defensivo. Quedan fuera de alcance y no se aceptarán ni
asistirán: "hackear de vuelta", escanear o explotar la infraestructura del
atacante, desanonimizar personas o publicar datos personales. Eso corresponde a
las autoridades.
