# Observación del endpoint C2 (defensiva, sin participar)

> Versión en español de `C2_OBSERVATION.md`.

Este documento registra una observación controlada del endpoint de comando y
control (C2) embebido en el backdoor del proyecto. La observación se realizó desde
un **contenedor aislado** (`docker compose run --rm c2-observer`), **no envió
variables de entorno** y **nunca ejecutó** la respuesta. El script de la sonda es
`security/observe-c2.js`.

## Endpoint

```
https://ipcheck-hashed.vercel.app/api/identity/1a6e008f91d4ca2566f4
```

Origen: codificado como `Hashed` en `server/config/constant.js` y consumido por
`callHashedContract()` en `server/config/getContract.js`.

## Comportamiento observado

| Petición | Resultado |
| --- | --- |
| `GET` (sin header) | Devuelve una página de error de Express: `Cannot GET /api/identity/...` (la ruta solo responde a POST). |
| `POST` con header `x-secret-header: secret` y un cuerpo JSON | `200 OK`, `x-powered-by: Express`, `server: Vercel`, `content-type: text/html`, **cuerpo = 3.550.800 bytes de JavaScript fuertemente ofuscado**. |

El payload es ofuscación clásica de string-array (estilo obfuscator.io):

```js
function q(){const Mr=['\x57\x34\x5a\x63\x56\x53\x6b\x4b\x6c\x43\x6f\x67',
'\x42\x4e\x72\x5a\x6c\x63\x61','\x72\x67\x76\x4d\x79\x78\x75',
'\x57\x50\x33\x64\x51\x53\x6b\x54\x76\x38\x6b\x68', ... ] ... }   // ~3.5 MB en total
```

## Interpretación

El endpoint es un **servidor de entrega de segunda etapa con compuerta (gated)**:

1. Solo devuelve el payload cuando el header mágico `x-secret-header: secret`
   está presente — exactamente el header que envía `callHashedContract()`. Los
   visitantes casuales (o un GET simple) no obtienen nada, lo que oculta el
   malware de los escáneres.
2. El blob ofuscado de 3.5 MB es el código que la máquina de la víctima
   ejecutaría mediante `errorHandler` → `new Function('require', body)(require)`
   — es decir, ejecución remota de código arbitrario con acceso completo a
   `require` de Node.js (sistema de archivos, red, `child_process`, …).

Esto confirma, de forma empírica, que el repositorio es un vehículo de entrega de
malware, no una prueba de código legítima. Ver `../SECURITY_REPORT.es.md` para el
análisis completo.

> El payload capturado intencionalmente **no** se guardó completo en disco y
> **no** se ejecutó. Solo se registran aquí, como evidencia, su tamaño, sus
> cabeceras y un fragmento corto e inerte.
