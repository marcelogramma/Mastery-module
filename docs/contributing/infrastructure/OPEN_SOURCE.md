# Open-source preference

the organization's infrastructure and tooling choices MUST favor open-source software over proprietary alternatives. This policy exists to ensure auditability, portability, cost control, community-driven security and freedom from vendor lock-in.

## Preference mandate

When two or more solutions address the same technical need, the open-source solution MUST be chosen unless one of the following conditions is met and explicitly documented:

* The proprietary solution provides a significant operational or security advantage that the open-source alternative cannot reasonably match;

* The proprietary solution is an AWS managed service that reduces operational overhead in a way that justifies its selection (see Approved exceptions);

* A written ESA approval has been obtained.

Any exception MUST be documented in the project's technical documentation.

## Operating systems

* GNU/Linux MUST be used for all server environments, container base images and CI/CD runners;

* macOS and Windows are acceptable for local developer workstations only;

* Container images MUST be based on a GNU/Linux distribution. Alpine Linux is RECOMMENDED for production images due to its minimal footprint and reduced attack surface.

## Containerization

* The open-source [Docker CLI](<https://docs.docker.com/engine/reference/commandline/cli/>) and [Docker Engine](<https://docs.docker.com/engine/>) MUST be used as the container runtime;

* [Docker Desktop](<https://www.docker.com/products/docker-desktop/>) is a proprietary application and SHOULD NOT be used. If a developer workstation requires a graphical interface for container management, an open-source alternative (e.g. [Podman
Desktop](<https://podman-desktop.io/>)) SHOULD be evaluated;

* If Docker Desktop is used on a local workstation despite this recommendation, it MUST be configured to use the open-source Docker Engine and its use MUST be strictly limited to the local development environment.

## Databases

* Open-source relational database engines (e.g. [PostgreSQL](<https://www.postgresql.org/>), [MySQL](<https://www.mysql.com/>) or [MariaDB](<https://mariadb.org/>)) MUST be preferred over proprietary engines (e.g. Microsoft SQL Server, Oracle Database);

* Open-source document stores (e.g. [MongoDB](<https://www.mongodb.com/>) Community Edition) MUST be preferred over proprietary alternatives;

* AWS managed database services (e.g. Amazon RDS for PostgreSQL, Amazon Aurora, Amazon DynamoDB) MAY be used under the Approved exceptions policy.

## Message brokers and queues

* Open-source message brokers (e.g. [RabbitMQ](<https://www.rabbitmq.com/>), [Apache Kafka](<https://kafka.apache.org/>)) MUST be preferred over proprietary alternatives;

* AWS managed messaging services (e.g. Amazon SQS, Amazon SNS, Amazon EventBridge) MAY be used under the Approved exceptions policy.

## Monitoring and observability

* Open-source observability tools (e.g. [Prometheus](<https://prometheus.io/>), [Grafana](<https://grafana.com/oss/grafana/>), [OpenTelemetry](<https://opentelemetry.io/>)) MUST be preferred over proprietary alternatives;

* AWS native observability services (e.g. Amazon CloudWatch, AWS X-Ray) MAY be used under the Approved exceptions policy.

## Approved exceptions

AWS managed services MAY be selected without requiring an individual ESA approval when the following conditions are met:

* The service is the infrastructure layer that underlies the application (e.g. Amazon RDS as the database engine behind a PostgreSQL-compatible interface);

* The service reduces operational burden (patching, backups, high availability) in a way that is not economically viable to replicate with a self-managed open-source alternative;

* The service does not introduce irreversible application-level coupling (i.e. the application code interacts with the service through a standard interface or abstraction layer).

All other proprietary software selections MUST be approved by the ESA team before adoption.
