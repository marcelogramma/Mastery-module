# Naming conventions

This document defines the naming rules for infrastructure resources. Two distinct naming concerns are covered:

* **SAM/CloudFormation logical resource names** — the names used as keys in the `Resources:` section of a template; visible only within the template and in the CloudFormation console;

* **AWS cloud resource names** — the actual names assigned to provisioned resources in the AWS account; visible in the AWS Console, in ARNs and in service endpoints.

## SAM/CloudFormation logical resource names

Logical resource names are identifiers used internally within a CloudFormation or SAM template. They have no direct impact on the provisioned resource's name in AWS unless the template explicitly passes them as a name property.

### Logical name rules

* MUST use `PascalCase`;

* MUST be descriptive of the resource's purpose;

* MUST include the CloudFormation resource type as a suffix, using the last segment of the `Type` value (e.g. `Function` for `AWS::Serverless::Function`, `Table` for `AWS::DynamoDB::Table`, `Api` for `AWS::Serverless::Api`);

* MUST NOT use generic names such as `Resource1`, `MyFunction` or `Table1`;

* MUST NOT include the environment name — logical names are environment-agnostic since the same template is parameterized and deployed to multiple environments.

### Logical name examples

    # Good
    Resources:
        UserTableTable:
            Type: AWS::DynamoDB::Table
            # ...

        CreateUserFunction:
            Type: AWS::Serverless::Function
            # ...

        UserApiApi:
            Type: AWS::Serverless::Api
            # ...

        OrdersBucket:
            Type: AWS::S3::Bucket
            # ...

        ProcessOrderQueue:
            Type: AWS::SQS::Queue
            # ...

    # Bad
    Resources:
        Table1:                 # Not descriptive
            Type: AWS::DynamoDB::Table

        MyFunction:             # Generic name, missing type suffix
            Type: AWS::Serverless::Function

        UserAPI:                # Incorrect case for the suffix
            Type: AWS::Serverless::Api

## AWS cloud resource names

AWS cloud resource names are the actual names assigned to resources when they are provisioned in an AWS account. These names appear in the AWS Console, in ARNs and in service endpoint URLs.

### Cloud resource rules

* MUST use `kebab-case`;

* MUST follow the pattern: `{project}-{component}-{resource-type}-{env}`;

* MUST include the environment identifier as the final segment (e.g. `dev`, `qa`, `prod`);

* MUST use English, descriptive and meaningful names. Abbreviations SHOULD be avoided unless they are widely recognized in the domain context;

* MUST NOT use uppercase letters, underscores or spaces;

* MUST NOT exceed the character limit imposed by the target AWS service (limits vary; refer to the service documentation).

### Pattern breakdown

Segment | Description | Example
---|---|---
`{project}` | Short identifier for the project or application | `billing`
`{component}` | The functional component or module within the project | `user`, `order`, `payment`
`{resource-type}` | Short descriptor for the AWS resource type | `table`, `function`, `api`, `bucket`, `queue`
`{env}` | Target environment identifier | `dev`, `qa`, `prod`

### Cloud resource examples

    # Good
    billing-user-table-dev
    billing-user-table-prod
    billing-create-user-function-dev
    billing-create-user-function-prod
    billing-user-api-dev
    billing-orders-bucket-prod
    billing-process-order-queue-qa

    # Bad
    UserTable                   # Missing project, component and environment segments
    billing_user_table_dev      # Underscores not allowed
    BillingUserTableDev         # PascalCase not allowed
    billing-user-table          # Missing environment segment

### SAM template example

The cloud resource name MUST be derived from a parameter or mapping to ensure the environment suffix is applied consistently:

    Parameters:
        Environment:
            Type: String
            AllowedValues:
        * dev
        * qa
        * prod

    Resources:
        UserTableTable:
            Type: AWS::DynamoDB::Table
            Properties:
                TableName: !Sub 'billing-user-table-${Environment}'
                # ...

        CreateUserFunction:
            Type: AWS::Serverless::Function
            Properties:
                FunctionName: !Sub 'billing-create-user-function-${Environment}'
                # ...

Using `!Sub` with the `Environment` parameter ensures that the same template produces correctly named resources in every target environment without duplication or manual substitution.

## Resource tag names

Resource tag names MUST use [Reverse DNS notation](<https://en.wikipedia.org/wiki/Reverse_domain_name_notation>) to avoid collisions with AWS-managed tag namespaces (e.g. `aws:*`) and third-party tooling. All the organization-managed tags MUST use
the `com.the organization` namespace as the root prefix.

### Format

    com.the organization.<qualifier>

Where `<qualifier>` is a lowercase, dot-separated descriptor that identifies the tag's purpose.

### Rules

* Tag names MUST use the `com.the organization` root prefix;

* Tag names MUST use lowercase letters, digits, hyphens and dots only;

* Tag names MUST NOT use uppercase letters, underscores or spaces;

* Tag names MUST be descriptive and unambiguous.

### Standard tags

The following tags MUST be applied to all provisioned resources:

Tag | Description | Example
---|---|---
`com.the organization.author` | Team or individual responsible for the resource | `engineering@company.com`
`com.the organization.source` | URL of the source repository | `https://github.com/the organization/skeleton-aws-lambda-python`
`com.the organization.version` | Version of the deployed artifact | `1.2.0`

Additional tags MAY be introduced under the `com.the organization` namespace as needed.

### Example

    Tags:
        com.the organization.author: "engineering@company.com"
        com.the organization.source: "https://github.com/the organization/skeleton-aws-lambda-python"
        com.the organization.version: "1.2.0"
