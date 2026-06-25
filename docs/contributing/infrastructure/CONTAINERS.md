# Containers

In order to share a standardized environment regardless of the host where our applications run, we rely on [OS-level virtualization](<https://en.wikipedia.org/wiki/OS-level_virtualization>). All of our projects use [Docker](<https://www.docker.com/>) for that purpose. In some cases, where the application uses multiple services, we also use [Docker Compose](<https://docs.docker.com/compose/>) as an orchestrator for these container-based services.

To ease the development and delivery of our products, you MUST always execute and perform operations related to project tooling in a virtualized environment. This way we also adhere to the [DevOps](<https://en.wikipedia.org/wiki/DevOps>) principles
and best practices.

## Docker CLI

The [Docker CLI](<https://docs.docker.com/engine/reference/commandline/cli/>) (open-source) MUST be used as the container runtime interface. See the [Open-source preference](<open-source.html#containerization>) policy for further details about the
choice of tooling.

## Project structure

Each project MUST include a `.docker/` directory at the repository root. This directory contains the configuration required by Docker and Docker Compose to bring up the container-based environment for the project.

A typical layout looks like:

    your-project/
    ├─ .docker/
    │  ├─ app/
    │  │  └─ Dockerfile
    │  ├─ .env
    │  ├─ .env.dist
    │  └─ compose.yaml
    └─ ...

* `.docker/app/Dockerfile`: Defines the container image for the application service;

* `.docker/.env`: Local environment variables loaded by Docker Compose (MUST NOT be committed to version control);

* `.docker/.env.dist`: Template for `.docker/.env`, with sample or dummy values (MUST be committed to version control). See the [distribution files convention](<../code/conventions.html#distribution-files>) for the rationale and rules that govern
`.dist` files;

* `.docker/compose.yaml`: Docker Compose service definitions.

## Dockerfile and Compose conventions

The infrastructure policy documents above define _what_ tooling is required and _how_ projects are structured. For the implementation rules that govern _how_ to author `Dockerfile` and Compose files correctly (registry requirements, BuildKit
directive, stage naming, OCI annotation keys, runtime behavior, `cli` service convention, etc.), see the dedicated sections in the coding conventions document:

* [Docker](<../code/conventions.html#docker>)

* [Docker Compose](<../code/conventions.html#docker-compose>)

## Pre-requisites

The following tools are REQUIRED to work with containers across all projects:

* [Docker](<https://www.docker.com/>) >= 27;

* [Docker Compose](<https://docs.docker.com/compose/>) >= 2.29.

Based on specific circumstances, some projects could require additional tools, but these are the minimum requirements for almost all cases.
