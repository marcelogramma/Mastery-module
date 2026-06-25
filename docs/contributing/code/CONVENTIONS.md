# Conventions

This document describes coding standards and conventions used to make it more consistent and predictable. You are encouraged to follow them in your own code.

## Language

Source code, comments, documentation, commit messages, exception messages, and any piece of software MUST use English. The only exception to this rule is in case we are providing an output that must be written in a different language (like in
translation files of a multi-language application).

### Customer-specific and non-English terms

Projects often involve customer-specific jargon, acronyms or terms that originate from the customer's internal vocabulary or from a language other than English. These terms are meaningful only within the customer's business context and carry no
semantic value outside it.

Symbol names that represent customer-specific concepts MUST be translated to English before they can be part of the codebase. The codebase MUST remain understandable to any engineer - including those who are not familiar with the customer's internal
glossary or native language.

When a term is translated, the mapping between the English symbol name and the original customer term MUST be documented:

* In source code, the class, method or attribute MUST include a docblock or inline comment explaining the original term;

* In database schemas, column or table descriptions MUST clarify the original term when the mapping is not self-evident;

* In Infrastructure as Code, resource logical identifiers, parameter names and output keys MUST include a comment explaining the original term;

* In project documentation, a glossary or equivalent section MUST list the translated terms alongside their customer-facing originals.

This documentation ensures that any team member - current or future - can trace the relationship between the codebase and the customer's domain language without requiring oral tradition or undocumented knowledge.

#### Examples

##### Customer jargon in a non-English language

A customer uses the Spanish term "CeVe" (abbreviation of "Centro de Ventas") to refer to their Sales Centers. Stakeholders use this term - and its plural "CeVes" - pervasively in meetings and specifications.

    class SalesCenter:
        """
        Represents a physical sales location.

        Customer glossary: "CeVe" (abbreviation of "Centro de Ventas").
        """

        pass

    CREATE TABLE sales_center (
        id INT PRIMARY KEY,
        name VARCHAR(255)
    );

    COMMENT ON TABLE sales_center IS 'Customer glossary: "CeVe" (abbreviation of "Centro de Ventas").';

##### Terms in the customer's native language

A customer refers to their billing periods as "Liquidaciones" (Spanish for "Settlements"). The codebase MUST use the English equivalent:

    /**
    * A billing settlement period.
     *
    * Customer glossary: "Liquidación" (pl. "Liquidaciones").
     */
    class Settlement {
        // ...
    }

##### Abbreviations without meaning outside the customer's context

A customer uses "NIF" internally to refer to a tax identification number specific to their country. Since "NIF" is not a universally recognized English abbreviation, it MUST be translated:

    class TaxIdentificationNumber:
        """
        Unique tax identifier assigned to a legal entity.

        Customer glossary: "NIF" (Número de Identificación Fiscal).
        """

        pass

If the abbreviation is internationally recognized in English (e.g., "VAT", "SKU", "EAN"), translation is not required - only a clarifying comment is needed if the customer uses a local alias for the same concept.

##### Customer-specific terms in end-user-facing layers

The translation requirement applies to all codebases: source code, database schemas, Infrastructure as Code, configuration files, and API contracts. However, the presentation layer - any output intended for end-user consumption (UI labels, reports,
notifications, dashboards) - MAY preserve the customer's original terminology when ALL of the following conditions are met:

* The term is part of the customer's established business vocabulary that end users already know and use;

* Translating the term would confuse the end user or break the expected experience;

* The term is sourced from a translation file or configuration, not hardcoded in the codebase.

This distinction ensures that code remains readable to any engineer while user-facing outputs remain meaningful to the business audience.

## Syntax

* Single quotes SHOULD be used around strings;

* Indentation SHOULD use spaces instead of tabs, 2 minimum and 4 maximum;

* Line endings MUST NOT contain spaces and MUST use LF ("\n") instead other variants (like CR or CRLF);

* End of files SHOULD contain a line feed;

* Symbol names SHOULD NOT use reserved words if they are not intended to make a reference for the related concept in the underlying context or stack;

* Terms that represent acronyms in symbol names MUST NOT be fully capitalized ("REST" => "Rest", "API" => "Api", "HTTP" => "Http", "DB" => "Db", etc).

## Ordering and sorting

