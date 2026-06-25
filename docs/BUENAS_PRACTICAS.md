# Buenas Prácticas del Proyecto — Nubity

Análisis basado en la configuración actual del repositorio `Mastery-module` (skeleton AWS Lambda Python de Nubity).

---

## 1. Naming Conventions

### Python (src/, tests/)

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos/módulos | snake_case | `date_format.py`, `app_test.py` |
| Clases | PascalCase | `DateFormat`, `AppTest` |
| Funciones | camelCase* | `handleRequest`, `getCompany` |
| Variables | camelCase / snake_case | `companyId`, `table_name` |
| Constantes | UPPER_SNAKE_CASE | `FORMAT_ISO8601` |
| Enums | PascalCase (clase), UPPER_SNAKE_CASE (valores) | `DateFormat.FORMAT_UNIX_TIME` |
| Tests | Archivo: `*_test.py`, Clase: `*Test`, Método: `test*` | `app_test.py`, `AppTest`, `testHandleRequestWithExistentCompany` |
| Directorios | snake_case | `model_enum/` |

> *Nota: el skeleton usa camelCase para funciones (estilo Java/JavaScript). Mantener consistencia.

### AWS CloudFormation / SAM (template.yaml)

| Elemento | Convención | Ejemplo |
|---|---|---|
| Resources | PascalCase | `ApiLambdaFindCompany`, `TableCompany` |
| Parameters | PascalCase | `EnvironmentName`, `DynamoDbUri` |
| Outputs | PascalCase con prefijo de servicio | `DynamoDbTableNameCompany`, `CloudWatchAlarmLambdaErrors` |
| Log Groups | Path con namespace | `/aws/lambda/${AWS::StackName}` |
| Tags | dot-notation con namespace | `com.nubity.source` |

### GitHub Workflows

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | kebab-case.yaml | `qa-aws.yaml`, `create-branch-stable.yaml` |
| Job names | kebab-case | `build-docker`, `qa-python` |
| Job display names | Title Case con guiones | `'Quality Assurance - Python'` |
| Secretos | UPPER_SNAKE_CASE | `SUPABASE_URL`, `ANTHROPIC_API_KEY` |

### Docker

| Elemento | Convención | Ejemplo |
|---|---|---|
| Servicios | kebab-case | `cli`, `dynamodb`, `app` |
| Variables de entorno | UPPER_SNAKE_CASE con prefijo | `AWS_DYNAMODB_TABLE_NAME`, `COMPOSE_PROJECT_NAME` |
| Imágenes/targets | kebab-case | `cli-dev`, `builder` |

### Ramas Git

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Feature | `feature/<ticket-id>-<descripcion>` | `feature/MONE-123-add-endpoint` |
| Bug fix | `fix/<ticket-id>-<descripcion>` | `fix/MONE-456-null-response` |
| Release | `release/v<version>` | `release/v1.2.0` |
| Stable | `stable/<major>.<minor>` | `stable/1.2` |

### Commits

| Patrón | Ejemplo |
|---|---|
| `[<TICKET>] <Descripción imperativa>` | `[MONE-123] Add company endpoint` |

### Pull Request Titles

| Patrón | Ejemplo |
|---|---|
| `[<TICKET>] <Descripción concisa>` | `[MONE-123] Add DynamoDB read for company lookup` |

---

## 2. Branch Model

### Estructura de ramas

| Rama | Propósito |
|------|-----------|
| `master` | Rama principal de desarrollo. Destino de features, improvements y deprecations. |
| `stable/*` | Ramas estables creadas automáticamente a partir de tags para mantenimiento de PATCH. |
| `release/*` | Ramas generadas por el workflow `changelog.yaml` para preparar releases. |

### Reglas observadas

- **Features y nuevas funcionalidades** → target branch MUST be `master`.
- **Bug fixes** → target branch MUST be la rama estable más baja aplicable y mantenida.
- **BC breaks** → SHOULD solo introducirse en releases MAJOR.
- Se usa **Semantic Versioning** con soporte para pre-releases (`is-pre-release`).
- Se genera automáticamente un merge PR desde ramas `stable` de vuelta a `master` tras un PATCH release (workflow `create-merge-from-release.yaml`).
- Los tags disparan la creación de ramas estables (`create-branch-stable.yaml`).

### Flujo de release

