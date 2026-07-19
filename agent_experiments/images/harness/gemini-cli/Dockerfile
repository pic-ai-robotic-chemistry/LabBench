ARG BASE_IMAGE=skillsomething/base-runtime:latest

FROM node:22-bookworm-slim AS gemini-builder

ARG GEMINI_CLI_VERSION=0.43.0

RUN npm install -g @google/gemini-cli@${GEMINI_CLI_VERSION}

FROM ${BASE_IMAGE}

COPY --from=gemini-builder /usr/local/ /usr/local/

RUN gemini --version

WORKDIR /root
