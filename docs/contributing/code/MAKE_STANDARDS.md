# Make standards

This document describes the coding standards and conventions for `Makefile` files in the organization projects.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](<https://www.ietf.org/rfc/rfc2119.txt>).

## Targets

* All `make` targets MUST be declared as `.PHONY` unless they produce a file artifact with a name that matches the target;

* Each target MUST include a short inline `## <description>` comment — this is what the `help` target uses to auto-generate its output (see The `help` target);

* Targets MAY combine multiple command executions and implement additional logic (e.g., pre- or post-processing steps) to fully encapsulate the required routine — the user MUST NOT need to run extra commands outside of `make` to complete a task;

* Composite targets SHOULD aggregate related sub-targets to provide a single entry point for a logical group of operations (e.g., a `lint` target that calls `lint-markdown` and `lint-yaml`);

* Target names MUST use lowercase, hyphen-separated words (e.g., `build-html-docs`, `lint-markdown`).

### Dependencies

Target dependencies are declared on the same line as the target name, after the colon, as a space-separated list of other target names:

    lint: lint-markdown lint-yaml ## Lint.
    .PHONY: lint

Make guarantees that all declared dependencies are executed — in the order they are listed — before the target's own recipe runs. Dependencies MUST only reference other targets declared in the same `Makefile`. Circular dependencies MUST NOT be
introduced, as they cause Make to fail with an error.

## Shell

Target shell commands SHOULD use `sh` unless a `bash`-specific feature is required — this keeps targets portable and consistent with the [POSIX compliance policy](<../../../index.html#shell-environment-and-posix-compliance>).

## Parameters

When a target accepts parameters, all of them MUST be explicitly declared as `make` variables — whether required or optional:

* Optional parameters MUST provide a default value using the `?=` assignment operator so that the target can be invoked without specifying them explicitly:

`makefile ENV ?= development`

* Required parameters MUST be validated at the start of the target body. If a required variable is not set, the target MUST fail immediately with a descriptive error message:

`makefile deploy: ## Deploy the application. ifndef ENV $(error ENV is required. Usage: make deploy ENV=<environment>) endif @./scripts/deploy.sh "${ENV}" .PHONY: deploy`

## The `help` target

Every `Makefile` MUST include a `help` target as the first declared target. It serves as the built-in documentation entrypoint, listing all available targets and their descriptions. The `help` target MUST be implemented by scanning the `Makefile`
for inline `## <description>` comments declared on each target, so that the output stays automatically in sync with the targets defined.

The following implementation is RECOMMENDED:

    help: ## Show this help.
        @egrep -h '\s##\s' $(MAKEFILE_LIST) \
            | awk 'BEGIN {FS = ":.*?## "}; { if ($$1 == "$@") printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2; exit;}'
        @egrep -h '\s##\s' $(MAKEFILE_LIST) \
            | awk 'BEGIN {FS = ":.*?## "}; { if ($$1 != "$@") printf "%-30s|%s\n", $$1, $$2}' \
            | LC_COLLATE=C sort --ignore-case \
            | awk -F '|' '{printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'
    .PHONY: help

This implementation:

* Prints the `help` target's own description first;

* Lists all other targets alphabetically with their descriptions;

* Uses colour formatting for readability.
