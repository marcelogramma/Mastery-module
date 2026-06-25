# Infrastructure as Code

[Infrastructure as Code (IaC)](<https://en.wikipedia.org/wiki/Infrastructure_as_code>) is the practice of managing and provisioning infrastructure resources through machine-readable configuration files, rather than through manual processes or
interactive tools.

## Mandate

All cloud infrastructure MUST be provisioned exclusively using IaC. The following approaches are NOT allowed:

* Manual provisioning via the AWS Management Console;

* Manual execution of AWS CLI commands outside of IaC tooling;

* Any ad-hoc or interactive method that produces infrastructure state not captured in version-controlled templates.

This mandate applies to all environments, including development. There are no exceptions.

For the complementary rule governing how cloud provider operations MUST be expressed in documentation and runbooks (CLI commands over UI steps) and the AWS CloudShell recommendation, see [Cloud operations](<cloud-operations.html>).

## Supported tools

The following IaC tools are currently supported:

Tool | Use case | Status
---|---|---
[AWS SAM](<https://aws.amazon.com/serverless/sam/>) (Serverless Application Model) | Serverless applications | Supported

Other IaC tools MAY be evaluated and adopted with prior ESA approval. When evaluating general-purpose IaC tools, the following guidance applies in accordance with the [open-source preference policy](<open-source.html>):

* [OpenTofu](<https://opentofu.org/>) (MPL-2.0 licensed, open-source fork of Terraform) SHOULD be preferred over [Terraform](<https://www.terraform.io/>) (Business Source License 1.1 — source-available but not open-source);

* [Terragrunt](<https://terragrunt.gruntwork.io/>) (MIT licensed) MAY be evaluated as an orchestration wrapper for OpenTofu or Terraform;

* [AWS CDK](<https://aws.amazon.com/cdk/>) (Apache-2.0 licensed) MAY be evaluated for projects that prefer an imperative, code-first approach over declarative templates.

For the project-level integration conventions governing how AWS SAM assets are placed in the repository (`.aws/` directory, bridging pattern), see the [AWS SAM](<../code/conventions.html#sam>) section of the coding conventions.

## Template format

YAML MUST be used as the template format for all SAM and CloudFormation templates. JSON MUST NOT be used.

YAML is preferred because:

* It supports inline comments, which allow teams to document decisions and constraints directly in the template;

* It is more readable and aligns with the format used across all other configuration files in the project (e.g. `compose.yaml`, `.yamllint.yaml`);

* It reduces visual noise compared to JSON for nested structures.

## Template architecture

All SAM projects MUST follow a 2-phase template architecture composed of a foundation stack and a set of application layer nested stacks.

### Foundation stack

The foundation stack is defined in a `foundation.yaml` template and is provisioned once per environment. It declares the landing zone base components shared across all application layers, such as:

* [Amazon VPC](<https://aws.amazon.com/vpc/>) and subnet definitions;

* Shared [AWS IAM](<https://aws.amazon.com/iam/>) roles and policies;

* [AWS Systems Manager Parameter Store](<https://aws.amazon.com/systems-manager/features/#Parameter_Store>) parameters shared across stacks;

* The [Amazon CloudFormation](<https://aws.amazon.com/cloudformation/>) nested stack definitions that reference all application layer templates.

All application layer stacks MUST be declared as nested stacks within the foundation stack.

### Application layer stacks

Application functionality is divided into separate templates organized by responsibility. Each template MUST represent a distinct infrastructure concern, for example:

* `storage.yaml` — persistent storage resources (DynamoDB tables, S3 buckets, etc.);

* `compute.yaml` — compute resources (Lambda functions, ECS tasks, etc.);

* `api.yaml` — API gateway definitions and integrations.

Each application layer template MUST be a nested stack referenced from `foundation.yaml`. This ensures a single deployment entry point and consistent lifecycle management across all layers.

### Repository structure

IaC assets MUST live in the project repository alongside the application code, under a `.aws/sam/` directory at the repository root:

    your-project/
    ├─ .aws/
    │  └─ sam/
    │     ├─ foundation.yaml
    │     ├─ storage.yaml
    │     ├─ compute.yaml
    │     ├─ api.yaml
    │     └─ samconfig.toml.dist
    ├─ src/
    └─ ...

* `.aws/sam/foundation.yaml`: Foundation stack template, provisioned once per environment;

* `.aws/sam/*.yaml`: Application layer nested stack templates, one per responsibility layer;

* `.aws/sam/samconfig.toml.dist`: Template for the SAM CLI configuration file (`samconfig.toml`). It provides the default deployment parameters and MUST be committed to version control. The working `samconfig.toml` file MUST NOT be committed (add it
to `.gitignore`). See the [distribution files convention](<../code/conventions.html#distribution-files>) for the rationale and rules that govern `.dist` files.

## Environment mappings

SAM and CloudFormation `Mappings` MUST be used to control environment-specific behavior. Hardcoded environment-specific values MUST NOT be used directly in resource definitions.

### Retention policies

Resources whose retention behavior differs between environments MUST be governed by a `Mappings` block. The following rules apply:

* In the `prod` environment, resources MUST use persistent retention configuration:

* `DeletionPolicy: Retain` for stateful resources (e.g. DynamoDB tables, S3 buckets);

* Long log retention periods (e.g. 365 days for CloudWatch log groups).

* In lower environments (`dev`, `qa`, `staging`), resources MUST use ephemeral configuration to reduce cost:

* `DeletionPolicy: Delete`;

* Short log retention periods (e.g. 7 days).

### Example

    Mappings:
        EnvironmentConfig:
            prod:
                DeletionPolicy: Retain
                LogRetentionDays: 365
            qa:
                DeletionPolicy: Delete
                LogRetentionDays: 7
            dev:
                DeletionPolicy: Delete
                LogRetentionDays: 7

    Resources:
        UserTableTable:
            Type: AWS::DynamoDB::Table
            DeletionPolicy: !FindInMap [EnvironmentConfig, !Ref Environment, DeletionPolicy]
            Properties:
                # ...

All resource properties that vary by environment MUST be derived from the `Mappings` section using `!FindInMap`. This makes environment differences explicit, auditable and easy to review.

## Naming conventions

See the dedicated [Naming conventions](<naming-conventions.html>) document for the rules governing SAM/ CloudFormation logical resource names and AWS cloud resource names.
