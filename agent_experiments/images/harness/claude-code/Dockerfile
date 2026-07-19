ARG BASE_IMAGE=skillsomething/base-runtime:latest

FROM node:22-bookworm-slim AS claude-builder

ARG CLAUDE_CODE_VERSION=latest

RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}

FROM ${BASE_IMAGE}

COPY --from=claude-builder /usr/local/ /usr/local/

RUN claude --version

WORKDIR /root