When defining or maintaining collections where the order of items is not semantically significant (i.e., the items don't represent a specific sequence, hierarchy, or have other inherent ordering requirements), items SHOULD be ordered using [natural
sorting](<https://en.wikipedia.org/wiki/Natural_sort_order>) (also known as human sorting or alphanumeric sorting).

Natural sorting orders items in a way that matches human intuition, treating numbers within strings numerically rather than lexicographically. This improves code maintainability, reduces merge conflicts, and makes the content easier to scan and
verify.

This convention applies to:

* Arrays or lists of identifiers, codes, or enumeration values in source code;

* Allowed values in YAML or JSON configuration files;

* Terms in spelling dictionaries (e.g., `.cspell/project-terms.txt`);

* Lists of constants, properties, or enumeration members when declaration order is not significant;

* Import or include statements when the order does not affect functionality;

* Test case names or data fixtures when execution order is not significant.

**Lexicographic (incorrect) ordering:**

    # config/cve-list.yaml
    vulnerabilities:
  * CVE-2023-1
  * CVE-2023-10
  * CVE-2023-100
  * CVE-2023-2
  * CVE-2023-20

    # .cspell/project-terms.txt
    addon
    addon1
    addon10
    addon2
    plugin

**Natural (correct) ordering:**

    # config/cve-list.yaml
    vulnerabilities:
  * CVE-2023-1
  * CVE-2023-2
  * CVE-2023-10
  * CVE-2023-20
  * CVE-2023-100

    # .cspell/project-terms.txt
    addon
    addon1
    addon2
    addon10
    plugin

Collections that represent a specific sequence, hierarchy, priority, or have other semantic ordering requirements (e.g., initialization order, dependency order, execution sequence) MUST maintain their meaningful order rather than being sorted
naturally.

For additional information about ordering in documentation lists, see the [Documentation standards](<../documentation/standards.html#list-ordering>).

### Variables, properties, attributes, function parameters

Variables, properties or attributes, function parameters SHOULD use camel case when possible.

You MUST avoid [Hungarian notation](<https://en.wikipedia.org/wiki/Hungarian_notation>):

    // Bad
    const userArray = [];

    // Good
    const users = [];

Use the plural form or append terms like "list" or "collection" when the symbol provides multiple items:

    // Bad
    const name = ['Io', 'Europa'];
    const element = ['Hydrogen', 'Helium'];
    const particle = ['Electron', 'Neutrino'];

    // Good
    const names = ['Ganymede', 'Callisto'];
    const elementList = ['Tungsten', 'Argon'];
    const particleCollection = ['Muon', 'Tauon'];

Avoid one-time variables, like in this example:

    /**
    * @returns {boolean}
     */
    function check()
    {
      const isValid = true;

      return isValid;
    }

Do not perform assignments that may not be used based on the flow execution order:

Instead of:

    const databaseDriver = getDatabaseDriver();
    const databasePort = getDatabasePort();

    if (null === databaseDriver) {
      throw new Error('The database driver can not be null.');
    }

    if (null === databasePort) {
      throw new Error('The database port can not be null.');
    }

Use:

    const databaseDriver = getDatabaseDriver();

    if (null === databaseDriver) {
      throw new Error('The database driver can not be null.');
    }

    const databasePort = getDatabasePort();

    if (null === databasePort) {
      throw new Error('The database port can not be null.');
    }

You MUST avoid alignments in multiline assignments, as they makes harder to make future changes.

Instead of:

    const something = [
      'one':   1,
      'two':   2,
      'three': 3,
      'four':  4,
    ];

    let date     = '2022-04-28';
    let time     = '20:36:54';
    let timezone = 'UTC';

Use:

    const something = [
      'one': 1,
      'two': 2,
      'three': 3,
      'four': 4,
    ];

    let date = '2022-04-28';
    let time = '20:36:54';
    let timezone = 'UTC';

### Methods

Functions and methods SHOULD use camel case. As they are intended to perform actions, its names SHOULD contain a verb telling about its main purpose. This verb SHOULD be the first word in almost all the cases:

* `getSomething()`

* `addSomething()`

* `removeSomething()`

Please, try to avoid method names that don't use a verb in its name. If the method name is not enough to transmit its purpose in a clear way, please add a docblock including a detailed description explaining its goal.

    /**
    * Process the given files by setting their statuses to "enabled"
    * and moving them to their final location.
     */
    function processFiles(files: UserFile[]): void
    {
        files.forEach(function (file: UserFile): void {
            file.status = 'enabled';
            file.moveToFinalLocation();
        });
    }

You MUST produce the lowest [cyclomatic complexity](<https://en.wikipedia.org/wiki/Cyclomatic_complexity>) possible. This means that the execution flow MUST have as less decision branches as possible, and it MUST break the execution as soon as
possible too.

    // Bad
    function process(file: UserFile): void
    {
        if ('disabled' === file.status) {
            file.status = 'enabled';
        }

        if ('private' === file.permission) {
            file.permission = 'public';
        }

        if ('disabled' !== file.status || 'private' !== file.permission) {
            throw new Error('File is not disabled or its permission is not private.');
        }
    }

    // Good
    function process(file: UserFile): void
    {
        if ('disabled' !== file.status || 'private' !== file.permission) {
            throw new Error('File is not disabled or its permission is not private.');
        }

        file.status = 'enabled';
        file.permission = 'public';
    }

If the responsibility of a function can not be accomplished, an exception MUST be thrown instead of failing silently.

    // Bad
    function enableFile(file: UserFile): void
    {
        if ('disabled' === file.status) {
            file.status = 'enabled';
        }
    }

    // Good
    function enableFile(file: UserFile): void
    {
        if ('disabled' !== file.status) {
            throw new Error(`File MUST be in status "disabled", but its status is "${file.status}".`);
        }

        file.status = 'enabled';
    }

### Classes, interfaces, traits, enumerations, etc

Classes, interfaces, traits, enumerations, etc, MUST use pascal case. As they are intended to encapsulate some responsibilities, its names MUST contain only nouns, but not verbs:

* `BillingProxy`

* `HelpdeskPlatform`

* `MonitoringBridge`

* `PasswordGenerator`

If some of these names are not enough to transmit its purpose in a clear way, please add a docblock including a detailed description explaining its goal.

#### One definition per file

Each class, interface, trait, or enumeration MUST be defined in its own file and the filename MUST describe the element it defines. Generic or ambiguous filenames MUST NOT be used.

Instead of:

    # Bad
    src/dto.ts
    src/utils.ts
    src/helpers.ts
    src/types.ts
    src/interfaces.ts

Use:

    # Good
    src/repository-mapper.ts
    src/date-formatter.ts
    src/billing-proxy.ts
    src/user-repository-interface.ts

The filename MUST use the same name as the element it defines, converted to the appropriate case for the language (e.g., kebab-case for TypeScript/JavaScript files, snake_case for Python modules, PascalCase for PHP files following PSR-4).

### Parameters

Parameters, options, etc, SHOULD use snake case:

* "dry_run"

* "enable_short_syntax"

* "memory_limit"

### Exception messages, logs, comments

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in these texts MUST be used as described in [RFC 2119](<https://www.ietf.org/rfc/rfc2119.txt>).

You MUST always use a full stop at the end of an exception message, log or comment:

*

`js throw new Error('An error occurred.');`

*

`python # We are using this comment to provide a clear example.`

Block comments MUST only be used as [docblocks](<https://en.wikipedia.org/wiki/Docblock>) on structural elements, like classes, properties, members and methods.

    /**
    * Block comment for the "class" element.
     */
    final class Foo
    {
        /**
         * Block comment for the "property" or "member" element.
         */
        private String bar = "Bar";

        /**
         * Block comment for the "method" element.
         */
        public String getBar()
        {
            // Inline comment inside the method's body.
            return this.bar;
        }
    }

Do not use comment banners or padding.

Instead of:

    ########
    # Hello
    ########

    /************
    * Hello
     ***********/

    /////////////////////////////
    /// Functions for the app ///
    /////////////////////////////

Use:

    // Functions for the app.

### TODO comments

If you identify some task that must be done in order to fix or improve something but the scope of your work is not related to that finding, you MUST add `@todo` comments. These comments mark every piece of code that needs to be removed, uncommented
or reworked in a future PR. These comments MUST be as explicit as possible regarding the required changes that need to be performed in order to remove the comment. Even, if possible, these comments MUST be followed by `@see` comments including the
reference to the related task in the issue tracker.

Example:

    // @todo: Add "some_param" parameter to the request in order to call `someFunction()`.
    // @see: https://the organization.atlassian.net/browse/XXX-1234.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in these comments MUST be used as described in [RFC 2119](<https://www.ietf.org/rfc/rfc2119.txt>).

### Deprecations

From time to time, some classes and/or methods are deprecated in the framework; that happens when a feature implementation cannot be changed because of backward compatibility issues, but we still want to propose a "better" alternative. In that case,
the old implementation can simply be **deprecated**.

A feature is marked as deprecated by adding a `@deprecated` annotation to relevant classes, methods, properties, ...:

    /**
    * @deprecated since version 1.2, to be removed in 2.0. Use `XXX` instead.
     */

The deprecation message SHOULD indicate the version where the class or method was deprecated, the version where it will be removed, and whenever possible, how the feature was replaced.

## Distribution files

Distribution files (`.dist` files) are template counterparts to configuration or environment files that contain sensitive or environment-specific values. They document the expected structure and provide safe placeholder values, allowing any
developer to bootstrap a working local setup from scratch.

### Convention

* A `.dist` file MUST be created for every configuration file that contains sensitive information or values that differ between environments (e.g., API keys, passwords, DSNs, local port overrides);

* The `.dist` file MUST be named by appending the `.dist` suffix to the real file's name (e.g., `.env.dist` for `.env`, `samconfig.toml.dist` for `samconfig.toml`);

* The `.dist` file MUST be committed to version control and MUST contain only safe placeholder or example values - never real credentials or sensitive data;

* The real implementation file (without the `.dist` suffix) MUST be excluded from version control by adding it to `.gitignore`;

* The `.dist` file MUST be kept in sync with the real file: any time a new key or parameter is added to the real file, a corresponding placeholder MUST be added to the `.dist` file;

* Alternative suffixes such as `.example`, `.default`, or `.sample` MUST NOT be used; `.dist` is the only accepted suffix for template files.

### Rationale

Committing the real file would expose sensitive data in the repository history. Using a `.dist` template instead separates the structure (safe to share) from the values (environment-specific or secret), while ensuring that onboarding a new developer
or setting up a new environment requires only copying the `.dist` file and filling in the real values.

### Examples of distribution files

Docker environment file:

    your-project/
    ├─ .docker/
    │  ├─ .env          ← excluded from version control (add to .gitignore)
    │  └─ .env.dist     ← committed; contains placeholder values
    └─ ...

To set up a local environment, copy the `.dist` file and fill in the real values:

    cp .docker/.env.dist .docker/.env

SAM CLI configuration file:

    your-project/
    ├─ .aws/
    │  └─ sam/
    │     ├─ samconfig.toml.dist     ← committed; contains placeholder deployment parameters
    │     └─ samconfig.toml          ← excluded from version control (add to .gitignore)
    └─ ...

To set up the SAM CLI configuration, copy the `.dist` file and fill in the real values:

    cp .aws/sam/samconfig.toml.dist .aws/sam/samconfig.toml

For more specific examples of `.dist` files in context, see:

* [Containers - project structure](<../infrastructure/containers.html#project-structure>)

* [Infrastructure as Code - repository structure](<../infrastructure/iac.html#repository-structure>)

## Quality

### Architecture

#### SOLID

You MUST follow the [SOLID principles](<https://en.wikipedia.org/wiki/SOLID>), a famous set of concepts which help developers create high quality software architectures. Following the SOLID principles brings many advantages to our projects:

* it decouples your logic in multiple independent components which you can easily unit test;

* it eases migration by avoiding your project to be tightly linked to its dependencies;

* it helps newcomers understand the most important parts of your project by exposing only the necessary public API.

You MUST keep the application API as closed as possible. If a property, attribute, method, etc. don't need to be accessed publicly, you MUST declare them as private or protected instead of public, depending on the case and the language capabilities.
Classes and methods MUST also be declared as final if possible.

#### Object-Oriented Programming

[Object-Oriented Programming (OOP)](<https://en.wikipedia.org/wiki/Object-oriented_programming>) MUST be used when possible and convenient. Classes, interfaces, encapsulation, inheritance, and polymorphism SHOULD be preferred over procedural or
purely functional approaches for business logic, services, and domain models.

OOP is the natural companion to the SOLID principles: applying Single Responsibility (SRP), Open/Closed (OCP), Liskov Substitution (LSP), Interface Segregation (ISP), and Dependency Inversion (DIP) is only meaningful when the code is structured
around objects with well-defined responsibilities and contracts.

#### Twelve factor app

You MUST follow the principles (called _factors_) stated in the [twelve-factor app](<https://12factor.net/>), which is a methodology for building software-as-a-service apps that:

* Use declarative formats for setup automation, to minimize time and cost for new developers joining the project;

* Have a clean contract with the underlying operating system, offering maximum portability between execution environments;

* Are suitable for deployment on modern cloud platforms, obviating the need for servers and systems administration;

* Minimize divergence between development and production, enabling continuous deployment for maximum agility;

* And can scale up without significant changes to tooling, architecture, or development practices.

The twelve-factor methodology can be applied to apps written in any programming language, and which use any combination of backing services (database, queue, memory cache, etc).

#### Monolithic HTTP applications

Monolithic HTTP applications with multiple responsibilities MUST expose their resources through separate HTTP domains regarding its purposes.

To improve the resilience and scalability, each of these domains MUST be served from their specific and individual compute services.

By instance, lets take this example for the "example" app:

* REST Application Programming Interface: `api.example.com`;

* Single Page Application: `example.com`;

* Content Management System: `admin.example.com`;

* Other static assets: `static.example.com`.

### Security

#### Sensitive information

Sensitive information, like plain passwords, secrets, DSNs including these kind of data and [Personally Identifiable Information (PII)](<https://csrc.nist.gov/publications/detail/sp/800-122/final>) MUST NOT be stored in a repository or anywhere in
the project sources. These are the only exceptions for this rule:

* The fictitious information used for development purposes in non-production environments (like the database fixtures used for tests);

* Functional documentation that is required by the business workflow to allow the application maintenance and support, like contact emails for specific integration owners. The information exposed under this exception MUST be explicitly authorized by
the person responsible for the project where this is required.

* The default credentials provided for development in local service integrations (like databases, cache or message queues).

#### Access credentials

When access credentials are required for a service connection, the following premises MUST be respected:

* If the connection configuration supports [Data Source Names (DSNs)](<https://en.wikipedia.org/wiki/Data_source_name>), they MUST be used to provide all the connection parameters instead of using various separated parameters. The information in
this DSN MUST be considered as sensitive.

* For credentials owned by an application, the parameters used to confirm the authentication process in a connection are the only ones that MUST be considered sensitive information. By instance, the password used in conjunction with a username or an
API secret used in conjunction with an API key. Other standalone parameters like usernames, API keys, host names or ports MUST NOT be considered sensitive information and MUST NOT be treated as such.

* For credentials owned by a third party entities (applications or users), all the parameters used during the authentication process MUST be considered sensitive information. By instance, the API key and the API secret pair provided by the
application's users to authenticate themselves against another platform.

* The sensitive information MUST always be protected at rest using an encryption key, never store these values as plain text.

#### Symmetric Encryption Algorithms

When you need a single key to encrypt and decrypt sensitive data, you MUST use an [AES-256](<https://csrc.nist.gov/pubs/fips/197/final>) symmetric key. AES-256 (Advanced Encryption Standard with a 256-bit key) is a symmetric encryption algorithm
widely used to secure sensitive data. It is part of the AES family, which also includes AES-128 and AES-192, but AES-256 provides the highest level of security due to its longer key length. AES-256 is considered highly resistant to brute-force
attacks and is commonly used for encrypting data-at-rest, securing communications, and protecting files in industries requiring strong security.

#### Asymmetric Encryption Algorithms

For securing communications and data where public and private keys are required, you MUST use the [Ed25519](<https://datatracker.ietf.org/doc/html/rfc8032#section-5.1>) encryption algorithm. Ed25519 is an elliptic curve algorithm that provides a
high level of security with a fixed key size of 256 bits. It is optimized for performance and security, making it highly resistant to common cryptographic attacks, including those from quantum computing in the future. Ed25519 is mandatory for use in
all cryptographic operations such as SSH key management and digital signatures. It is the only acceptable encryption algorithm due to its strong security guarantees, efficiency, and widespread support in modern cryptographic libraries.

#### Password Hashing Algorithms

For password hashing, [Bcrypt](<https://en.wikipedia.org/wiki/Bcrypt>) is the RECOMMENDED algorithm. Bcrypt is a key derivation function specifically designed to be slow and resistant to brute-force and parallel attacks, making it ideal for securing
passwords. Bcrypt allows us to adjust the computational cost (the "work factor"), which can be increased over time to keep up with advances in hardware performance, thus enhancing long-term security.

While other algorithms like [Argon2](<https://password-hashing.net/argon2-specs.pdf>) are also secure, Bcrypt is our preferred choice due to its broader adoption, ease of use, and well-established track record in securing passwords in production
environments. It is the recommended algorithm for any system requiring password storage, ensuring that passwords are securely hashed and protected from unauthorized access.

#### Building authentication mechanisms

When you need to build an authentication mechanism using a database or other persistence media, the sensitive information like the password or the secret used to confirm the authentication process MUST be hashed using a password hashing algorithm
and the result of the hashing operation MUST be stored instead of the plain information. Plain information MUST NOT be stored in any of these cases.

### Typing

You MUST use the most strong and strict typing available given the capabilities available in the project you are working on. If you can use explicit typing, you MUST NOT omit the declaration in any of the supported elements:

*

`ts message?: string;`

*

`python event: str = 'start'`

*

`php private bool $isEnabled;`

*

`php public function getStatus(string $myArg): int`

If the explicit typing is not available, you MUST use annotations in order to explain what types are allowed:

*

`js /** * @property {string|null} */ message;`

*

`php /** * @var bool */ private $isEnabled;`

*

`php /** * @param string $myArg * * @return int */ public function getStatus($myArg)`

*

`php /** * @var array<string, int> */ private $options = ['max' => 42];`

*

`php /** * @param array<string, int> $options */ public function getStatus(array $options): int`

You SHOULD use [generics](<https://en.wikipedia.org/wiki/Concept_\(generic_programming\)>) if they are available.

Type juggling, coercion and casting MUST be avoided.

#### Single Responsibility Principle and typing

Classes and methods MUST have a single, well-defined responsibility (Single Responsibility Principle from SOLID). Strong typing enforces this principle by making interfaces explicit and preventing misuse. Each class SHOULD represent one concept with
a clear type signature.

When a class or method handles multiple concerns, it becomes difficult to type correctly and often leads to overly generic or union types, which is an indicator of poor design.

Example of SRP violation through typing:

    // Bad: Class handles too many responsibilities, reflected in complex types
    class UserManager {
        createUser(data: string | object): User | Error {
            // ...
        }

        sendEmail(user: User, template: string): boolean | void {
            // ...
        }

        generateReport(format: 'pdf' | 'csv' | 'json'): string | Buffer | object {
            // ...
        }
    }

    // Good: Single responsibilities with clear types
    class UserRepository {
        create(data: UserData): User {
            // ...
        }
    }

    class EmailService {
        send(user: User, template: EmailTemplate): void {
            // ...
        }
    }

    class ReportGenerator {
        generate(data: ReportData, format: ReportFormat): Report {
            // ...
        }
    }

#### Variance and covariance

When working with generic types and inheritance hierarchies, you MUST understand and properly apply variance rules to maintain type safety while allowing flexibility in your designs.

**Definitions** :

* **Covariance** : Allows a method to return a more derived (specific) type than specified by the base definition. Represented as `T` is covariant if `Derived` can be used where `Base` is expected when `Derived extends Base`.

* **Contravariance** : Allows a method parameter to accept a less derived (more general) type than specified. Parameters should be contravariant to accept broader inputs.

* **Invariance** : Type must match exactly, no variance is allowed.

**TypeScript example** :

    // Covariance in return types
    interface Animal {
        name: string;
    }

    interface Dog extends Animal {
        breed: string;
    }

    interface AnimalShelter {
        getAnimal(): Animal;
    }

    // Good: Covariant return type (returning more specific type)
    class DogShelter implements AnimalShelter {
        getAnimal(): Dog {
            return { name: 'Buddy', breed: 'Golden Retriever' };
        }
    }

    // Contravariance in parameters
    type AnimalHandler = (animal: Animal) => void;
    type DogHandler = (dog: Dog) => void;

    // A function expecting AnimalHandler can accept a handler
    // that works with any Animal (contravariant)
    const processDog = (handler: AnimalHandler, dog: Dog): void => {
        handler(dog);
    };

**PHP example** (PHP 7.4+):

    <?php

    declare(strict_types=1);

    // Covariance in return types
    class Animal
    {
        public function getName(): string
        {
            return 'Animal';
        }
    }

    class Dog extends Animal
    {
        public function getBreed(): string
        {
            return 'Golden Retriever';
        }
    }

    class AnimalShelter
    {
        public function getAnimal(): Animal
        {
            return new Animal();
        }
    }

    // Good: Covariant return type
    final class DogShelter extends AnimalShelter
    {
        public function getAnimal(): Dog
        {
            return new Dog();
        }
    }

    // Contravariance in parameters (PHP 7.2+)
    class AnimalFeeder
    {
        public function feed(Dog $dog): void
        {
            // Feed specific dog food
        }
    }

    // Good: Contravariant parameter type
    final class UniversalFeeder extends AnimalFeeder
    {
        public function feed(Animal $animal): void
        {
            // Feed any animal
        }
    }

**Python example** :

    from typing import TYPE_CHECKING, Generic, TypeVar

    if TYPE_CHECKING:
        from typing import Any

    # Covariance with TypeVar
    T_co = TypeVar('T_co', covariant=True)

    class Animal:
        """Base animal class."""

        def __init__(self, name: str) -> None:
            self.name = name

    class Dog(Animal):
        """Dog class extending Animal."""

        def __init__(self, name: str, breed: str) -> None:
            super().__init__(name)
            self.breed = breed

    class AnimalShelter(Generic[T_co]):
        """Generic animal shelter."""

        def getAnimal(self) -> T_co:
            raise NotImplementedError

    # Good: Covariant return type
    class DogShelter(AnimalShelter[Dog]):
        """Shelter specialized for dogs."""

        def getAnimal(self) -> Dog:
            return Dog('Buddy', 'Golden Retriever')

    # Usage: DogShelter can be used where AnimalShelter[Animal] is expected
    def processShelter(shelter: AnimalShelter[Animal]) -> Animal:
        return shelter.getAnimal()

    dogShelter: AnimalShelter[Dog] = DogShelter()
    animal: Animal = processShelter(dogShelter)

**Java example** :

    // Covariance with wildcards
    class Animal {
        private String name;

        public String getName() {
            return name;
        }
    }

    class Dog extends Animal {
        private String breed;

        public String getBreed() {
            return breed;
        }
    }

    // Covariant: can read Dog as Animal
    List<? extends Animal> animals = new ArrayList<Dog>();
    Animal animal = animals.get(0);

    // Contravariant: can write Animal to a list that accepts any supertype
    List<? super Dog> dogs = new ArrayList<Animal>();
    dogs.add(new Dog());

**Key principles** :

* Return types SHOULD be covariant (return more specific types);

* Parameter types SHOULD be contravariant (accept more general types);

* Mutable collections SHOULD be invariant for safety;

* Immutable collections CAN be covariant.

#### Avoiding duck typing

[Duck typing](<https://en.wikipedia.org/wiki/Duck_typing>) ("if it walks like a duck and quacks like a duck, it must be a duck") MUST be avoided in favor of explicit interface definitions and type constraints. While duck typing offers flexibility,
it sacrifices type safety and makes code harder to understand and maintain.

**Why avoid duck typing** :

* Lacks compile-time type checking;

* Makes refactoring dangerous and error-prone;

* Hides dependencies and contracts;

* Reduces IDE support (autocomplete, refactoring);

* Makes code harder to understand for newcomers.

**Bad example** (duck typing):

    // Bad: Relying on duck typing
    function processData(obj: any) {
        if (obj.validate) {
            return obj.validate();
        }

        if (obj.save) {
            obj.save();
        }

        return true;
    }

    // Any object with these methods will "work"
    const user = {
        save() {
            console.log('Saving user');
        },
        validate() {
            return true;
        }
    };

    const product = {
        save() {
            console.log('Saving product');
        },
        validate() {
            return false;
        }
    };

    processData(user);
    processData(product);

**Good example** (explicit interfaces):

    // Good: Explicit interface defines the contract
    interface Persistable {
        save(): boolean;
    }

    interface Validatable {
        validate(): boolean;
    }

    interface Entity extends Persistable, Validatable {
    }

    function processData(entity: Entity): boolean {
        entity.validate();

        return entity.save();
    }

    class User implements Entity {
        save(): boolean {
            console.log('Saving user');

            return true;
        }

        validate(): boolean {
            return true;
        }
    }

    class Product implements Entity {
        save(): boolean {
            console.log('Saving product');

            return true;
        }

        validate(): boolean {
            return false;
        }
    }

    // Type-safe usage
    const user: Entity = new User();
    const product: Entity = new Product();

    processData(user);
    processData(product);

**Python example** with Protocols (Python 3.8+):

    from typing import TYPE_CHECKING, Protocol

    if TYPE_CHECKING:
        pass

    # Bad: Duck typing
    def processData(obj):
        if hasattr(obj, 'validate'):
            return obj.validate()

        if hasattr(obj, 'save'):
            obj.save()

        return True

    # Good: Using Protocol for structural typing
    class Persistable(Protocol):
        """Protocol for persistable objects."""

        def save(self) -> bool:
            ...

    class Validatable(Protocol):
        """Protocol for validatable objects."""

        def validate(self) -> bool:
            ...

    class Entity(Persistable, Validatable, Protocol):
        """Clear contract for entities."""

        pass

    def processData(entity: Entity) -> bool:
        entity.validate()

        return entity.save()

    class User:
        """User entity."""

        def save(self) -> bool:
            print('Saving user')

            return True

        def validate(self) -> bool:
            return True

    # Type checker verifies User satisfies Entity protocol
    user: Entity = User()
    processData(user)

**PHP example** :

    <?php

    declare(strict_types=1);

    // Bad: Duck typing with magic methods
    final class DataProcessor
    {
        public function process($obj): bool
        {
            if (\method_exists($obj, 'validate')) {
                return $obj->validate();
            }

            if (\method_exists($obj, 'save')) {
                $obj->save();
            }

            return true;
        }
    }

    // Good: Explicit interfaces
    interface Persistable
    {
        public function save(): bool;
    }

    interface Validatable
    {
        public function validate(): bool;
    }

    interface Entity extends Persistable, Validatable
    {
    }

    final class DataProcessor
    {
        public function process(Entity $entity): bool
        {
            $entity->validate();

            return $entity->save();
        }
    }

    final class User implements Entity
    {
        public function save(): bool
        {
            // Save user.

            return true;
        }

        public function validate(): bool
        {
            return true;
        }
    }

    // Type-safe usage
    $processor = new DataProcessor();
    $user = new User();
    $processor->process($user);

**Key guidelines** :

* ALWAYS define explicit interfaces or protocols for contracts;

* USE abstract classes or interfaces to define expected behavior;

* AVOID `any`, `object`, or checking for method existence at runtime;

* LEVERAGE language-specific features (TypeScript interfaces, PHP interfaces, Python Protocols, Java interfaces);

* DOCUMENT the contract expectations in interface definitions.

### Modeling and persistence

#### Interacting with the database

You MUST use a [database abstraction layer](<https://en.wikipedia.org/wiki/Database_abstraction_layer>) (DBAL) on top of your database. Don't use the database API directly.

Additionally, you SHOULD implement an object mapper ([object-relational mapper](<https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping>) or [object-document
mapper](<https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping#Object-oriented_databases>), depending on your database engine) to interact with the persistence layer.

#### Models

Use singular names for model classes, database tables, etc.

    // Bad
    class Users
    {
    }

    // Good
    class User
    {
    }

#### Database naming conventions

Database component names MUST use `lower_snake_case` to ensure consistency across different database engines and operating systems. This convention provides maximum portability and avoids issues with case sensitivity that vary between database
engines (MySQL/MariaDB on Windows is case-insensitive, while on Linux it is case-sensitive; PostgreSQL converts unquoted identifiers to lowercase; MSSQL is configurable).

All database component names MUST use English and MUST be descriptive and meaningful. Abbreviations SHOULD be avoided unless they are widely recognized in the domain context.

##### General principles

* Database component names MUST use `lower_snake_case`;

* Names MUST use singular form for tables (e.g., `user`, not `users`);

* Names MUST be descriptive and self-explanatory;

* Names SHOULD avoid abbreviations unless widely recognized (e.g., `id` is acceptable, `usr` is not);

* Names MUST NOT use database engine reserved words without proper handling (see Handling reserved words);

* Names MUST use only alphanumeric characters and underscores;

* Names MUST start with a letter, not a number or underscore;

* Names SHOULD be concise but descriptive (aim for clarity over brevity).

##### Schemas

For projects using database schemas (primarily data lake projects), schema names MUST use `lower_snake_case` and SHOULD represent the logical grouping or domain they contain.

    -- Bad
    CREATE SCHEMA UserManagement;
    CREATE SCHEMA user-data;
    CREATE SCHEMA USERS;

    -- Good
    CREATE SCHEMA user_management;
    CREATE SCHEMA analytics;
    CREATE SCHEMA reporting;

For single-schema databases (the majority of projects), the default schema provided by the database engine SHOULD be used.

##### Tables

Table names MUST use singular form and `lower_snake_case`. The singular form aligns with the object-oriented model representation where each row represents a single entity instance.

    -- Bad
    CREATE TABLE Users (id INT);
    CREATE TABLE user-accounts (id INT);
    CREATE TABLE PRODUCTS (id INT);
    CREATE TABLE order_items (id INT); -- Plural form

    -- Good
    CREATE TABLE user (id INT);
    CREATE TABLE user_account (id INT);
    CREATE TABLE product (id INT);
    CREATE TABLE order_item (id INT);

For junction tables (many-to-many relationships), use both entity names in alphabetical order separated by underscore:

    -- Bad
    CREATE TABLE users_roles (user_id INT, role_id INT);
    CREATE TABLE roles_users (user_id INT, role_id INT);

    -- Good
    CREATE TABLE role_user (role_id INT, user_id INT);
    CREATE TABLE product_tag (product_id INT, tag_id INT);

##### Columns

Column names MUST use `lower_snake_case` and SHOULD be descriptive of the data they contain. Column names SHOULD NOT include the table name as a prefix, except for primary and foreign keys.

    -- Bad
    CREATE TABLE user (
      userId INT,
      userName VARCHAR(100),
      user_email VARCHAR(255), -- Redundant prefix
      UserStatus VARCHAR(50)
    );

    -- Good
    CREATE TABLE user (
      id INT,
      username VARCHAR(100),
      email VARCHAR(255),
      status VARCHAR(50),
      created_at DATETIME,
      updated_at DATETIME
    );

Boolean columns SHOULD use prefixes like `is_`, `has_`, `can_`, or `should_` to indicate their binary nature:

    -- Bad
    CREATE TABLE user (
      id INT,
      active BOOLEAN,
      verified BOOLEAN,
      admin BOOLEAN
    );

    -- Good
    CREATE TABLE user (
      id INT,
      is_active BOOLEAN,
      is_verified BOOLEAN,
      is_admin BOOLEAN,
      has_profile_photo BOOLEAN,
      can_publish BOOLEAN
    );

Timestamp columns SHOULD follow these naming conventions:

* `created_at`: For record creation timestamp

* `updated_at`: For last modification timestamp

* `deleted_at`: For soft deletion timestamp

* `published_at`: For publication timestamp

* `*_at` suffix pattern for other timestamp fields

    -- Good
    CREATE TABLE article (
      id INT,
      title VARCHAR(255),
      created_at DATETIME,
      updated_at DATETIME,
      published_at DATETIME,
      deleted_at DATETIME
    );

##### Primary keys

Primary key columns MUST be named `id` for single-column primary keys. For composite primary keys, use the constituent column names that make up the key.

    -- Bad
    CREATE TABLE user (
      user_id INT PRIMARY KEY,
      name VARCHAR(100)
    );

    CREATE TABLE role_user (
      role_user_id INT PRIMARY KEY,
      role_id INT,
      user_id INT
    );

    -- Good
    CREATE TABLE user (
      id INT PRIMARY KEY,
      name VARCHAR(100)
    );

    CREATE TABLE role_user (
      role_id INT,
      user_id INT,
      PRIMARY KEY (role_id, user_id)
    );

Primary key constraints SHOULD be explicitly named using the pattern `pk_{table_name}`:

    -- Good
    CREATE TABLE user (
      id INT,
      name VARCHAR(100),
      CONSTRAINT pk_user PRIMARY KEY (id)
    );

##### Foreign keys

Foreign key columns MUST use the pattern `{referenced_table}_id` to clearly indicate the relationship.

    -- Bad
    CREATE TABLE order_item (
      id INT,
      order INT, -- Unclear
      product INT, -- Unclear
      quantity INT
    );

    -- Good
    CREATE TABLE order_item (
      id INT,
      order_id INT,
      product_id INT,
      quantity INT
    );

Foreign key constraints SHOULD be explicitly named using the pattern `fk_{table}_{referenced_table}` or `fk_{table}_{column}` when the relationship is ambiguous:

    -- Good
    CREATE TABLE order_item (
      id INT,
      order_id INT,
      product_id INT,
      CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES order(id),
      CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES product(id)
    );

For self-referencing foreign keys or multiple foreign keys to the same table, include additional context in the column name:

    -- Good
    CREATE TABLE user (
      id INT,
      name VARCHAR(100),
      manager_id INT,
      CONSTRAINT fk_user_manager FOREIGN KEY (manager_id) REFERENCES user(id)
    );

    CREATE TABLE order (
      id INT,
      billing_address_id INT,
      shipping_address_id INT,
      CONSTRAINT fk_order_billing_address FOREIGN KEY (billing_address_id) REFERENCES address(id),
      CONSTRAINT fk_order_shipping_address FOREIGN KEY (shipping_address_id) REFERENCES address(id)
    );

##### Indexes

Index names MUST use the prefix `idx_` followed by the table name and indexed column(s), using the pattern `idx_{table}_{column1}_{column2}...` for clarity and maintainability.

    -- Bad
    CREATE INDEX user_email ON user(email);
    CREATE INDEX idx1 ON user(email);
    CREATE INDEX email_index ON user(email);

    -- Good
    CREATE INDEX idx_user_email ON user(email);
    CREATE INDEX idx_user_last_name_first_name ON user(last_name, first_name);
    CREATE INDEX idx_order_created_at ON order(created_at);
    CREATE INDEX idx_order_item_order_id ON order_item(order_id);

For unique indexes, use the prefix `uidx_` to distinguish them from regular indexes:

    -- Good
    CREATE UNIQUE INDEX uidx_user_email ON user(email);
    CREATE UNIQUE INDEX uidx_product_sku ON product(sku);

For full-text indexes (where supported), use the prefix `ftidx_`:

    -- Good
    CREATE FULLTEXT INDEX ftidx_article_content ON article(title, content);

##### Unique constraints

Unique constraint names SHOULD use the pattern `uq_{table}_{column1}_{column2}...`:

    -- Good
    CREATE TABLE user (
      id INT,
      email VARCHAR(255),
      username VARCHAR(50),
      CONSTRAINT uq_user_email UNIQUE (email),
      CONSTRAINT uq_user_username UNIQUE (username)
    );

    CREATE TABLE product (
      id INT,
      sku VARCHAR(50),
      vendor_id INT,
      vendor_product_code VARCHAR(50),
      CONSTRAINT uq_product_sku UNIQUE (sku),
      CONSTRAINT uq_product_vendor_code UNIQUE (vendor_id, vendor_product_code)
    );

##### Check constraints

Check constraint names SHOULD use the pattern `chk_{table}_{column}_{condition}` where the condition briefly describes the validation:

    -- Good
    CREATE TABLE product (
      id INT,
      name VARCHAR(255),
      price DECIMAL(10,2),
      quantity INT,
      status VARCHAR(20),
      CONSTRAINT chk_product_price_positive CHECK (price >= 0),
      CONSTRAINT chk_product_quantity_positive CHECK (quantity >= 0),
      CONSTRAINT chk_product_status_valid CHECK (status IN ('active', 'inactive', 'discontinued'))
    );

##### Views

View names MUST use `lower_snake_case` and SHOULD include a suffix that indicates they are views, typically `_view` or a descriptive name that clearly differentiates them from tables.

    -- Bad
    CREATE VIEW UserOrders AS SELECT ...;
    CREATE VIEW v_user_orders AS SELECT ...;

    -- Good
    CREATE VIEW user_order_view AS SELECT ...;
    CREATE VIEW active_user_view AS SELECT ...;
    CREATE VIEW monthly_sales_summary_view AS SELECT ...;

Alternatively, views MAY be named descriptively without the `_view` suffix if the name clearly indicates a derived or aggregated nature:

    -- Good
    CREATE VIEW user_order_summary AS SELECT ...;
    CREATE VIEW product_inventory_status AS SELECT ...;

##### Sequences

For databases that support sequences (PostgreSQL, Oracle), sequence names SHOULD use the pattern `seq_{table}_{column}`:

    -- Good
    CREATE SEQUENCE seq_user_id START 1;
    CREATE SEQUENCE seq_order_id START 1000;

For databases using auto-increment (MySQL/MariaDB, MSSQL), the sequence is managed implicitly by the `AUTO_INCREMENT` or `IDENTITY` column property.

##### Stored procedures and functions

While stored procedures and functions SHOULD be avoided in favor of application-layer logic (following the principle of keeping business logic in the application), when they are necessary, their names MUST use `lower_snake_case`.

Stored procedure names SHOULD use a verb prefix indicating their action:

    -- Good
    CREATE PROCEDURE calculate_user_statistics()
    CREATE PROCEDURE archive_old_orders()
    CREATE PROCEDURE send_notification_batch()

Function names SHOULD follow the same conventions as application methods:

    -- Good
    CREATE FUNCTION get_user_full_name(user_id INT) RETURNS VARCHAR(200)
    CREATE FUNCTION calculate_order_total(order_id INT) RETURNS DECIMAL(10,2)
    CREATE FUNCTION is_user_active(user_id INT) RETURNS BOOLEAN

##### Handling reserved words

Database engines have reserved words that cannot be used as identifiers without special handling. You SHOULD avoid using reserved words as table or column names. If unavoidable, you MUST use the appropriate quoting mechanism for your database
engine.

Common reserved words to avoid include: `user`, `order`, `table`, `group`, `select`, `index`, `key`, `date`, `time`, `timestamp`, `status`, `type`, `level`, `action`, `role`, `value`, `option`, `default`, `check`, `constraint`, `transaction`,
`session`, `password`, `database`, `schema`, `view`, `trigger`, `procedure`, `function`, `cursor`, `case`, `when`, `then`, `else`, `end`, `commit`, `rollback`, etc.

When reserved words must be used:

* **MySQL/MariaDB** : Use backticks:

`sql CREATE TABLE `order` (id INT); SELECT * FROM `user` WHERE `group` = 'admin';`

* **PostgreSQL** : Use double quotes:

`sql CREATE TABLE "order" (id INT); SELECT * FROM "user" WHERE "group" = 'admin';`

* **MSSQL** : Use square brackets or double quotes:

`sql CREATE TABLE [order] (id INT); CREATE TABLE "order" (id INT); SELECT * FROM [user] WHERE [group] = 'admin';`

However, the RECOMMENDED approach is to use alternative names that avoid reserved words entirely:

    -- Better approach: avoid reserved words
    CREATE TABLE user_account (id INT); -- Instead of "user"
    CREATE TABLE purchase_order (id INT); -- Instead of "order"
    CREATE TABLE user_group (id INT); -- Instead of "group"

##### DynamoDB naming conventions

For DynamoDB tables and attributes, follow similar conventions with considerations for NoSQL structure:

* Table names MUST use `lower_snake_case` and singular form:

`text # Bad Users user-accounts UserAccount`

`text # Good user user_account product`

* Attribute names MUST use `lower_snake_case`:

`json { "id": "user_12345", "email": "user@example.com", "first_name": "John", "last_name": "Doe", "is_active": true, "created_at": "2026-04-15T00:00:00Z" }`

* Primary key attributes SHOULD use `id` for the partition key and `sort_key` or a descriptive name for the sort key:

`text # Good Partition key: id Sort key: created_at`

`text # Good (for composite keys) Partition key: user_id Sort key: order_id`

* Global Secondary Index (GSI) names SHOULD use the pattern `gsi_{attribute}` or `gsi_{attribute1}_{attribute2}`:

`text # Good gsi_email gsi_created_at gsi_user_id_created_at`

* Local Secondary Index (LSI) names SHOULD use the pattern `lsi_{attribute}`:

`text # Good lsi_status lsi_updated_at`

##### Engine-specific considerations

###### MySQL

* Identifier length limit: 64 characters

* Table names are case-sensitive on Linux/Unix, case-insensitive on Windows (use `lower_snake_case` to avoid issues)

* Use `utf8mb4` character set for full Unicode support including emojis

* Engine type (InnoDB, MyISAM) affects constraint support

###### MSSQL (Microsoft SQL Server)

* Identifier length limit: 128 characters

* Schema-qualified naming is common: `schema_name.table_name`

* Case sensitivity depends on collation settings (use `lower_snake_case` for consistency)

* Use `nvarchar` for Unicode support

###### DynamoDB

* Table name length: 3-255 characters

* Attribute name length: 1-255 characters (64KB limit for attribute name and value combined)

* No native schema constraints; validation must be handled at application layer

* Partition key design is critical for performance and cost

###### PostgreSQL

* Identifier length limit: 63 characters

* Automatically converts unquoted identifiers to lowercase

* Rich support for constraints, indexes, and data types

* Use `text` type instead of `varchar` unless specific length constraint is needed

#### Migrations

You MUST use [database migrations](<https://en.wikipedia.org/wiki/Schema_migration>) in order to keep your environments in-sync regarding your database schema. These migrations MUST be able to perform updates and rollbacks in a transparent way,
allowing these operations to be safely executed without requiring additional scripts or manual operations.

The migrations MUST also provide the minimal information required by the application to work (like the admin user, the pre-configured roles, etc).

Migrations SHOULD be included only when a new version is released, rather than spread between multiple commits.

IMPORTANT: Before executing a migration, you MUST be sure it works correctly with the schema and the contents in the deployment target. This means you SHOULD test the migration in a development or testing environment before performing operations in
environments like "qa", "uat", "staging", "production", etc.

#### Data fixtures

For development purposes, you SHOULD provide [data fixtures](<https://en.wikipedia.org/wiki/Test_fixture#Software>) to ease the work while building the software. Data fixtures can also complement or override the data provided by the database
migrations.

IMPORTANT: These fixtures are only meant for development and MUST NOT be used during deployment to environments other than those used for development.

#### Using references

When you need to point a reference about the persistence layer, you MUST use references from the application layer (models, properties, etc) instead of using references to the database components (tables, columns, etc). Only use database references
when the concept regarding your subject is only present at database layer.

#### Persisting dates

Dates MUST be persisted using the UTC time zone. If the application requires to show or edit the persisted dates using a different time zone, the transformation MUST be done during the presentation or the modification phases, based on the time zone
required by the application for these operations.

The database service and the application server MUST use the UTC time zone.

For consistency, the dates MUST always be generated from the application. The database engine MUST NOT be used to generate dates.

All the infrastructure components such as the application and the database servers MUST ensure [clock synchronization](<https://en.wikipedia.org/wiki/Clock_synchronization>) through a [Network Time
Protocol](<https://en.wikipedia.org/wiki/Network_Time_Protocol>) [time server](<https://en.wikipedia.org/wiki/Time_server>).

### Integrations

#### Providing access for 3rd party systems

You MUST use [REST](<https://en.wikipedia.org/wiki/REST>) (Representational state transfer) if your application needs to expose integrations for 3rd party systems. This API MUST be documented using
[OAS](<https://swagger.io/specification/#version-3.1.0>) (OpenAPI Specification) 3.0.0 or higher.

The REST API MUST be served through its own HTTP domain, by instance, `api.example.com`. See Monolithic HTTP applications.

##### Authentication

Unless requirements explicitly define a different mechanism, the authentication process MUST use [JWT](<https://datatracker.ietf.org/doc/html/rfc7519>) (JSON Web Token). The tokens MUST be generated using an asymmetric key. See:

* Asymmetric Encryption Algorithms

* [JSON Web Token (JWT) Signing Algorithms Overview](<https://auth0.com/blog/json-web-token-signing-algorithms-overview/>)

##### Exposing errors

API errors MUST be exposed following the IETF's document [Problem Details for HTTP APIs](<https://www.ietf.org/rfc/rfc9457.txt>). For additional context about this RFC and the OpenAPI Specification, see these dedicated blog posts:

* [Problem Details (RFC 9457): Doing API Errors Well](<https://swagger.io/blog/problem-details-rfc9457-doing-api-errors-well/>)

* [Problem Details (RFC 9457): Getting Hands-On with API Error Handling](<https://swagger.io/blog/problem-details-rfc9457-api-error-handling/>)

##### Deprecating resources, properties and operations

A best practice regarding web API development is to apply the [evolution strategy](<https://philsturgeon.com/api-evolution-for-rest-http-apis/>) to indicate to client applications which resource types, operations and properties are deprecated and
shouldn't be used anymore. While versioning an API requires modifying all clients to upgrade, even the ones not impacted by the changes. It's a tedious task that should be avoided as much as possible.

On the other hand, the evolution strategy (also known as versionless APIs) consists of deprecating the properties, resource types or operations that will be removed at some point.

Most modern API formats including JSON-LD / Hydra, GraphQL and OpenAPI allow you to mark resources types, operations or properties as deprecated.

Resources, properties and operations MUST be marked as deprecated using the `deprecated` property from the Open API Specification.

The [Sunset HTTP response header (RFC 8594)](<https://ietf.org/rfc/rfc8594.txt>) indicates that a URI is likely to become unresponsive at a specified point in the future. It is especially useful to indicate when a deprecated URL will not be
available anymore. All the responses for deprecated resources and operations MUST include the `Sunset` header.

For more information, see [What Organizations Need to Know When Deprecating APIs](<https://swagger.io/blog/api-strategy/best-practices-for-deprecating-apis/>).

#### Consuming 3rd party systems

When you need to connect with a 3rd party systems (like HTTP APIs, pre-existing databases, etc) you MUST always use an abstraction layer, regardless the integration's complexity or its frequency of use. This abstraction MUST provide an API agnostic
to the software you're building, allowing its reuse in other systems if required.

##### Building your own client

Probably, many of the use cases you can find about these integrations are already covered by 3rd party dependencies, like official SDKs and similar tools; but if that is not your case, you MUST build your own. Even, there are cases where you need to
build a new (adapter) layer on top another one, because there is a contract to respect between multiple integrations covering the same responsibility.

When building a client, you MUST respect and follow all the principles and guidelines provided in this documentation.

Lets take these examples:

  1. You need to integrate with a ReST API that uses a different language than English in their endpoints and properties, so you must respect these values when consuming the API.
  2. You MUST use English in the code (classes, methods, properties, variables, etc) you provide.

  3. You need to integrate with an existing database that uses a different language than English in their tables and columns, so you must respect these values when executing operations.

  4. You MUST use English in the code (models, classes, methods, properties, variables, etc) you provide.

### Testing

In order to deliver high-quality software, all the code you write MUST be covered by unit tests. Functional tests MAY also be added when a feature must be checked. The test scripts MUST mimic the same filesystem structure as the scripts they are
covering. By instance, if you are testing a class that is declared at `src/the organization/MyUsefulClass.js`, the test script MUST be declared at `tests/the organization/MyUsefulClassTest.js`.

Test classes MUST use `Test` as suffix, while the test methods MUST use the `test` prefix. Test methods MUST NOT return anything.

    final class FormLoginTest
    {
        void testSubmit()
        {
            // ...
        }
    }

The [code coverage](<https://en.wikipedia.org/wiki/Code_coverage>) MUST met the project requirements, as the minimum allowed coverage percentage is already ensured in our Continuous Integration suite.

### Internationalization

Applications that expose user-facing strings MUST externalize them into translation files, even if the application currently supports a single language. This practice decouples text content from code, enables future localization without refactoring,
and centralizes all user-visible text in a single maintainable location.

A standard [internationalization (i18n)](<https://en.wikipedia.org/wiki/Internationalization_and_localization>) library appropriate for the technology stack MUST be used. Some examples:

* [react-i18next](<https://react.i18next.com/>) for React applications;

* [i18next](<https://www.i18next.com/>) for Node.js applications;

* [gettext](<https://docs.python.org/3/library/gettext.html>) or [Babel](<https://babel.pocoo.org/>) for Python applications;

* [Symfony Translation](<https://symfony.com/doc/current/translation.html>) for PHP (Symfony) applications.

Hardcoded user-facing strings MUST NOT appear in the presentation layer code.

#### Translation keys

Translation keys MUST be descriptive and follow a dot-separated namespace convention that reflects the context where they are used:

    # Bad
    btn1
    msg
    errorMessage
    fetchFailed

    # Good
    repositories.table.header.name
    repositories.table.header.vendor
    http.loading
    http.error.fetch_failed

The segments within a translation key MUST use `snake_case`:

    # Bad
    errors.fetchFailed
    repositories.openPullRequests

    # Good
    errors.fetch_failed
    repositories.open_pull_requests

### Integration (bridging) with optional tools

If a project includes integration with optional tools, it MUST be provided in an isolated way, respecting the [bridging](<https://en.wikipedia.org/wiki/Bridging_\(programming\)>) concept in order to keep the project's operation agnostic to these
tools. Usually, these tools SHOULD expose its own configuration and documentation under a specific directory at the project's root. The directory that holds these integrations MUST include a period (`.`) at the beginning in its name (like in
`.aws/`, `.azure/`, `.circleci/`, `.docker/`, `.github/`, `.gitlab/`, `.terraform/`, etc). All the features or behaviors provided by these tools MUST only live in their own directories and SHOULD NOT be referenced from an external scope.

#### Docker

We make a broad use of Docker to virtualize and standardize the environments across the different platforms where the stacks are deployed, from local to production environments. The infrastructure policy governing _why_ Docker is used, which tools
are required and how the `.docker/` directory is structured is documented in the [Containers](<../infrastructure/containers.html>) document.

Unless specific exceptions, there SHOULD be a single multi-stage Dockerfile per project. The path of this file SHOULD be `.docker/app/Dockerfile`.

All the public remote images in your Docker projects MUST be pulled from the [`public.ecr.aws/docker/`](<https://gallery.ecr.aws/docker/>) registry.

    # Bad
    FROM alpine:3.20.3 AS base

    # Good
    FROM public.ecr.aws/docker/library/alpine:3.20.3 AS base

In order to leverage the benefits from the [BuildKit backend](<https://docs.docker.com/build/buildkit/>), the Dockerfile documents MUST use the [syntax parser directive](<https://docs.docker.com/reference/dockerfile/#syntax>) with the value `#
syntax=docker/dockerfile:1`. For more information, see [Custom Dockerfile syntax](<https://docs.docker.com/build/dockerfile/frontend/#dockerfile-frontend>).

All the Docker stages MUST define an [alias](<https://docs.docker.com/reference/dockerfile/#from>). When they are intended to produce an image for deployment, they MUST use the "packaged-" prefix, by instance "packaged-app", "packaged-http",
"packaged-cli", etc. These stages MUST NOT include development dependencies.

In order to ease DX in development time, the Dockerfile SHOULD also include a stage called "cli" providing all the command line tools required by the project.

All the produced Docker images MUST use the [OCI annotation keys](<https://github.com/opencontainers/image-spec/blob/main/annotations.md#pre-defined-annotation-keys>). The required keys are:

* `org.opencontainers.image.authors='the organization <engineering@company.com>'`

* `org.opencontainers.image.licenses='LicenseRef-Proprietary'`

* `org.opencontainers.image.source='<REPOSITORY_URL>'`

* `org.opencontainers.image.title='<PROJECT_NAME>'`

* `org.opencontainers.image.vendor='the organization'`

* `org.opencontainers.image.version='<IMAGE_VERSION>'`

Replace the placeholders with the real values. For multi-image projects, add a suffix in `<PROJECT_NAME>` regarding the purpose of each produced image.

According to the [OCI conventions](<https://github.com/opencontainers/image-spec/tree/main?tab=readme-ov-file#running-an-oci-image>), the images MUST be able to run without any additional configuration, although they MAY be configurable through
environment variables.

For more detailed examples, see the [Docker recipe](<../../index.html#recipes>).

#### Docker Compose

The local and Continuous Integration environments orchestrate the project services through Docker Compose.

The configuration file MUST be placed at `.docker/compose.yaml` and MUST include at least a "cli" service providing all the command line tools required by the project. Usually, this service points to the "cli" stage declared in the Dockerfile.

**NOTE** : It's important to use the name "cli" because, by convention, the CI platforms look for this service to build the project (`docker compose run cli ...`).

#### AWS

AWS integration assets MUST be placed under the `.aws/` directory at the repository root.

##### SAM

For projects that use [AWS SAM](<https://aws.amazon.com/serverless/sam/>) (Serverless Application Model) to provision serverless infrastructure, see the dedicated [Infrastructure as Code](<../infrastructure/iac.html>) document for the full
conventions: supported tools, template format (YAML), 2-phase template architecture (`foundation.yaml` \+ nested stacks), repository structure (`.aws/sam/`), environment mappings and naming conventions.

## Colloquial text

When writing colloquial text (in docs, exception messages, comments, commit messages, pull request titles, etc.), you MUST follow these rules:

* Use backticks around [symbols](<https://en.wikipedia.org/wiki/Symbol_\(programming\)>) (like variables, classes, functions, parameters, properties, constants, etc.), snippets or hard references (like scripts, paths, URL parts, etc.). Please, note
that `true`, `false` and `null` are usually constants in many languages.

* Use double quotes around literals (like text values, literal parameter and option names, section names, package names, section titles, etc.).

* When referring to a package, use its name in the package manager instead of other names or aliases.

* Don't use any surrounding char around integers, floats, etc.

* Always use parentheses when referring to a function or method, regardless of the number of arguments it has (`getSomething()` instead of `getSomething`).

* When referring to classes or software components, use the class name as it appears in the code, not the filename where it's defined. The class name is the proper symbol reference.

* Provide as much context as possible in order to achieve a unique and definitive reference. If a function is defined under a namespace or inside a class, don't omit them.

* Use the proper casing, do not capitalize words that are not proper names or the very first word in a sentence; use upper case for acronyms.

Examples:

* > Add `$isStrict` parameter to `App\Controller::getSomething()` in order to leverage the "is_strict" request option.

* > Use `false` in `$.root.parameters.debug` option parameter at `config/settings.json`.

* > Add `id` property to `UserInterface` interface.

* > Set `THRESHOLD_MIN` to 42.

* > Remove the `/user/logout` API endpoint.

* > Update constraint for "friendsofphp/php-cs-fixer" to `^3.4`.

* > Property `$.items.instance.id` missing from the JSON response body.

* > Add integration with Jira.

* > Update `UserController` to handle authentication. _(Not: "Update`user.controller.ts` to handle authentication")_

* > The `DatabaseConnection` class now supports connection pooling. _(Not: "The`database-connection.php` file now supports connection pooling")_

* > Refactor `OrderService` to use dependency injection. _(Not: "Refactor`order.service.js` to use dependency injection")_

Use proper names, brand names and product names exactly as defined by their owner:

* Proper names, brand names and product names MUST be written exactly as defined by their owner - do not alter their capitalisation in prose (e.g., write "Lambda", not "lambda"; "DynamoDB", not "dynamodb"; "Amazon S3", not "S3" on first mention in a
document);

* Do not precede a proper name with a definite article unless the name itself includes one. Write "Lambda returns an error", not "the Lambda returns an error"; write "a Lambda resource" when a count noun is needed.

Use precise filesystem terms that reflect the actual structure of the operating system, not graphical metaphors introduced by desktop environments:

* Use `directory` instead of `folder`. A _directory_ is the filesystem object; a _folder_ is its visual representation in a graphical file manager and MUST NOT be used in technical writing;

* Use `file` for any regular filesystem node that holds data. Do not use "document" as a generic synonym for file in technical contexts;

* Use `filename` (one word) for the name component of a file, not "file name" (two words);

* Use `path` for a location in the filesystem (absolute or relative), not "address" or "location";

* Use `symlink` (or `symbolic link`) instead of "shortcut". A _shortcut_ is a Windows graphical concept, not a POSIX filesystem construct;

* Use `executable` for a file with execution permissions, not "program", "binary" or "app" unless the context specifically requires distinguishing between those;

* Use `mount point` for the directory where a filesystem is attached, not "drive" (a hardware concept) or "volume" unless referring specifically to a storage volume.

For more information about documentation text, please read the [dedicated section](<../documentation/standards.html>).