1. Se ejecuta manualmente `changelog.yaml` eligiendo `major`, `minor` o `patch`.
2. Se crea un PR de release con changelog auto-generado.
3. Al mergearse el PR, `release.yaml` publica el tag.
4. El tag dispara: creación de rama stable, release de imágenes Docker, release de versión JIRA.

---

## 3. Linters y Quality Assurance

### Python

| Herramienta | Configuración | Propósito |
|---|---|---|
| `pylint` | `.pylintrc` (score mínimo: 10.0) | Análisis estático completo |
| `mypy` | `mypy.ini` (strict: disallow_untyped_defs, disallow_untyped_calls) | Type checking |
| `pydocstyle` | `.pydocstyle` (ignora D100, D104, D105, D106, D107, D203, D212) | Docstrings |
| `autopep8` | `.pep8` (ignora E501 - line length) | Formateo automático |
| `isort` | Ejecutado vía `pdm run isort` | Orden de imports |
| `radon` | Mínimo complejidad B | Complejidad ciclomática |
| `pip-audit` | Integrado en dev deps | Auditoría de vulnerabilidades |
| `pip-licenses` | Integrado en QA | Cumplimiento de licencias |

El script compuesto `pdm run qa` ejecuta todos en orden: `autopep8 → isort → mypy → pydocstyle → pylint → radon`.

### Markdown

- **markdownlint**: `.markdownlint.yaml` — line length 160, permite HTML inline (MD033 desactivado).

### YAML

- **yamllint**: `.yamllint.yaml` — indentación 4 espacios, comillas simples requeridas para strings con `@`, truthy solo `true`/`false`.

### JSON

- **jsonlint**: Indentación 4 espacios, validado por el target `make lint-json`.

### XML

- **xmllint**: Formateo UTF-8 con 4 espacios de indentación.

### Spelling

- **CSpell**: `.cspell/cspell.yaml` — idiomas `en`, `en-gb`, `es-es`. Diccionarios custom: `project-terms.txt`, `stack-terms.txt`.
- Los diccionarios custom deben estar ordenados alfabéticamente (`sort --ignore-case`) y sin duplicados.
- Se verifica que los términos custom no existan ya en diccionarios built-in.

### Docker Linting

- **Hadolint**: `.docker/.hadolint.yaml` — failure threshold `style`, pragma desactivado, solo registries trusted (`public.ecr.aws`), labels OCI obligatorias.
- **Trivy**: `.docker/.trivy.yaml` — severidad CRITICAL y HIGH, solo paquetes OS, timeout 5m, ignora unfixed.

### AWS CloudFormation / SAM

| Herramienta | Configuración | Propósito |
|---|---|---|
| `cfn-lint` | `.aws/sam/.cfnlintrc.yaml` | Validación de schema/sintaxis |
| `cfn_nag` | `.aws/sam/.cfn_nag_deny_list.yaml` | Warnings de seguridad |
| `cfn-guard` | `.aws/sam/guards/*.guard` | Políticas custom del proyecto |
| `sam validate --lint` | `samconfig.toml` | Validación SAM específica |

### cfn-guard policies definidas

- **code.guard**: Todo código Lambda/SAM/SFN debe referenciar paths locales como string de una línea. Prohibido `InlineCode` y `ZipFile`.
- **networking.guard**: Subnets sin IP pública, VPCs con DNS habilitado, Security Groups con descripción en cada regla, VPC endpoints con DNS privado, DMS no público y encriptado con KMS.

---

## 4. Estructura de Directorios

