# syntax=docker/dockerfile:1

FROM public.ecr.aws/docker/library/python:3.12.11-alpine3.21 AS base

LABEL org.opencontainers.image.authors='Fede RL03 Inc. <esa@nubity.com>'
LABEL org.opencontainers.image.licenses='LicenseRef-Proprietary'
LABEL org.opencontainers.image.source='https://github.com/fedelr03/Mastery-module'
LABEL org.opencontainers.image.title='AWS Lambda Python Skeleton'
LABEL org.opencontainers.image.vendor='Fede RL03 Inc.'

ENV WORKDIR=/app
ENV PATH="/opt/tools/.venv/bin:/app/.venv/bin:${PATH}"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR ${WORKDIR}

EXPOSE 3001

FROM public.ecr.aws/aws-cloudformation/cloudformation-guard:3.1.2 AS guard-source

FROM base AS cli-dev

WORKDIR /app

ENV PATH="${PATH}:/usr/local/bundle/bin"
ENV SAM_CLI_TELEMETRY=0
ENV TRIVY_CACHE_DIR=/tmp/trivy/cache

COPY --from=guard-source /usr/src/cloudformation-guard/cfn-guard /usr/local/bin/cfn-guard
COPY --from=public.ecr.aws/aquasecurity/trivy:0.60.0 /usr/local/bin/trivy /usr/local/bin/trivy
COPY --from=hadolint/hadolint:v2.12.0 /bin/hadolint /usr/local/bin/hadolint

RUN apk add --no-cache \
    #>CVEs
    icu-libs~=74.2-r1 \
    libcrypto3~=3.3.7 \
    libexpat~=2.8.1-r0 \
    libssl3~=3.3.7 \
    musl-utils~=1.2.5-r11 \
    nghttp2-libs~=1.69.0 \
    sqlite-libs~=3.48.0-r4 \
    xz~=5.8.3-r0 \
    #<CVEs
    aws-cli~=2.22 \
    bash~=5.2 \
    # "coreutils" provides "sort".
    coreutils~=9 \
    # "diffutils" provides "diff".
    diffutils~=3.10 \
    gawk~=5.3 \
    jq~=1.7.1 \
    # "libxml2-dev" provides "xmllint".
    libxml2-dev~=2.13.9 \
    make~=4 \
    nodejs~=22.23.0-r0 \
    ruby~=3.3.10 \
    yamllint~=1 \
    zip~=3 \
    && apk add --no-cache --virtual .build-deps \
    # "gcc" and "musl-dev" are required to install "cfn-nag".
    gcc~=14.2 \
    musl-dev~=1.2.5-r11 \
    npm~=10.9 \
    ruby-dev~=3.3.10 \
    && python3 -m venv /opt/tools/.venv \
    && /opt/tools/.venv/bin/pip install --no-cache-dir \
        aws-sam-cli~=1.159 \
        cfn-lint~=1.48 \
        pdm~=2.22 \
        pip~=26.1 \
        urllib3~=1.26.15 \
    && npm install -g \
        @cspell/dict-es-es@>=3.0.3 \
        cspell@^9.1.3 \
        jsonlint@^1.6.0 \
        markdownlint-cli@^0.32.2 \
    && gem install \
        cfn-nag -v '~> 0.8.10' \
    && apk del .build-deps

FROM cli-dev AS builder

EXPOSE 8080

RUN adduser -D -u 1000 appuser

# Copy project files to the image.
COPY ./ "${WORKDIR}"

RUN chown -R appuser:appuser "${WORKDIR}"

USER appuser

VOLUME ${WORKDIR}
