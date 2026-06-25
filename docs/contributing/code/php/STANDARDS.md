# PHP Coding Standards

the organization follows the standards defined in the [PSR-0](<https://www.php-fig.org/psr/psr-0/>), [PSR-1](<https://www.php-fig.org/psr/psr-1/>), [PSR-2](<https://www.php-fig.org/psr/psr-2/>) and [PSR-4](<https://www.php-fig.org/psr/psr-4/>) documents.

Since a picture - or some code - is worth a thousand words, here's a short example containing most features described below:

    <?php

    declare(strict_types=1);

    /*
    * This file is part of the the organization - Mythe organization project.
     *
    * (c) the organization <engineering@company.com>.
     *
    * This source code is proprietary and confidential. All rights reserved.
     *
    * This source file is subject to a proprietary license, which is bundled
    * with this source code in the LICENSE file. You may not distribute, modify,
    * or disclose this code except as expressly authorized by the organization
     *
    * SPDX-License-Identifier: Proprietary (Custom) License
     */

    namespace the organization\Demo;

    /**
    * Coding standards demonstration
     */
    final readonly class FooBar
    {
        private const int SOME_CONST = 42;

        /**
         * A useful description about this property
         */
        private string $fooBar;

        /**
         * @param string $dummy Some argument description
         */
        public function __construct(string $dummy)
        {
            $caption = 'This is a multiline'
                .' string that spans its content'
                .' with concatenated strings';

            $text = $this->transformText($dummy, [
                'another_option' => self::SOME_CONST,
                'caption' => $caption,
            ]);

            \assert(\is_string($text));

            $this->fooBar = $text;
        }

        /**
         * @deprecated
         */
        public function someDeprecatedMethod(): string
        {
            @\trigger_error(\sprintf(
                'The `%s()` method is deprecated since version 2.8 and will be removed in 3.0. Use `the organization\Baz::someMethod()` instead.',
                __METHOD__
            ), E_USER_DEPRECATED);

            return Baz::someMethod($this->fooBar, $this->reverseBoolean());
        }

        /**
         * Transforms the input given as first argument
         *
         * @param string|null $dummy Some argument description
         * @param array<string, mixed> $options An options collection to be used within the transformation
         * @param null|int $nullable A nullable integer argument
         *
         * @throws \RuntimeException When an invalid option is provided
         *
         * @return string|null The transformed input
         */
        private function transformText(?string $dummy = null, array $options = [], ?int $nullable = null): ?string
        {
            if (null === $nullable) {
                return 'Argument 3 is `NULL`.';
            }

            $defaultOptions = [
                'some_default' => 'values',
                'another_option' => 'more values',
            ];

            foreach ($options as $option => $value) {
                if (!\in_array($option, $defaultOptions, true)) {
                    throw new \RuntimeException(\sprintf('Unrecognized option "%s".', $option));
                }
            }

            $mergedOptions = \array_merge(
                $defaultOptions,
                $options
            );

            if ('string' === $dummy) {
                if ('values' === $mergedOptions['some_default']) {
                    return \mb_substr($dummy, 0, 5);
                }

                return \mb_convert_case($dummy, MB_CASE_TITLE);
            }

            return null;
        }

        /**
         * Performs some basic check for a given value
         *
         * @param bool|null $value Some value to check against
         * @param bool $theSwitch Some switch to control the method's flow
         */
        private function reverseBoolean(?bool $value = null, bool $theSwitch = false): ?bool
        {
            if (!$theSwitch) {
                return null;
            }

            if (null === $value) {
                return null;
            }

            return $value;
        }
    }

## Structure

* Add a single space after each comma delimiter;

* Add a single space around binary operators (`==`, `&&`, ...), with the exception of the concatenation (`.`) operator;

* Place unary operators (`!`, `--`, ...) adjacent to the affected variable;

* Always use [identical comparison](<https://php.net/manual/en/language.operators.comparison.php>) unless you need type juggling;

* Use [Yoda conditions](<https://en.wikipedia.org/wiki/Yoda_conditions>) when checking a variable against an expression to avoid an accidental assignment inside the condition statement (this applies to `==`, `!=`, `===`, and `!==`);

* Use short array syntax `[]` instead of long array syntax `array()`;

* Add a comma after each array item in a multi-line array, even after the last one;

* Add a blank line before `return` statements, unless the return is alone inside a statement-group (like an `if` statement);

* Use `return null;` when a function explicitly returns `null` values and use `return;` when the function returns `void` values;

* Use braces to indicate control structure body regardless of the number of statements it contains;

* Define one class, interface, trait, or enumeration per file (see [One definition per file](<../conventions.html#one-definition-per-file>) for naming and structure rules);

* Declare the class inheritance and all the implemented interfaces on the same line as the class name;

* Declare class constants before properties and class properties before methods;

* Declare public elements first, then protected ones and finally private ones. The exceptions to this rule are the class constructor and the `setUp()` and `tearDown()` methods of PHPUnit tests, which should always be the first methods to increase
readability;

* Declare all the arguments on the same line as the method/function name, no matter how many arguments there are;

* Use property, method/function argument and return type declarations when possible;

* Use parentheses when instantiating classes regardless of the number of arguments the constructor has;

* Exception and error message strings should be concatenated using `sprintf()`;

* Each line in a multiline concatenated string MUST start with the concatenation (`.`) operator;

* Each line in a multiline concatenated string with blank spaces MUST only be split before the occurrence of a blank space;

* Sentences in exception and error message strings should always end with a full stop;

* Do not use [complex (curly) syntax](<https://www.php.net/manual/en/language.types.string.php#language.types.string.parsing.complex>) for strings where it is not required;

* Calls to `trigger_error()` with type `E_USER_DEPRECATED` should be switched to opt-in via `@` operator;

* Do not use `else`, `elseif`, `break` after `if` and `case` conditions which return or throw something;

* Do not use spaces around `[` offset accessor and before `]` offset accessor;

* Add a `use` statement for every class that is not part of the global namespace;

* Do not perform operations or assignments that may not be used based on the flow execution order.

## Naming conventions

* Use camelCase for PHP variables, function and method names, arguments (e.g. `$acceptableContentTypes`, `hasSession()`);

* Use snake_case for configuration parameters and template variables (e.g. `framework.csrf_protection`, `http_status_code`);

* Use SCREAMING_SNAKE_CASE for constants (e.g. `InputArgument::IS_ARRAY`);

* Use UpperCamelCase for enumeration cases (e.g. `InputArgumentMode::IsArray`);

* Use namespaces for all PHP classes, interfaces, traits and enums and UpperCamelCase for their names (e.g. `ConsoleLogger`);

* Prefix abstract classes with `Abstract`;

* Suffix interfaces with `Interface`;

* Suffix traits with `Trait`;

* Suffix exceptions with `Exception`;

* Use alphanumeric characters and underscores for file names;

* For type-hinting in PHPDocs and casting, use `bool` (instead of `boolean` or `Boolean`), `int` (instead of `integer`), `float` (instead of `double` or `real`);

* Don't forget to look at the more verbose [`Conventions`](<../conventions.html>) document for more subjective naming considerations.

### Service Naming Conventions

* A service name MUST be the same as the fully qualified class name (FQCN) of its class (e.g. `App\EventSubscriber\UserSubscriber`);

* If there are multiple services for the same class, use the FQCN for the main service and use lowercased and underscored names for the rest of services. Optionally divide them in groups separated with dots (e.g. `something.service_name`,
`app.something.service_name`);

* Use lowercase letters for parameter names (except when referring to environment variables with the `%env(VARIABLE_NAME)%` syntax);

* Add class aliases for public services (e.g. alias `App\Something\ClassName` to app.something.service_name).

## Documentation

* Add PHPDoc blocks for all classes, methods, and functions where they can add some value;

* Group annotations together so that annotations of the same type immediately follow each other, and annotations of a different type are separated by a single blank line;

* Omit the `@return` tag if the method does not return anything;

* The `@package` and `@subpackage` annotations are not used;

* Inline PHPDoc blocks (e.g. `/** @var Container $container */`) are only allowed for variables, while structural elements (e.g. classes, functions) MUST use conventional (multiline) blocks;

* When adding a new class or when making significant changes to an existing class, an `@author` tag with personal contact information may be added, or expanded. Please note it is possible to have the personal contact information updated or removed
per request.

## Deprecations

A PHP `E_USER_DEPRECATED` error MUST also be triggered to help people with the migration starting one or two minor versions before the version where the feature will be removed (depending on the criticality of the removal):

    @trigger_error('`XXX()` is deprecated since version 1.2 and will be removed in 2.0. Use `XXX()` instead.', \E_USER_DEPRECATED);

Without the [@-silencing operator](<https://php.net/manual/en/language.operators.errorcontrol.php>), users would need to opt-out from deprecation notices. Silencing swaps this behavior and allows users to opt-in when they are ready to cope with them
(by adding a custom error handler like the one used by the Web Debug Toolbar or by the PHPUnit bridge).
