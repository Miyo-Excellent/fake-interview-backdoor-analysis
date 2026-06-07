# Contributing / Cómo contribuir

Thanks for helping protect the developer community. / Gracias por ayudar a
proteger a la comunidad de desarrolladores.

This is a **defensive, awareness** project. Contributions must keep that spirit. /
Este es un proyecto **defensivo y de concientización**. Las contribuciones deben
mantener ese espíritu.

---

## 🇬🇧 English

### ✅ Contributions we welcome
- **Detection content:** YARA / Sigma rules, regexes, or heuristics that catch
  this backdoor pattern (`process.env` exfiltration, `new Function()` RCE,
  auto-run-on-import, gated obfuscated payloads).
- **Passive IOCs:** additional domains/IPs/URLs/hashes obtained from *public*
  sources (DNS, WHOIS, Certificate Transparency, VirusTotal, urlscan). Always
  **defang** them (`evil[.]com`, `1.2.3[.]4`).
- **Analysis & write-ups:** deobfuscation notes, links to related campaigns,
  comparison with other "Contagious Interview" samples.
- **Translations** of the reports and posts.
- **Improvements** to the clean reproduction (the `michell-api-test/` API,
  Dockerization, tests).

### ❌ Not accepted (will be closed)
- Any **offensive action**: hacking back, scanning, probing, or exploiting the
  attacker's infrastructure.
- **Deanonymization** of individuals or publishing **personal data** (doxxing).
  Note that WHOIS/registry contacts belong to *hosting providers*, not attackers.
- Committing a **runnable copy of the malware** or the **live payload**, or
  re-enabling the disabled backdoor.
- Anything illegal or that endangers a contributor.

### How to submit
1. Open an issue first for anything substantial, so we can align.
2. Fork, create a branch, make your change.
3. **Before committing:** remove any secret/credential, defang indicators, and
   make sure no live payload or runnable malware is added.
4. Open a Pull Request describing *what* and *why*. Reference sources for IOCs.

### Ground rules
- Keep it factual; no accusations against named individuals.
- Be respectful and constructive (assume good faith).
- When in doubt about safety or legality, ask in the issue before acting.

---

## 🇪🇸 Español

### ✅ Contribuciones que aceptamos
- **Contenido de detección:** reglas YARA / Sigma, regex o heurísticas que
  detecten este patrón de backdoor (exfiltración de `process.env`, RCE con
  `new Function()`, autoejecución al importar, payloads ofuscados con compuerta).
- **IOCs pasivos:** dominios/IPs/URLs/hashes adicionales obtenidos de fuentes
  *públicas* (DNS, WHOIS, Certificate Transparency, VirusTotal, urlscan). Siempre
  **ofuscados** (`evil[.]com`, `1.2.3[.]4`).
- **Análisis y artículos:** notas de desofuscación, enlaces a campañas
  relacionadas, comparación con otras muestras de "Contagious Interview".
- **Traducciones** de los reportes y las publicaciones.
- **Mejoras** a la reproducción limpia (la API `michell-api-test/`,
  dockerización, pruebas).

### ❌ No se acepta (se cerrará)
- Cualquier **acción ofensiva**: hackear de vuelta, escanear, sondear o explotar
  la infraestructura del atacante.
- **Desanonimización** de personas o publicación de **datos personales** (doxxing).
  Recuerda: los contactos de WHOIS/registro son de los *proveedores de hosting*,
  no de los atacantes.
- Subir una **copia ejecutable del malware** o el **payload activo**, o reactivar
  el backdoor deshabilitado.
- Cualquier cosa ilegal o que ponga en riesgo a quien contribuye.

### Cómo enviar cambios
1. Abre primero un issue para algo sustancial, para alinear.
2. Haz fork, crea una rama y tu cambio.
3. **Antes de commitear:** elimina cualquier secreto/credencial, ofusca los
   indicadores y asegúrate de no añadir payloads activos ni malware ejecutable.
4. Abre un Pull Request describiendo *qué* y *por qué*. Cita las fuentes de los IOCs.

### Reglas básicas
- Mantén todo factual; sin acusaciones contra personas nombradas.
- Sé respetuoso y constructivo (presume buena fe).
- Ante dudas de seguridad o legalidad, pregunta en el issue antes de actuar.
