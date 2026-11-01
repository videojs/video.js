# Keep the tag in step with apps/abr-lab's playwright-core: a remote browser server must match the client.
FROM mcr.microsoft.com/playwright:v1.59.1-noble
WORKDIR /app
RUN npm init -y >/dev/null && npm install --no-audit --no-fund playwright-core@1.59.1
COPY browser.mjs .
CMD ["node", "browser.mjs"]
