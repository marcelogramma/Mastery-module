# Team reviews

the organization produces proprietary projects driven by a large team. If you don't feel ready to contribute code or patches, reviewing issues and pull requests (PRs) can be a great start to get involved. In fact, people who "triage" Pull Requests
are the backbone to the the organization products' success!

Communicating in a way where your words come across as intended can be difficult. Please read through the [Respectful review comments](<review-comments.html#respectful-review-comments>) guidelines.

## Why reviewing is important

Team reviews are essential for the development process, since there are many more pull requests and bug reports than there are maintainers in the the organization core team to review, fix and merge them.

On the issue tracker, you MAY find many items:

* **Issues** : Issues and bug reports need to be checked for completeness. Is any important information missing? Can the bug be reproduced?

* **Pull Requests** : Pull requests contain code that fixes a bug or implements new functionality. Reviews of pull requests ensure that they are implemented properly, are covered by test cases, don't introduce new bugs and maintain backward
compatibility.

Note that **anyone who has some basic familiarity with the languages used in the project and the the organization's practices and standards can review bug reports and pull requests**. You don't need to be an expert to help.

## Be constructive

Before you begin, remember that you are looking at the result of someone else's hard work. A good review comment thanks the contributor for their work, identifies what was done well, identifies what should be improved and suggests a next step when
there is a clear action path.

## The pull request review process

In the pull request review process you need to understand the functionality that has been fixed or added and find out whether the implementation is complete.

The review stage is a very important step in our [Pull Request flow](<pull-requests.html#pull-request-flow>).

It is okay to do partial reviews! If you do a partial review, comment how far you got.

Pick a pull request and follow these steps:

  1. **Is the PR complete?**

Every pull request MUST contain a header that gives some basic information about the PR. You can find the template for that header in the [Submitting a Pull Request](<pull-requests.html#make-a-pull-request>) document.

  2. **Is the base branch correct?**

The collaborative platform displays the branch that a PR is based on near the title of the pull request. Is that branch correct?

    * Bugs SHOULD be fixed in the oldest, maintained version that contains the bug. Check the project releases to find the oldest currently supported version.
    * New features SHOULD always be added to the current development version.
  3. **Reproduce the problem**

Read the issue that the pull request is supposed to fix. You MAY reproduce the problem on your local environment and try to understand why it exists.

  4. **Review the code**

Read the code of the pull request and check it against some common criteria:

    * Does the code address the issue the PR is intended to fix/implement?
    * Does the PR stay within scope to address **only** that issue?
    * Does the PR contain automated tests? Do those tests cover all relevant edge cases?
    * Does the PR contain sufficient comments to understand its code?
    * When referencing a specific file, line or code block in a review comment, always use a permalink (a URL pinned to a specific commit SHA) rather than a branch-based URL. Branch URLs change as new commits are pushed and the referenced line may no longer exist or may have moved. On GitHub, press `Y` while viewing a file to switch to the permalink URL. On GitLab, use the "Copy link" option on the line number. If the referenced code is already present in the base (upstream) repository, the permalink MUST point to the base repository, not to the contributor's fork;
    * Does the code break backward compatibility? If yes, does the PR header say so?
    * Does the PR contain deprecations? If yes, does the PR header say so? Does the code contain deprecation statements for all deprecated features?
    * Are all deprecations and backward compatibility breaks documented in the latest `UPGRADE-X.X.md` file? Do those explanations contain "Before"/"After" examples with clear upgrade instructions?

Eventually, some of these aspects will be checked automatically.

  5. **Update the PR status**

At last, approve or add comments to the PR:

    * **Not approved** If the PR is not yet ready to be merged, you MUST add the comments explaining the issues that you found.
    * **Approved** If the PR satisfies all the checks above, you SHOULD approve the PR. A maintainer SHOULD soon look at the PR and decide whether it can be merged or needs further work.

Here is a sample comment for a PR that is not yet ready for merge:

`text Thank you @phansys for working on this! It seems that your test cases don't cover the cases when the counter is zero or smaller. Could you please add some tests for that?`
