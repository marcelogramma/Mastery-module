# Docker environment

**Note**: All the instructions and examples in this file assumes that your current directory is the project's root (`/` instead
of `./docker/`).

## Table of contents

- [Setup]
- [Running]
- [Usage]

## Setup

Create a new `.docker/.env` file from the content in `.docker/.env.dist`:

```shell
cp .docker/.env.dist .docker/.env
```

You MUST replace the values in `.docker/.env` according to your local setup. As this file is ignored, the changes you make
here will exist only in your environment.

Sensitive parameters for the local environment are stored under the `.docker/secrets/` directory. They are exposed to the
application's containers through [Docker Compose secrets](https://docs.docker.com/compose/use-secrets/).

Create a new `.aws/sam/samconfig.toml` file from the content in `.aws/sam/samconfig.toml.dist`:

```shell
cp .aws/sam/samconfig.toml.dist .aws/sam/samconfig.toml
```

In order to configure the [AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html#cli-configure-files-format-profile),
you MUST create the file `.docker/secrets/aws_credentials.txt`.

Set your own values according the AWS documentation:

```text
[default]
aws_access_key_id=********************
aws_secret_access_key=****************************************
region=us-east-1
output=json
```

## Service provisioning

Build the "cli" container:

```shell
docker compose -f .docker/compose.yaml build cli
```

Install PDM dependencies:

```shell
docker compose -f .docker/compose.yaml run --rm cli pdm install --dev
```

Create the application package for use with AWS Lambda:

```shell
docker compose -f .docker/compose.yaml run --rm cli make package
```

Start the Docker containerized environment using [docker compose]:

```shell
docker compose -f .docker/compose.yaml up -d
```

Create the local DynamoDB table:

```shell
docker compose -f .docker/compose.yaml run --rm cli aws \
    dynamodb create-table --endpoint-url "http://dynamodb:8000" --cli-input-json file:///app/.docker/dynamodb/schema.json
```

Insert dummy data in the local DynamoDB table:

```shell
docker compose -f .docker/compose.yaml run --rm cli aws \
    dynamodb batch-write-item --endpoint-url "http://dynamodb:8000" --request-items file:///app/.docker/dynamodb/items.json
```

## Usage

You have the following services:

- **cli**: The service that provides all the CLI tools required by the project, including `pdm`, `aws`, `sam`, `xmllint`,
  `yamllint`.
- **app**: The service that provides AWS Lambda local service (`public.ecr.aws/lambda/python:3.12-rapid-x86_64`).
- **dynamodb**: The service that provides DynamoDB 2.5.2 local service (`amazon/dynamodb-local:2.5.2`).

For example, you can run `pdm --version` using:

```shell
docker compose -f .docker/compose.yaml run --rm cli pdm --version
```

## Running

Invoke an AWS Lambda resource:

```shell
curl --request POST \
    --url http://127.0.0.1:3001/2015-03-31/functions/ApiLambdaFindCompany/invocations \
    --header 'Content-Type: application/json' \
    --data '{"company_id":42}' \
    -vvv
```

[docker compose]: https://docs.docker.com/compose/
[Setup]: #setup
[Running]: #running
[Usage]: #usage