```text
.
├── .aws/
│   └── sam/
│       ├── template.yaml          # SAM template principal
│       ├── samconfig.toml.dist    # Config SAM distribuible (se copia a samconfig.toml)
│       ├── .cfnlintrc.yaml        # Config cfn-lint
│       ├── .cfn_nag_deny_list.yaml
│       ├── guards/                # Reglas cfn-guard custom
│       │   ├── code.guard
│       │   ├── networking.guard
│       │   └── README.md
│       ├── build/                 # (gitignored) Artefacto zip para deploy
│       └── build-lambda/          # (gitignored) Zips individuales por Lambda
├── .cspell/
│   ├── cspell.yaml
│   ├── project-terms.txt          # Términos específicos del proyecto
│   └── stack-terms.txt            # Términos del stack tecnológico
├── .docker/
│   ├── compose.yaml               # Docker Compose multi-servicio
│   ├── app/Dockerfile             # Imagen multi-stage (base → cli-dev → builder)
│   ├── dynamodb/                  # Schema y datos seed para DynamoDB local
│   ├── secrets/                   # Credenciales locales (gitignored excepto .gitignore)
│   ├── .env / .env.dist           # Variables de entorno Docker
│   ├── .hadolint.yaml
│   ├── .trivy.yaml
│   └── README.md
├── .github/
│   ├── CODEOWNERS                 # @nubity/team-Mastery-leads como owners
│   ├── PULL_REQUEST_TEMPLATE.md   # Template con checklist de PR
│   ├── dependabot.yaml            # Actualizaciones semanales
│   ├── ISSUE_TEMPLATE/            # Templates para issues
│   └── workflows/                 # CI/CD pipelines
├── src/
│   ├── __init__.py                # Con license header
│   ├── app.py                     # Handler principal Lambda
│   └── model_enum/                # Enums del dominio
├── tests/
│   ├── app_test.py                # Tests unitarios Python
│   └── aws/cloudformation/guards/ # Tests de cfn-guard
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .licenseheader
├── .markdownlint.yaml
├── .pep8
├── .pdm-python
├── .pydocstyle
├── .pylintrc
├── LICENSE
├── Makefile
├── README.md
├── mypy.ini
├── pdm.lock
├── pdm.toml
├── pyproject.toml
└── pytest.ini
```

---

## 5. Convenciones de Código Python

- **Python 3.12** obligatorio (`requires-python = ">=3.12"`).
- **Indentación**: 4 espacios (`.editorconfig`).
- **Line length**: 120 caracteres (`.editorconfig`), pep8 ignora E501.
- **Type hints obligatorios** (mypy strict: `disallow_untyped_defs`, `disallow_untyped_calls`).
- **Docstrings obligatorios** en módulos, clases y funciones públicas (pydocstyle activo, ignora `__init__` y test modules).
- **License header** obligatorio en cada archivo `.py` (gestionado por `licenseheaders`).
- **Imports**: ordenados con `isort`.
- **Complejidad**: máximo B según `radon` (Cyclomatic Complexity ≤ 5 por función).

---

## 6. Docker y Entorno Local

### Principios

- Todo comando (excepto `git`) se ejecuta dentro de Docker: `docker compose -f .docker/compose.yaml run cli ...`.
- Imagen base: `python:3.12.11-alpine3.21` (ECR público).
- Multi-stage build: `base → cli-dev → builder`.
- Secrets gestionados via Docker Compose secrets (no variables de entorno para credenciales).
- `.env.dist` como template; `.env` ignorado en git.

### Servicios Docker Compose

| Servicio | Imagen | Propósito |
|---|---|---|
| `cli` | Custom (Dockerfile) | Herramientas CLI: pdm, aws, sam, linters |
| `app` | Custom (cli-dev stage) | SAM local start-lambda |
| `dynamodb` | `aws-dynamodb-local:2.5.2` | DynamoDB local |

---

## 7. Testing

- **Framework**: `pytest` con `pytest-cov` para coverage.
- **Mocking AWS**: `moto[dynamodb]` para simular servicios AWS.
- **Directorio**: `tests/` en raíz, archivos con sufijo `_test.py`.
- **Cache**: almacenado en `.pytest/cache/` (gitignored).
- **Formato de reporte**: xunit2.
- **cfn-guard tests**: archivos `.guard.test.yaml` en `tests/aws/cloudformation/guards/` con escenarios PASS y FAIL.

---

## 8. CI/CD (GitHub Actions)

### Workflows principales

