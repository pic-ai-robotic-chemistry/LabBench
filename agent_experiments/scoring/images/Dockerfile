ARG HARNESS_IMAGE
FROM ${HARNESS_IMAGE}

ENV DEBIAN_FRONTEND=noninteractive

RUN set -eux; \
    if command -v apt-get >/dev/null 2>&1; then \
      apt-get update; \
      apt-get install -y --no-install-recommends bash ca-certificates jq python3 ripgrep; \
      rm -rf /var/lib/apt/lists/*; \
    fi; \
    mkdir -p /workspace /logs/artifacts /logs/agent /logs/verifier /opt/skill-layer/skills; \
    chmod -R 777 /workspace /logs
