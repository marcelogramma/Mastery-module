# Automated integration between JIRA and GitHub

We have several automations and integrations created between our organizations at [JIRA](<https://the organization.atlassian.net/jira>) and [GitHub](<https://github.com/the organization>) platforms. These automations are based on commands provided
by the user through comments in JIRA issues. The commands always start with the `/` char and are followed by the command name and optionally, by the command arguments.

This is an example using the fictional command `/foo-command` with 2 arguments:

    /foo-command argument-1 argument-2

All the commands include their syntax reference using the [Backus-Naur Form Grammar](<https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form>).

## Create a GitHub repository

The creation of a GitHub repository is automated by the `/create-repository-from` command. This command trigger the following events in GitHub:

* Creation of a repository from the given skeleton;

* Creation of a team and configuring it in the [`.github/CODEOWNERS`](<https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners>) file.

### Requirements for a new repository

* The user who triggers the command MUST have the `Technical Leader` or `Product Manager` role in the JIRA project;

* The issue MUST have one associated version in the `Fix versions` field;

* The associated version MUST NOT be released;

* The associated version MUST respect the format `{project-key}-{component-name}-{version}`.

### Grammar for the repository creation command

This is the Backus-Naur Form Grammar for the command:

    <command> ::= <command_prompt> " " <skeleton>
                | <command_prompt> " " <skeleton> " " <description>
    <command_prompt> ::= "/create-repository-from"
    <description_char> ::= <char>
                         | [A-Z] | " " | "-" | "." | "," | ";" | ":" | "!" | "?" | "/" | "\\" | "(" | ")" | "[" | "]" | "<" | ">"
                         | "_" | "*" | "%" | "$" | "#" | "@" | "+" | "=" | "~" | "\"" | "'" | "`"
    <char> ::= [a-z] | [0-9]
    <skeleton> ::= <char>
                 | <char> <skeleton_rest>
    <skeleton_rest> ::= <char>
                      | "-" <char>
                      | <char> <skeleton_rest>
                      | "-" <char> <skeleton_rest>
    <description> ::= <description_char> | <description_char> <description>

You can test the grammar of your command
[here](<https://bnfplayground.pauliankline.com/?bnf=%3Ccommand%3E%20%3A%3A%3D%20%3Ccommand_prompt%3E%20%22%20%22%20%3Cskeleton%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Ccommand_prompt%3E%20%22%20%22%20%3Cskeleton%3E%20%22%20%22%20%3Cdescription%3E%0A%3Ccommand_prompt%3E%20%3A%3A%3D%20%22%2Fcreate-repository-from%22%0A%3Cdescription_char%3E%20%3A%3A%3D%20%3Cchar%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%5BA-Z%5D%20%7C%20%22%20%22%20%7C%20%22-%22%20%7C%20%22.%22%20%7C%20%22%2C%22%20%7C%20%22%3B%22%20%7C%20%22%3A%22%20%7C%20%22!%22%20%7C%20%22%3F%22%20%7C%20%22%2F%22%20%7C%20%22%5C%5C%22%20%7C%20%22\(%22%20%7C%20%22\)%22%20%7C%20%22%5B%22%20%7C%20%22%5D%22%20%7C%20%22%3C%22%20%7C%20%22%3E%22%20%7C%20%22_%22%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%22*%22%20%7C%20%22%25%22%20%7C%20%22%24%22%20%7C%20%22%23%22%20%7C%20%22%40%22%20%7C%20%22%2B%22%20%7C%20%22%3D%22%20%7C%20%22~%22%20%7C%20%22%5C%22%22%20%7C%20%22%27%22%20%7C%20%22%60%22%0A%3Cchar%3E%20%3A%3A%3D%20%5Ba-z%5D%20%7C%20%5B0-9%5D%0A%3Cskeleton%3E%20%3A%3A%3D%20%3Cchar%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cchar%3E%20%3Cskeleton_rest%3E%0A%3Cskeleton_rest%3E%20%3A%3A%3D%20%3Cchar%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%22-%22%20%3Cchar%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Cchar%3E%20%3Cskeleton_rest%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%22-%22%20%3Cchar%3E%20%3Cskeleton_rest%3E%0A%3Cdescription%3E%20%3A%3A%3D%20%3Cdescription_char%3E%20%7C%20%3Cdescription_char%3E%20%3Cdescription%3E&name=Release%20command>).

### Example creating a repository

    /create-repository-from skeleton-python Repository description.

## Release a new version in a GitHub repository

The release of a new version in the GitHub repository is automated by the `/release` command. This command trigger the following events in GitHub:

* Creation of a Pull Request updating the `CHANGELOG.md` file with the corresponding contents based on the release type (release or pre-release);

* Creation of a Git annotated tag and their associated GitHub release, including the updated contents from `CHANGELOG.md`;

* Removal of the previous maintenance branch and creation of a new one, in case of a `MAJOR` or `MINOR` release;

* Creation of a Pull Request merging the contents from released version into the development (`master`) branch, in case of a `PATCH` release.

### Requirements for a new release

* The user who triggers the command MUST have the `Technical Leader` or `Product Manager` role in the JIRA project;

* The issue MUST have one associated version in the `Fix versions` field;

* The associated version MUST NOT be released;

* The associated version MUST respect the format `{repository-name}-{version}`;

* The requested release type MUST be one of `major`, `minor` or `patch`.

### Grammar for the release creation command

This is the Backus-Naur Form Grammar for the command:

    <command> ::= <command_prompt> " " <release_target>
                | <command_prompt> " " <release_target> " " <is_pre_release>
    <command_prompt> ::= "/release"
    <release_target> ::= "major"
                       | "minor"
                       | "patch"
    <is_pre_release> ::= "pre-release"

You can test the grammar of your command
[here](<https://bnfplayground.pauliankline.com/?bnf=%3Ccommand%3E%20%3A%3A%3D%20%3Ccommand_prompt%3E%20%22%20%22%20%3Crelease_target%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%3Ccommand_prompt%3E%20%22%20%22%20%3Crelease_target%3E%20%22%20%22%20%3Cis_pre_release%3E%0A%3Ccommand_prompt%3E%20%3A%3A%3D%20%22%2Frelease%22%0A%3Crelease_target%3E%20%3A%3A%3D%20%22major%22%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%22minor%22%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7C%20%22patch%22%0A%3Cis_pre_release%3E%20%3A%3A%3D%20%22pre-release%22&name=Release%20command>).

### Example creating a release

    /release minor pre-release
