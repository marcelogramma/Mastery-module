# CloudFormation Guard — Policy Rules

This directory contains [AWS CloudFormation Guard (cfn-guard)](https://github.com/aws-cloudformation/cloudformation-guard)
rule files that enforce security and operational policies on all SAM/CloudFormation templates at static analysis time. Guard
rules are evaluated against the template source files - no deployment is required to detect violations.

cfn-guard complements the other linting tools used in this project:

| Tool        | Purpose                                                                        |
| ----------- | ------------------------------------------------------------------------------ |
| `cfn-lint`  | CloudFormation schema and syntax validation                                    |
| `cfn_nag`   | Security warnings (e.g., overly permissive policies, missing encryption)       |
| `cfn-guard` | Project-specific policy enforcement (mandatory properties, security baselines) |

## Running locally

### Validate all templates against all guards

```shell
make lint-aws-cfn-guard
```

### Run guard unit tests

```shell
make test-aws-cfn-guard
```

## Unit tests

Unit tests for each guard file live in [`tests/aws/cloudformation/guards/`](./../../../tests/aws/cloudformation/guards/).
Each test file exercises both the PASS path (compliant resource) and the FAIL path (non-compliant resource) for every rule
it covers. Tests use the native `cfn-guard test` runner - no additional tooling is required.

## Limitations

cfn-guard evaluates **static template text** without resolving CloudFormation intrinsic functions (`!Sub`, `!Ref`, `!If`,
etc.). Properties whose values are computed at deploy time (e.g., `!Sub 'acme/${Environment}/schema/db'`) are seen by cfn-guard
as the literal unresolved string `acme/${Environment}/schema/db`. Consequently:

- **Naming convention rules** for resource names built with `!Sub` cannot be enforced by cfn-guard. These MUST be enforced
  at deploy time through `AllowedValues`.
- **Rules that depend on resolved ARNs or IDs** (e.g., cross-stack references via `Fn::ImportValue`) cannot be evaluated.
  Use cfn-lint or integration tests for those checks.

## How to extend

Follow these steps to add a new rule:

1. **Choose or create the appropriate guard file** based on the security domain (e.g., add networking rules to `networking.guard`).

2. **Write the rule** using the cfn-guard v3 filter syntax so it fires correctly on mixed-type templates:

   ```text
   rule my_new_rule {
       let resources = Resources.*[ Type == "AWS::Some::Resource" ]

       when %resources !empty {
           %resources.Properties.RequiredProperty exists
           <<
               Violation: <clear description of the requirement>.
               <Reference to the source document or standard>.
           >>
       }
   }
   ```

3. **Add PASS and FAIL test scenarios** to the corresponding test file in [`tests/aws/cloudformation/guards/`](./../../../tests/aws/cloudformation/guards/).
   Each scenario MUST include at minimum one compliant (`PASS`) and one non-compliant (`FAIL`) input.

4. **Validate locally**:

   ```shell
   make lint-aws-cfn-guard
   make test-aws-cfn-guard
   ```

5. Both `lint-aws-cfn-guard` and `test-aws-cfn-guard` MUST pass before the change is merged.
