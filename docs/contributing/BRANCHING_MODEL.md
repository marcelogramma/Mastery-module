# Branching model

Our branching model is designed to follow [Semantic Versioning](https://semver.org/).

You MUST know the definitions stated in this standard to understand our branching model and our development flow.

## Branches

We use the branch `master` to track all the new features and improvements. In other words, everything that is planned and is not fixing something already delivered in a stable version.

We use the maintenance branches, like `1.0`, `1.1`, or `1.2` to track the support and patches for previously published stable versions. This is the [Backus-Naur Form Grammar](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form) for the versioning
branches:

    <release_branches> ::= <branch_for_new_features>
                         | <major> "." <minor>
    <branch_for_new_features> ::= "master"
    <major> ::= <numeric_positive_identifier>
    <minor> ::= <numeric_identifier>
    <numeric_identifier> ::= "0"
                           | <numeric_positive_identifier>
    <numeric_positive_identifier> ::= <positive_digit>
                                    | <positive_digit> <digits>
    <positive_digit> ::= "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
    <digits> ::= <digit>
               | <digit> <digits>
    <digit> ::= "0"
              | <positive_digit>

You can test the grammar of your versioning branches
[here](https://bnfplayground.pauliankline.com/?bnf=%3Crelease_branches%3E%20%3A%3A%3D%20%3Cbranch_for_new_features%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cmajor%3E%20%22.%22%20%3Cminor%3E%0A%3Cbranch_for_new_features%3E%20%3A%3A%3D%20%22master%22%0A%3Cmajor%3E%20%3A%3A%3D%20%3Cnumeric_positive_identifier%3E%0A%3Cminor%3E%20%3A%3A%3D%20%3Cnumeric_identifier%3E%0A%3Cnumeric_identifier%3E%20%3A%3A%3D%20%220%22%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cnumeric_positive_identifier%3E%0A%3Cnumeric_positive_identifier%3E%20%3A%3A%3D%20%3Cpositive_digit%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cpositive_digit%3E%20%3Cdigits%3E%0A%3Cpositive_digit%3E%20%3A%3A%3D%20%221%22%20%7C%20%222%22%20%7C%20%223%22%20%7C%20%224%22%20%7C%20%225%22%20%7C%20%226%22%20%7C%20%227%22%20%7C%20%228%22%20%7C%20%229%22%0A%3Cdigits%3E%20%3A%3A%3D%20%3Cdigit%3E%0A%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cdigit%3E%20%3Cdigits%3E%0A%3Cdigit%3E%20%3A%3A%3D%20%220%22%0A%20%20%20%20%20%20%20%20%20%20%7C%20%3Cpositive_digit%3E&name=Release%20Branches).

Every commit in these versioning branches MUST be in a release-ready state. Do not submit partial, dummy or incomplete patches against a versioning branch.

If you need to work with atomic tasks that will be partially build in multiple steps or commits, use feature branches.

## Phases

In our projects, we have two main development phases, and our branching model is aware of them.

### Unstable

This is the initial phase of any project, where we develop all the required features to build the first release. In this phase MAJOR version zero (0.y.z) and anything MAY change at any time. The public API SHOULD NOT be considered stable.

#### Example

In this example, the following **unstable** versions are released:

  1. `0.1.0`
  2. `0.2.0`
  3. `0.3.0`
  4. `0.4.0`
  5. `0.5.0`
  6. `0.6.0`
  7. `0.7.0`

Then, the unstable version `0.7.0` is used as base for the first stable release (`1.0.0`).

\--- config: gitGraph: parallelCommits: true showCommitLabel: false mainBranchName: "master" \--- gitGraph commit commit commit commit commit tag: "0.1.0" commit commit commit commit tag: "0.2.0" commit commit tag: "0.3.0" commit commit commit tag:
"0.4.0" commit commit tag: "0.5.0" commit commit commit commit tag: "0.6.0" commit commit tag: "0.7.0" commit tag: "1.0.0"

### Stable

This phase starts with the release of version 1.0.0. It defines the public API and the maintenance contract about the published features. The way in which the version number is incremented after this release is dependent on this public API and how
it changes. The public API SHOULD be considered stable.

#### Example starting at version 1.0.0

In this example, the following **stable** versions are released:

  1. `1.0.0`
  2. `1.0.1`
  3. `1.1.0`
  4. `1.1.1`
  5. `1.1.2`
  6. `1.2.0`

Between the `1.1.0` and `1.2.0` MINOR versions, the `1.1.1` and `1.1.2` PATCH versions were released.

\--- config: gitGraph: parallelCommits: true showCommitLabel: false mainBranchName: "master" \--- gitGraph commit tag: "1.0.0" branch 1.0 checkout master commit commit checkout 1.0 commit commit checkout master commit checkout 1.0 commit commit tag:
"1.0.1-rc.1" commit tag: "1.0.1" checkout master commit commit merge 1.0 commit commit commit tag: "1.1.0-rc.1" commit tag: "1.1.0" branch 1.1 commit commit checkout master commit commit commit checkout 1.1 commit tag: "1.1.1-rc.1" commit commit
tag: "1.1.1-rc.2" checkout master commit checkout 1.1 commit tag: "1.1.1" checkout master commit merge 1.1 checkout 1.1 commit commit tag: "1.1.2-rc.1" commit tag: "1.1.2" checkout master commit commit tag: "1.2.0-rc.1" merge 1.1 commit tag:
"1.2.0-rc.2" commit tag: "1.2.0"

#### Example delivering features before identified issues

In this example, the following **stable** versions are released:

  1. `1.2.0`
  2. `1.3.0`
  3. `1.3.1`
  4. `1.4.0`

Between the `1.3.0` and `1.4.0` MINOR versions, the `1.3.1` PATCH version was released, including the patches for the issues that were identified in version `1.2.0`. These patches were originally planned for the release `1.2.1`, but that version was
never released.

Note the inheritance from `1.2` to `1.3` branch, and the merge from `master` to `1.3` after the release `1.3.0`.

\--- config: gitGraph: parallelCommits: true showCommitLabel: false mainBranchName: "master" \--- gitGraph commit tag: "1.2.0" branch 1.2 checkout master checkout 1.2 commit commit checkout master commit checkout 1.2 commit commit tag: "1.2.1-rc.1"
checkout master commit commit tag: "1.3.0-rc.1" commit commit commit tag: "1.3.0-rc.2" commit tag: "1.3.0" checkout 1.2 branch 1.3 merge master type: HIGHLIGHT commit checkout master commit commit commit tag: "1.4.0-rc.1" commit checkout 1.3 commit
commit tag: "1.3.1-rc.1" commit commit tag: "1.3.1-rc.2" checkout master commit checkout 1.3 commit commit tag: "1.3.1-rc.4" commit tag: "1.3.1" checkout master merge 1.3 commit commit tag: "1.4.0-rc.2" commit tag: "1.4.0" branch 1.4 commit checkout
master commit commit

## Feature branches

A feature branch is a copy of the main codebase where an individual or team can work on a new feature until it is complete.

In this example, the following **feature branches** are created from `master` branch, in this order:

  1. `FB-1`
  2. `FB-2`
  3. `FB-4`
  4. `FB-3`

Note that, regardless the order of the creation of these branches, the merges are using its own order. For this scenario, they were merged in this order:

  1. `FB-2`
  2. `FB-1`
  3. `FB-4`
  4. `FB-3`

As with any branch, feature branches SHOULD receive updates from their base branch as frequently as needed, but at least, they MUST be updated every time other feature branch is merged against its base.

\--- config: gitGraph: parallelCommits: true showCommitLabel: false mainBranchName: "master" \--- gitGraph commit tag: "1.0" branch FB-1 branch FB-2 branch FB-4 checkout master commit commit checkout FB-1 commit commit checkout FB-2 commit commit
checkout FB-4 commit commit commit commit commit commit checkout master merge FB-2 branch FB-3 commit checkout FB-1 merge master type: HIGHLIGHT checkout FB-3 commit commit checkout FB-4 merge master type: HIGHLIGHT commit checkout FB-3 commit
checkout master commit commit merge FB-1 checkout FB-3 commit commit commit checkout FB-4 merge master type: HIGHLIGHT checkout FB-3 merge master type: HIGHLIGHT checkout master commit merge FB-4 checkout FB-3 merge master type: HIGHLIGHT checkout
master commit checkout FB-3 commit commit checkout master commit tag: "1.1.0-rc.1" commit tag: "1.1.0" commit commit commit tag: "1.2.0-rc.1" commit commit tag: "1.2.0-rc.2" commit merge FB-3 commit tag: "1.2.0-rc.3" commit tag: "1.2.0"

## Inspecting the branching model in your repository

You can visually inspect the branches in any repository with this command:

    git log \
        --graph \
        --abbrev-commit \
        --decorate \
        --format='%C(bold yellow)%d%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)'

## Releases

All the releases documented here are created following our [release process](release.html).
