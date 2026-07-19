ARG BASE_IMAGE=skillsomething/base-runtime:latest

FROM node:22-bookworm-slim AS codex-builder

ARG CODEX_VERSION=latest

RUN npm install -g @openai/codex@${CODEX_VERSION}

FROM ${BASE_IMAGE}

COPY --from=codex-builder /usr/local/ /usr/local/

RUN codex --version \
    && rm -rf /root/.codex

WORKDIR /root
