# Minimal, isolated image for the defensive C2 observer.
# It contains ONLY the observer script and no project code or dependencies.
# It uses Node's built-in fetch (no npm install needed).
FROM node:22-alpine

ENV HOME=/tmp
WORKDIR /probe

COPY observe-c2.js ./

USER node
CMD ["node", "observe-c2.js"]
