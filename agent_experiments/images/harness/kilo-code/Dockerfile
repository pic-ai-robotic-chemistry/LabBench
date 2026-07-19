ARG BASE_IMAGE=skillsomething/base-runtime:latest

FROM node:22-bookworm-slim AS kilo-builder

ARG KILO_CODE_VERSION=7.3.1

RUN npm install -g @kilocode/cli@${KILO_CODE_VERSION}

FROM ${BASE_IMAGE}

COPY --from=kilo-builder /usr/local/ /usr/local/

RUN kilo --version

WORKDIR /root
