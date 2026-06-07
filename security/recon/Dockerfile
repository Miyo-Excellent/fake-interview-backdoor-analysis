# Isolated image for passive infrastructure OSINT.
# Contains only standard read-only lookup tools (dig, whois, curl). No project
# code, no secrets. See recon.sh for the (passive-only) scope.
FROM alpine:3.20

RUN apk add --no-cache bind-tools whois curl jq

WORKDIR /recon
COPY recon.sh ./
RUN chmod +x recon.sh

# Unprivileged user.
RUN adduser -D -H recon
USER recon

ENTRYPOINT ["sh", "recon.sh"]
