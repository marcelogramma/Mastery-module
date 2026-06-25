# Submitting changes

A [Pull Request](<https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests>), "PR" for short, is the best way to provide a bug fix or to propose enhancements.

Pull Requests let you tell others about changes you've pushed to a branch in a repository. Once a pull request is opened, you can discuss and review the potential changes with collaborators and add follow-up commits before your changes are merged
into the base branch.

A fork is a new repository that shares code and visibility settings with the original **upstream** repository. Forks are often used to iterate on ideas or changes before they are proposed back to the upstream repository, such as in open source
projects or when a user does not have write access to the upstream repository.

In order to work with our development flow, you MUST [create a fork](<https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo>) from the **upstream** repository and
[clone](<https://git-scm.com/docs/git-clone>) it to your local environment.

## Pull Request flow

\--- title: Pull Request Flow config: flowchart: curve: "monotoneX" \--- flowchart LR F([Fetch upstream]) --> CB CB[\Create branch/] --> D[\Develop/] D --> IU{Is up to date?} IU --> |No| R{{Rebase}} R --> IU IU --> |Yes| P[\Push/] P --> PRE{Pull
Request\nExists?} PRE --> |Yes| CI[[Continuous Integration]] PRE --> |No| CPR[\Create Pull Request/] CPR --> PRE CI --> CIP{Pass?} CIP --> |No| D CIP --> |Yes| Rv[/Review/] Rv --> RvP{Pass?} RvP <\--> |No| D RvP --> |Yes| M([Merge])

## Step 1: Setup your environment

### Install the software stack

Before working on any project, setup a friendly environment with the following software:

* [Git](<https://git-scm.com/>).

## Configure Git

Set up your user information with your real name and a working email address:

    git config --global user.name "Your Name"
    git config --global user.email you@company.com

NOTE:

> If you are new to Git, you are highly recommended to read the excellent and free [Pro Git](<https://git-scm.com/book/en/v2>) book.

NOTE:

> If your IDE creates configuration files inside the project's directory, you can use global `.gitignore` file (for all projects) or `.git/info/exclude` file (per project) to ignore them. See [GitHub's
documentation](<https://help.github.com/articles/ignoring-files>).

NOTE:

> Windows users: when installing Git, the installer will ask what to do with line endings, and suggests replacing all LF with CRLF. This is the wrong setting if you wish to contribute! Selecting the as-is method is your best choice, as Git will
convert your line feeds to the ones in the repository. If you have already installed Git, you can check the value of this setting by typing:

    git config core.autocrlf

This will return either "false", "input" or "true"; "true" and "false" being the wrong values. Change it to "input" by typing:

    git config --global core.autocrlf input

Replace --global by --local if you want to set it only for the active repository.

### Get the source code

Get the source code:

* Create a [GitHub](<https://github.com/join>) / [GitLab](<https://gitlab.the organization.com/users/sign_up>) account and sign in;

* Fork the repository (click on the "Fork" button);

* After the "forking action" has completed, clone your fork locally (this will create a directory with the same name as the cloned repo):

    git clone git@github.com:USERNAME/REPOSITORY.git

* Add the upstream repository as a remote:

    cd REPOSITORY
    git remote add upstream git@github.com:ORGANIZATION/REPOSITORY.git

You MUST always choose the SSH option instead other variants (like HTTPS) when cloning a repository or when adding a remote. The algorithm for the SSH key pair MUST be [Ed25519](<https://datatracker.ietf.org/doc/html/rfc8032#section-5.1>).

### Check that the current tests pass

Now that the project is cloned and configured, you MUST check if there are unit tests and if they pass in your environment.

## Step 2: Work on your Pull Request

### The License

Before you start, you MUST know that all the code you are going to submit MUST be released under the _proprietary license_ , unless explicitly specified in your commits.

### Branching model

At this point and before continuing, you MUST make sure you know and understand the [branching model](<branching-model.html>).

### Choose the right branch

Before working on a Pull Request, you MUST determine on which branch you need to work. We use [Semantic Versioning](<https://semver.org/>) as base for our release strategy.

* If you are fixing a bug for an existing feature, you MUST choose the lowest maintained branch. By instance, if the last released version is `1.2.0`, the lowest maintained branch will be `1.2` (unless your application is maintaining multiple stable
releases in parallel). You MAY have to choose a higher branch if the feature you are fixing was introduced in a later version.

* If you are adding a new feature, you MUST use choose `master`. The version for the next release from this branch will be determined based on the nature of the introduced changes:

* If they are backward compatible, the release MUST increment the MINOR version.

* If they are backward incompatible, the release MUST increment the MAJOR version.

NOTE:

> When a tag for a new version is created, a new maintenance branch MUST be created immediately. By instance, when the tag `3.5.0-rc.1` is created, the branch `3.5` MUST be created accordingly.

NOTE:

> All bug fixes merged into maintenance branches MUST also merged into more recent branches on a regular basis. For instance, if you submit a Pull Request for the `1.2` branch, the Pull Request will also be applied by maintainers on the `master`
branch. You SHOULD maintain only the latest stable release in order to keep the process simple. If there is more than one maintained version, the maintenance becomes complex.

### Create a topic branch

Each time you want to work on a Pull Request for a bug or on an enhancement, create a topic branch:

    git checkout -b BRANCH_NAME master

Or, if you want to provide a bugfix for the `1.0` branch, first track the remote `1.0` branch locally:

    git checkout -t origin/1.0

Then create a new branch off the `1.0` branch to work on the bugfix:

    git checkout -b BRANCH_NAME 1.0

> Use a descriptive name for your branch ("ticket_XXX" where "XXX" is the ticket number is a good convention for bug fixes).

The above checkout commands automatically switch the code to the newly created branch (check the branch you are working on with `git branch`).

### Work on your Pull Request

Work on the code as much as you want and commit as much as you want; but keep in mind the following:

* Read about the [conventions](<code/conventions.html>) and follow the coding standards (use `git diff --check` to check for trailing spaces -- also read the tip below);

* When referencing a specific file, line or code block in a commit description or Pull Request description, always use a permalink (a URL pinned to a commit SHA) rather than a branch-based URL. If the referenced code is present in the base
(upstream) repository, the permalink MUST point to the base repository, not to your fork;

* Add unit tests to prove that the bug is fixed or that the new feature actually works;

* Try hard to not break backward compatibility (if you must do so, try to provide a compatibility layer to support the old way) -- Pull Requests that break backward compatibility have less chance to be merged;

* Do atomic and logically separate commits (use the power of `git rebase` to have a clean and logical history);

* Never fix coding standards in some existing code as it makes the code review more difficult;

* Write good commit messages (see the tip below).

NOTE:

> When submitting Pull Requests, some CS (coding standard) and SCA (static code analysis) tools can check your code for common typos and errors. If a CI (continuous integration) suite ([Circle CI](<https://circleci.com/>), [GitHub Actions](<https://github.com/features/actions>), [Travis CI](<https://travis-ci.org/>), [AWS CodeBuild](<https://aws.amazon.com/codebuild/>), etc.) is integrated with your project, a status can be posted below the Pull Request description with a summary of any problems it detects or any build failures.

NOTE:

> A good commit and Pull Request messages are composed of a summary (the first line), optionally followed by a blank line and a more detailed description. The summary MUST start with the task identifier you are working on in square brackets
(`[MN-1234]`, `[RM-5678]`, ...). Use an imperative verb (`Fix ...`, `Add ...`, ...) to start the summary and don't add a period at the end.

There are already a few articles (or even single purpose websites) about this, we cannot recommend enough the following:

* <https://rakeroutes.com/blog/deliberate-git>

* <https://commit.style>

* <https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html>

To sum them up, the commit message has to be crystal clear and of course, related to the PR content.

The first line of the commit message MUST be short, keep it under 100 characters. It MUST say concisely but precisely what you did. The other lines, if needed, MAY contain a complete description of why you did this.

**Bad commit message subjects:**

Message that does not explain the reason why the `README.md` file must be changed:

    [RM-1234] Update `README.md`

Message that uses a non-imperative verb to describe the changes:

    [RM-1234] Updating PDM dependencies to avoid CVEs

Message that does not use an imperative verb to describe the introduced changes:

    [SK-16] Documentation for the deployment setup

**Good commit message subjects:**

    [RM-1234] Document how to install the project

    [SK-52] Update PDM dependencies to avoid CVEs

    [SK-16] Update APK constraints to fix dependencies resolution

Also, when you specify what you did avoid commit message subjects with "Fix bug in such and such feature". Saying you are fixing something implies the previous implementation was wrong and yours is right, which might not even be true. Instead, state
unquestionable technical facts about your changes, not opinions. Then, in the commit description, explain why you did that and how it fixes something.

    [RM-1234] Call `foo::bar()` instead of `bar::baz()`

    This fixes a bug that arises when doing this or that, because `baz()` needs a
    flux capacitor object that might not be defined.
    Fixes #42.

    [SK-16] Update APK constraints to fix dependencies resolution

    `libexpat` 2.7.4 is not currently available in the Alpine 3.21 package repository.
    See: https://pkgs.alpinelinux.org/packages?name=libexpat&branch=v3.21.

The description is OPTIONAL but strongly RECOMMENDED. It could be asked by the team if needed. PR will often lead to complicated, hard-to-read conversations with many links to other web pages.

The commit description SHOULD be able to live without what is said in the PR, and SHOULD ideally sum it up in a crystal clear way, so that people do not have to open a web browser to understand what you did. Links to PRs/Issues and external
references are of course welcome, but SHOULD not be considered enough. When you reference an issue, make sure to use one of the keywords described in this dedicated [GitHub
article](<https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue>).

**Good commit message with description:**

    [RM-1234] Update web UI background color to blue

    This is a consensus made on #4242 in addition to #1337.
    We agreed that blank color is boring and so deja vu. Blue is the new way to do.

Obviously, this commit is not real.

### Prepare your Pull Request for submission

When your Pull Request is not about a bug fix (when you add a new feature or change an existing one for instance), it MUST also include the following:

* An explanation of the changes in the PR description (the "[BC BREAK]" or the "[DEPRECATION]" prefix MUST be used when relevant);

* An explanation on how to upgrade an existing application in the relevant `UPGRADE` file(s) if the changes break backward compatibility or if you deprecate something that will ultimately break backward compatibility.

You MUST be sure you are not adding any artifact that is built by a tool, like compiled assets, cache files, third party dependencies, etc. If you find some of these files in your environment, you MUST check that they are explicitly ignored in your
Git configuration.

## Step 3: Submit your Pull Request

Whenever you think that your Pull Request is ready for submission, follow the following steps.

NOTE:

> Every commit in versioning branches (`1.2`, `3.5`, `master`, etc) MUST be in a release-ready status. Do not submit partial, dummy or incomplete Pull Requests against a versioning branch.

### Rebase your Pull Request

Before submitting your Pull Request, update your branch (needed if it takes you a while to finish your changes):

    git checkout master
    git fetch upstream
    git merge upstream/master
    git checkout BRANCH_NAME
    git rebase master

> Replace `master` with the branch you selected previously (e.g. `1.0`) if you are working on a bugfix

When doing the `rebase` command, you might have to fix merge conflicts. `git status` will show you the _unmerged_ files. Resolve all the conflicts, then continue the rebase:

    git add ... # Add resolved files
    git rebase --continue

Check that all tests still pass and push your branch remotely:

    git push --force origin BRANCH_NAME

> When doing a `push --force`, always specify the branch name explicitly to avoid messing other branches in the repo (`--force` tells Git that you really want to mess with things so do it carefully).

### Make a Pull Request

You can now make a Pull Request on the repository.

> Take care to point your Pull Request towards `REPOSITORY:1.0` if you want the maintainers to pull a bugfix based on the `1.0` branch.

To ease the maintainers' work, always include the reference for the related task in your Pull Request title, like in:

    [MN-1234] Fix something
    [RM-5678] Add something

The Pull Request description MUST include the following checklist at the top to ensure that contributions may be reviewed without needless feedback loops and that your contributions can be included into a new release as quickly as possible:

    | Q             | A
    | ------------- | ---
    | Branch        | [lowest applicable and maintained version]
    | Bug fix?      | [yes|no]
    | New feature?  | [yes|no]
    | BC breaks?    | [yes|no]
    | Deprecations? | [yes|no]
    | Fixed tickets | [comma separated list of tickets fixed by the PR]
    | License       | proprietary

An example submission could now look as follows:

    | Q             | A
    | ------------- | ---
    | Branch        | 1.0
    | Bug fix?      | no
    | New feature?  | no
    | BC breaks?    | no
    | Deprecations? | no
    | Fixed tickets | [MN-12], [MN-43]
    | License       | proprietary

The whole table MUST be included (do **not** remove lines that you think are not relevant).

Some answers to the questions trigger some more requirements:

* If you answer yes to "Bug fix?", check if the bug is already listed in the issue tracker and reference it/them in "Fixed tickets";

* If you answer yes to "New feature?", you MUST submit a Pull Request to the documentation and reference it under the "Doc PR" section;

* If you answer yes to "BC breaks?", the Pull Request MUST contain updates to the relevant `CHANGELOG` and `UPGRADE` files;

* If you answer yes to "Deprecations?", the Pull Request MUST contain updates to the relevant `CHANGELOG` and `UPGRADE` files;

* If the "License" is not proprietary, just don't submit the Pull Request as it won't be accepted anyway.

If some of the previous requirements are not met, create a todo-list and add relevant items:

    ### To Do

  * [ ] Fix the tests as they have not been updated yet;
  * [ ] Submit changes to the documentation;
  * [ ] Document the BC breaks.

If the Pull Request is not ready for merge or the code is not finished yet because you don't have time to finish it or because you want early feedback on your work, add an item to todo-list:

    ### To Do

  * [ ] Find a way to avoid the workaround;
  * [ ] Gather feedback for my changes.

As long as you have items in the todo-list, please prefix the Pull Request title with "[WIP]" and mark it as draft.

In the Pull Request description, give as much details as possible about your changes (don't hesitate to give code examples to illustrate your points). If your Pull Request is about adding a new feature or modifying an existing one, explain the
rationale for the changes. The Pull Request description helps the code review and it serves as a reference when the code is merged (the Pull Request description and all its associated comments are part of the merge commit message).

In addition to this "code" Pull Request, you MUST also send a Pull Request to update the documentation when appropriate.

## Step 4: Receiving feedback

We ask all contributors to follow some best practices to ensure a [constructive feedback process](<review.html>).

When addressing a comment received in the review process, make all the required changes you consider and don't forget to answer all the questions that may be present in the conversation. You SHOULD NOT mark as resolved a comment that was not started
by you.

If you think someone fails to keep this advice in mind and you want another perspective, please join the project's channel on [the organization Slack](<https://the organization.slack.com/>). If you receive feedback you find abusive please contact
the maintainers or the core team.

### Rework your Pull Request

Based on the feedback on the Pull Request, you might need to rework your Pull Request. Before re-submitting the Pull Request, rebase with "upstream/master" or "upstream/1.0", don't merge; and force the push to the origin:

    git rebase --force-rebase upstream/master
    git push --force origin BRANCH_NAME

Maintainers earlier asked you to "squash" your commits. This means you will convert many commits to one commit.

## Getting information about merged Pull Requests

Whenever a Pull Request is merged, the information about the Pull Request author and number is saved in the repository as [Git notes](<https://git-scm.com/docs/git-notes>).

The Pull Request reference allows you to have a look at the original Pull Request on the collaborative platform where it was merged (GitHub, GitLab, etc):

* `https://github.com/the organization/REPOSITORY/pull/1111`

* `https://gitlab.the organization.com/REPOSITORY/-/merge_requests/1111`

If you want to fetch these notes locally, run the following `git fetch` command:

    git fetch upstream 'refs/notes/*:refs/notes/*'

After a fetch, getting the GitHub information for a commit is then a matter of adding `--notes=github-pull-request` to the `git log` command:

    git log HEAD --notes=github-pull-request
