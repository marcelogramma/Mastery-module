# Release process

## Software release life cycle

In order to keep the organization in our deliverable assets clean, simple and scalable, we adopt Semantic Versioning with a subset of the [SemVer 2.0 standard](<https://semver.org/>) for our [Software release life
cycle](<https://en.wikipedia.org/wiki/Software_release_life_cycle>).

SemVer is a simple set of rules and requirements that dictate how version numbers are assigned and incremented. These rules are based on but not necessarily limited to pre-existing widespread common practices in use in both closed and open-source
software. For this system to work, a public contract for an API or an Acceptance Criteria MUST be declared. This MAY consist of documentation or be enforced by the code itself. Regardless, it is important that this contract be clear and precise.
Once the contract is declared, its changes MUST be communicated with specific increments to the version number. Consider a version format of `X.Y.Z` (`Major.Minor.Patch`). Bug fixes not affecting the contract increment the patch version, backward
compatible contract additions/changes increment the minor version, and backward incompatible contract changes increment the major version. Under this scheme, version numbers and the way they change convey meaning about the underlying code and what
has been modified from one version to the next.

From the available semantic versions, we only allow the following formats:

* `X.Y.Z-rc.x` for pre-releases;

* `X.Y.Z` for stable (final) releases.

We do not publish other pre-release versions than [Release Candidate](<https://en.wikipedia.org/wiki/Software_release_life_cycle#Release_candidate>), therefore `rc.x` is the only allowed unstable identifier.

Here we have a [Backus-Naur Form Grammar](<https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form>) for the allowed SemVer versions:

    <valid_semver> ::= <version_core_allowing_unstable>
                     | <version_core>
                     | <version_core_allowing_pre_release> "-" <pre_release> "." <numeric_identifier>
    <version_core> ::= <major> "." <minor> "." <patch>
    <version_core_allowing_unstable> ::= <major_allowing_unstable> "." <minor_allowing_unstable> "." "0"
    <version_core_allowing_pre_release> ::= <major> "." <numeric_positive_identifier> "." <patch>
                                          | <major> "." <minor> "." <numeric_positive_identifier>
    <major_allowing_unstable> ::= <numeric_identifier>
    <minor_allowing_unstable> ::= <numeric_positive_identifier>
    <major> ::= <numeric_positive_identifier>
    <minor> ::= <numeric_identifier>
    <patch> ::= <numeric_identifier>
    <numeric_identifier> ::= "0"
                           | <numeric_positive_identifier>
    <numeric_positive_identifier> ::= <positive_digit>
                                    | <positive_digit> <digits>
    <positive_digit> ::= "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
    <digits> ::= <digit>
               | <digit> <digits>
    <digit> ::= "0"
              | <positive_digit>
    <pre_release> ::= "rc"

You can test the grammar of your semantic versions
[here](<https://bnfplayground.pauliankline.com/?bnf=%3Cvalid_semver%3E%20%3A%3A%3D%20%3Cversion_core_allowing_unstable%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cversion_core%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cversion_core_allowing_pre_release%3E%20%22-%22%20%3Cpre_release%3E%20%22.%22%20%3Cnumeric_identifier%3E%0A%3Cversion_core%3E%20%3A%3A%3D%20%3Cmajor%3E%20%22.%22%20%3Cminor%3E%20%22.%22%20%3Cpatch%3E%0A%3Cversion_core_allowing_unstable%3E%20%3A%3A%3D%20%3Cmajor_allowing_unstable%3E%20%22.%22%20%3Cminor_allowing_unstable%3E%20%22.%22%20%220%22%0A%3Cversion_core_allowing_pre_release%3E%20%3A%3A%3D%20%3Cmajor%3E%20%22.%22%20%3Cnumeric_positive_identifier%3E%20%22.%22%20%3Cpatch%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cmajor%3E%20%22.%22%20%3Cminor%3E%20%22.%22%20%3Cnumeric_positive_identifier%3E%0A%3Cmajor_allowing_unstable%3E%20%3A%3A%3D%20%3Cnumeric_identifier%3E%0A%3Cminor_allowing_unstable%3E%20%3A%3A%3D%20%3Cnumeric_positive_identifier%3E%0A%3Cmajor%3E%20%3A%3A%3D%20%3Cnumeric_positive_identifier%3E%0A%3Cminor%3E%20%3A%3A%3D%20%3Cnumeric_identifier%3E%0A%3Cpatch%3E%20%3A%3A%3D%20%3Cnumeric_identifier%3E%0A%3Cnumeric_identifier%3E%20%3A%3A%3D%20%220%22%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cnumeric_positive_identifier%3E%0A%3Cnumeric_positive_identifier%3E%20%3A%3A%3D%20%3Cpositive_digit%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cpositive_digit%3E%20%3Cdigits%3E%0A%3Cpositive_digit%3E%20%3A%3A%3D%20%221%22%20%7C%20%222%22%20%7C%20%223%22%20%7C%20%224%22%20%7C%20%225%22%20%7C%20%226%22%20%7C%20%227%22%20%7C%20%228%22%20%7C%20%229%22%0A%3Cdigits%3E%20%3A%3A%3D%20%3Cdigit%3E%0A%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cdigit%3E%20%3Cdigits%3E%0A%3Cdigit%3E%20%3A%3A%3D%20%220%22%0A%20%20%20%20%20%20%20%20%20%20%7C%20%3Cpositive_digit%3E%0A%3Cpre_release%3E%20%3A%3A%3D%20%22rc%22&name=SemVer>).

Before a release becomes stable, we walk through pre-release validations, which are stages that serve as control for the approval during the [Quality Assurance](<https://en.wikipedia.org/wiki/Quality_assurance>) and [User Acceptance
Testing](<https://en.wikipedia.org/wiki/Acceptance_testing#User_acceptance_testing>) processes.

Our release plan MUST always target stable releases.

The pre-releases are created in order to confirm the acceptance tests are successfully fulfilled, and to provide the corresponding changes when required. Their purpose is the validation and approval of the work which will be used to create a stable
release.

Pre-releases MUST only be published when the planned work for the stable version is considered **complete** , they MUST NOT be used to deliver partial or incomplete work.

We MUST NOT create a release (stable or not) if the planned work for that version has not yet finished.

The history between releases MUST be linear. The most recent versions MUST always include the history from the previous releases.

Let's suppose we are trying to release the version `1.2.0`, this is an example scenario:

  1. We finished all the work planned for this release and then, we publish the version `1.2.0-rc.1`;
  2. After checking the resulting behavior, we receive feedback that require more changes;
  3. We work on these changes and then we release the version `1.2.0-rc.2`;
  4. In a new UAT session, the results are approved, then we release the version `1.2.0` in the same point of history (the same point than `1.2.0-rc.2`).

We only maintain the latest stable release. In other words, if we have the releases `1.2.0`, `1.2.1`, `1.3.0`, `1.3.1` and `1.3.2`; the only release that receive patches is `1.3.2`.

If you have doubts, please read carefully the documentation about our [branching model](<branching-model.html>).

### Working before the first stable release

In every project, the first stable version is `1.0.0`, that's why the pre-releases are allowed only for releases created after this version.

Before the release of version `1.0.0`, all the work released during the initial development phase MUST be published using `0` for the MAJOR version. The MINOR versions can introduce breaking changes as the result is considered as a work in progress.
For more context about this, see [How do I know when to release 1.0.0?](<https://semver.org/#how-do-i-know-when-to-release-100>).

## Source Control Management

Since we are using [Git SCM](<https://git-scm.com/>) as our Source Control Management tool, the releases created for all of our projects are backed on top of [Git annotated tags](<https://git-scm.com/book/en/v2/Git-Basics-Tagging#_annotated_tags>).

    git tag --sign '1.0.0' --message '1.0.0'

### Release sources

Only `master` and the maintenance branches MUST be used to build a release. Feature branches are not allowed for this purpose, as they MUST be merged to `master` before its contents can be included in a release.

The branch `master` always represents the next feature release, whether it is a new MAJOR or MINOR release.

You can get more information about our [release sources](<branching-model.html#branches>).

#### Maintenance branches

Every time we release a MINOR or MAJOR stable version, a new maintenance branch tracking the released version MUST be created. By instance, when the version `1.2.0` is released, the branch `1.2` MUST be created. This way, we can use this branch for
future support whenever we need to fix bugs or security issues.

### Inheriting patches

When a new PATCH stable version is released, the introduced fixes MUST be merged into the `master` branch.

### Change log

Every release, stable or not, MUST add new entries to `CHANGELOG.md`. These entries MUST be sort by date in descending order.

An example:

    # Change Log
    All notable changes to this project are documented in this file.
    This project adheres to [Semantic Versioning](https://semver.org/).

    ## [1.2.0](https://github.com/the organization/REPOSITORY/compare/v1.1.5...v1.2.0) - 2024-04-25

  * [#89](https://github.com/the organization/REPOSITORY/pull/89)
      [EX-12] Fix 2
      ([@phansys](https://github.com/phansys))
  * [#86](https://github.com/the organization/REPOSITORY/pull/86)
      [EX-7] Fix 1
      ([@phansys](https://github.com/phansys))
  * [#82](https://github.com/the organization/REPOSITORY/pull/82)
      [EX-5] Fix 2
      ([@phansys](https://github.com/phansys))

    ## [1.1.5](https://github.com/the organization/REPOSITORY/compare/v1.1.4...v1.1.5) - 2024-03-22

      ...

### Delivery sequence

Here is a visual representation of our delivery flow, showing the sequence order between all the steps, starting from the development to the deployment of a stable release.

\--- title: Software Development Life Cycle config: mirrorActors: false \--- sequenceDiagram %% Iteration 1 actor Delivery team box Development participant Delivery team participant Build & Unit tests participant Version Control end loop Pull
Request activate Delivery team Delivery team ->> Build & Unit tests: Push deactivate Delivery team activate Build & Unit tests rect rgb(285,84,47) Note right of Build & Unit tests: ⛔ Fail end Build & Unit tests -->> Delivery team: Feedback
deactivate Build & Unit tests %% Iteration 2 activate Delivery team Delivery team ->> Build & Unit tests: Push deactivate Delivery team activate Build & Unit tests rect rgb(114, 255, 47) Note right of Build & Unit tests: ✅ Pass end Note over
Delivery team, Build & Unit tests: Team Review Build & Unit tests ->> Version Control: Merge activate Version Control Build & Unit tests --x Delivery team: Feedback deactivate Build & Unit tests Version Control --x Delivery team: Feedback end %%
Pre-Release Version Control ->> Pre-release: Create artifacts deactivate Version Control activate Pre-release Pre-release --x Delivery team: Feedback actor User Acceptance Tests %% User Acceptance Tests loop Acceptance Criteria Note over
Pre-release, User Acceptance Tests: Unstable Stage Pre-release ->> User Acceptance Tests: Deploy artifacts deactivate Pre-release activate User Acceptance Tests rect rgb(285,84,47) Note right of User Acceptance Tests: ⛔ Fail end User Acceptance
Tests -->> Delivery team: Feedback deactivate User Acceptance Tests activate Delivery team %% Iteration 3 loop Pull Request Delivery team ->> Build & Unit tests: Push deactivate Delivery team activate Build & Unit tests rect rgb(114, 255, 47) Note
right of Build & Unit tests: ✅ Pass end Note over Delivery team, Build & Unit tests: Team Review Build & Unit tests ->> Version Control: Merge activate Version Control Build & Unit tests --x Delivery team: Feedback deactivate Build & Unit tests
Version Control --x Delivery team: Feedback end %% Pre-Release box Unstable Stage participant Pre-release participant User Acceptance Tests end Version Control ->> Pre-release: Create artifacts deactivate Version Control activate Pre-release
Pre-release --x Delivery team: Feedback %% User Acceptance Tests Note over Pre-release, User Acceptance Tests: Unstable Stage Pre-release ->> User Acceptance Tests: Deploy artifacts deactivate Pre-release activate User Acceptance Tests rect rgb(114,
255, 47) Note right of User Acceptance Tests: ✅ Pass end User Acceptance Tests --x Delivery team: Feedback end %% Release box Stable Stage participant Release participant Production end User Acceptance Tests -->> Version Control: Approve deactivate
User Acceptance Tests activate Version Control Version Control ->> Release: Create artifacts deactivate Version Control activate Release Release --x Delivery team: Feedback %% Production Note over Release, Production: Stable Stage Release ->>
Production: Deploy artifacts deactivate Release activate Production Production --x Delivery team: Feedback rect rgb(114, 255, 47) Note right of Release: ✅ Pass end deactivate Production

#### Blocking issues

Unlike the case of typical bugs, when a patch is applied to fix a problem caused by dependency resolution issues or by detected CVEs, a stable release MUST be created immediately when the patch is merged. The pre-release versions and the User
Acceptance Tests SHOULD be omitted in this case. This allows other branches inheriting the fixes from the last maintained version to get the patches quickly. Otherwise, the development workflow would be blocked by the presence of these issues until
the UAT process is finished.

\--- title: Software Development Life Cycle config: mirrorActors: false \--- sequenceDiagram %% Iteration 1 actor Delivery team box Development participant Delivery team participant Build & Unit tests participant Version Control end loop Pull
Request activate Delivery team Delivery team ->> Build & Unit tests: Push deactivate Delivery team activate Build & Unit tests rect rgb(285,84,47) Note right of Build & Unit tests: ⛔ Fail end Build & Unit tests -->> Delivery team: Feedback
deactivate Build & Unit tests %% Iteration 2 activate Delivery team Delivery team ->> Build & Unit tests: Push deactivate Delivery team activate Build & Unit tests rect rgb(114, 255, 47) Note right of Build & Unit tests: ✅ Pass end Note over
Delivery team, Build & Unit tests: Team Review Build & Unit tests ->> Version Control: Merge activate Version Control Build & Unit tests --x Delivery team: Feedback deactivate Build & Unit tests Version Control --x Delivery team: Feedback end %%
Release box Stable Stage participant Release participant Production end activate Version Control Version Control ->> Release: Create artifacts deactivate Version Control activate Release Note over Release, Production: Stable Stage Release ->>
Production: Deploy artifacts deactivate Release activate Production Production --x Delivery team: Feedback rect rgb(114, 255, 47) Note right of Release: ✅ Pass end deactivate Production

Here is a graphical example from the Source Control Management perspective of the described cases, where the version `1.0.1` is created to fix a CVE and the `1.0.2` version fixes a dependency resolution issue:

\--- config: gitGraph: parallelCommits: true showCommitLabel: true mainBranchName: "master" \--- gitGraph commit tag: "1.0.0" branch 1.0 checkout master commit checkout 1.0 commit id: "CVE fix" tag: "1.0.1" checkout master merge 1.0 commit commit
checkout 1.0 commit id: "Dependency fix" tag: "1.0.2" checkout master merge 1.0 commit commit tag: "1.1.0-rc.1" commit tag: "1.1.0"

Please, note that a deployment for the releases fixing these kind of issues is OPTIONAL. While the primary goal of a release is typically to be deployed to an environment, technically speaking this is not required.

#### Release automation from JIRA

See [Release a new version in a GitHub repository](<automation-jira-github.html#release-a-new-version-in-a-github-repository>).

## Environments

The definition and rules for deployment environments (UAT, Production and additional environments) are documented in the dedicated [Deployment environments](<infrastructure/environments.html>) document.
