ARG BASE_IMAGE=skillsomething/base-runtime:latest

FROM node:22-bookworm-slim AS openclaw-builder

ARG OPENCLAW_VERSION=2026.4.15
ARG DEBIAN_APT_MIRROR=
ARG DEBIAN_SECURITY_APT_MIRROR=

RUN if [ -n "${DEBIAN_APT_MIRROR}" ]; then \
        sed -i "s|http://deb.debian.org/debian|${DEBIAN_APT_MIRROR}|g" \
        /etc/apt/sources.list /etc/apt/sources.list.d/*.sources 2>/dev/null || true; \
    fi \
    && if [ -n "${DEBIAN_SECURITY_APT_MIRROR}" ]; then \
        sed -i "s|http://deb.debian.org/debian-security|${DEBIAN_SECURITY_APT_MIRROR}|g" \
        /etc/apt/sources.list /etc/apt/sources.list.d/*.sources 2>/dev/null || true; \
    fi \
    && apt-get -o Acquire::Retries=5 update \
    && apt-get install -y --no-install-recommends ca-certificates git openssh-client \
    && rm -rf /var/lib/apt/lists/* \
    && git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" \
    && git config --global url."https://github.com/".insteadOf "ssh://git@github.com:" \
    && git config --global url."https://github.com/".insteadOf "git@github.com:" \
    && git config --global url."https://github.com/".insteadOf "git+ssh://git@github.com/" \
    && npm install -g openclaw@${OPENCLAW_VERSION}

FROM ${BASE_IMAGE}

COPY --from=openclaw-builder /usr/local/ /usr/local/

RUN openclaw --version

WORKDIR /root
