# Deployment environments

## Environment separation

Each environment MUST be isolated from all others. The strongest and RECOMMENDED boundary is a dedicated [AWS account](<https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started_concepts.html>) per environment, managed under
[AWS Organizations](<https://aws.amazon.com/organizations/>). An AWS account is the natural trust boundary for IAM policies, resource policies, service quotas, VPC networking, billing and AWS Service Control Policies (SCPs). No other isolation
mechanism provides equivalent guarantees at every layer simultaneously.

The reasons for this separation, ordered from most to least critical, are:

### Security

A compromised or misconfigured lower environment MUST NOT be able to reach production credentials, data or compute. AWS account-level separation is the strongest available boundary: IAM roles, resource-based policies, VPC peering controls and SCPs
all operate at the account boundary. A secret leaked or an IAM role over-permissioned in Development cannot reach Production resources if the two environments live in separate accounts. No network route, no cross-account role assumption and no
shared credential MUST exist between Production and any lower environment unless it is explicitly required, documented and approved.

### Data integrity and compliance

Production holds real user data, financial records and potentially regulated information (PII, PCI DSS, HIPAA, GDPR, etc.). A destructive operation, a failed migration, a test fixture load or a runaway process in a lower environment MUST NOT be able
to corrupt, expose or delete that data. Environment separation ensures that production datasets are never accessible from non-production execution contexts.

### Resilience

A bad deployment, a runaway process, an exhausted service quota, or a cascading failure in Development or UAT MUST NOT affect production availability. Separate AWS accounts provide separate service quotas, separate rate limits, and fully independent
fault domains. A total failure in a lower environment is a learning opportunity; the same failure in Production is a customer-facing incident. This is the [blast-radius
containment](<https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_fault_isolation_use_bulkhead_pattern.html>) principle from the [AWS Well-Architected Framework — Reliability
Pillar](<https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html>).

### Change governance

Production MUST be subject to formal change control: only approved stable releases may be deployed there, by authorized identities, through documented procedures. Without environment separation, this discipline is impossible to enforce technically.
Separate accounts allow SCPs and IAM policies to restrict deployments to approved pipelines and identities only, making unauthorized production changes technically impossible rather than merely prohibited by policy.

### Auditability

AWS CloudTrail logs, AWS Config rules and compliance reports for Production MUST record only real operational activity. If Development and Production share an account, audit trails mix developer experimentation — intentional policy violations, test
resource creation and deletion, temporary credential use — with the production record, making forensic analysis and compliance evidence collection unreliable. Separation ensures that the Production audit trail is clean, complete and exclusively
reflects real business operations.

### Observability

Production metrics, logs, alarms and dashboards MUST reflect only real user traffic and operational state. Mixing lower-environment noise — test loads, frequent deployments, intentional error injection — into production observability degrades alert
fidelity, increases the mean time to detect (MTTD) real incidents, and makes capacity planning and SLA reporting unreliable.

### Performance isolation

Load tests, stress tests and poorly optimized queries run in lower environments MUST NOT contend with production compute, database I/O or network throughput. In a shared environment, a test workload can starve real user requests of resources.
Account separation guarantees completely independent capacity, quota pools and network bandwidth.

### Cost accountability

Separate AWS accounts produce separate billing reports, making it straightforward to attribute infrastructure costs to their environment without complex custom tagging strategies. This supports budget governance, makes it easy to identify runaway
spending in any single environment, and provides a clear cost baseline per stage of the delivery pipeline.

## Development environment

The Development environment is the organization's primary and exclusive workspace for the duration of the project. the organization MUST have complete, unrestricted control over this environment. This means:

* Changes are made at any time, as required by the development process, without prior notice, approval cycle or change-freeze window;

* No stability or uptime warranty applies — the customer MUST NOT rely on the state of this environment for any business purpose;

* The customer MUST NOT impose restrictions, change-approval processes or any governance constraint on Development activities.

The customer's AWS `dev` environment MUST already be provisioned and accessible before the organization begins any development or testing activity.

The [least-privilege principle](<https://en.wikipedia.org/wiki/Principle_of_least_privilege>) is applied progressively: as infrastructure components and application services are tested and consolidated in the Development environment, their IAM
permissions MUST be tightened to the minimum required before the solution is promoted to higher environments. This ensures that the privilege reduction is validated in a safe context before it is enforced in environments with business impact.

If the project requires cost reduction or a simplified delivery process, the Development environment MAY be used as the UAT acceptance environment. This reuse MUST be explicitly agreed upon and documented in the project scope before acceptance
testing begins. When this agreement is in place, the change-control rules applicable to the UAT environment (see User Acceptance Testing) apply from the moment the acceptance cycle starts.

## Required environments

The release process requires two environments: one for [User Acceptance Testing](<https://en.wikipedia.org/wiki/Acceptance_testing#User_acceptance_testing>) (UAT) and one for
[Production](<https://en.wikipedia.org/wiki/Deployment_environment#Production>).

What gets deployed to each environment is determined by its release type (unstable pre-release or stable release) and version. See the [release process](<../release.html>) for the full versioning rules and release lifecycle.

All releases MUST always be deployed, tested and accepted in the UAT environment before they can be deployed to the Production environment.

Regardless of the underlying infrastructure (such as server names, domain names, etc.), these names MUST be used when referring to these environments.

### User Acceptance Testing

User Acceptance Testing (UAT) consists of a process of verifying that a solution works for the user. It is not system testing (ensuring software does not crash and meets documented requirements) but rather ensures that the solution will work for the
user (i.e. tests that the user accepts the solution); software vendors often refer to this as "Beta testing".

This testing SHOULD be undertaken by the intended end user, or a subject-matter expert (SME), preferably the owner or client of the solution under test, and provide a summary of the findings for confirmation to proceed after trial or review. In
software development, UAT as one of the final stages of a project often occurs before a client or customer accepts the new system. Users of the system perform tests in line with what would occur in real-life scenarios.

The materials given to the tester MUST be similar to the materials that the end user will have. Testers SHOULD be given real-life scenarios such as the three most common or difficult tasks that the users they represent will undertake.

The UAT acts as a final verification of the required business functionality and proper functioning of the system, emulating real-world conditions on behalf of the paying client or a specific large customer. If the software works as required and
without issues during normal use, one can reasonably extrapolate the same level of stability in Production.

User tests, usually performed by clients or by end-users, do not normally focus on identifying simple cosmetic problems such as spelling errors, nor on showstopper defects, such as software crashes; testers and developers identify and fix these
issues during earlier unit testing, integration testing and system testing phases.

The objective of UAT is to present the current release to a testing team representing the final user base, to determine if the project requirements and specification are met. When users can test the software earlier, they can spot conceptual
weaknesses that have been introduced during the analysis phase.

By testing the software more frequently, users can identify functional implementation errors and user interface or application flow misconceptions earlier, lowering the cost and impact of correcting them. Flaws detected by UAT may be very difficult
to detect by other means. The more often you conduct acceptance tests, the better for the project, because end users provide valuable feedback to the development team as requirements evolve.

Only [pre-release versions](<https://en.wikipedia.org/wiki/Software_release_life_cycle#Release_candidate>) (e.g. `1.2.0-rc.1`, `1.2.0-rc.2`) are deployed to this environment during the acceptance cycle. See the [release
process](<../release.html#software-release-life-cycle>) for the versioning rules that govern which versions reach UAT.

When a pre-release version is under revision in this environment, the objective MUST be focused on exhausting all the required iterations to get the approval required to promote the tested version to a stable release. Requests asking to deploy
off-topic artifacts (artifacts that are not part of the target release under revision) in this environment when there is a pending approval MUST be strongly avoided. The approval process MUST conclude before the environment can be used to test a
different target release.

### Production

The Production environment is the most sensitive one. Deploying to this environment is also the most sensitive step. This is the final environment that end users interact with.

All deployments to the Production environment MUST ship the contents of a [stable release](<../release.html#software-release-life-cycle>). The only exception is the case where a [hotfix](<https://en.wikipedia.org/wiki/Hotfix>) is required to provide
an urgent patch for a critical error. In this case, the hotfix MUST be applied quickly in order to mitigate the impact of the bug. Once the hotfix is deployed, the maintenance effort MUST bring the higher priority to provide the proper bugfix in
replacement of the hotfix, releasing the next PATCH version as soon as possible.

## Additional environments

The project MAY have more intermediate environments depending on their needs. Common environment names covering different responsibilities include: "Local", "Quality Assurance" and "Staging".

## Deployment responsibilities

the organization's deployment commitment covers a single low environment (Development, Quality Assurance or UAT) used to demonstrate the solution and support customer acceptance testing. Deployment to any other environment is exclusively the
customer's responsibility.

This applies especially to environments with direct business impact (Production and any other environment that serves live users or handles real data). the organization MUST NOT perform deployments in those environments as part of the default
project scope. If the customer requires the organization's involvement in these deployments, a separate consultancy service engagement MUST be agreed upon and documented before proceeding.

the organization's commitment includes delivering a complete, self-contained solution package that enables any qualified team to deploy the project independently. The package MUST be sufficient on its own — no additional documentation, credentials,
or the organization involvement MUST be required beyond what is included in the deliverable.

the organization MAY provide onboarding support to assist the customer's team in understanding and operating the delivered solution. This support is limited to knowledge transfer and MUST NOT be treated as a consultancy service unless the project
scope explicitly defines it as such.

### Deliverable package

All artifacts produced for a customer deployment MUST be delivered as a self-contained ZIP package. The package MUST include:

* All application and software component assets required to deploy and run the solution;

* All [Infrastructure as Code](<iac.html>) assets required to provision the solution;

* All functional and technical documentation, including a pre-requisites document when applicable (see Pre-existing infrastructure);

* A PDF export of the documentation for stakeholders who do not use Markdown.

The package MUST be fully self-contained: it MUST NOT require access to any the organization-internal platform, service or repository, nor to any customer-internal platform, service or repository. All deployment procedures MUST be executable using
only the assets in the package and publicly available tools.

The transfer of the package to the customer MUST be coordinated explicitly and agreed upon before delivery. The default delivery channel is the Product Owner via email. Any alternative transfer mechanism MUST be agreed upon with the customer and
documented.

### Pre-existing infrastructure

When the target deployment environment already has resources that the solution must integrate with (e.g. existing VPCs, IAM roles, databases, S3 buckets, third-party service endpoints), all those resources MUST be fully documented as pre-requisites
before any deployment activity begins.

The pre-requisites document MUST include:

* A clear description of each pre-existing resource and its purpose;

* The resource identifiers required to reference it from the IaC templates (ARNs, endpoint URLs, parameter names, etc.);

* How each identifier is consumed in the IaC templates (e.g. as a CloudFormation parameter, a Systems Manager Parameter Store reference, or an environment variable).

The customer MUST confirm and sign off on all pre-requisite items before any deployment activity begins.

No infrastructure component MAY be considered part of the solution unless it appears in one of the following:

* The pre-requisites document, as a pre-existing resource owned and managed by the customer;

* An IaC template, as a new resource provisioned by the solution.

There are no implicit infrastructure dependencies. Any resource that is relied upon but not documented in either of these two places is considered out of scope and MUST be explicitly added before proceeding.

## Infrastructure

An environment can be composed of multiple infrastructure resources, such as compute servers, database services, content delivery networks, etc. All infrastructure resources MUST be provisioned using [Infrastructure as Code](<iac.html>) — never
manually via consoles or interactive CLI commands.
