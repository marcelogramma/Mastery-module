# JavaScript Coding Standards

This document describes coding standards related to JavaScript and rules that MUST be followed.

Note: You SHOULD use [TypeScript](<typescript/standards.html>) instead of JavaScript, because in terms of development it offers advantages such as more explicit code, static [typing](<https://www.typescriptlang.org/docs/handbook/type-compatibility.html>), [interfaces](<https://www.typescriptlang.org/docs/handbook/2/objects.html>), [generics](<https://www.typescriptlang.org/docs/handbook/2/generics.html>), [object-oriented programming](<https://www.typescriptlang.org/docs/handbook/2/classes.html>), inheritance, and method access modifiers, among other things that make the code more robust and reliable.

## Use of modules in JavaScript

There are two module systems:

* [CommonJS](<https://nodejs.org/api/modules.html>) modules (the original way to package JavaScript code).

* [ECMAScript](<https://nodejs.org/api/esm.html>) modules ([the official standard format](<https://tc39.github.io/ecma262/#sec-modules>)).

Recommended way to use a CommonJS module:

    // doubleNumber.js
    /**
    * Doubles a number.
     *
    * @param {number} num
     *
    * @returns {number}
     */
    const doubleNumber = (num) => {
      return num * 2;
    };

    module.exports = doubleNumber;

    // anotherFile.js
    const doubleNumber = require('./doubleNumber');

    // returns 4
    doubleNumber(2);

Another example:

    // calculateFactorial.js
    /**
    * Calculates the factorial of a number given.
     *
    * @param {number} num Non-negative integer.
     *
    * @throws {RangeError} If the argument it's a negative integer.
    * @throws {TypeError} If the argument it's not an integer `number` object.
     *
    * @returns {number}
     */
    const calculateFactorial = (num) => {
      if (false === Number.isInteger(num)){
         throw new TypeError(`Argument 1 passed to \`calculateFactorial()\` must be \`number\` object and hold zero or an integer positive value, "${num}" given.`);
      }

      if (num < 0) {
        throw new RangeError(`Argument 1 passed to \`calculateFactorial()\` must be a non-negative number, "${num}" given.`);
      }

      if (0 === num) {
        return 1;
      }

      return num * calculateFactorial(num-1);
    }

    module.exports = calculateFactorial;

    // anotherFile.js
    const calculateFactorial = require('./calculateFactorial');

    // returns 24
    calculateFactorial(4);

Recommended way to use an ECMAScript module:

    // doubleNumber.js
    /**
    * Doubles a number.
     *
    * @param {number} num
     *
    * @returns {number}
     */
    const doubleNumber = (num) => {
      return num * 2;
    };

    export default doubleNumber;

    // anotherFile.js
    import doubleNumber from './doubleNumber';

    // returns 4
    doubleNumber(2);

Another example:

    // calculateFactorial.js
    /**
    * Calculates the factorial of a number given.
     *
    * @param {number} num Non-negative integer.
     *
    * @throws {RangeError} If the argument it's a negative integer.
    * @throws {TypeError} If the argument it's not an integer `number` object.
     *
    * @returns {number}
     */
    const calculateFactorial = (num) => {
      if (false === Number.isInteger(num)){
         throw new TypeError(`Argument 1 passed to \`calculateFactorial()\` must be \`number\` object and hold zero or an integer positive value, "${num}" given.`);
      }

      if (num < 0) {
        throw new RangeError(`Argument 1 passed to \`calculateFactorial()\` must be a non-negative number, "${num}" given.`);
      }

      if (0 === num) {
        return 1;
      }

      return num * calculateFactorial(num-1);
    }

    export default calculateFactorial;

    // anotherFile.js
    import calculateFactorial from './calculateFactorial';

    // returns 24
    calculateFactorial(4);

Since the ECMAScript module is [the official standard format](<https://tc39.github.io/ecma262/#sec-modules>) to package JavaScript code, you SHOULD use ECMAScript module instead of CommonJS module for file export.

## Structure

* Add a single space after each comma delimiter;

* Add a single space around binary operators (`==`, `&&`, ...), with the exception of the concatenation (`+`) operator;

* Place unary operators (`!`, `--`, ...) adjacent to the affected variable;

* Always use [identical comparison](<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality>) unless you need type juggling;

* Use [Yoda conditions](<https://en.wikipedia.org/wiki/Yoda_conditions>) when checking a variable against an expression to avoid an accidental assignment inside the condition statement (this applies to `==`, `!=`, `===`, and `!==`);

* Use short array syntax `[]` instead of long array syntax `new Array()`;

* Use short object syntax `{}` instead of long object syntax `new Object()`;

* Add a comma after each array item in a multi-line array, even after the last one;

* Add a blank line before `return` statements, unless the return is alone inside a statement-group (like an `if` statement);

* Use `return null;` when a function explicitly returns `null` values and use `return;` when the function returns `void` values;

* Use braces to indicate control structure body regardless of the number of statements it contains;

* Define one class, interface, trait, or enumeration per file (see [One definition per file](<../conventions.html#one-definition-per-file>) for naming and structure rules);

* Declare the class inheritance and all the implemented interfaces on the same line as the class name;

* Declare class constants before properties and class properties before methods;

* Declare public elements first, then protected ones and finally private ones;

* Declare all the arguments on the same line as the method/function name, no matter how many arguments there are;

* Use property, method/function argument and return type declarations when possible;

* Use parentheses when instantiating classes regardless of the number of arguments the constructor has;

* Sentences in exception and error message strings should always end with a full stop;

* Do not use `else`, `else if`, `break` after `if` and `case` conditions which return or throw something;

* Do not use spaces around `[` offset accessor and before `]` offset accessor;

* Add a `import` statement for every class that is not part of the global namespace;

* Do not perform operations or assignments that may not be used based on the flow execution order.

## Naming conventions

* Use camelCase for variables, function and method names, arguments (e.g. `acceptableContentTypes`, `hasSession()`);

* Use snake_case for configuration parameters and template variables (e.g. `framework.csrf_protection`, `http_status_code`);

* Use SCREAMING_SNAKE_CASE for constants (e.g. `InputArgument.IS_ARRAY`);

* Use UpperCamelCase for enumeration cases (e.g. `InputArgumentMode.IsArray`);

* Use namespaces for all classes, interfaces, traits and enums and UpperCamelCase for their names (e.g. `ConsoleLogger`);

* Prefix abstract classes with `Abstract`;

* Suffix interfaces with `Interface`;

* Suffix exceptions with `Error`;

* Use alphanumeric characters and underscores for file names;

* Don't forget to look at the more verbose [`Conventions`](<../conventions.html>) document for more subjective naming considerations.

## Documentation

* Add JSDoc blocks for all classes, methods, and functions where they can add some value;

* Group annotations together so that annotations of the same type immediately follow each other, and annotations of a different type are separated by a single blank line;

* Omit the `@return` tag if the method does not return anything;

* The `@package` and `@subpackage` annotations are not used;

* Inline JSDoc blocks (e.g. `/** @var {Container} container */`) are only allowed for variables, while structural elements (e.g. classes, functions) must use conventional (multiline) blocks;

* When adding a new class or when making significant changes to an existing class, an `@author` tag with personal contact information may be added, or expanded; Please note it is possible to have the personal contact information updated or removed
per request;

* Always add a `@throws` tag into the JSDoc block when the function or method throws an exception.

## License

* the organization is released under the proprietary license, and the license block has to be present at the top of every JS file.
