# Documentation standards

Contributions MUST follow these standards to match the style and tone of the rest of the the organization documentation.

**Note** : All documentation MUST be written in English (American English). See the dedicated section below for detailed language requirements.

## Markdown

All our documents use the [Markdown](<https://en.wikipedia.org/wiki/Markdown>) syntax and the English language.

* The following characters are chosen for different heading levels: level 1 is `#` (1 hash char), level 2 `##` (2 hash chars), level 3 `###` (3 hash chars), and so;

* Each line has a soft-limit of 120 characters. Lines SHOULD break when reaching or exceeding this limit;

* Inline hyperlinks are used. Do **not** separate the link and their target definition;

* Inline markup SHOULD be closed on the same line as the open-string.

### Example

    # Example

    When you are working on the docs, you should follow the [the organization documentation](./README.md).

    ## Level 2

    A PHP example would be:

        echo 'Hello World';

    ### Level 3

    Something else.

## Directory structure

The documentation MUST be placed under the `doc/` directory, except for the `README.md` file, which MUST be placed at the root.

    your-project/
    ├─ doc/
    │  ├─ functional/
    │  ├─ setup/
    │  └─ index.md
    └─ README.md

### Translations

In cases where the documentation requires translations to other languages, follow the same rules described for the English language and use the following directory structure:

    your-project/
    ├─ doc/ # Primary English documentation
    │  ├─ functional/
    │  ├─ setup/
    │  ├─ translations/ # Optional localized documentation
    │  │  ├─ es/ # Spanish translations
    │  │  │  ├─ functional/
    │  │  │  ├─ setup/
    │  │  │  └─ index.md
    │  │  ├─ pt/ # Portuguese translations
    │  │  │  ├─ functional/
    │  │  │  ├─ setup/
    │  │  │  └─ index.md
    │  │  └─ languages.md # Index of supported languages/status
    │  └─ index.md
    └─ README.md

Note that the structure under `doc/translations/` mirrors the mandatory English documentation structure from the `doc/` directory.

## Code examples

* The code follows the [the organization Coding Standards](<../code/index.html>);

* The code examples should look real for a web application context. Avoid abstract or trivial examples (`foo`, `bar`, `demo`, etc.);

* The code should follow the [the organization conventions](<../code/conventions.html>);

* Use `the organization` when the code requires a vendor name;

* Use `example.com` as the domain of sample URLs and `example.org` and `example.net` when additional domains are required. All of these domains are [reserved by the IANA](<https://tools.ietf.org/html/rfc2606#section-3>);

* If a domain is able to work with HTTP and HTTPS, always prefer the `https://` scheme in the examples;

* To avoid horizontal scrolling on code blocks, we prefer to break a line correctly if it crosses the 85th character. This lower limit (compared to the 120-character limit for documentation text) accounts for code indentation and ensures readability
in split-view editors;

* When you fold one or more lines of code, place `...` in a comment at the point of the fold. These comments are: `// ...` (Java/JavaScript/PHP), `# ...` (Bash/Python/YAML), `{# ... #}` (Twig), `<!-- ... -->` (HTML/XML), `; ...` (INI), `...` (text);

* When you fold a part of a line, e.g. a variable value, put `...` (without comment) at the place of the fold;

* Description of the folded code: (optional)

* If you fold several lines: the description of the fold can be placed after the `...`;

* If you fold only part of a line: the description can be placed before the line;

* If useful to the reader, a code example should start with the namespace declaration if it supported by the language;

* When referencing classes, be sure to show the `use` or `import` statements at the top of your code block. You don't need to show _all_ these statements in every example, just show what is actually being used in the code block;

* If useful, a `codeblock` should begin with a comment containing the filename of the file in the code block. Don't place a blank line after this comment, unless the next line is also a comment;

* All the command line snippets SHOULD be based on Unix (Bash, Bourne Shell, etc), unless a different environment is strictly required;

* You MUST NOT mention the command line environment type if it is using the default environment of the project;

* When a shell block shows both a command and its expected output, SHOULD prefix the command line with `$` to distinguish it from the output lines. When a block contains only commands (no output), MUST NOT include a `$` prompt prefix.

### Formats

Configuration examples should show all supported formats using configuration blocks (`js`, `json`, `xml`, `yaml`, etc).

#### Example formats

    // src/Model/User.php
    namespace Model;

    use the organization\Demo\Cat;
    // ...

    final class User extends Person
    {
        // ...

        public function getSomething(?string $myArg = null): self
        {
            // Set user with a value of bar.
            $user = ...;

            $cat = new Cat($user);

            // ... Check if `$myArg` has the correct value.

            return $cat->baz($myArg, ...);
        }
    }

In YAML you should put a space after `{` and before `}` (e.g. `{ _controller: ... }`), but this should not be done in Twig (e.g. `{'hello' : 'value'}`).

### Files and directories

* When referencing directories, always add a trailing slash to avoid confusions with regular files (e.g. "execute the `console` script located at the `bin/` directory").

* When referencing file extensions explicitly, you SHOULD include a leading dot for every extension (e.g. "XML files use the `.xml` extension").

* When you list a the organization file/directory hierarchy, use `your-project/` as the top-level directory. E.g.

`text your-project/ ├─ app/ ├─ doc/ ├─ src/ ├─ tests/ ├─ vendor/ ├─ ... └─ README.md`

### Code syntax highlighting

When creating code blocks, always specify the appropriate language identifier for proper syntax highlighting. Use the following standard identifiers:

* `shell` for POSIX-compliant shell scripts (preferred for general command-line examples);

* `bash` MUST only be used when Bash-specific syntax is required;

* `dockerfile` for `Dockerfile` files;

* `html` for HTML documents;

* `java` for Java code;

* `javascript` or `js` for JavaScript code (prefer `javascript` for consistency);

* `json` for JSON data;

* `mermaid` for Mermaid diagrams;

* `php` for PHP code;

* `python` for Python code;

* `sql` for SQL queries;

* `text` for plain text or pseudo-code;

* `typescript` or `ts` for TypeScript code (prefer `typescript` for consistency);

* `xml` for XML documents;

* `yaml` for YAML configuration files.

Example:

    ```python
    def greet(name: str) -> str:
        return f'Hello, {name}!'
    ```

### Links

* Use relative paths for internal project documentation links (e.g. `[conventions](./../code/conventions.md)`);

* Use absolute URLs for external references (e.g. `[RFC 2119](https://www.ietf.org/rfc/rfc2119.txt)`);

* Link text SHOULD be descriptive and meaningful. Avoid generic phrases like "click here" or "read more";

* When linking to a specific section within a document, use anchor links (e.g. `[English standards](#english-language-standards)`);

* All external links SHOULD use HTTPS when available;

* Verify that all links are valid and accessible.

### Lists

* The hyphen (`-`) MUST be used as the item marker for unordered lists;

* Use unordered lists for items without a specific order or priority;

* Use ordered lists (with `1.`, `2.`, etc.) for sequential steps or ranked items;

* Maintain consistent indentation (2 spaces) for nested lists;

* Nesting depth SHOULD NOT exceed three levels. If deeper nesting is needed, consider restructuring the content;

* List items SHOULD be parallel in structure (all sentences, all fragments, etc.);

* End list items with a semicolon (`;`) when they are part of a sentence or phrase, or with a period (`.`) when they are complete sentences. For simple fragments, punctuation MAY be omitted.

Example of nested lists:

  * Primary item
  * Secondary item
    * Tertiary item
  * Another secondary item
  * Another primary item

#### List ordering

When creating lists where the order of items is not semantically significant (i.e., the items don't represent sequential steps, ranked priorities, or have other inherent ordering requirements), items SHOULD be ordered using [natural
sorting](<https://en.wikipedia.org/wiki/Natural_sort_order>) (also known as human sorting or alphanumeric sorting).

Natural sorting orders items in a way that matches human intuition, treating numbers within strings numerically rather than lexicographically. This makes lists more maintainable and easier to scan visually.

Examples of lists that SHOULD use natural sorting:

* Lists of CVE identifiers (e.g., CVE-2023-1, CVE-2023-10, CVE-2023-2)

* Lists of terms or definitions in glossaries

* Lists of allowed values or enumeration members

* Lists of reference identifiers or codes

* Lists of version numbers

**Lexicographic (incorrect) ordering:**

  * CVE-2023-1
  * CVE-2023-10
  * CVE-2023-100
  * CVE-2023-2
  * CVE-2023-20

**Natural (correct) ordering:**

  * CVE-2023-1
  * CVE-2023-2
  * CVE-2023-10
  * CVE-2023-20
  * CVE-2023-100

Lists that represent sequential steps, ranked priorities, or have other semantic ordering requirements (e.g., chronological order, importance) SHOULD maintain their meaningful order rather than being sorted naturally.

### Tables

* Use standard Markdown table syntax;

* Always include a header row;

* Column alignment using colons in the separator row (`:---` for left, `:---:` for center, `---:` for right) is OPTIONAL;

* Keep table content concise. For complex data, consider alternative presentation methods;

* Tables SHOULD be readable in plain text format.

Example:

    | Environment | URL                     | Purpose                |
    |:----------- |:----------------------- |:---------------------- |
    | Development | http://localhost:3000   | Local development      |
    | Staging     | https://staging.example | Pre-production testing |
    | Production  | https://example.com     | Live application       |

### Images

* Use relative paths for image references (e.g. `![diagram](./images/diagram.png)`);

* Image filenames SHOULD use [Kebab case](<https://en.wikipedia.org/wiki/Letter_case#Kebab_case>) (e.g. `architecture-diagram.png`);

* Supported formats in order of preference: SVG, PNG, GIF, JPEG. Prefer SVG for scalable graphics and diagrams, PNG for screenshots;

* Always provide meaningful alternative text for accessibility (e.g. `![System architecture diagram](./images/architecture-diagram.png)`);

* Images SHOULD be optimized for web use to minimize file size;

* If an image requires attribution or licensing information, include it in a caption or nearby text.

Example:

    ![Database schema showing user and order tables](./images/database-schema.png)

    *Figure 1: The database schema illustrating the relationship between users and orders.*

### Diagrams

For creating diagrams in documentation, follow this preference order:

  1. **[Mermaid](<https://mermaid.js.org/>)** (preferred): Use Mermaid for diagrams when the required diagram type is supported. Mermaid is a text-based diagramming tool that generates diagrams from Markdown-like syntax, making it easy to version
control and maintain. Supported diagram types include flowcharts, sequence diagrams, class diagrams, state diagrams, entity-relationship diagrams, user journey diagrams and more.

Example:

`markdown ```mermaid graph TD A[Start] --> B{Is it working?} B -->|Yes| C[Great!] B -->|No| D[Debug] D --> B ````

  1. **[Diagrams.net](<https://www.diagrams.net/>)** (fallback): When the required diagram is not a fit for Mermaid, use Diagrams.net (formerly known as draw.io) to create the diagram and export it as SVG with metadata. The SVG file MUST contain the
embedded diagram metadata to allow future editing. This ensures that diagrams remain maintainable even when they cannot be represented as code.

To export with metadata in Diagrams.net: \- Select "File" > "Export as" > "SVG" \- Ensure "Include a copy of my diagram" option is checked \- Save the file with a descriptive name

When using either approach, SHOULD provide a caption explaining the diagram's purpose and key elements.

## Terminology and references

When introducing external topics, services, tools, frameworks, standards, or acronyms in documentation, you MUST provide proper context on their first mention to ensure reader comprehension.

### Acronyms and abbreviations

* Acronyms and abbreviations MUST be spelled out on first use, followed by the acronym in parentheses;

* After the first introduction, the acronym MAY be used throughout the rest of the document;

* Commonly known acronyms (HTTP, API, URL, HTML, CSS, SQL, JSON, XML) MAY be used without introduction if appropriate for the target audience;

* Provide a link to official documentation or authoritative sources when introducing technical acronyms or specifications.

Examples:

* **First mention** : "The API documentation uses [OpenAPI Specification (OAS)](<https://swagger.io/specification/>) to define endpoints."

* **Subsequent mentions** : "The OAS file includes all REST endpoints."

### External tools and services

* When referencing external tools, frameworks, or services for the first time, provide a brief description and link to official documentation;

* The description SHOULD be concise (one sentence) and explain the tool's purpose or relevance;

* Links SHOULD point to official documentation, not third-party tutorials or blog posts.

Examples:

* **Good** : "We use [Terraform](<https://www.terraform.io/>), an infrastructure-as-code tool, to provision cloud resources."

* **Good** : "Authentication is handled via [Auth0](<https://auth0.com/>), an identity management platform."

### Industry standards and specifications

* When referencing industry standards (RFCs, ISO standards, W3C specifications, etc.), include both the standard identifier and a link to the official document;

* Provide context about what the standard defines or governs.

Examples:

* **Good** : "Password hashing follows [RFC 2898](<https://www.ietf.org/rfc/rfc2898.txt>), which defines PBKDF2."

* **Good** : "Token format adheres to [JWT (RFC 7519)](<https://datatracker.ietf.org/doc/html/rfc7519>), a standard for securely transmitting information as JSON objects."

## Syntax documentation

When documenting a syntax rule, format constraint, or grammar definition (e.g., naming conventions, version string formats, URL patterns, configuration value formats), the grammar MUST be expressed using [Backus–Naur Form
(BNF)](<https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form>). Other variants such as EBNF, ABNF or ANTLR notation MUST NOT be used, to ensure a single, unambiguous standard across all documentation.

The BNF grammar MUST be accompanied by a link to the [BNF Playground](<https://bnfplayground.pauliankline.com/>) with the grammar pre-loaded in the URL using the `bnf` query parameter (URL-encoded), so that readers can interactively explore and
validate the syntax without any additional setup.

### Example branch naming convention

Expressed in BNF:

    <branch>      ::= <type> "/" <ticket> "-" <description>
    <type>        ::= "feature" | "bugfix" | "hotfix" | "chore"
    <ticket>      ::= <letters> "-" <digits>
    <description> ::= <word> | <word> "-" <description>
    <letters>     ::= <letter> | <letter> <letters>
    <letter>      ::= "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
                   | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"
    <digits>      ::= <digit> | <digit> <digits>
    <digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
    <word>        ::= <letter> | <letter> <word>

[Try in BNF
Playground](<https://bnfplayground.pauliankline.com/?bnf=%3Cbranch%3E%20%3A%3A%3D%20%3Ctype%3E%20%22%2F%22%20%3Cticket%3E%20%22-%22%20%3Cdescription%3E%0A%3Ctype%3E%20%3A%3A%3D%20%22feature%22%20%7C%20%22bugfix%22%20%7C%20%22hotfix%22%20%7C%20%22chore%22%0A%3Cticket%3E%20%3A%3A%3D%20%3Cletters%3E%20%22-%22%20%3Cdigits%3E%0A%3Cdescription%3E%20%3A%3A%3D%20%3Cword%3E%20%7C%20%3Cword%3E%20%22-%22%20%3Cdescription%3E%0A%3Cletters%3E%20%3A%3A%3D%20%3Cletter%3E%20%7C%20%3Cletter%3E%20%3Cletters%3E%0A%3Cletter%3E%20%3A%3A%3D%20%22A%22%20%7C%20%22B%22%20%7C%20%22C%22%20%7C%20%22D%22%20%7C%20%22E%22%20%7C%20%22F%22%20%7C%20%22G%22%20%7C%20%22H%22%20%7C%20%22I%22%20%7C%20%22J%22%20%7C%20%22K%22%20%7C%20%22L%22%20%7C%20%22M%22%20%7C%20%22N%22%20%7C%20%22O%22%20%7C%20%22P%22%20%7C%20%22Q%22%20%7C%20%22R%22%20%7C%20%22S%22%20%7C%20%22T%22%20%7C%20%22U%22%20%7C%20%22V%22%20%7C%20%22W%22%20%7C%20%22X%22%20%7C%20%22Y%22%20%7C%20%22Z%22%0A%3Cdigits%3E%20%3A%3A%3D%20%3Cdigit%3E%20%7C%20%3Cdigit%3E%20%3Cdigits%3E%0A%3Cdigit%3E%20%3A%3A%3D%20%220%22%20%7C%20%221%22%20%7C%20%222%22%20%7C%20%223%22%20%7C%20%224%22%20%7C%20%225%22%20%7C%20%226%22%20%7C%20%227%22%20%7C%20%228%22%20%7C%20%229%22%0A%3Cword%3E%20%3A%3A%3D%20%3Cletter%3E%20%7C%20%3Cletter%3E%20%3Cword%3E>).

## English language standards

the organization documentation uses the United States English dialect, commonly called [American English](<https://en.wikipedia.org/wiki/American_English>). The [American English Oxford
dictionary](<https://www.lexico.com/definition/american_english>) is used as the vocabulary reference.

In addition, documentation follows these rules:

* **Mandatory Language** : All project documentation must be authored in English. English is the only required language; all other language versions are considered optional translations.

* **Section titles** : use a variant of the sentence case, where the first word is always capitalized and the remaining words are not (read Wikipedia article about [headings and
titles](<https://en.wikipedia.org/wiki/Letter_case#Headings_and_publication_titles>)).

E.g.: The main goal of the API

* **Punctuation** : avoid the use of [Serial (Oxford) commas](<https://en.wikipedia.org/wiki/Serial_comma>);

* **Pronouns** : avoid the use of [nosism](<https://en.wikipedia.org/wiki/Nosism>) and always use _you_ instead of _we_ (i.e. avoid the first person point of view: use the second instead);

* **Gender-neutral language** : when referencing a hypothetical person, such as _"a user with a session cookie"_ , use gender-neutral pronouns (they/their/them). For example, instead of:

* he or she, use they

* him or her, use them

* his or her, use their

* his or hers, use theirs

* himself or herself, use themselves

* **Avoid belittling words** : Things that seem "obvious" or "simple" for the person documenting it, can be the exact opposite for the reader. To make sure everybody feels comfortable when reading the documentation, try to avoid words like:

* basically

* clearly

* easy/easily

* just

* logically

* merely

* obviously

* of course

* quick/quickly

* simply

* trivial

These rules ensures that documentation remains accessible and welcoming to readers of all skill levels.
