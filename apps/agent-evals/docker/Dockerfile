# One image per harness version. Everything that could change results between two runs is pinned here, and each trial
# records what it saw (latest packages on npm, docs hashes, CLI versions) in its result.json.
ARG PLAYWRIGHT_VERSION=1.63.0

# A 40-second test pattern cut into 2-second HLS segments, which the live-hls service loops as a live stream. Built in
# its own stage, from the same base so no other registry is involved, and ffmpeg stays out of the image.
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble AS media
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && mkdir -p /media/live \
  && ffmpeg -loglevel error -f lavfi -i testsrc2=size=640x360:rate=30 -t 40 \
    -c:v libx264 -profile:v baseline -pix_fmt yuv420p -g 60 -keyint_min 60 -sc_threshold 0 \
    -f hls -hls_time 2 -hls_list_size 0 -hls_segment_filename '/media/live/seg-%03d.ts' /media/live/source.m3u8

FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

ARG PLAYWRIGHT_VERSION
ARG PNPM_VERSION=12.6.0
ARG CLAUDE_CODE_VERSION=2.1.282
ARG CODEX_VERSION=0.156.1

RUN apt-get update \
  && apt-get install -y --no-install-recommends jq ripgrep sudo \
  && rm -rf /var/lib/apt/lists/*

RUN npm install --global --no-fund --no-audit \
    pnpm@${PNPM_VERSION} \
    @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
    @openai/codex@${CODEX_VERSION} \
  && npm cache clean --force

# One pnpm store both accounts can write, so projects linked by one account install cleanly for the other.
RUN groupadd --system evals \
  && usermod --append --groups evals pwuser \
  && mkdir -p /opt/harness /work /opt/pnpm-store \
  && chown pwuser:pwuser /opt/harness /work \
  && chown root:evals /opt/pnpm-store \
  && chmod 2775 /opt/pnpm-store

# Agents run as their own account, which cannot read the harness's tasks, solutions, answer cards, or grader. The
# harness's account may act as it and hand the workspace between the two, and nothing else.
COPY --from=media /media /opt/media
COPY docker/eval-own /usr/local/bin/eval-own
RUN useradd --create-home --uid 1002 --groups evals --shell /bin/bash agent \
  && chmod 755 /usr/local/bin/eval-own \
  && printf '%s\n' \
    'Defaults:pwuser !requiretty, !lecture' \
    'pwuser ALL=(agent) NOPASSWD:SETENV: ALL' \
    'pwuser ALL=(root) NOPASSWD: /usr/local/bin/eval-own agent, /usr/local/bin/eval-own harness' \
    > /etc/sudoers.d/evals \
  && chmod 440 /etc/sudoers.d/evals \
  && visudo --check --quiet
USER agent
RUN mkdir -p ~/.npm-global ~/.config/git \
  && git config --global user.name "Eval Developer" \
  && git config --global user.email "evals@videojs.invalid" \
  && git config --global init.defaultBranch main \
  && printf '%s\n' node_modules/ .next/ .nuxt/ .output/ .svelte-kit/ .astro/ dist/ > ~/.config/git/ignore
USER root

USER pwuser
ENV HOME=/home/pwuser \
    NPM_CONFIG_PREFIX=/home/pwuser/.npm-global \
    PATH=/home/pwuser/.npm-global/bin:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    ASTRO_TELEMETRY_DISABLED=1 \
    EVAL_AGENT_USER=agent \
    npm_config_store_dir=/opt/pnpm-store

# A developer machine: a git identity, and build output that git ignores even in projects without a .gitignore.
RUN mkdir -p ~/.npm-global ~/.config/git \
  && git config --global user.name "Eval Developer" \
  && git config --global user.email "evals@videojs.invalid" \
  && git config --global init.defaultBranch main \
  && git config --global --add safe.directory '*' \
  && printf '%s\n' node_modules/ .next/ .nuxt/ .output/ .svelte-kit/ .astro/ dist/ > ~/.config/git/ignore

# Fixtures install once from their lockfiles; each trial copies one into a fresh /work/app.
COPY --chown=pwuser:pwuser fixtures /opt/harness/fixtures
COPY --chown=pwuser:pwuser docker/install-fixtures.sh /opt/harness/docker/install-fixtures.sh
RUN umask 002 && bash /opt/harness/docker/install-fixtures.sh

# Grader dependencies live outside the agent's project so they never appear in its node_modules.
WORKDIR /opt/harness
RUN npm init --yes > /dev/null \
  && npm pkg set type=module \
  && npm install --no-fund --no-audit playwright@${PLAYWRIGHT_VERSION} @axe-core/playwright@4.13.0 \
  && npm cache clean --force

# A CA trusted only inside this image, and a certificate it signs for the hosts a run may serve from deploy previews.
# The containers map those hosts to a local forwarder; without that mapping the certificate is never presented.
USER root
RUN mkdir -p /opt/harness/tls && cd /opt/harness/tls \
  && openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -subj "/CN=Video.js agent evals CA" \
    -keyout ca.key -out ca.crt 2> /dev/null \
  && openssl req -newkey rsa:2048 -nodes -subj "/CN=videojs.org" -keyout site.key -out site.csr 2> /dev/null \
  && printf 'subjectAltName=DNS:videojs.org,DNS:www.videojs.org,DNS:shadcn.videojs.org\nextendedKeyUsage=serverAuth\n' > site.ext \
  && openssl x509 -req -in site.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 825 -extfile site.ext \
    -out site.crt 2> /dev/null \
  && rm ca.key site.csr site.ext \
  && cp ca.crt /usr/local/share/ca-certificates/videojs-agent-evals.crt \
  && update-ca-certificates > /dev/null \
  && chown -R pwuser:pwuser /opt/harness/tls \
  && chmod 600 /opt/harness/tls/site.key
USER pwuser
ENV NODE_EXTRA_CA_CERTS=/opt/harness/tls/ca.crt \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# Only the harness's account can enter these; held-out tasks mount under private/ for the same reason.
COPY --chown=pwuser:pwuser tasks /opt/harness/tasks
COPY --chown=pwuser:pwuser src /opt/harness/src
RUN mkdir -p /opt/harness/private && chmod 700 /opt/harness/tasks /opt/harness/src /opt/harness/private

WORKDIR /work