| Workflow | Trigger | Propósito |
|---|---|---|
| `qa.yaml` | PR + cron diario 6AM | QA general + spelling + Python QA |
| `qa-aws.yaml` | PR (paths: .aws/**, .docker/**) + cron | Build Docker + CloudFormation linting |
| `qa-docker.yaml` | PR (paths: .docker/**) + cron | QA imágenes Docker (Hadolint, Trivy) |
| `qa-pr.yaml` | PR (opened/reopened/edited/sync) | Validación de formato del PR |
| `qa-yaml.yaml` | (scheduled) | Validación YAML |
| `qa-json.yaml` | (scheduled) | Validación JSON |
| `qa-xml.yaml` | (scheduled) | Validación XML |
| `qa-md.yaml` | (scheduled) | Validación Markdown |
| `test.yaml` | PR + cron | Tests Python + tests cfn-guard + integración |
| `changelog.yaml` | Manual (workflow_dispatch) | Genera PR de release con changelog |
| `release.yaml` | PR closed | Publica release |
| `release-container-images.yaml` | Tag push | Publica imágenes Docker |
| `release-jira-version.yaml` | Tag push | Marca versión en JIRA |
| `stale.yaml` | Cron diario | Cierra PRs/issues inactivos |
| `clean-cr.yaml` | Cron diario + manual | Limpieza del container registry |
| `pr-merge-note.yaml` | PR closed | Agrega nota al commit mergeado |
| `pr-checks-placeholders.yaml` | PR | Placeholders para checks required |
| `issue-update.yaml` | Cron L-V cada 2h (12-23) | Actualiza issues desde PRs |
| `create-branch-stable.yaml` | Tag push | Crea rama stable |
| `create-merge-from-release.yaml` | Tag push | Crea PR de merge a master |

### Patrón de reutilización

Todos los workflows delegan la lógica real a **reusable workflows** del repositorio `nubity/dev-kit` (o `Fede RL03/dev-kit`) rama `master`. El proyecto solo define triggers y parámetros.

---

## 9. Git

### .gitattributes

- Todos los archivos text con `eol=lf`.
- Whitespace checks activados: `blank-at-eol`, `blank-at-eof`, `space-before-tab`, `tab-in-indent`.
- Archivos de config (linters, tests) marcados como `export-ignore` (no se incluyen en archives).

### .gitignore

- Build artifacts: `.aws/sam/build*`, `__pycache__`, `*.egg-info/`, `.cache/`, `.mypy_cache/`, `.venv/`, `dist/`.
- Configs locales sensibles: `.aws/sam/samconfig.toml`.

### CODEOWNERS

- `*` → `@nubity/team-Mastery-leads` (review obligatorio del equipo).
- `/.github/` y `/.gitlab/` → `@nubity/esa` (protección de pipelines).

---

## 10. Dependabot

- **Ecosistemas monitoreados**: `gradle` (residual del skeleton?) y `github-actions`.
- **Frecuencia**: semanal a las 02:00.
- **Prefijo de commits**: `[SK-16]`.
- **Target**: `master`.
- **Límite de PRs abiertos**: 10.

---

## 11. Seguridad y Vulnerabilidades

- **CVE overrides** en `pyproject.toml`: se fuerzan versiones mínimas para paquetes con vulnerabilidades conocidas (cryptography, urllib3, requests, jinja2, pip, etc.).
- **Trivy**: escaneo de seguridad en imágenes Docker (CRITICAL + HIGH, solo paquetes OS).
- **pip-audit**: auditoría de vulnerabilidades en dependencias Python.
- **cfn_nag + cfn-guard**: enforcement de seguridad en infraestructura (no public subnets, KMS encryption, SG descriptions).

---

## 12. Pull Request

### Template obligatorio

Cada PR debe incluir la tabla:

| Campo | Valor esperado |
|---|---|
| Branch | master (feature) / stable (bugfix) |
| Bug fix? | yes/no |
| New feature? | yes/no |
| BC breaks? | yes/no |
| Deprecations? | yes/no |
| Fixed tickets | `[Mastery-*]` (referencia JIRA) |
| License | proprietary |

### Checks required

- Quality Assurance (placeholder si no aplica por paths).
- Test (placeholder si no aplica).
- QA del PR (formato, título, descripción).

---

## 13. Licencia y Propiedad Intelectual

- **Licencia**: Proprietary (Nubity Inc.).
- **License header** obligatorio en todo archivo `.py` (managed con `licenseheaders` + `.licenseheader`).
- **pip-licenses**: se verifica que todas las dependencias tengan licencias compatibles.

---

## 14. Resumen de Herramientas del Stack

| Categoría | Herramientas |
|---|---|
| Lenguaje | Python 3.12 |
| Package Manager | PDM |
| AWS SDK | boto3, aws-lambda-powertools |
| IaC | AWS SAM + CloudFormation |
| Container | Docker (Alpine), Docker Compose |
| Linting | pylint, mypy, pydocstyle, autopep8, isort, radon, markdownlint, yamllint, jsonlint, xmllint, hadolint, cfn-lint, cfn_nag, cfn-guard, cspell |
| Testing | pytest, moto, cfn-guard test |
| Security | Trivy, pip-audit, cfn_nag, cfn-guard |
| CI/CD | GitHub Actions (reusable workflows desde dev-kit) |
| Project Management | JIRA (proyecto Mastery), Dependabot |
