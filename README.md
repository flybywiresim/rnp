# RNP

RNP is a language which compiles to [RPN][], a scripting language used by MSFS.

RNP provides a familiar and expressive environment with strict types. In
the future it may also perform optimization.

## Types

- `boolean` - `true` or `false`.
- `number` - IEEE-754 double precision floating point number.
- `string` - A string type.
- `any` - Used for unknown types. No builtin in the language allows this type,
   but some expressions may be valid with it, for example `(L:X) = (L:Y)`.
- `void` - The absence of a value. An example of an expression which produces
  `void` is `if true {}`.

## Syntax

### Comments

#### Line Comments

Comment out a single line.

```rnp
# this is a line comment
```

#### Block Comments

Comment out multiple lines. Nesting is allowed.

```rnp
#* this
comment
is
longer
*#
```

```rnp
#*

#*
comment doesn't end here
*#

comment ends here
*#
```

### Declarations

#### Locals

Declare a local.

```rnp
let a = 1;
```

### Aliases

SimVars can be aliased to local names.

```rnp
alias x = (L:X, bool);

x = true; # set L:X to true
if x {    # if L:X is true
}
```

#### Macros

Declare a macro. Macros may be exported using `export`. Macros are "hygienic",
meaning that identifiers may not be implicitly leaked into or out of a macro
scope. Macros parameters use `$` to avoid being confused with normal variables.

```rnp
macro add($a, $b) {
  $a + $b
}
```

```rnp
export macro sub($a, $b) {
  $a - $b
}
```

```rnp
macro assign($a) {
  $a = 1;
}

let b = 0;
# does not break hygiene rules because `b` was explicitly passed
assign(b);
```

#### Imports

Macros can be imported from other files using `import`.

```rnp
import { sub } from './file.rnp';
```

### Assignments

#### Locals

Assign a value to a local.

```rnp
a = 1;
```

#### SimVars

Assign a value to a SimVar.

```rnp
(X:Y) = 1;
(X:Y, unit) = 1;
```

### Expressions

#### Literals

```rnp
# booleans
true;
false;

# numbers
1.0;
0x10;
0b101010;

# strings
'hello';
```

#### Locals

Reference a local.

```rnp
a
```

#### SimVars

Reference a SimVar.

```rnp
(X:Y)
(X:Y, unit)
```

#### Macro Expansion

Expand a macro.

```rnp
add(1, 2);
```

#### Blocks

```rnp
{
  1
}
```

#### If Expressions

Conditional evaluation, may be used as an expression.

```rnp
if x {
}
```

```rnp
if x {
} else {
}
```

```rnp
if x {
} else if y {
} else {
}
```

```rnp
let a = if x { 1 } else { 2 };
```

#### Binary and Unary Operators

Mathematical and relational operations.

```rnp
1 + 1;
1 / 1;
'hello' == 'hello';
# etc...

!true
~1
# etc...
```

#### Method Operations

RPN provides several standard operations. These operations are available in
RNP as method-ish syntax.

```rnp
8.log(2);
```

```rnp
'hello'.toUpperCase();
```

[RPN]: https://www.prepar3d.com/SDKv5/sdk/scripting/rpn_scripting.html
