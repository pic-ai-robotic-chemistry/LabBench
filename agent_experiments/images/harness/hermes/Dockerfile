ARG BASE_IMAGE=skillsomething/base-runtime:latest

FROM node:22-bookworm-slim AS node-runtime

FROM ${BASE_IMAGE}

ARG HERMES_VERSION=main
ARG UBUNTU_APT_MIRROR=

COPY --from=node-runtime /usr/local/ /usr/local/

RUN if [ -n "$UBUNTU_APT_MIRROR" ]; then \
        sed -i "s|http://ports.ubuntu.com/ubuntu-ports|${UBUNTU_APT_MIRROR}|g; s|http://archive.ubuntu.com/ubuntu|${UBUNTU_APT_MIRROR}|g; s|http://deb.debian.org/debian|${UBUNTU_APT_MIRROR}|g" /etc/apt/sources.list /etc/apt/sources.list.d/*.sources 2>/dev/null || true; \
    fi \
    && apt-get -o Acquire::Retries=5 update && apt-get -o Acquire::Retries=5 install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    python3-venv \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    node --version; \
    npm --version; \
    npm install -g --omit=dev --ignore-scripts \
        "agent-browser@^0.26.0" \
        "@askjo/camofox-browser@^1.5.2"; \
    mkdir -p /root/.hermes/node/bin; \
    ln -sf /usr/local/bin/node /root/.hermes/node/bin/node; \
    ln -sf /usr/local/bin/npm /root/.hermes/node/bin/npm; \
    ln -sf /usr/local/bin/npx /root/.hermes/node/bin/npx; \
    ln -sf /usr/local/bin/agent-browser /root/.hermes/node/bin/agent-browser; \
    agent-browser --version || true; \
    npm cache clean --force

RUN set -eux; \
    mkdir -p /usr/local/lib/hermes-agent /tmp/hermes-build; \
    curl -fL --retry 5 --retry-delay 5 --speed-limit 1024 --speed-time 60 --max-time 300 \
        "https://github.com/NousResearch/hermes-agent/archive/refs/heads/${HERMES_VERSION}.tar.gz" \
        -o /tmp/hermes-agent.tar.gz; \
    tar -xzf /tmp/hermes-agent.tar.gz -C /tmp/hermes-build --strip-components=1; \
    cp -a /tmp/hermes-build/. /usr/local/lib/hermes-agent/; \
    python3 -m venv /usr/local/lib/hermes-agent/venv; \
    /usr/local/lib/hermes-agent/venv/bin/python -m pip install --upgrade pip setuptools wheel; \
    cd /usr/local/lib/hermes-agent; \
    /usr/local/lib/hermes-agent/venv/bin/python -m pip install -e '.[cli,pty,mcp]'; \
    printf '%s\n' \
        '#!/usr/bin/env bash' \
        'unset PYTHONPATH' \
        'unset PYTHONHOME' \
        'exec /usr/local/lib/hermes-agent/venv/bin/hermes "$@"' \
        > /usr/local/bin/hermes; \
    chmod +x /usr/local/bin/hermes; \
    rm -rf /tmp/hermes-build /tmp/hermes-agent.tar.gz /root/.cache/pip; \
    hermes version

WORKDIR /root
