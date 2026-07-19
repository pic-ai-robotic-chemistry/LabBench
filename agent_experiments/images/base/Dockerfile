FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

ARG UBUNTU_APT_MIRROR=

RUN if [ -n "$UBUNTU_APT_MIRROR" ]; then \
        sed -i "s|http://ports.ubuntu.com/ubuntu-ports|${UBUNTU_APT_MIRROR}|g; s|http://archive.ubuntu.com/ubuntu|${UBUNTU_APT_MIRROR}|g" /etc/apt/sources.list /etc/apt/sources.list.d/*.sources 2>/dev/null || true; \
    fi \
    && apt-get -o Acquire::Retries=5 update \
    && apt-get -o Acquire::Retries=5 install -y --no-install-recommends \
        bash \
        ca-certificates \
        curl \
        git \
        jq \
        python3 \
        python3-pip \
        python3-openpyxl \
        python3-requests \
        python3-venv \
        ripgrep \
    && python3 -m pip install --break-system-packages --no-cache-dir \
        anthropic \
        openpyxl \
        requests \
    && rm -rf /root/.cache/pip /var/lib/apt/lists/*

WORKDIR /root
