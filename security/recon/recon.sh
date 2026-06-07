#!/bin/sh
# Passive infrastructure OSINT for an abuse / law-enforcement report.
#
# SCOPE & SAFETY:
#   * 100% passive. It queries public DNS resolvers, WHOIS registries and a
#     third-party IP intelligence API (ipinfo.io). It does NOT connect to,
#     scan, probe or exploit the attacker's servers.
#   * No authentication, no payloads, no exploitation. Read-only lookups only.
#   * Intended to run in an isolated container with no host secrets.
#
# Targets are the indicators of compromise (IOCs) found in the repository.

set -u

C2_HOST="ipcheck-hashed.vercel.app"
RANSOM_DOMAIN="dispossessor.com"
RAW_IP="87.237.52.168"

bar() { echo; echo "========================================================================"; echo "$1"; echo "========================================================================"; }
sub() { echo; echo "----- $1 -----"; }

run() {
  # run <description> <command...>  with a timeout so nothing hangs.
  sub "$1"; shift
  timeout 25 "$@" 2>&1 || echo "(no data / lookup failed)"
}

bar "PASSIVE INFRASTRUCTURE OSINT — generated for abuse reporting"
echo "Targets:"
echo "  C2 endpoint host : $C2_HOST"
echo "  Ransomware domain: $RANSOM_DOMAIN"
echo "  Raw backend IP   : $RAW_IP"
echo "Note: all lookups below hit public DNS/WHOIS/ipinfo, never the attacker."

############################################################################
bar "1) C2 ENDPOINT  ($C2_HOST)"
run "DNS A records"        dig +short A "$C2_HOST"
run "DNS CNAME chain"      dig +short CNAME "$C2_HOST"
run "DNS (full answer)"    dig "$C2_HOST" A
C2_IP="$(dig +short A "$C2_HOST" | head -n1)"
echo; echo "Resolved C2 IP: ${C2_IP:-<none>}"
if [ -n "${C2_IP:-}" ]; then
  run "ipinfo for resolved IP" curl -s --max-time 20 "https://ipinfo.io/${C2_IP}/json"
fi
run "WHOIS of base domain (vercel.app)" whois "vercel.app"
echo; echo "ABUSE PATH: hosted on Vercel -> report at https://vercel.com/abuse (or abuse@vercel.com)."

############################################################################
bar "2) RANSOMWARE-ASSOCIATED DOMAIN  ($RANSOM_DOMAIN)"
run "DNS A records"   dig +short A "$RANSOM_DOMAIN"
run "DNS NS records"  dig +short NS "$RANSOM_DOMAIN"
run "DNS MX records"  dig +short MX "$RANSOM_DOMAIN"
run "DNS TXT records" dig +short TXT "$RANSOM_DOMAIN"
run "WHOIS"           whois "$RANSOM_DOMAIN"
RD_IP="$(dig +short A "$RANSOM_DOMAIN" | head -n1)"
if [ -n "${RD_IP:-}" ]; then
  run "ipinfo for resolved IP" curl -s --max-time 20 "https://ipinfo.io/${RD_IP}/json"
fi
echo; echo "CONTEXT: 'Dispossessor' (a.k.a. Radar) was a ransomware/extortion crew;"
echo "its infrastructure was disrupted by an FBI-led action in Aug 2024."

############################################################################
bar "3) RAW BACKEND IP  ($RAW_IP)"
run "Reverse DNS (PTR)" dig +short -x "$RAW_IP"
run "ipinfo (geo/ASN/org/abuse)" curl -s --max-time 20 "https://ipinfo.io/${RAW_IP}/json"
run "WHOIS (RIR / netblock / abuse contact)" whois "$RAW_IP"

############################################################################
bar "DONE"
echo "Take the 'abuse'/'OrgAbuseEmail'/registrar fields above into the reports."
echo "Where to report: see security/recon/ATTRIBUTION.md"
