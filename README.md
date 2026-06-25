# Fede RL03 — AWS Lambda Python Skeleton for Mastery Module

Skeleton para funciones AWS Lambda en Python 3.12, desplegado con AWS SAM. Incluye una función de ejemplo
(`ApiLambdaFindCompany`) que consulta una tabla DynamoDB y retorna datos de una empresa por ID.

## Stack tecnológico

- **Runtime**: Python 3.12
- **Package Manager**: PDM
- **IaC**: AWS SAM (CloudFormation)
- **Infraestructura**: Lambda en VPC privada, DynamoDB (PAY_PER_REQUEST), VPC Endpoint Gateway, CloudWatch Logs/Alarms
- **Contenedores**: Docker + Docker Compose (entorno local homogéneo)

## Requisitos

- [Docker](https://docs.docker.com/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

Todo comando (excepto `git`) se ejecuta dentro de Docker:

```shell
docker compose --file .docker/compose.yaml run --rm cli <comando>
```

## Setup

1. Crear archivos de configuración local:

   ```shell
   cp .docker/.env.dist .docker/.env
   cp .aws/sam/samconfig.toml.dist .aws/sam/samconfig.toml
   ```

2. Configurar credenciales AWS en `.docker/secrets/aws_credentials.txt`:

   ```text
   [default]
   aws_access_key_id=********************
   aws_secret_access_key=****************************************
   region=us-east-1
   output=json
   ```

3. Construir el contenedor e instalar dependencias:

   ```shell
   docker compose -f .docker/compose.yaml build cli
   docker compose -f .docker/compose.yaml run --rm cli pdm install --dev
   ```

4. Crear la tabla DynamoDB local y cargar datos seed:

   ```shell
   docker compose -f .docker/compose.yaml up -d dynamodb
   docker compose -f .docker/compose.yaml run --rm cli aws \
       dynamodb create-table --endpoint-url "http://dynamodb:8000" --cli-input-json file:///app/.docker/dynamodb/schema.json
   docker compose -f .docker/compose.yaml run --rm cli aws \
       dynamodb batch-write-item --endpoint-url "http://dynamodb:8000" --request-items file:///app/.docker/dynamodb/items.json
   ```

## Uso

### Ejecutar Lambda localmente

```shell
docker compose -f .docker/compose.yaml up -d
```

Invocar la función:

```shell
curl --request POST \
    --url http://127.0.0.1:3001/2015-03-31/functions/ApiLambdaFindCompany/invocations \
    --header 'Content-Type: application/json' \
    --data '{"company_id": 42}'
```

### Quality Assurance (todos los linters)

```shell
docker compose -f .docker/compose.yaml run --rm cli pdm run qa
```

Esto ejecuta secuencialmente: `autopep8` → `isort` → `mypy` → `pydocstyle` → `pylint` → `radon`.

### Linters individuales

```shell
docker compose -f .docker/compose.yaml run --rm cli pdm run pylint
docker compose -f .docker/compose.yaml run --rm cli pdm run mypy
docker compose -f .docker/compose.yaml run --rm cli pdm run pytest
```

### Lint de infraestructura y archivos

```shell
docker compose -f .docker/compose.yaml run --rm cli make lint
```

Incluye: markdownlint, yamllint, xmllint, jsonlint, cfn-lint, cfn-guard, cfn_nag, SAM validate.

### Tests

```shell
docker compose -f .docker/compose.yaml run --rm cli pdm run pytest
```

### Tests de cfn-guard

```shell
docker compose -f .docker/compose.yaml run --rm cli make test-aws-cfn-guard
```

### Empaquetar para deploy

```shell
docker compose -f .docker/compose.yaml run --rm cli make package
```

Genera `.aws/sam/build/nubity-skeleton-aws-lambda-python.zip` listo para deploy.

### Spell check

```shell
docker compose -f .docker/compose.yaml run --rm cli make spellcheck
```

## Estructura del proyecto

```text
.aws/sam/           # Template SAM, config, guards de seguridad
.cspell/            # Diccionarios para spell checking
.docker/            # Compose, Dockerfile, DynamoDB local, secrets
.github/            # Workflows CI/CD, templates PR/issues, CODEOWNERS
src/                # Código fuente de la Lambda
tests/              # Tests unitarios Python y tests cfn-guard
Makefile            # Targets de lint, package y test de infraestructura
pyproject.toml      # Dependencias, metadata y scripts PDM
```

## CI/CD

Los pipelines se ejecutan automáticamente en GitHub Actions:

- **En cada PR**: QA completo (Python + infraestructura + spelling + Docker), tests, validación de formato de PR.
- **Cron diario (06:00 UTC)**: QA y tests como safety net.
- **Release**: se dispara manualmente vía `changelog.yaml`, genera PR de release con changelog auto-generado.
- **Al crear tag**: publica imagen Docker, crea rama stable, marca versión en JIRA.

## Licencia

Proprietary — Copyright (c) 2024 Fede RL03 Inc. Todos los derechos reservados.

Consultar el archivo [LICENSE](./LICENSE) para más detalles.

## Documentación adicional

- [Índice de Documentación](./docs/INDEX.md)
- [Entorno Docker](./.docker/README.md)
- [CloudFormation Guard — Policy Rules](./.aws/sam/guards/README.md)
- [Buenas Prácticas del Proyecto](./docs/BUENAS_PRACTICAS.md)
- [Análisis del Sitio Web](./docs/ANALISIS_SITIO.md)
