# Cloud operations

## CLI-first approach

All instructional content for cloud provider operations — including procedures, runbooks, README steps and documentation — MUST express operations as deterministic CLI commands. UI-based navigation steps (e.g., "click the blue button at the top",
"open the service in the console and select the option") MUST NOT be used.

CLI commands are reproducible, versionable, auditable and unambiguous. UI steps are brittle: they vary across regions, accounts, roles and console versions, cannot be scripted or reviewed in pull requests, and are prone to becoming outdated as
provider interfaces evolve.

## AWS

### AWS CloudShell

[AWS CloudShell](<https://docs.aws.amazon.com/cloudshell/latest/userguide/welcome.html>) is a browser-based shell environment provided by AWS directly within the AWS Management Console. It is pre-authenticated using the credentials of the currently
signed-in IAM identity, requires no local toolchain setup, and comes with the AWS CLI and common utilities pre-installed.

CloudShell is available in every AWS region and can be launched from the console toolbar. Because it runs within the AWS infrastructure and inherits the caller's session credentials, it eliminates the need to manage local credential files or assume
roles manually for one-off operations.

### Running AWS CLI commands

All AWS CLI instructions in documentation and runbooks SHOULD target AWS CloudShell as the execution environment. This ensures that every reader can follow the instructions without needing a locally configured AWS CLI, credentials or additional
tooling.

The only acceptable alternative is a local environment that already has the AWS CLI installed and configured with valid credentials for the target account and region.

### Secrets in CLI commands

Sensitive values (passwords, API keys, tokens, secret payloads) MUST NOT appear as literal arguments in shell commands. Any value passed directly on the command line is recorded in shell history files (`.bash_history`, `.zsh_history`) and may be
visible in process listings.

To prevent this exposure, commands that accept secret input MUST use **stdin** redirection so the sensitive data is never part of the command line. The operator pastes the value and presses **Ctrl+D** (EOF) to submit it.

Example with AWS Secrets Manager:

    aws secretsmanager create-secret \
        --name my-service/api-key \
        --secret-string "$(cat)"

The `"$(cat)"` construct causes the shell to read from stdin — the secret value never appears in history or process arguments.

Documentation and runbooks that include commands handling secrets MUST use this pattern and MUST include the following notice immediately before the command block:

> **Security Notice:** To prevent sensitive data from being recorded in the terminal history, the commands below use stdin redirection (e.g., `"$(cat)"`). The operator pastes the secret payload and presses **Ctrl+D** (EOF) to submit it. Because the
secret value is never part of the command line, it does not appear in shell history files.
