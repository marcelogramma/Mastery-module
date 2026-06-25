# Python Coding Standards

the organization follows the standards defined in the [PEP 8](<https://peps.python.org/pep-0008/>) style guide.

Since a picture - or some code - is worth a thousand words, here's a short example containing most features described below:

    import re
    from typing import TYPE_CHECKING

    from collector.aws.service_monitoring.service import Service
    from collector.aws.service_monitoring.target_group import TargetGroup

    if TYPE_CHECKING:
        from collector.aws.service_monitoring.client import Client

    class ElbApplication(Service):
        """
        Class representing the "Application Load Balancer" type from AWS Elastic Load Balancing service.

        See https://docs.aws.amazon.com/elasticloadbalancing/latest/APIReference/Welcome.html.

        Attributes:
            TIME_INTERVAL Time interval in minutes that service metrics are requested.
        """

        SERVICE_NAME: str = 'ELBV2'
        SERVICE_NAMESPACE: str = 'AWS/ApplicationELB'
        TIME_INTERVAL: int = 10

        def __init__(self, client: 'Client', regionName: str, resourceName: str) -> None:
            super().__init__(client, self.SERVICE_NAME, regionName, resourceName)
            self._defaultMetricsStat = 'Sum'
            self._serviceNamespace = self.SERVICE_NAMESPACE
            self._resourceName = self.getLoadBalancerResourceName()
            self._dimensions = [
                {
                    'Name': 'LoadBalancer',
                    'Value': self.getLoadBalancerName()
                }
            ]
            self._targetGroups = self.getTargetGroups()

        def getServiceMetrics(self) -> dict:
            return {}

        def describeResource(self) -> list[dict[str, str]]:
            resources = []
            for targetGroup in self._targetGroups:
                resources.append({
                    '{#TARGETGROUPNAME}': targetGroup.getTargetGroupName(),
                    '{#TARGETGROUPARN}': targetGroup.getTargetGroupArnName()
                })

            return resources

        def getLoadBalancerResourceName(self) -> str:
            client = self.getServiceConnection()
            try:
                services = client.describe_load_balancers(Names=[self.getResource().getResourceName()])
            except Exception as e:
                raise ValueError(f'Couldn\'t describe load balancer for resource named "{self.getResource().getResourceName()}".') from e

            loadBalancer = services.get('LoadBalancers')[0]

            return loadBalancer.get('LoadBalancerArn')

        def getLoadBalancerName(self) -> str:
            return re.findall(':loadbalancer/(.*)', self._resourceName)[0]

        def getTargetGroups(self) -> list:
            client = self.getServiceConnection()
            targetGroups = []
            try:
                services = client.describe_target_groups(LoadBalancerArn=self._resourceName)
            except Exception as e:
                raise ValueError(f'Couldn\'t describe target groups for resource named "{self._resourceName}".') from e

            for targetGroup in services.get('TargetGroups'):
                targetGroupArnShortName = re.findall(':(targetgroup/.+)', targetGroup.get('TargetGroupArn'))
                targetGroupName = targetGroup.get('TargetGroupName')
                targetGroups.append(TargetGroup(self._client, self._region, self.getLoadBalancerName(), targetGroupArnShortName[-1], targetGroupName))

            return targetGroups

        def getCloudWatchMetrics(self) -> dict:
            elbApplicationMetrics = super().getCloudWatchMetrics()
            targetGroupsMetrics = {}
            for targetGroup in self._targetGroups:
                targetGroupMetrics = targetGroup.getCloudWatchMetrics()
                metricKeys = targetGroupMetrics.keys()
                newMetricNames = []
                for metric in metricKeys:
                    newMetricNames.append(metric + '[' + targetGroup.getTargetGroupArnName() + ']')

                targetGroupsMetrics.update(dict(zip(newMetricNames, list(targetGroupMetrics.values()))))

            elbApplicationMetrics.update(targetGroupsMetrics)

            return elbApplicationMetrics

## Structure

* Add a single space after each comma delimiter;

* Add a single space around binary operators (`==`, `and`, ...), with the exception of the concatenation (`+`) operator;

* Place unary operators (`!`, `--`, ...) adjacent to the affected variable;

* Use [Yoda conditions](<https://en.wikipedia.org/wiki/Yoda_conditions>) when checking a variable against an expression to avoid an accidental assignment inside the condition statement (this applies to `==` and `!=`);

* Use short list syntax `[]` instead of long list syntax `list()`;

* Add a comma after each list item in a multi-line list, even after the last one;

* Add a blank line before `return` statements, unless the return is alone inside a statement-group (like an `if` statement);

* Use `return None` when a function explicitly returns `None` values;

* Use braces to indicate control structure body regardless of the number of statements it contains;

* Define one class, interface, trait, or enumeration per file (see [One definition per file](<../conventions.html#one-definition-per-file>) for naming and structure rules);

* Declare the class inheritance on the same line as the class name;

* Declare class constants before attributes and class attributes before methods;

* Declare public elements first, then protected ones and finally private ones;

* Declare all the arguments on the same line as the method/function name, no matter how many arguments there are;

* Type annotations are mandatory on all function and method signatures, including return types (see Typing);

* Sentences in exception and error message strings MUST always end with a full stop;

* Do not use `else`, `elif`, `break` after `if` and `case` conditions which return or throw something;

* Do not use spaces around `[` offset accessor and before `]` offset accessor;

* Add a `import` statement for every class that is not part of the global namespace;

* Do not perform operations or assignments that may not be used based on the flow execution order.

## Naming conventions

* Use camelCase for variables, function and method names, arguments (e.g. `acceptableContentTypes`, `hasSession()`);

* Use snake_case for configuration parameters, template variables, and module (file) names (e.g. `framework.csrf_protection`, `http_status_code`, `date_format.py`);

* Use SCREAMING_SNAKE_CASE for constants (e.g. `InputArgument.IS_ARRAY`);

* Use namespaces for all classes and UpperCamelCase for their names (e.g. `ConsoleLogger`);

* Prefix abstract classes with `Abstract`;

* Suffix exceptions with `Error`;

* Use alphanumeric characters and underscores for file names;

* Don't forget to look at the more verbose [`Conventions`](<../conventions.html>) document for more subjective naming considerations.

### Service Naming Conventions

* A service name MUST be the same as the fully qualified class name (FQCN) of its class (e.g. `App.EventSubscriber.UserSubscriber`);

* If there are multiple services for the same class, use the FQCN for the main service and use lowercased and underscored names for the rest of services. Optionally divide them in groups separated with dots (e.g. `something.service_name`,
`app.something.service_name`);

* Use lowercase letters for parameter names (except when referring to environment variables with the `env.VARIABLE_NAME` syntax);

## Typing

Type annotations are **mandatory** on all function and method definitions, including their parameters and return types. Any function or method without complete annotations MUST be considered a standards violation.

Since the project targets Python 3.12, use built-in generic types directly instead of their deprecated equivalents from the `typing` module:

* Use `list[str]` instead of `typing.List[str]`;

* Use `dict[str, Any]` instead of `typing.Dict[str, Any]`;

* Use `tuple[int, str]` instead of `typing.Tuple[int, str]`;

* Use `set[str]` instead of `typing.Set[str]`;

* Use `X | None` instead of `typing.Optional[X]` (Python 3.10+ union syntax);

* Use `X | Y` instead of `typing.Union[X, Y]`.

The `typing` module is still used for constructs that have no built-in equivalent, such as `Any`, `Protocol`, `TYPE_CHECKING`, `TypeVar`, `Generic`, `overload`, and `cast`. Import these from `typing` as needed.

Use `if TYPE_CHECKING:` guards to import types that are only needed for annotations, in order to avoid circular imports:

    from typing import TYPE_CHECKING, Any

    if TYPE_CHECKING:
        from mypackage.client import Client

    def connect(client: 'Client') -> None:
        ...

## String formatting

String formatting rules differ depending on the context:

### Exception and error messages

Exception and error message strings MUST use f-strings:

    # Bad
    raise ValueError('Company "{}" not found.'.format(company_id))
    raise ValueError('Company "%d" not found.' % company_id)

    # Good
    raise ValueError(f'Company "{company_id}" not found.')

### Logging calls

Logging calls (`logger.debug()`, `logger.info()`, `logger.warning()`, `logger.error()`, `logger.critical()`) MUST use `%`-style lazy formatting — the format string and its arguments MUST be passed as separate positional arguments to the logging
method. F-strings and `str.format()` MUST NOT be used in logging calls.

    # Bad — eager string construction, even when the log level is inactive
    logger.debug(f'Processing company "{company_id}".')
    logger.info('Processing company "{}".'.format(company_id))

    # Good — deferred construction; string is only formatted if the level is active
    logger.debug('Processing company "%d".', company_id)
    logger.info('Company "%d" not found in table "%s".', company_id, table_name)

The rationale for this rule is two-fold:

  1. **Performance** : The `logging` module only formats the string if the log level is active. Using an f-string forces Python to construct the string eagerly on every call, regardless of whether the message will be emitted. This is wasteful in
high-frequency code paths.
  2. **Structured logging** : Libraries such as `aws-lambda-powertools` capture the format string and arguments as separate fields in the log record, enabling machine-readable, filterable log output in CloudWatch and similar platforms. An f-string
collapses all context into a flat opaque string, losing the structured data.

## Import ordering

Imports MUST be sorted. The expected grouping order, separated by blank lines, is:

  1. Standard library imports;
  2. Third-party library imports;
  3. Local application imports.

    # Standard library
    import datetime
    import os
    from typing import TYPE_CHECKING, Any

    # Third-party
    import boto3
    from aws_lambda_powertools import Logger

    # Local
    from model_enum.date_format import DateFormat

## Code formatting

Projects MUST include a PEP 8 auto-formatter in their QA pipeline. The `E501` (line-too-long) check MUST be excluded from the formatter because line length is governed separately by the linter (see Line length).

## Line length

The maximum line length for Python source files is **160 characters**. The `.editorconfig` ruler hint is set to 120 characters as a soft visual guide, but the hard limit enforced by the linter is 160. Indentation MUST use 4 spaces.

URLs and long import paths that cannot be wrapped without reducing readability are exempt from the line-length limit.

## Cyclomatic complexity

Cyclomatic complexity MUST be measured and enforced as part of the QA pipeline. The maximum accepted complexity grade is **B** (complexity score ≤ 10 per function or method). Functions graded C or higher MUST be refactored before merging.

For general guidance on keeping cyclomatic complexity low, see the [`Conventions`](<../conventions.html#methods>) document.

## Documentation

* Add docstring blocks for all classes, methods, and functions where they can add some value;

* Structural elements (e.g. classes, functions, attributes) MUST use conventional (multiline) blocks;

* Docstrings MUST use [Sphinx / reStructuredText](<https://www.sphinx-doc.org/en/master/usage/restructuredtext/domains.html#info-field-lists>) style for parameter and return documentation (`:param name: description`, `:return: description`):

```python def getCompany(companyId: int) -> dict[str, Any] | None: """ Get company data from the persistence layer.

      :param companyId: The id of the company to retrieve.
      :return: The company data dictionary, or None if not found.
      """
      ...

```

* The active `pydocstyle` ruleset applies the following conventions:

* **D211** (no blank line before class docstring) is active — do NOT add a blank line between the class declaration and its opening docstring;

* **D213** (multi-line docstring summary on the second line) is active — the summary line MUST appear on the second line, not the first, in multi-line docstrings;

* Methods decorated with `@override` are exempt from the docstring requirement.

## License

* the organization is released under the proprietary license.
